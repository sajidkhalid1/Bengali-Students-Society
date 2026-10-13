import { stripeMode } from "./checkout-presentation";
import { createHmac, timingSafeEqual } from "node:crypto";
import { registrationEnabled, membershipConfigurationIssues } from "./membership-server";

export const testCookie = "bss_test_access";
export function testConfigurationIssues(): string[] {
  const issues = membershipConfigurationIssues();
  if (stripeMode(process.env.STRIPE_SECRET_KEY) !== "test") issues.push("stripe-server-key-not-test-mode");
  if ((process.env.MEMBERSHIP_TEST_TOKEN || "").length < 32) issues.push("test-token-shorter-than-32-characters");
  if (!process.env.MEMBERSHIP_TEST_EMAIL) issues.push("missing:MEMBERSHIP_TEST_EMAIL");
  return issues;
}
export function testConfigured() { return testConfigurationIssues().length === 0; }
function equal(a: string, b: string) {
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
export function validTestPassword(value: string) {
  return testConfigured() && equal(value, process.env.MEMBERSHIP_TEST_TOKEN!);
}
export function issueTestAccess(now = Date.now()) {
  const expiry = String(Math.floor(now / 1000) + 3600);
  const signature = createHmac("sha256", process.env.MEMBERSHIP_TEST_TOKEN!).update(expiry).digest("hex");
  return `${expiry}.${signature}`;
}
export function hasTestAccess(value?: string, now = Date.now()) {
  if (!testConfigured() || !value) return false;
  const [expiry, signature, extra] = value.split(".");
  if (extra || !/^\d+$/.test(expiry) || !/^[a-f0-9]{64}$/.test(signature || "")) return false;
  const remaining = Number(expiry) - Math.floor(now / 1000);
  return remaining > 0 && remaining <= 3600 && equal(signature, createHmac("sha256", process.env.MEMBERSHIP_TEST_TOKEN!).update(expiry).digest("hex"));
}
export function canRegister(cookie?: string) { return registrationEnabled() || hasTestAccess(cookie); }
