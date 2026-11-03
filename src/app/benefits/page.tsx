import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { benefits } from "@/lib/benefits";
import "./benefits.css";

export const metadata: Metadata = {
  title: "Member Benefits",
  description: "Explore the local partner offers available to Bengali Students Society members in Calgary.",
};

export default function BenefitsPage() {
  return (
    <main id="main-content" className="benefits-page">
      <section className="benefits-hero">
        <div className="container benefits-hero-inner">
          <div className="benefits-hero-copy">
            <p className="eyebrow"><span className="benefits-hero-mark" aria-hidden="true">✳</span> BSS MEMBER BENEFITS</p>
            <h1>A little extra<br /><em>comes with belonging.</em></h1>
            <p className="benefits-intro">Your BSS membership brings you closer to campus community and local Calgary favourites. Show your active membership when you visit to access these partner offers.</p>
            <Link className="button" href="/membership">Become a member <span aria-hidden="true">↗</span></Link>
          </div>
          <div className="benefits-hero-stamp" role="img" aria-label={`${benefits.length} local partners. Yearly membership perks.`}>
            <svg viewBox="0 0 260 260" aria-hidden="true"><defs><path id="perks-top-arc" d="M 35,130 A 95,95 0 0,1 225,130" /><path id="perks-bottom-arc" d="M 35,130 A 95,95 0 0,0 225,130" /></defs><circle cx="130" cy="130" r="122" /><circle className="stamp-inner-ring" cx="130" cy="130" r="78" /><text className="stamp-arc"><textPath href="#perks-top-arc" startOffset="50%" textAnchor="middle">LOCAL PARTNERS</textPath></text><text className="stamp-arc"><textPath href="#perks-bottom-arc" startOffset="50%" textAnchor="middle">YEARLY MEMBER PERKS</textPath></text><text className="stamp-four" x="130" y="139" textAnchor="middle">{benefits.length}</text><text className="stamp-caption" x="130" y="164" textAnchor="middle">WAYS TO SAVE</text><text className="stamp-star" x="29" y="136">✳</text><text className="stamp-star" x="216" y="136">✳</text></svg>
          </div>
        </div>
        <div className="benefits-ribbon" aria-hidden="true"><div className="benefits-marquee-track">{[0, 1].map(copy => <div className="benefits-marquee-group" key={copy}>{[0, 1, 2].map(index => <span key={index}>GOOD FOOD <i>✳</i> GOOD PEOPLE <i>✳</i> GOOD TOGETHER <i>✳</i></span>)}</div>)}</div></div>
      </section>

      <section className="container benefits-list-section" aria-labelledby="partner-offers-title">
        <div className="benefits-section-heading">
          <div><p className="eyebrow">YOUR MEMBERSHIP, A LITTLE MORE DELICIOUS</p><h2 id="partner-offers-title">Yearly membership<br /><em>perks.</em></h2></div>
          <p>Discover ongoing member discounts below. Restaurant and grocery perks run throughout your membership term; Tiger Auto and Tires’ 8% offer applies during Fall and Winter terms.</p>
        </div>

        <div className="benefits-card-grid">
          {benefits.map((benefit, index) => (
            <article className={`benefit-card benefit-card-${benefit.id}`} key={benefit.id}>
              <div className="benefit-card-topline"><span className="benefit-index">0{index + 1} / BSS PARTNER</span><span className="benefit-star" aria-hidden="true">✳</span></div>
              <div className="benefit-wordmark">{benefit.logo && <div className="benefit-logo"><Image src={benefit.logo} alt={`${benefit.name} logo`} width={200} height={100} /></div>}<h3>{benefit.name}</h3></div>
              <div className="benefit-offer-row"><p className="benefit-discount">{benefit.offer}</p><span className="benefit-scope">{benefit.scope}</span></div>
              <p className="benefit-terms">{benefit.terms}</p>
              <a className="benefit-source" href={benefit.sourceUrl} target="_blank" rel="noreferrer">{benefit.id === "tiger-auto" ? "Ask BSS for partner details" : `Visit ${benefit.name}`} <span aria-hidden="true">↗</span></a>
            </article>
          ))}
        </div>
        <p className="benefits-fine-print">Offers are for active BSS members and apply during each partner’s stated term. Promotional items and offers are excluded as listed. Please present your membership before checkout.</p>
      </section>

      <section className="container benefits-deals-section" aria-labelledby="active-deals-title"><div className="benefits-section-heading"><div><p className="eyebrow">A LITTLE EXTRA, FOR A LITTLE WHILE</p><h2 id="active-deals-title">Active deals.<br /><em>Limited-time offers.</em></h2></div><p>A separate place for short-term member specials, monthly deals, and student packages. We’ll update this section as offers are confirmed.</p></div><article className="tire-deal" aria-labelledby="tire-deal-title"><div className="tire-deal-heading"><span className="deals-status">ACTIVE OFFER · BSS STUDENTS ONLY</span><h3 id="tire-deal-title">Ready for the season.</h3><p>Tire-swap specials at Tiger Auto and Tires, exclusively for BSS students.</p></div><dl className="tire-deal-prices"><div><dt>Tire swap with loose tires</dt><dd>CA$40</dd></div><div><dt>Dismount & remount<br/><span>Rims smaller than 18 inches</span></dt><dd>CA$75</dd></div><div><dt>Dismount & remount<br/><span>Rims 18 inches or larger</span></dt><dd>CA$90</dd></div></dl><p className="form-help">Show your active BSS membership. Contact BSS for partner and booking details. The promotion’s end date will be announced when available; ask whether offers can be combined.</p><Link className="text-link" href="/#contact">Ask BSS about this offer ↗</Link></article><p className="benefits-fine-print">More limited-time partner offers, monthly deals, and student packages are coming soon. We’ll publish each offer’s dates and redemption details once confirmed.</p></section>

      <section className="benefits-join">
        <div className="container benefits-join-inner">
          <div><p className="eyebrow">MORE THAN THE SAVINGS</p><h2>Make room for<br /><em>more belonging.</em></h2><p>Meet people, celebrate culture, and find your place in the BSS community.</p></div>
          <Link className="button button-outline" href="/membership">See membership <span aria-hidden="true">↗</span></Link>
        </div>
      </section>
    </main>
  );
}
