import { database, type Member } from "./membership-server";
import { membershipEmailConfigurationIssues, sendMembershipCardEmail } from "./membership-email-provider";
import { escapeMarkup, memberCardPng, verificationUrl } from "./member-card";

/** A DB lease serializes sends; accepted emails are skipped on webhook replay. */
export async function deliverMembershipEmail(id: string) {
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new Error("Invalid member reference.");
  if (membershipEmailConfigurationIssues().length) throw new Error("Membership email is not configured.");
  const claimed: Member[] = await database("rpc/claim_bss_card_email", { method: "POST", body: JSON.stringify({ member_id: id }) });
  const member = claimed[0];
  if (!member) {
    const [existing] = await database(`bss_members?id=eq.${id}&select=status,expires_at,card_email_accepted_at&limit=1`);
    if (!existing || existing.status !== "active" || Date.parse(existing.expires_at) <= Date.now() || existing.card_email_accepted_at) return;
    throw new Error("Card email delivery is in progress. Retry required.");
  }
  try {
    // Recheck at issuance as well as in SQL. No pending/refunded/expired card is sent.
    if (member.status !== "active" || Date.parse(member.expires_at) <= Date.now()) throw new Error("Membership is not active.");
    const testing = member.checkout_session_id?.startsWith("cs_test_");
    const card = await memberCardPng(member);
    const url = verificationUrl(member.id);
    const result = await sendMembershipCardEmail({
        from: process.env.MEMBERSHIP_EMAIL_FROM, to: [member.email], subject: testing ? "TEST — BSS membership card (not valid for discounts)" : "Your BSS 2026–2027 membership card",
        text: `${testing ? "TEST ONLY — not a valid membership. " : ""}Welcome to BSS, ${member.full_name}! Your payment has been verified. Your digital membership card is attached. Save the image to your phone and show it at participating partners. Partners must scan the QR code to check current membership status and match your name. Discounts depend on each partner's offer. Verification: ${url}\nKeep this email to access your card on any device. Do not share your card with others.`,
        html: `<div style="background:#06271e;color:#f6f0dc;padding:32px;font-family:Arial,sans-serif;line-height:1.7"><p style="color:#dfc58b">BENGALI STUDENTS SOCIETY · 2026–2027</p>${testing ? "<p>TEST ONLY — not a valid membership or discount card.</p>" : ""}<h1>Welcome to BSS, ${escapeMarkup(member.full_name)}.</h1><p>Your payment has been verified. Your membership card is attached to this email—save the image to your phone and keep this email for later.</p><p>Show your card at participating partners. They can scan its QR code to check your current membership status and match your name. Discounts depend on each partner’s offer.</p><p><a style="color:#dfc58b" href="${escapeMarkup(url)}">Check your membership status</a></p><p>Please keep your card for your own use.</p></div>`,
        attachments: [{ filename: "BSS-membership-2026-2027.png", content: card.toString("base64"), content_type: "image/png" }],
    }, member.id);
    if (typeof result.id !== "string") throw new Error("Email acceptance could not be confirmed.");
    await database(`bss_members?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ card_email_accepted_at: new Date().toISOString(), card_email_provider_id: result.id, card_email_claimed_at: null }) });
  } catch (error) {
    // Keep the lease until it expires. Resend has provider idempotency; SMTP uses a stable Message-ID.
    throw error;
  }
}
