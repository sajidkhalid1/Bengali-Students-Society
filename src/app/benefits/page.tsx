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
          <div className="benefits-hero-stamp" aria-label="Local partners, member perks">
            <span className="stamp-orbit" aria-hidden="true">✳ &nbsp; LOCAL PARTNERS &nbsp; ✳ &nbsp; MEMBER PERKS &nbsp;</span>
            <span className="stamp-center"><b>4</b><small>WAYS TO<br />SAVE</small></span>
          </div>
        </div>
        <div className="benefits-ribbon" aria-hidden="true"><span>GOOD FOOD · GOOD PEOPLE · GOOD TOGETHER · </span><span>GOOD FOOD · GOOD PEOPLE · GOOD TOGETHER · </span></div>
      </section>

      <section className="container benefits-list-section" aria-labelledby="partner-offers-title">
        <div className="benefits-section-heading">
          <div><p className="eyebrow">YOUR MEMBERSHIP, A LITTLE MORE DELICIOUS</p><h2 id="partner-offers-title">Local love.<br /><em>Member perks.</em></h2></div>
          <p>Four Calgary partners are making your BSS membership go a little further. Explore the offers below and check each partner’s terms before ordering.</p>
        </div>

        <div className="benefits-card-grid">
          {benefits.map((benefit, index) => (
            <article className={`benefit-card benefit-card-${benefit.id}`} key={benefit.id}>
              <div className="benefit-card-topline"><span className="benefit-index">0{index + 1} / BSS PARTNER</span><span className="benefit-star" aria-hidden="true">✳</span></div>
              <div className="benefit-wordmark">{benefit.logo && <div className="benefit-logo"><Image src={benefit.logo} alt={`${benefit.name} logo`} width={200} height={100} /></div>}<h3>{benefit.name}</h3></div>
              <div className="benefit-offer-row"><p className="benefit-discount">{benefit.offer}</p><span className="benefit-scope">{benefit.scope}</span></div>
              <p className="benefit-terms">{benefit.terms}</p>
              {benefit.extra && <p className="benefit-extra"><span aria-hidden="true">✳</span> {benefit.extra}</p>}
              <a className="benefit-source" href={benefit.sourceUrl} target="_blank" rel="noreferrer">Visit {benefit.name} <span aria-hidden="true">↗</span></a>
            </article>
          ))}
        </div>
        <p className="benefits-fine-print">Offers are for active BSS members and apply throughout the membership term unless stated otherwise. Promotional items and offers are excluded as listed. Please present your membership before checkout.</p>
      </section>

      <section className="benefits-join">
        <div className="container benefits-join-inner">
          <div><p className="eyebrow">MORE THAN THE SAVINGS</p><h2>Make room for<br /><em>more belonging.</em></h2><p>Meet people, celebrate culture, and find your place in the BSS community.</p></div>
          <Link className="button button-outline" href="/membership">See membership <span aria-hidden="true">↗</span></Link>
        </div>
      </section>
    </main>
  );
}
