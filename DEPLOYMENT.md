> September 29 update: embedded checkout now requires STRIPE_PUBLISHABLE_KEY. See STRIPE_INTEGRATION_TODO.md for current deployment and testing status; older hosted-checkout instructions below are historical.

# Live deployment

URL: https://bss-website-lilac.vercel.app/

Vercel project: bss-website
Team: Bengali Student's Society (bengali-student-s-society)
Dashboard: https://vercel.com/bengali-student-s-society/bss-website
Deployed: 2026-09-16 via Vercel Drop to Deploy using the source ZIP.

This deployment is not connected to a Git repository. Future changes must be redeployed to this existing project or connected to a repository for automatic deployments. CLI authentication is not configured; use the authenticated Vercel dashboard.


## Feature update — 2026-09-21

Published from bss-website-update.zip to the existing production domain. Vercel deployment: HyhHWv18rAmJJYv7NDpZHZUp5yc7 (Ready). Verified live: gallery with 36 photos and working viewer; named past sponsors/business partners; membership preview with registration disabled; landing-page SVG boundaries changing with scroll. Payment collection and wallet issuance remain disabled pending setup described in MEMBERSHIP-SETUP.md.


## About/events update — prepared locally, not yet published

Custom production domain: https://bssucalgary.app/

Added the owner-confirmed founding story (2018, Rafia Babar), expanded About content as the landing page, corrected polaroid caption and welcome seal, textile curtain navigation, a dedicated yearly events page, and Asia Cup 2026 sponsor portraits/profile links. Wallet readiness is independent of paid membership registration to support a staged low-cost launch. Membership remains closed pending accounts, expiry, policies, and provider tests.

Validation: standalone TypeScript and ESLint checks; eight membership regression tests; production build; desktop/phone browser checks of the collage and route navigation. The local sandbox prevents Next's TypeScript child process, so build-time type checking was temporarily skipped after running standalone tsc; temporary worker settings were restored and are not shipped.

## Current committee / benefits / email-card update

Nine committee names and roles supplied by the owner are included on /team; initials are intentional until portraits arrive. /benefits contains future partner discounts without inventing percentages or treating past partners as confirmed redemption locations. Membership signup links to benefits. Both pages participate in textile transitions.

The card flow now uses email PNG attachments with live QR verification rather than requiring wallet enrollment. Email provider, database and payment credentials are not configured. Membership remains disabled. These changes are prepared locally and are not published by creating the ZIP.

## Production confirmed — 2026-09-21

The user uploaded bss-website-membership-update.zip to the existing Vercel project. Deployment 4WiHcmjXSL4f3RHXmuuxqqcjze5W is Ready (bss-website-c1d6qrjup-bengali-student-s-society.vercel.app), connected to https://bssucalgary.app/ and the original Vercel domain. This supersedes the prepared/not-published status above.

Verified production HTTP 200 for /, /team, /benefits and /membership; confirmed Rafia Babar founding content, committee content and disabled registration. Browser verification confirms the published benefits page with forthcoming offers, emailed QR-card instructions, CAD prices and September 1, 2027 expiry. Payment/database/email services remain unconfigured and registration remains closed pending integration and end-to-end provider tests.

## Service configuration — 2026-09-22

Production deployment x11TShTiZzAcMqC8vcMcANNX8UQD is Ready. All required environment-variable names are saved in Vercel, with MEMBERSHIP_ENABLED=false. Resend mail.bssucalgary.app was verified in its dashboard. Stripe sandbox webhook we_1UIa8g2Ev31qPjZIWaOeEP8Q was created by the owner for the five membership events; owner saved the signing secret and generated MEMBER_DATA_KEY privately.

Corrected SUPABASE_URL from the dashboard URL to the confirmed Data API origin https://fekhdfugwiqvmxctlmuu.supabase.co. Redeployed and verified a random, nonexistent UUID gives Card not recognized rather than service unavailable, confirming the membership-table lookup works. Checkout still returns 503 as intended. Secret values were not exported into this project.

Remaining: verify Stripe credentials/signatures and Resend delivery with a controlled test flow; configured names alone do not prove their values work. Public registration remains closed pending pre-launch improvements documented in STRIPE-INTEGRATION-PLAN.md and MEMBERSHIP-SETUP.md. Owner authorized a test card email to their supplied personal inbox, using a fictional name and student ID; no payment or email test has yet been performed. Use an isolated or access-controlled test flow rather than opening production signup just to test.


## September 26 update — awaiting upload

Prepared private membership testing, checkout recovery, test-card labeling and rejection, canonical alias redirect, native draggable/autoplay event carousel, and landing-only scroll scaling with reduced-motion support. ZIP: bss-website-signup-motion-update.zip. Existing Vercel deployment remains unchanged until upload. Test access requires the two MEMBERSHIP_TEST_* variables described in MEMBERSHIP-SETUP.md. No real charges or emails were sent this turn.
