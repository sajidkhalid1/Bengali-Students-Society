import { publishableKeyMatches, stripeMode } from "./checkout-presentation";
import { reportServiceFailure } from "./service-diagnostics";
import { membershipEmailConfigurationIssues } from "./membership-email-provider";
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { membershipPrice, membershipExpiresAt, type MembershipPlan } from "./membership";

export const memberCookie = "bss_member_access";
export type Member = { created_at?: string; id: string; full_name: string; email: string; student_id_encrypted?: string; plan: MembershipPlan; status: "pending" | "active" | "revoked" | "expired"; card_email_accepted_at?: string | null; expires_at: string; checkout_session_id: string | null; };
const required = ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "MEMBER_DATA_KEY", "SITE_URL"];
export function walletEnabled(provider: "apple" | "google") {
  const keys = provider === "apple"
    ? ["APPLE_PASS_TYPE_ID", "APPLE_TEAM_ID", "APPLE_PASS_CERTIFICATE", "APPLE_PASS_PRIVATE_KEY", "APPLE_WWDR_CERTIFICATE"]
    : ["GOOGLE_WALLET_ISSUER_ID", "GOOGLE_WALLET_CLASS_ID", "GOOGLE_WALLET_CLIENT_EMAIL", "GOOGLE_WALLET_PRIVATE_KEY"];
  return process.env[`${provider.toUpperCase()}_WALLET_ENABLED`] === "true" && keys.every(key => Boolean(process.env[key]));
}
export function membershipExpiry() { return process.env.MEMBERSHIP_EXPIRES_AT || membershipExpiresAt; }
export function membershipConfigurationIssues(): string[] {
  const issues = required.filter(key => !process.env[key]).map(key => `missing:${key}`);
  issues.push(...membershipEmailConfigurationIssues());
  if (!publishableKeyMatches()) issues.push("stripe-key-mode-mismatch-or-invalid-prefix");
  if (Buffer.from(process.env.MEMBER_DATA_KEY || "", "base64").length !== 32) issues.push("invalid-member-data-key-length");
  if (!(Date.parse(membershipExpiry()) > Date.now())) issues.push("invalid-or-expired-membership-period");
  return issues;
}
export function membershipConfigured() { return membershipConfigurationIssues().length === 0; }
export function registrationEnabled() {
  return process.env.MEMBERSHIP_ENABLED === "true" && (stripeMode(process.env.STRIPE_SECRET_KEY) === "live") && membershipConfigured();
}
export function hash(value: string) { return createHash("sha256").update(value).digest("hex"); }
export function siteOrigin() { return new URL(process.env.SITE_URL || "https://bssucalgary.app").origin; }
export function encryptStudentId(value: string) {
  const key = Buffer.from(process.env.MEMBER_DATA_KEY || "", "base64");
  if (key.length !== 32) throw new Error("Membership encryption is not configured.");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const body = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), body].map((part) => part.toString("base64")).join(".");
}
export function decryptStudentId(value: string) {
  const key = Buffer.from(process.env.MEMBER_DATA_KEY || "", "base64");
  const parts = value.split(".");
  if (key.length !== 32 || parts.length !== 3) throw new Error("Student information is unavailable.");
  const [iv, tag, body] = parts.map(part => Buffer.from(part, "base64"));
  if (iv.length !== 12 || tag.length !== 16 || body.length > 120) throw new Error("Student information is unavailable.");
  try {
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(body), decipher.final()]).toString("utf8");
  } catch { throw new Error("Student information is unavailable."); }
}
export async function database(path: string, options: RequestInit = {}) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Membership storage is not configured.");
  const response = await fetch(`${url}/rest/v1/${path}`, { ...options, cache: "no-store", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation", ...options.headers }, signal: AbortSignal.timeout(15000) }).catch(() => {
    reportServiceFailure("storage");
    throw new Error("Membership storage is unavailable.");
  });
  if (!response.ok) {
    reportServiceFailure("storage", response.status);
    throw new Error("Membership storage is unavailable.");
  }
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
export async function stripe(path: string, body?: URLSearchParams, idempotencyKey?: string, apiVersion?: string) {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("Payments are not configured.");
  const response = await fetch(`https://api.stripe.com/v1/${path}`, { method: body ? "POST" : "GET", cache: "no-store", headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}), ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}), ...(apiVersion ? { "Stripe-Version": apiVersion } : {}) }, body, signal: AbortSignal.timeout(20000) }).catch(() => {
    reportServiceFailure("stripe");
    throw new Error("The payment service is unavailable.");
  });
  if (!response.ok) {
    reportServiceFailure("stripe", response.status, response.headers.get("request-id"));
    throw new Error("The payment service is unavailable.");
  }
  return response.json();
}
export async function getMember(access: string | undefined): Promise<Member | null> {
  if (!access || !/^[a-f0-9]{64}$/.test(access) || !process.env.SUPABASE_URL) return null;
  const rows = await database(`bss_members?access_hash=eq.${hash(access)}&select=id,full_name,email,student_id_encrypted,plan,status,expires_at,checkout_session_id,card_email_accepted_at,created_at&limit=1`);
  return rows[0] ?? null;
}
export async function fulfillSession(sessionId: string) {
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) throw new Error("Invalid checkout session.");
  const session = await stripe(`checkout/sessions/${sessionId}?expand[]=payment_intent.latest_charge`);
  if (session.payment_status !== "paid" || session.mode !== "payment" || session.metadata?.membership_year !== "2026-2027") return;
  if (session.livemode !== (stripeMode(process.env.STRIPE_SECRET_KEY) === "live")) throw new Error("Payment environment mismatch.");
  const rows = await database(`bss_members?checkout_session_id=eq.${encodeURIComponent(sessionId)}&select=id,plan,status,created_at&limit=1`);
  const member = rows[0];
  if (!member || session.metadata.member_id !== member.id || session.currency !== "cad" || session.amount_total !== membershipPrice(member.plan as MembershipPlan, member.created_at ? Date.parse(member.created_at) : 0)) throw new Error("Payment does not match the membership.");
  const charge = session.payment_intent?.latest_charge;
  if (!charge || typeof charge !== "object") throw new Error("Payment verification is incomplete.");
  const revoked = charge.amount_refunded > 0 || charge.disputed || member.status === "revoked";
  const updated = await database(`bss_members?id=eq.${member.id}${revoked ? "" : "&status=neq.revoked"}`, { method: "PATCH", body: JSON.stringify({ status: revoked ? "revoked" : "active", payment_intent_id: session.payment_intent.id }) });
  return revoked || !updated?.length ? undefined : member.id as string;
}
export function verifyStripeSignature(raw: string, signature: string) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return false;
  const fields = signature.split(",").map((field) => field.split("="));
  const timestamp = fields.find(([key]) => key === "t")?.[1];
  if (!timestamp || !/^\d+$/.test(timestamp) || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${raw}`).digest();
  return fields.filter(([key]) => key === "v1").some(([, value]) => {
    if (!/^[a-f0-9]{64}$/i.test(value)) return false;
    return timingSafeEqual(expected, Buffer.from(value, "hex"));
  });
}
