// September 1, 2027 at 00:00 in Calgary (MDT, UTC-06:00).
export const membershipExpiresAt = "2027-09-01T06:00:00Z";

export const membershipPlans = {
  new: { label: "New member", cents: 1500 },
  returning: { label: "Returning member", cents: 1000 },
} as const;
// Price follows the reservation date, so retries and delayed webhooks retain the original amount.
export const earlyBirdStartsAt = "2026-10-02T05:10:00Z";
export const originalEarlyBirdEndsAt = "2026-10-08T06:00:00Z";
// Preserve full-price reservations made after the first offer ended.
export const earlyBirdExtensionStartsAt = "2026-10-13T17:30:00Z";
// November 1 at midnight in Calgary, before the daylight-saving change.
export const earlyBirdEndsAt = "2026-11-01T06:00:00Z";
export function isEarlyBird(at: number = Date.now()) {
  return (at >= Date.parse(earlyBirdStartsAt) && at < Date.parse(originalEarlyBirdEndsAt))
    || (at >= Date.parse(earlyBirdExtensionStartsAt) && at < Date.parse(earlyBirdEndsAt));
}
export function membershipPrice(plan: keyof typeof membershipPlans, at: number = Date.now()) { return plan === "new" && isEarlyBird(at) ? 1000 : membershipPlans[plan].cents; }
export type MembershipPlan = keyof typeof membershipPlans;

export function validateRegistration(value: unknown) {
  if (!value || typeof value !== "object") throw new Error("Please complete the form.");
  const fields = value as Record<string, unknown>;
  const fullName = typeof fields.fullName === "string" ? fields.fullName.trim() : "";
  const email = typeof fields.email === "string" ? fields.email.trim().toLowerCase() : "";
  const studentId = typeof fields.studentId === "string" ? fields.studentId.trim() : "";
  if (fullName.length < 2 || fullName.length > 100) throw new Error("Enter your full name (2–100 characters).");
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid student email address.");
  if (!/^[A-Za-z0-9 -]{3,30}$/.test(studentId)) throw new Error("Enter a valid student ID (3–30 letters, numbers, spaces, or hyphens).");
  if (fields.plan !== "new" && fields.plan !== "returning") throw new Error("Choose a membership type.");
  if (fields.consent !== true) throw new Error("Please agree to the membership information notice.");
  return { fullName, email, studentId, plan: fields.plan as MembershipPlan };
}
