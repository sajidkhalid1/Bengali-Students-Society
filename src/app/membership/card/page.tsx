/* eslint-disable react-hooks/purity -- Dynamic server route: expiry is checked at request time. */
/* eslint-disable @next/next/no-html-link-for-pages -- Wallet endpoints download a pass or redirect externally; do not prefetch. */
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { qrSvg, verificationUrl } from "@/lib/member-card";
import { getMember, memberCookie, fulfillSession, walletEnabled, decryptStudentId } from "@/lib/membership-server";
export const dynamic = "force-dynamic";
export const metadata = { title: "Your Membership Card", robots: { index: false, follow: false } };
export default async function CardPage() {
  const token = (await cookies()).get(memberCookie)?.value;
  let member = null;
  let unavailable = false;
  let studentId = "";
  try {
    member = await getMember(token);
    if (member?.checkout_session_id) { await fulfillSession(member.checkout_session_id); member = await getMember(token); }
      if (member?.status === "active" && member.student_id_encrypted) studentId = decryptStudentId(member.student_id_encrypted);
  } catch { unavailable = true; }
  if (!member || unavailable || member.status !== "active" || Date.parse(member.expires_at) <= Date.now()) return <main id="main-content" className="container section"><p className="eyebrow">BSS MEMBERSHIP</p><h1>{member?.status === "pending" ? "Payment verification pending." : "Membership card unavailable."}</h1><p>{unavailable ? "We could not verify your membership just now. Please try again shortly." : "A card is issued only after payment is confirmed. Open this page in the same browser used for checkout."}</p><Link className="button" href="/membership/card">Check again</Link> <Link className="text-link" href="/membership">Back to membership</Link></main>;
  return <main id="main-content" className="container section card-page"><p className="eyebrow">WELCOME TO THE COMMUNITY</p><h1>Your place in BSS.</h1>{member.checkout_session_id?.startsWith("cs_test_") && <p className="signup-notice">TEST CARD — not a valid membership or discount card.</p>}<div className="digital-card"><div className="card-brand"><Image src="/bss-logo.png" alt="BSS" width={58} height={58} /><span>Bengali Students Society<br />2026–2027</span></div><p className="card-title">{member.full_name}</p><p>{member.plan === "new" ? "New" : "Returning"} member</p><dl className="card-identity"><dt>Student email</dt><dd>{member.email}</dd><dt>Student ID</dt><dd>{studentId || "Not provided"}</dd></dl><div className="member-qr" role="img" aria-label="Scan to verify membership" dangerouslySetInnerHTML={{ __html: qrSvg(verificationUrl(member.id)) }} /><p className="form-help">Member {member.id.slice(0, 8).toUpperCase()}<br />Valid until {new Date(member.expires_at).toLocaleDateString("en-CA", { timeZone: "America/Edmonton" })}</p></div><div className="wallet-actions"><a className="button" href="/api/membership/card-image" download>Save your digital card ↧</a>{walletEnabled("apple") && <a className="button" href="/api/membership/wallet/apple">Add to Apple Wallet</a>}{walletEnabled("google") && <a className="button button-outline" href="/api/membership/wallet/google">Add to Google Wallet</a>}</div><p>{member.card_email_accepted_at ? "Your card email has been sent. Check your student email inbox and spam folder, then save the attachment to your phone." : "Your membership is active. Your card email is being prepared; you can download it here now."}</p><p>Partners scan the QR code to verify your current membership and match your name. Your card contains your student email and ID. The public QR verification page shows only your name and membership status.</p><Link className="text-link" href="/benefits">Explore your member benefits ↗</Link></main>;
}
