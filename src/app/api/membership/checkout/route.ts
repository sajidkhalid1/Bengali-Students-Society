import { checkoutPresentation } from "@/lib/checkout-presentation";
import { randomBytes, randomUUID, createHmac } from "node:crypto";
import { cookies } from "next/headers";
import { canRegister, hasTestAccess, testCookie } from "@/lib/membership-access";
import { NextResponse } from "next/server";
import { openMemberCheckout } from "@/lib/member-checkout";
import { validateRegistration } from "@/lib/membership";
import { database, encryptStudentId, hash, memberCookie, membershipExpiry, siteOrigin, getMember } from "@/lib/membership-server";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const jar = await cookies();
  const testing = hasTestAccess(jar.get(testCookie)?.value);
  if (!canRegister(jar.get(testCookie)?.value)) return NextResponse.json({ error: "Registration is not open yet. No payment has been taken." }, { status: 503 });
  if (request.headers.get("origin") !== siteOrigin()) return NextResponse.json({ error: "Please register from the BSS website." }, { status: 403 });
  let registration;
  try {
    const raw = await request.text();
    if (raw.length > 4096) throw new Error("The form is too large.");
    registration = validateRegistration(JSON.parse(raw));
    if (testing && registration.email !== process.env.MEMBERSHIP_TEST_EMAIL?.trim().toLowerCase()) throw new Error("Use the designated test email address.");
    if (testing) registration.fullName = "BSS Test Member";
    const domains = (process.env.STUDENT_EMAIL_DOMAINS || "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
    if (!testing && domains.length && !domains.includes(registration.email.split("@")[1])) throw new Error("Please use an eligible student email address.");
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Check your registration details." }, { status: 400 }); }
  let access: string | undefined;
  try {
    const existing = await getMember(jar.get(memberCookie)?.value);
    if (existing && existing.status !== "expired") return NextResponse.json({ error: "You already have a checkout or membership in this browser. Use Resume checkout below." }, { status: 409 });
    const studentLookup = createHmac("sha256", process.env.MEMBER_DATA_KEY!).update((testing ? "TEST:" : "") + registration.studentId.replace(/[ -]/g, "").toUpperCase()).digest("hex");
    const id = randomUUID();
    access = randomBytes(32).toString("hex");
    // The SQL function atomically prevents duplicate active / recent pending registrations.
    const reserved = await database("rpc/reserve_bss_membership", { method: "POST", body: JSON.stringify({ member_id: id, member_name: registration.fullName, member_email: registration.email, member_plan: registration.plan, encrypted_student_id: encryptStudentId(registration.studentId), student_lookup: studentLookup, access_digest: hash(access), membership_expiry: membershipExpiry() }) });
    if (!reserved) return NextResponse.json({ error: "This student already has a membership or a checkout in progress. Resume your checkout from the membership page. If it cannot be resumed, contact BSS before trying another payment." }, { status: 409 });
    const member = await getMember(access);
    if (!member) throw new Error("Membership reservation could not be read.");
    const session = await openMemberCheckout(member);
    const response = NextResponse.json(checkoutPresentation(session), { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(memberCookie, access, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
    return response;
  } catch {
    const response = NextResponse.json({ error: "Checkout could not be opened. Use Resume checkout to retry the same payment attempt." }, { status: 502 });
    if (access) response.cookies.set(memberCookie, access, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
    return response;
  }
}
