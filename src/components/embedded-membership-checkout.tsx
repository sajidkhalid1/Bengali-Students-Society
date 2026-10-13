"use client";

import Script from "next/script";
import { useEffect, useId, useState } from "react";

type StripeForm = {
  mount(selector: string): void;
  on(event: "confirm", callback: (event: unknown) => Promise<void>): void;
  destroy?(): void;
  unmount?(): void;
};
type CheckoutSdk = {
  createForm(options: { layout: "expanded" }): StripeForm;
  loadActions(): Promise<
    { type: "success"; actions: { confirm(options: { formConfirmEvent: unknown }): Promise<unknown> } } |
    { type: "error" }
  >;
};
declare global {
  interface Window {
    Stripe?: (key: string, options: { betas: string[] }) => {
      initCheckoutFormSdk(options: { clientSecret: string; appearance: typeof appearance }): CheckoutSdk;
    };
  }
}

// BSS palette applied through Stripe Appearance; card data remains inside Stripe.
const appearance = {
  theme: "night", labels: "auto", inputs: "condensed",
  variables: { borderRadius: "12px", colorBackground: "#103e30", colorDanger: "#df1b41",
    colorPrimary: "#c44735", colorSuccess: "#00c853", colorText: "#fff4dc",
    fontFamily: "Montserrat, system-ui, sans-serif", fontSizeBase: "16px", spacingUnit: "4px" },
};

export function EmbeddedMembershipCheckout({ clientSecret, publishableKey }: { clientSecret: string; publishableKey: string }) {
  const id = `bss-checkout-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [scriptReady, setScriptReady] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (loaded || error) return;
    const timer = setTimeout(() => setError("The payment form is taking too long to load. Check your connection and retry the same checkout."), 30000);
    return () => clearTimeout(timer);
  }, [loaded, error, attempt]);
  useEffect(() => {
    if (!scriptReady) return;
    let disposed = false;
    let form: StripeForm | undefined;
    let confirming = false;
    async function mount() {
      try {
        if (!window.Stripe) throw new Error("Stripe unavailable");
        const stripe = window.Stripe(publishableKey, { betas: ["custom_checkout_payment_form_1"] });
        const checkout = stripe.initCheckoutFormSdk({ clientSecret, appearance });
        const result = await checkout.loadActions();
        if (disposed) return;
        if (result.type !== "success") throw new Error("Checkout unavailable");
        form = checkout.createForm({ layout: "expanded" });
        form.on("confirm", async (event) => {
          if (disposed || confirming) return;
          confirming = true;
          setError("");
          try {
            // Stripe redirects to our return URL; only the server can issue a card.
            await result.actions.confirm({ formConfirmEvent: event });
          } catch {
            if (!disposed) setError("Payment could not be confirmed. Follow the message in the payment form or retry. If you were charged, check your membership card before paying again.");
          } finally { confirming = false; }
        });
        form.mount(`#${id}`);
        setLoaded(true);
        setError("");
      } catch {
        if (!disposed) setError("We couldn’t load secure payment. Retry this checkout; your membership details are already saved.");
      }
    }
    void mount();
    return () => {
      disposed = true;
      if (form?.destroy) form.destroy();
      else form?.unmount?.();
    };
  }, [scriptReady, clientSecret, publishableKey, id, attempt]);

  return <section className="embedded-checkout" aria-labelledby={`${id}-title`}>
    <Script src="https://js.stripe.com/dahlia/stripe.js" strategy="afterInteractive"
      onReady={() => setScriptReady(true)} onError={() => setError("Stripe could not load. Check your connection, then reload this page and use Resume checkout.")} />
    <div className="checkout-brand"><span aria-hidden="true">✳</span><p className="eyebrow">BSS / SECURE CHECKOUT</p><span className="secure-pill">Powered by Stripe</span></div>
    <h2 id={`${id}-title`}>You’re almost a member.</h2>
    <p>Complete your one-time payment below. Stripe securely handles your payment details.</p>
    {!loaded && !error && <p role="status">Loading secure payment…</p>}
    <div id={id} className="stripe-form-mount" />
    {error && <div className="signup-notice"><p role="alert">{error}</p>
      {scriptReady && <button className="button button-outline" type="button" onClick={() => { setError(""); setLoaded(false); setAttempt(value => value + 1); }}>Reload payment form</button>}
    </div>}
    <p className="form-help">Your card will be issued after payment is verified. Need to return later? Use Resume checkout on this page in the same browser.</p>
    <a className="text-link" href="/membership/card">Already paid? Check your membership card ↗</a>
  </section>;
}
