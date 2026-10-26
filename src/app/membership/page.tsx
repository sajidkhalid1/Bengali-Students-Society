import { cookies } from "next/headers";
import { canRegister, hasTestAccess, testCookie } from "@/lib/membership-access";
import type { Metadata } from "next";
import Link from "next/link";
import { MembershipForm } from "@/components/membership-form";
import { membershipExpiry } from "@/lib/membership-server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Become a Member", description: "Join BSS for 2026–2027. Early-bird new memberships CA$10 through October 31; regular price CA$15. Returning memberships CA$10." };
export default async function MembershipPage({ searchParams }: { searchParams: Promise<{ cancelled?: string }> }) {
  // This dynamic server route supplies one clock snapshot for hydration.
  // eslint-disable-next-line react-hooks/purity
  const initialTime = Date.now();
  const access = (await cookies()).get(testCookie)?.value;
  const testing = hasTestAccess(access);
  const cancelled = (await searchParams).cancelled === "1";
  const expiry = membershipExpiry();
  const expiryLabel = expiry && Number.isFinite(Date.parse(expiry)) ? new Date(expiry).toLocaleDateString("en-CA", { timeZone: "America/Edmonton", year: "numeric", month: "long", day: "numeric" }) : undefined;
  return <main id="main-content"><div className="inner-page-hero"><div className="container"><p className="eyebrow">MEMBERSHIP / 2026–2027</p><h1>A new chapter.<br /><em>A place for you.</em></h1><p>Choose your membership and make this year yours.</p><Link className="text-link" href="/benefits">Explore membership benefits ↗</Link></div></div><section className="section container" aria-label="Membership registration">{cancelled && <div className="signup-notice" role="status"><strong>Checkout cancelled.</strong><p>Use Resume checkout below to return to your existing payment session.</p></div>}<MembershipForm enabled={canRegister(access)} testing={testing} initialTime={initialTime} expiryLabel={expiryLabel} /></section><section className="container membership-contributions" aria-labelledby="membership-contributions-title"><div className="contribution-panel"><p className="eyebrow">ANOTHER WAY TO GIVE BACK</p><h2 id="membership-contributions-title">Help our community<br /><em>grow together.</em></h2><p>Want to support BSS beyond your membership? A voluntary contribution helps bring our student events, cultural celebrations, and community gatherings to life.</p><p>Contributions can be sent by e-transfer to <strong className="contribution-email">bengalistudentssociety@gmail.com</strong>.</p><p className="form-help">Contributing is optional and separate from the membership fee. It does not register or renew a membership.</p><Link className="button button-outline" href="/contribute">Contribution details ↗</Link></div></section></main>;
}

