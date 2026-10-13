/* eslint-disable react-hooks/purity -- Dynamic server page checks expiry at request time. */
import { database } from "@/lib/membership-server";
import Link from "next/link";
export const dynamic = "force-dynamic";
export const metadata = { title: "Verify Membership", robots: { index: false, follow: false }, referrer: "no-referrer" as const };

export default async function VerifyMembership({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let status: "active" | "inactive" | "unavailable" | "invalid" | "test" = "invalid";
  let name = "";
  let expiry = "";
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id)) {
    try {
      const [member] = await database(`bss_members?id=eq.${id}&select=full_name,status,expires_at,checkout_session_id&limit=1`);
      if (member) {
        status = member.checkout_session_id?.startsWith("cs_test_") ? "test" : member.status === "active" && Date.parse(member.expires_at) > Date.now() ? "active" : "inactive";
        if (status === "active") { name = member.full_name; expiry = new Date(member.expires_at).toLocaleDateString("en-CA", { timeZone: "America/Edmonton" }); }
      }
    } catch { status = "unavailable"; }
  }
  const title = { test: "Test card — not valid for discounts", active: "Active BSS member", inactive: "Membership is not active", invalid: "Card not recognized", unavailable: "Unable to verify right now" }[status];
  return <main id="main-content" className="container section verification-page"><p className="eyebrow">BSS / LIVE MEMBERSHIP CHECK</p><div className={`verification-panel verification-${status}`}><span className="verification-mark" aria-hidden="true">{status === "active" ? "✓" : "!"}</span><h1>{title}</h1>{status === "active" ? <><p className="verified-name">{name}</p><p>Member {id.slice(0, 8).toUpperCase()} · 2026–2027<br />Expires {expiry} at midnight, Calgary time.</p><p>Partners: match this name with the card and the person presenting it before applying your membership offer.</p></> : <p>{status === "unavailable" ? "The membership service could not be reached. Please refresh and verify before applying a discount." : "This QR code does not currently confirm an eligible BSS membership. Please ask for a current card."}</p>}</div><p className="form-help">Check that this page is on bssucalgary.app. A screenshot of a successful check is not a live verification. Student IDs and email addresses are never displayed here.</p><Link className="text-link" href="/benefits">Membership benefits ↗</Link></main>;
}
