import { randomUUID, timingSafeEqual } from "node:crypto";
import { sendMembershipCardEmail } from "@/lib/membership-email-provider";
import { siteOrigin } from "@/lib/membership-server";
export const runtime = "nodejs";
export const maxDuration = 60;
function reply(text: string, status: number) {
  return new Response(text, { status, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
export async function POST(request: Request) {
  if (request.headers.get("origin") !== siteOrigin()) return reply("Forbidden.", 403);
  const body = await request.text();
  if (body.length > 1024) return reply("Invalid request.", 400);
  const expected = process.env.MEMBERSHIP_TEST_TOKEN || "";
  const supplied = new URLSearchParams(body).get("password") || "";
  const a = Buffer.from(expected), b = Buffer.from(supplied);
  if (expected.length < 32 || a.length !== b.length || !timingSafeEqual(a, b)) return reply("Incorrect test password.", 403);
  if (process.env.MEMBERSHIP_EMAIL_PROVIDER !== "gmail") return reply("The deployed email provider is not Gmail.", 503);
  const recipient = process.env.MEMBERSHIP_TEST_EMAIL?.trim().toLowerCase();
  if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) return reply("Set MEMBERSHIP_TEST_EMAIL in Vercel Production, then redeploy.", 503);
  try {
    await sendMembershipCardEmail({ to: [recipient], subject: "BSS — Gmail delivery test", text: "This test was sent by the BSS website using Gmail SMTP. No payment was made and no membership was created. Please confirm receipt with BSS.", html: "<div style='background:#06271e;color:#f6f0dc;padding:32px;font-family:Arial,sans-serif'><h1>BSS email delivery test</h1><p>This message was sent by the website using Gmail SMTP.</p><p>No payment was made and no membership was created.</p></div>", attachments: [] }, `email-test-${randomUUID()}`);
    return reply(`Gmail accepted the test email for ${recipient}. Check the inbox and spam folder. Acceptance does not guarantee inbox delivery.`, 200);
  } catch { return reply("Gmail did not accept the test email. Check the App Password, Gmail account, and Vercel runtime logs. No payment was made.", 502); }
}
