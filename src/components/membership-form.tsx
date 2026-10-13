"use client";

import Image from "next/image";
import Link from "next/link";
import { EmbeddedMembershipCheckout } from "./embedded-membership-checkout";
import type { CheckoutPresentation } from "@/lib/checkout-presentation";
import { useEffect, useState } from "react";
import { membershipPlans, membershipPrice, isEarlyBird, type MembershipPlan } from "@/lib/membership";

export function MembershipForm({ enabled, expiryLabel, testing = false, initialTime }: { enabled: boolean; expiryLabel?: string; testing?: boolean; initialTime: number }) {
  const [now, setNow] = useState(initialTime);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const earlyBird = isEarlyBird(now);
  const [plan, setPlan] = useState<MembershipPlan>("new");
  const [fullName, setFullName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [checkout, setCheckout] = useState<{ client_secret: string; publishable_key: string } | null>(null);
  const continueCheckout = (result: CheckoutPresentation) => {
    if ("client_secret" in result && result.client_secret && result.publishable_key) {
      setCheckout(result); setPending(false);
    } else if ("url" in result && result.url) { window.location.assign(result.url); }
    else { throw new Error("Payment could not be opened. Use Resume checkout to try again."); }
  };
  if (checkout) return <EmbeddedMembershipCheckout clientSecret={checkout.client_secret} publishableKey={checkout.publishable_key} />;
  return <div className="signup-layout"><form className="signup-form" onSubmit={async (event) => {
    event.preventDefault();
    if (!enabled || pending) return;
    setError(""); setPending(true);
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/membership/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fullName: data.get("fullName"), email: data.get("email"), studentId: data.get("studentId"), plan, consent: data.get("consent") === "on" }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Checkout is unavailable. Please try again.");
      continueCheckout(result);
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to open checkout."); setPending(false); }
  }}>
    {testing && <div className="signup-notice" role="status"><strong>Private test signup — no real payments.</strong><p>Use the designated test inbox, fictional student details, and Stripe test card 4242 4242 4242 4242. Test cards do not qualify for discounts.</p></div>}
    {!enabled && <div className="signup-notice" role="status"><strong>Registration is opening soon.</strong><p>You can explore the form and card preview. Information is not submitted and payments are not collected yet.</p></div>}
    {earlyBird && <div className="early-bird-offer"><p className="eyebrow">EARLY BIRD / UNTIL OCTOBER 31</p><h2>Your year starts here.</h2><p>New membership <del>CA$15</del> <strong>CA$10</strong>. Offer ends October 31 at 11:59 PM, Calgary time. Returning members stay CA$10.</p></div>}
    <fieldset disabled={pending}><legend>01 / Choose your membership</legend><div className="plan-options">{Object.entries(membershipPlans).map(([key, value]) => <label className={`plan-option ${plan === key ? "selected" : ""}`} key={key}><input type="radio" name="plan" value={key} checked={plan === key} onChange={() => setPlan(key as MembershipPlan)} /><span>{value.label}<strong>{key === "new" && earlyBird && <del>CA$15 </del>}CA${membershipPrice(key as MembershipPlan, now) / 100}</strong></span></label>)}</div></fieldset>
    <fieldset disabled={pending}><legend>02 / A little about you</legend><label className="form-field">Full name<input name="fullName" autoComplete="name" required minLength={2} maxLength={100} value={fullName} onChange={(event) => setFullName(event.target.value)} /></label><label className="form-field">Student email<input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="Your school email address" /></label><label className="form-field">Student ID number<input name="studentId" autoComplete="off" required minLength={3} maxLength={30} pattern="[A-Za-z0-9 \-]{3,30}" aria-describedby="student-id-help" /></label><p id="student-id-help" className="form-help">Your student email and ID will appear on your digital membership card.</p><label className="consent-field"><input type="checkbox" name="consent" required /><span>I agree that BSS may use my name, student email, and student ID to administer my membership and email my card. My card displays my name, student email, and student ID. Its QR verification page shows only my name and membership status. Payment is processed securely by Stripe; BSS does not receive my card details.</span></label></fieldset>
    {enabled && <button type="button" className="text-link" disabled={pending} onClick={async () => { setPending(true); setError(""); try { const response = await fetch("/api/membership/resume", { method: "POST" }); const result = await response.json(); if (!response.ok) throw new Error(result.error); continueCheckout(result); } catch (error) { setError(error instanceof Error ? error.message : "Unable to resume checkout."); setPending(false); } }}>Already started? Resume checkout ↗</button>}
    <div className="checkout-total"><span>One-time membership payment</span><strong>CA${membershipPrice(plan, now) / 100}.00</strong></div>{error && <p role="alert" className="form-error">{error}</p>}<button className="button w-full" type="submit" disabled={!enabled || pending}>{pending ? "Opening secure checkout…" : enabled ? "Continue to payment" : "Registration opening soon"}</button><p className="form-help">No recurring subscription. Membership period: 2026–2027. {expiryLabel ? `Expires ${expiryLabel} at midnight, Calgary time.` : "Exact expiry and full terms will be confirmed before registration opens."}</p>
  </form><aside className="membership-preview"><p className="eyebrow">YOUR COMMUNITY, IN YOUR POCKET</p><div className="digital-card"><div className="card-brand"><Image src="/bss-logo.png" alt="BSS" width={58} height={58} /><span>Bengali Students Society<br /><small>2026–2027</small></span></div><p className="card-title">A little Bengal.<br /><em>Always with you.</em></p><div className="card-details"><strong>{fullName.trim() || "Your name here"}</strong><span>{membershipPlans[plan].label}</span></div><span className="card-preview-label">PREVIEW · NOT A VALID MEMBERSHIP</span></div><h2>Your place in BSS.</h2><p>After payment is verified, we’ll email your digital card with a QR code. Save the image on your phone and show it at participating partner locations.</p><ol className="membership-steps"><li>Enter your student details.</li><li>Pay securely in Canadian dollars.</li><li>Receive your card by email and save it.</li></ol><Link className="text-link" href="/benefits">Explore membership benefits ↗</Link></aside></div>;
}
