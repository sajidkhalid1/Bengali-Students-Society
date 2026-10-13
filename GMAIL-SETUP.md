# Membership emails from the BSS Gmail account

The website can send membership card emails directly from bengalistudentssociety@gmail.com through Gmail SMTP over authenticated TLS. The account's normal password is never used.

## Activate in Vercel Production

1. Sign in to the BSS Google account. Enable 2-Step Verification if needed: https://myaccount.google.com/security
2. Create a Google App Password named BSS Website: https://myaccount.google.com/apppasswords
3. Save these variables in the existing project's Production environment:

| Variable | Value |
| --- | --- |
| MEMBERSHIP_EMAIL_PROVIDER | gmail |
| GMAIL_USER | bengalistudentssociety@gmail.com |
| GMAIL_APP_PASSWORD | The Google App Password, saved as Secret |

Enter the password directly in Vercel. Do not paste it in chat or commit it to source. Spaces in Google's displayed password are handled automatically.

4. Upload bss-gmail-membership-update.zip to the existing bss-website project. This includes the updated card with student email and ID; no earlier ZIP or database migration is needed.
5. Verify a new paid signup's email arrives from the BSS Gmail account. Keep the card download available as a fallback while checking inbox delivery.

When gmail is selected, the sender is built from GMAIL_USER and the display name BSS Membership. The older MEMBERSHIP_EMAIL_FROM and RESEND_API_KEY values are not used. No extra paid email service is introduced.

The default provider remains resend until the Gmail variables are configured and the new code is deployed. An invalid provider or malformed credential configuration prevents opening new membership checkouts.

## Reliability

Payment verification, the database send lease, and accepted-email tracking remain in place. Webhook replay does not resend already-accepted card emails. SMTP does not provide Resend's provider-side idempotency guarantee: an ambiguous disconnect after server acceptance, or a database failure while recording acceptance, can occasionally cause a duplicate retry. A stable Message-ID is retained across retries.

Already-accepted membership emails are not automatically resent by switching providers. SMTP credentials and actual live delivery remain unverified until the account setup is complete.

## References

- Google App Passwords: https://support.google.com/mail/answer/185833
- Nodemailer Gmail guidance: https://nodemailer.com/usage/using-gmail/
- Vercel SMTP support: https://vercel.com/kb/guide/serverless-functions-and-smtp
