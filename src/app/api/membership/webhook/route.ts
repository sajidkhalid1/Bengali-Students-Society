import { NextResponse } from "next/server";
import { database, fulfillSession, verifyStripeSignature } from "@/lib/membership-server";
import { deliverMembershipEmail } from "@/lib/membership-email";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const raw = await request.text();
  if (!verifyStripeSignature(raw, request.headers.get("stripe-signature") || "")) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  try {
    const event = JSON.parse(raw);
    if (["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type)) { const memberId = await fulfillSession(event.data.object.id); if (memberId) await deliverMembershipEmail(memberId); }
    if (event.type === "checkout.session.expired" && /^cs_[A-Za-z0-9_]+$/.test(event.data.object.id)) await database(`bss_members?checkout_session_id=eq.${event.data.object.id}&status=eq.pending`, { method: "PATCH", body: JSON.stringify({ status: "expired" }) });
    if (["charge.refunded", "charge.dispute.created"].includes(event.type)) {
      const intent = event.data.object.payment_intent;
      if (typeof intent === "string" && /^pi_[A-Za-z0-9]+$/.test(intent)) await database(`bss_members?payment_intent_id=eq.${intent}`, { method: "PATCH", body: JSON.stringify({ status: "revoked" }) });
    }
    return NextResponse.json({ received: true });
  } catch { return NextResponse.json({ error: "Unable to process event. Retry required." }, { status: 500 }); }
}
