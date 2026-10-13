# Apple Wallet fee waiver: BSS next steps

Checked against Apple's official guidance on 2026-09-21.

Apple normally charges US$99/year for the Developer Program. A waiver is available to qualifying legal nonprofits, accredited educational institutions, and government entities. Individuals and sole proprietors do not qualify. The organization must not offer paid apps/in-app purchases under the Paid Applications Agreement or otherwise sell digital goods/services through its apps. Apple reviews eligibility and can ask for documents. Request the waiver during organization enrollment; existing account holders can request it before renewal. Previously paid fees are not refundable, and eligibility must be reconfirmed annually.

Source: https://developer.apple.com/help/account/membership/fee-waivers

## Before applying

Confirm whether BSS itself is a legal nonprofit entity. University club recognition alone does not establish that requirement. If BSS is not a separate entity, ask the university or Students' Union whether a qualifying organization can own and manage this service. This is a potential route to discuss, not a guarantee of approval. Do not enroll under another organization's name without its authorization.

## Application steps

1. An authorized representative creates/uses an Apple Account with two-factor authentication.
2. Start Apple Developer Program enrollment as an organization: https://developer.apple.com/programs/enroll/
3. Prepare the organization's legal name, D-U-N-S number, proof of legal/binding authority, organization-domain work email, and functional public website. A D-U-N-S number can generally be requested free of charge. Apple's enrollment page explains verification.
4. Select the fee-waiver option during enrollment. Supply requested nonprofit/educational-status documentation directly to Apple.
5. Wait for Apple's decision before paying. After approval, create a Pass Type ID and signing certificate so the website can issue Apple Wallet membership passes.

Enrollment source: https://developer.apple.com/help/account/membership/program-enrollment/

Explain the actual use to Apple: paid student society membership purchased on the website, with a Wallet pass as proof of membership; no paid app is planned. Ask Apple to confirm eligibility for this use. The website can launch with a web membership card while this is reviewed.

## Other accounts

Use Supabase Free: https://supabase.com/dashboard/sign-up . Create the project and retain the database password securely; do not paste passwords or private keys into chat. The database SQL is in database/membership.sql.

Use Stripe standard pay-as-you-go: https://dashboard.stripe.com/register . Complete the society's identity/business and payout onboarding yourself. Start integration in test mode; no paid subscription or paid custom Checkout domain is needed. Canadian standard domestic online card fees apply (2.9% + CA$0.30): https://stripe.com/en-ca/pricing .

The deployment will need server-only credentials entered directly into Vercel environment settings, plus the final membership expiry and contact/policy details. Membership is still disabled until configuration and end-to-end testing are complete.
