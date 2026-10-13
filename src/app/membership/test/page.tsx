import { testConfigurationIssues } from "@/lib/membership-access";
export const dynamic = "force-dynamic";
export const metadata = { title: "Private Membership Test", robots: { index: false, follow: false } };
export default async function TestPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const error = (await searchParams).error;
  const issues = testConfigurationIssues();
  // Only fixed diagnostic codes: never log environment values or submitted tokens.
  if (issues.length) console.error("BSS_TEST_CONFIGURATION", { issues });
  return <main id="main-content" className="container section"><p className="eyebrow">BSS / PRIVATE TEST</p><h1>Try the complete signup.</h1><p>For the BSS setup team. Use fictional student details and Stripe test cards only.</p>{!issues.length ? <form action="/api/membership/test-access" method="post" className="signup-form"><label className="form-field">Test access key<input type="password" name="password" required autoComplete="off" maxLength={256} /></label>{error && <p role="alert">Access could not be verified. Check the key and try again.</p>}<button className="button">Unlock test signup</button></form> : <p>Private testing has not been configured yet. Public registration remains closed.</p>}</main>;
}
