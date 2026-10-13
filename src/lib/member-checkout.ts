import { checkoutPresentation } from "./checkout-presentation";
import { membershipPlans, membershipPrice } from "./membership";
import { database, siteOrigin, stripe, type Member } from "./membership-server";

export const checkoutApiVersion = "2026-03-25.dahlia; custom_checkout_payment_form_preview=v1";

// Rebuild identical parameters from a durable reservation, including expiry.
// A lost network response is retried with the same Stripe idempotency key.
export async function openMemberCheckout(member: Member) {
  if (member.status !== "pending" || !member.created_at) throw new Error("No pending checkout.");
  const created = Math.floor(Date.parse(member.created_at) / 1000);
  if (!Number.isFinite(created) || Date.now() / 1000 - created > 1800) throw new Error("Checkout requires staff reconciliation.");
  const price = membershipPlans[member.plan];
  const values = new URLSearchParams({
    mode: "payment", customer_email: member.email,
    ui_mode: "form",
    billing_address_collection: "auto",
    "phone_number_collection[enabled]": "false",
    "automatic_tax[enabled]": "false",
    submit_type: "auto",
    integration_identifier: "custom_embedded_web_0001",
    "line_items[0][price_data][currency]": "cad",
    "line_items[0][price_data][unit_amount]": String(membershipPrice(member.plan, Date.parse(member.created_at))),
    "line_items[0][price_data][product_data][name]": `BSS 2026–2027 · ${price.label}`,
    "line_items[0][quantity]": "1", "metadata[member_id]": member.id,
    "metadata[membership_year]": "2026-2027",
    return_url: `${siteOrigin()}/membership/card`,
    expires_at: String(created + 3600),
  });
  const session = await stripe("checkout/sessions", values, `bss-checkout-v2-${member.id}`, checkoutApiVersion);
  if (!session.id || !session.client_secret) throw new Error("Checkout response incomplete.");
  checkoutPresentation(session);
  await database(`bss_members?id=eq.${member.id}&status=eq.pending`, { method: "PATCH", body: JSON.stringify({ checkout_session_id: session.id }) });
  return session;
}
