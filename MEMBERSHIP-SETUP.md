> September 29 update: embedded checkout now requires STRIPE_PUBLISHABLE_KEY. See STRIPE_INTEGRATION_TODO.md for current deployment and testing status; older hosted-checkout instructions below are historical.

# Membership launch: emailed QR cards

Current approach: Stripe checkout + Supabase private records + Resend card emails. Wallet enrollment is not required. Apple/Google integrations are dormant unless their separate flags are explicitly enabled. Public registration remains closed until setup and provider tests pass.

## Owner setup

1. Create a Supabase Free project and run database/membership.sql in its SQL editor. The script is safe to rerun for the email-column/function migration. Keep RLS enabled and service-role keys server-only.
2. Create a Stripe account for the society, complete onboarding, and use test keys first. Standard Canadian domestic online card pricing: 2.9% + CA$0.30 with no standard monthly fee (https://stripe.com/en-ca/pricing). Charges remain CA$15 new / CA$10 returning; fees are absorbed by BSS. No paid custom Checkout domain is needed.
3. Create a Resend Free account and verify a sending domain using Resend's DNS records. Set RESEND_API_KEY and MEMBERSHIP_EMAIL_FROM in Vercel. The From address must use the verified domain; an unverified test sender cannot email arbitrary students. Free sending currently has a 100/day limit (https://resend.com/pricing).
4. Set server-only values listed in .env.example directly in Vercel. SITE_URL is https://bssucalgary.app. Generate and safely back up a stable random 32-byte base64 MEMBER_DATA_KEY; losing it prevents decryption of student IDs. Do not paste private keys into chat or source control.
5. Expiry is September 1, 2027 at 00:00 Calgary time (2027-09-01T06:00:00Z), as confirmed by the owner. Configure eligible school-email domains, support contact, privacy/retention and refund terms. Returning status is self-declared unless prior records are supplied.
6. Create a Stripe webhook at https://bssucalgary.app/api/membership/webhook for checkout.session.completed, checkout.session.async_payment_succeeded, checkout.session.expired, charge.refunded, and charge.dispute.created. Set its signing secret.
7. Complete the checks below before setting MEMBERSHIP_ENABLED=true and redeploying. No production emails or charges were sent during development.

## Card flow

Checkout validates prices on the server, stores an encrypted student ID and private record, and opens Stripe-hosted payment. Only verified payment activates membership. A verified Stripe webhook then claims email delivery, renders a Montserrat-branded PNG with QR, and sends it as an attachment to the recorded student email. The authenticated card page also offers a PNG download. The card displays the student email and ID. The ID stays encrypted in the database and is decrypted only for authenticated card rendering and delivery. The public QR verification page excludes both fields.

The QR contains the site's verification URL and an unpredictable UUID. A fresh database read confirms current status and expiry. Active records show the name and card reference for comparison; inactive records show no name. Signup consent explains this disclosure. A copied valid card is still copyable: partners must match the verified name with the person presenting it. QR status alone does not verify identity. Screenshots of the verification page are not a live check.

## Email reliability

Database acceptance timestamps prevent routine webhook replay from sending again. A service-role-only SQL function leases delivery for two minutes to serialize concurrent calls. A stable Resend idempotency key covers ambiguous retries for 24 hours. Provider failure leaves the email unsent and returns a retryable webhook error; membership remains active and its card can still be downloaded.

Provider acceptance is not proof of inbox delivery. Monitor bounces in Resend. Stripe retries and manual event replay handle pending emails; no paid queue or recurring retry service is configured. Monitor unsent active records before Stripe's retry window ends, especially when daily email limits are reached. For ambiguous delivery beyond Resend's 24-hour idempotency window, check provider logs before replaying. Do not change the card/email template while an ambiguous delivery is pending.

Sources: https://resend.com/docs/api-reference/emails/send-email and https://resend.com/docs/dashboard/emails/idempotency-keys

## Required pre-launch verification

- Real Stripe test checkout success, decline, cancellation, session expiry, duplicate signup, failed checkout creation, refund/dispute, invalid signature and event replay.
- Actual Supabase RLS, unique-student reservation and concurrent email-claim execution. Local service mocks do not validate database permissions.
- Email delivery through the verified domain; read the PNG attachment and scan it on iOS/Android. Check name, link domain, invalid card, revoked membership, expiry, provider outage and retry behaviour.
- Add school-email ownership verification and production signup abuse controls before public registration. Domain syntax checks alone do not prove student status.
- Publish contact/refund/retention terms. The form consent is not a complete privacy policy.
- Reconcile pending signup records against Stripe before releasing them. Checkout-creation failure can leave a pending reservation needing staff support. Expired sessions are released by the verified webhook.

## Local checks

node node_modules/typescript/bin/tsc --noEmit
node node_modules/eslint/bin/eslint.js .
node node_modules/typescript/bin/tsc src/lib/membership.ts src/lib/membership-server.ts src/lib/wallet.ts src/lib/member-card.ts src/lib/membership-email.ts --outDir .test-build --module commonjs --target es2020 --esModuleInterop --skipLibCheck
node tests/membership.cjs

The 12-test suite covers validation, closed registration, encrypted IDs, signature tampering/replay, payment matching/refund revocation, optional wallets, independent QR decoding, email replay/failure handling and inactive-member suppression. Real service calls, device scans and delivery still require account-level testing.


## September 26: private signup test and recovery

Public signup now requires MEMBERSHIP_ENABLED=true AND a live Stripe key. To test without opening public registration, keep that flag false and add MEMBERSHIP_TEST_TOKEN (a new random 32+ character secret, not MEMBER_DATA_KEY) and MEMBERSHIP_TEST_EMAIL (the owner's authorized test inbox) in Vercel Production. Use the already-configured test Stripe credentials. Redeploy the latest ZIP, open https://bssucalgary.app/membership/test and enter the test token there. It issues a signed HttpOnly one-hour cookie. The token never belongs in a URL. Removing/rotating the token invalidates test access.

Use fictional student details and Stripe test card 4242 4242 4242 4242, any future expiry and three-digit CVC. The server restricts test signup to the configured inbox, forces a test display name, separates test student lookup hashes, marks test cards/email, and rejects test cards for discounts in QR verification. Test records still reside in the configured database; remove/reconcile test records before live launch. These are sandbox payments, not real memberships.

Cancelled checkout can now be resumed in the same browser. Creation failures retain a browser access cookie and retry the durable reservation with identical Stripe parameters/idempotency key. Recovery is bounded to 30 minutes; older ambiguous attempts require staff reconciliation rather than risking a second payment. Checkout expires one hour after reservation creation. Verified expired sessions can be released by Resume checkout or the webhook.

The historical bss-website-lilac.vercel.app alias redirects to bssucalgary.app to keep cookies and payment-origin checks consistent. All membership testing should start on the canonical domain.

Validation: 14 local regression tests; local HTTP tests of private access, blocked public signup, and test-recipient restriction; TypeScript, ESLint and production build. Account-backed Stripe checkout, webhook delivery and actual card email remain to be tested after deployment. Before a public live launch, the remaining email ownership/abuse controls and policies in this document still apply.


## Verified production test — September 26, 2026

Deployment `ADGiRghcmAVV2RZnx5vefStDbErL` applied the private test configuration. The authorized tester completed Stripe test checkout. The authenticated card page displayed an active test membership, and its email-accepted state was present. The PNG card downloaded successfully and was visually checked: test-only markings, new-member plan, QR code, and September 1, 2027 expiry. The user confirmed receipt of the email and attached card.

Still pending: scanning the delivered QR code to verify its test-only status; Stripe live-account readiness and live-mode webhook/key configuration; remaining public-launch controls and policies. Keep public registration disabled. Never copy test credentials into this file.
