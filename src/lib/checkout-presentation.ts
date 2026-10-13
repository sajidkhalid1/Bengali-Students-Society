// Only these values may be sent to the authenticated checkout browser.
export type CheckoutPresentation = { client_secret: string; publishable_key: string } | { url: string };
export type CheckoutSession = {
  id: string; client_secret?: string | null; url?: string | null;
  status?: string; payment_status?: string; livemode: boolean;
  metadata?: { member_id?: string; membership_year?: string };
};

export function stripeMode(key: string | undefined): "live" | "test" | undefined {
  return /^(sk|rk)_live_/.test(key || "") ? "live" : /^(sk|rk)_test_/.test(key || "") ? "test" : undefined;
}
export function publishableKeyMatches() {
  const mode = stripeMode(process.env.STRIPE_SECRET_KEY);
  return Boolean(mode && process.env.STRIPE_PUBLISHABLE_KEY?.startsWith(`pk_${mode}_`));
}
export function checkoutPresentation(session: CheckoutSession): CheckoutPresentation {
  if (!stripeMode(process.env.STRIPE_SECRET_KEY) || session.livemode !== (stripeMode(process.env.STRIPE_SECRET_KEY) === "live")) throw new Error("Payment environment mismatch.");
  if (session.client_secret) {
    if (!publishableKeyMatches()) throw new Error("Payment form is not configured.");
    return { client_secret: session.client_secret, publishable_key: process.env.STRIPE_PUBLISHABLE_KEY! };
  }
  // Resume pre-migration hosted sessions without creating another payment.
  if (session.url && new URL(session.url).origin === "https://checkout.stripe.com") return { url: session.url };
  throw new Error("Checkout response incomplete.");
}
