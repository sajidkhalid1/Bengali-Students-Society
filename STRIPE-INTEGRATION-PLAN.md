# BSS Stripe integration review — September 21, 2026

Status: documentation-based review, not output from stripe_implementation_planner. The requested plugin install failed because this session cannot write the Codex plugin cache. Adding the remote MCP server failed because Codex config.toml is outside writable locations. No Stripe planner is callable. The requested `npx skills add https://docs.stripe.com` fallback could not run because npx is unavailable on PATH. No Stripe credentials were saved, no Stripe account objects were created, and registration remains disabled.

## Business and scope

Bengali Students Society is a student-run University of Calgary club, operating at https://bssucalgary.app/. Initial payments are one-time CAD membership purchases: $15 new and $10 returning, expiring September 1, 2027 at midnight Calgary time. Event ticket sales are a future, separate flow; no event prices or capacity rules have been supplied. There is no need for recurring Billing or marketplace Connect for this membership flow.

Keep Stripe-hosted Checkout. Store membership records privately in Supabase; issue the emailed PNG/QR card through Resend only after verifying payment. Checkout redirects do not themselves establish payment. The current server-side redirect integration does not require a publishable key in the browser.

## Existing implementation reviewed

- `src/app/api/membership/checkout/route.ts` validates signup, reserves a student record, creates a CAD Checkout Session with server-set prices and an idempotency key, and sets an HttpOnly card-access cookie. Student IDs are not sent in Stripe metadata.
- `src/lib/membership-server.ts` checks the raw webhook signature with timestamp tolerance; fetches the Checkout Session from Stripe; checks paid status, membership metadata, currency and total; and handles refunded/disputed charges before activation.
- `src/app/api/membership/webhook/route.ts` handles completion, expiry, refund and dispute events. Email delivery failures return a retryable error.
- Email delivery has a database claim and provider idempotency key. QR verification reads current membership status and expiry rather than trusting the card image.

## Improvements before public launch

1. **Tax-aware payment validation:** Current fulfillment requires `amount_total` to equal 1500 or 1000. Exclusive tax would break that condition. Before enabling automatic tax, persist the intended price, tax behavior and order version; verify Stripe line items, quantity, currency, discounts and tax-complete status against that order. Validate the authoritative total according to inclusive/exclusive pricing instead of removing amount validation. Test taxable, zero-tax and incomplete-tax cases.
2. **Recoverable Checkout creation:** A timeout or database update failure can leave a reserved membership without a usable Checkout link. Retain a durable checkout attempt and retry its same idempotency key; reconcile Stripe state before releasing or recreating a reservation. Do not automatically create a second payment attempt after an ambiguous timeout.
3. **Version and environment controls:** Pin and test a Stripe API version and webhook event version together. Reject mismatched live/test events and sessions. Keep test credentials and test member records separate from production.
4. **Signup protection:** Add student-email ownership verification and rate limits before enabling public registration. Current domain validation is not proof of ownership. Publish support contact, privacy/retention and refund terms; decide how returning-member eligibility is verified.
5. **Operational recovery:** Monitor webhook failures and unsent active members. Keep membership activation independent from email-provider availability. Test simultaneous/reordered events and refund-versus-activation races, and reconcile final state with Stripe. A partial refund currently revokes membership too; confirm that business rule.

## Payments and Tax rollout

Start with test Checkout and the existing CAD prices. Before enabling Tax, obtain BSS's tax-registration status and confirm whether displayed prices include applicable tax. Do not infer exemption from student-club status or invent a tax registration. Confirm the correct membership product classification with whoever handles the club's finances.

Once those decisions are confirmed, configure Stripe Tax settings and applicable registrations, set the product tax code and explicit price tax behavior, and enable `automatic_tax[enabled]` in Checkout. Let Checkout collect the required billing location. Persist the tax outcome with the payment for reconciliation. Tax is separately priced; do not subscribe to a paid package merely to start development.

## Account setup and validation

1. Rotate the test secret disclosed in chat using Stripe Dashboard. Put the replacement in a private server environment as `STRIPE_SECRET_KEY`, never a `NEXT_PUBLIC_` variable. Do not paste it into chat.
2. Complete plugin/MCP installation from a normal local terminal or the app's plugin controls, then authenticate with OAuth and start a fresh session. Confirm the planner is callable before claiming a planner-generated review. Requested commands:

   ```powershell
   codex plugin add stripe@openai-curated
   codex mcp add stripe --url https://mcp.stripe.com
   codex mcp login stripe
   ```

   If the plugin already configures the server, inspect that configuration before adding a duplicate. Limit initial OAuth access to the test environment.
3. Connect a Supabase test project and verified Resend sender using the existing MEMBERSHIP-SETUP.md. Use a separate test deployment URL and matching SITE_URL. Keep production MEMBERSHIP_ENABLED=false.
4. Register the test deployment's `/api/membership/webhook` endpoint for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`, `charge.refunded`, and `charge.dispute.created`. Store its endpoint-specific signing secret as STRIPE_WEBHOOK_SECRET.
5. Test successful and declined payment, cancellation, duplicate registration, interrupted checkout creation, invalid signature, repeated/out-of-order events, refund/dispute, database outage, email outage/retry, and QR revocation/expiry. Use synthetic member data. Local mocks alone are not proof of provider integration.
6. Resolve the improvements above and repeat tests with confirmed tax settings before switching to live keys and opening registration. Live mode uses its own webhook signing secret. A test key cannot accept real payments.

## Official references

- Stripe MCP and planner: https://docs.stripe.com/mcp
- Hosted Checkout: https://docs.stripe.com/payments/checkout
- Checkout automatic tax: https://docs.stripe.com/tax/checkout/page
- Stripe Tax pricing: https://stripe.com/en-ca/tax/pricing
- API key management: https://docs.stripe.com/keys

This review did not change payment behavior or deploy new code. Revisit it with the Stripe planner after the connection is available.
