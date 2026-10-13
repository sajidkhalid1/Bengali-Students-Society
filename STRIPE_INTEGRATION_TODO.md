# October 13 automatic Gmail email integration

The owner requested automatic membership emails from bengalistudentssociety@gmail.com. Implemented Gmail SMTP with an App Password, TLS verification, updated card attachment, and existing fulfillment/lease/accepted-email safeguards. See GMAIL-SETUP.md for the three Production variables and deployment steps. The sender switch is not live yet; it requires the account App Password and bss-gmail-membership-update.zip upload. Actual SMTP authentication and inbox delivery remain unverified. Twenty-five tests, type checks, ESLint, and production build passed.

## Earlier live payment and card update

Stripe confirms the owner's live CAD $10 payment is paid and complete. Public QR verification reports the membership active. The live webhook completed successfully. Resend recorded the card email as delivered; the university Microsoft mail server accepted it with SMTP 250 and queued it for delivery, but the owner has not found it in their inbox.

Added the missing _dmarc.mail TXT record (v=DMARC1; p=none; adkim=r; aspf=r) in Vercel and verified public DNS propagation. This improves sender authentication but does not prove inbox placement or release an already-quarantined message.

The new card includes student email and student ID, with authenticated server-side decryption of the stored ID. The public verification page still excludes both. Signup notices were updated. Existing members can download the new card after deployment; accepted emails are not automatically resent. No database migration or environment change is required.

Deploy bss-membership-card-update.zip. Twenty-two automated tests, lint, type checks, and the production build passed. The rendered PNG and its QR were verified.

## Earlier October 13 release update

Public signup verified enabled on bssucalgary.app. Early-bird offer extended through October 31, 11:59 PM Calgary time (exclusive cutoff 2026-11-01T06:00:00Z). Full-price reservations between the original cutoff and the extension remain valid at their original price. Deploy bss-early-bird-oct31-update.zip to apply the extension. No database or environment changes required.

# Stripe integration: release status

## October 1, 2026 update (supersedes the historical checklist below)

The owner completed an actual embedded test payment and confirmed the emailed card and working QR verification. Live credentials and the live webhook have since been configured. Actual live payment and webhook delivery remain unverified.

Vercel Production MEMBERSHIP_ENABLED=true is saved at the owner's request and takes effect on the next deployment. Deploy bss-registration-events-update.zip to the existing project before announcing registration.

New-member early-bird pricing is CAD $10 through October 7, Calgary time, ending exclusively at 2026-10-08T06:00:00Z. Regular new membership automatically returns to CAD $15; returning membership stays CAD $10. Checkout and fulfillment use the immutable reservation timestamp, preserving historical pricing and retries. No database migration is required.

Nineteen automated tests, TypeScript, ESLint, and production build passed. Local announcements, gallery, and the seven-photo Asia Cup viewer were checked. The live Stripe iframe palette still needs visual confirmation after deployment. The agent has not performed a live payment.

## Historical checklist

Updated September 29, 2026. This is the current checklist; older setup documents provide historical context.

## Implemented locally

The membership form now displays the Stripe Checkout Form SDK inside the membership page. Server-controlled prices remain CAD 15 new / CAD 10 returning. Supabase reservation, same-session recovery, verified webhook fulfillment, Resend card email and QR verification remain in place. Public registration stays disabled.

Checkout uses ui_mode=form, mode=payment, billing_address_collection=auto, phone_number_collection.enabled=false, automatic_tax.enabled=false, submit_type=auto and integration_identifier=custom_embedded_web_0001. The preview API version is 2026-03-25.dahlia; custom_checkout_payment_form_preview=v1, scoped to checkout requests. Stripe.js uses the custom_checkout_payment_form_1 beta. Membership metadata, customer email, expiry and return URL are retained because fulfillment and recovery require them. Dynamic payment methods are controlled through Stripe. Cards are issued only after verified paid status.

STRIPE_PUBLISHABLE_KEY is supplied at runtime from the server. Both sk_ and rk_ secret-key mode prefixes are supported; restricted keys must also have the required API permissions. The browser receives only the publishable key and session client secret. Existing hosted sessions can still resume on checkout.stripe.com. The original reservation idempotency key is preserved to avoid duplicate sessions; an ambiguous pre-migration reservation may require staff reconciliation instead of a new session.

## Verification completed

- TypeScript and ESLint passed; production build passed.
- 16 automated tests passed, covering fulfillment, signatures, recovery, mode checks and checkout presentation.
- Local fixture HTTP checks passed for closed public registration, private test access, signup, same-session resume and cross-origin rejection.
- Earlier hosted Checkout test delivered an emailed digital card; the owner confirmed receipt.

The actual embedded Stripe iframe, preview-feature availability on the account, and payment completion have NOT yet been verified. Fixture checks do not prove those integrations work. The embedded-checkout package was uploaded by the owner, and the existing production deployment was redeployed on September 29 after STRIPE_PUBLISHABLE_KEY was added. The owner confirmed live keys. No live charge was attempted; embedded form payment verification remains pending. The subsequent event/design changes are packaged separately and await upload.

## Required environment configuration

Enter credentials directly in Vercel, never in this file or chat:

| Variable | Required value |
|---|---|
| STRIPE_PUBLISHABLE_KEY | Publishable key belonging to the same account and mode as the server key. This is newly required. |
| STRIPE_SECRET_KEY | Corresponding server-only key. |
| STRIPE_WEBHOOK_SECRET | Signing secret for the endpoint in that same test or live environment. |
| MEMBERSHIP_ENABLED | Keep false until release checks pass. |

Vercel now shows STRIPE_PUBLISHABLE_KEY in Production. The owner confirmed live keys; private test access intentionally requires test mode. Do not infer that those credentials match. Use matching test credentials for a private test, or a separate Preview environment with its own webhook URL and SITE_URL. Redeploy after changing environment variables.

The connected live account is acct_1UILpR2H0S2OwLcQ. Its enabled webhook is we_1UKooO2H0S2OwLcQ88IN91pX at https://bssucalgary.app/api/membership/webhook. Events: checkout.session.completed, checkout.session.async_payment_succeeded, checkout.session.expired, charge.refunded, charge.dispute.created. Live delivery remains unverified. The earlier test account differs from the connected live account.

## Next steps

1. Upload bss-website-embedded-checkout-update.zip to the existing Vercel project, with public registration disabled.
2. Configure matching test keys and test webhook secret, then redeploy. Confirm the preview Form SDK is available to that account.
3. Use private test access to test embedded payment, decline/retry, same-session resume, card email and QR validity. Test webhook replay and refund revocation. Never use test card numbers in live mode.
4. Before public launch, configure matching live credentials, verify live webhook delivery, confirm returning-member eligibility and publish club support, privacy/retention and refund terms. Complete email ownership/abuse protection review. Enable public registration only when these checks are complete.

Automatic tax remains disabled, as requested by the supplied Studio configuration; this does not determine the club's tax obligations.
