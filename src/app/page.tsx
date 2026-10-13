import { SectionHeading } from "@/components/section-heading";
import { memberships, site } from "@/lib/site";
import Image from "next/image";
import Link from "next/link";
import { EventCarousel } from "@/components/event-carousel";
import { LandingMotion } from "@/components/landing-motion";
import { SectionMorph } from "@/components/section-morph";

import { isEarlyBird, membershipPrice } from "@/lib/membership";
import { SeasonHighlights } from "@/components/season-highlights";
export const dynamic = "force-dynamic";
export default function Home() {
  const earlyBird = isEarlyBird();
  return (
    <main id="main-content" className="landing-page"><LandingMotion />
      <div className="hero-backdrop"><section id="home" className="hero container">
        <div className="hero-copy">
          <p className="eyebrow"><span className="red-rule" /> BENGALI STUDENTS SOCIETY · {site.year}</p>
          <h1>A little Bengal.<br />A lot of <em>belonging.</em></h1>
          <p className="hero-description">Celebrating Bengali culture. Creating community.<br />Get to know BSS, your home away from home at the University of Calgary.</p>
          <div className="flex flex-wrap gap-3"><a className="button" href="#membership">Find your place <span aria-hidden="true">↗</span></a><a className="button button-outline" href="#events">What’s coming up</a></div>
          <p className="hero-note">Bengali roots. Open to everyone.</p>
        </div>
        <div className="community-collage">
          <figure className="hero-photo"><div className="hero-photo-image"><Image src="/images/community.webp" alt="BSS members gathered for a group photo at a past celebration" fill sizes="(max-width: 760px) 90vw, 45vw" priority /></div><figcaption>A community to call your own.</figcaption></figure>
          <figure className="music-photo"><Image src="/images/music.webp" alt="Friends sharing live guitar music at an outdoor BSS gathering" width={220} height={290} sizes="(max-width: 760px) 130px, 180px" /><figcaption>The little moments.</figcaption></figure>
          <div className="welcome-seal" aria-label="Shagotom — welcome. You belong here."><svg viewBox="0 0 140 140" aria-hidden="true"><defs><path id="welcome-arc" d="M 20,76 A 50,50 0 0,1 120,76" /></defs><text><textPath href="#welcome-arc" startOffset="50%" textAnchor="middle">YOU BELONG HERE</textPath></text></svg><span lang="bn">স্বাগতম</span><small>WELCOME</small></div>
          <p className="collage-note">Our people. Our stories. Our BSS.</p>
        </div>
      </section></div>

      <div className="values-strip" aria-hidden="true"><div className="container flex flex-wrap justify-between gap-x-8 gap-y-3"><span>A shared culture</span><span>✳</span><span>A familiar feeling</span><span>✳</span><span>A place for you</span><span>✳</span></div></div>

      <SectionMorph from="#0b3529" to="#06271e" />
      <section id="about" className="section container about-grid">
        <div><SectionHeading eyebrow="01 / WHO WE ARE" title="Rooted in culture. Built on connection." /><figure className="about-photo"><Image src="/images/gathering.webp" alt="Friends sitting together around a picnic table at a BSS outdoor event" width={800} height={530} sizes="(max-width: 760px) 90vw, 40vw" /><figcaption>Familiar faces. New friendships.</figcaption></figure></div>
        <div className="about-copy"><p className="eyebrow">STUDENT-RUN · SINCE 2018</p><p className="lead">Home is more than a place.<br />Sometimes, it’s the people you find.</p><p>Founded in 2018 by Rafia Babar, the Bengali Students Society is a student-run community bringing together Bengali students at the University of Calgary. BSS creates a space where culture, connection, and belonging come to life.</p><p>For many, this is a home away from home. For all, it is a place to celebrate our roots, build friendships, and stay connected to our culture. Whether you grew up with these traditions or you’re discovering them for the first time, there’s a place for you here.</p><a className="text-link" href="#contact">Come be part of it <span aria-hidden="true">↗</span></a><br /><Link className="text-link" href="/team">Meet the executive committee ↗</Link></div>
      </section>

      <section className="container about-values" aria-labelledby="our-purpose"><div className="section-top"><div><p className="eyebrow">WHAT WE STAND FOR</p><h2 id="our-purpose">Culture to share.<br />Connections to keep.</h2></div><p className="section-description">BSS is a place to participate, contribute, and feel part of something throughout your student years.</p></div><div className="purpose-grid"><article><span className="eyebrow">01 / CULTURE</span><h3>Keep our roots close.</h3><p>From pitha and shared meals to music and celebration, we create space to enjoy Bengali traditions and share them with friends from every background.</p></article><article><span className="eyebrow">02 / BELONGING</span><h3>Find your people.</h3><p>Meet new friends, reconnect with familiar faces, and take part in a welcoming community. You don’t have to speak Bengali or share our heritage to join in.</p></article><article><span className="eyebrow">03 / OPPORTUNITY</span><h3>Grow together.</h3><p>Get involved in club life, help bring events to life, and make connections through gatherings such as our Career Fair. There’s room to learn and contribute.</p></article></div><div className="community-story"><p className="eyebrow">ON CAMPUS & BEYOND</p><h2>A student community.<br />A wider circle.</h2><p>Our events bring students, local businesses, and community supporters together. From the energy of Asia Cup to the generosity of free iftar gatherings, we make room for shared experiences that reach beyond the classroom.</p><Link className="text-link" href="/gallery">Explore our story in pictures ↗</Link></div></section>
      <SectionMorph from="#06271e" to="#092f25" />
      <section id="events" className="events-section section"><div className="container">
        <div className="section-top"><SectionHeading eyebrow="02 / MAKE SOME MEMORIES" title="Good things ahead." /><p className="side-note">A glimpse of what we’re planning.<br />Explore our annual traditions.</p></div>
        <SeasonHighlights /><EventCarousel />
        <p className="events-note">Meet and Greet, Career Fair, Asia Cup, Pitha Utshob, iftars, Royal Mezban—and new experiences for the year ahead.</p><Link className="text-link" href="/events">Explore all our events ↗</Link>
      </div></section>

      <SectionMorph from="#092f25" to="#06271e" />
      <section id="membership" className="section container membership-grid">
        <div><SectionHeading eyebrow="03 / YOUR PEOPLE ARE HERE" title="Make it your year." description="Become a BSS member and be part of our next chapter. Start new traditions, meet new friends, and celebrate with us." /><p className="membership-note">Membership · {site.year}<br />One payment. A year of community. Digital membership card included.</p></div>
        <div className="membership-card"><p className="eyebrow">{earlyBird ? "EARLY BIRD / THROUGH OCTOBER 31" : "A PLACE IN THE COMMUNITY"}</p>{earlyBird && <p className="early-bird-caption">New membership <del>CA$15</del> → <strong>CA$10</strong> until October 31, Calgary time.</p>}{memberships.map((membership) => <div className="price-row" key={membership.title}><div><h3>{membership.title}</h3><p>{membership.description}</p></div><p className="price"><span>$</span>{membershipPrice(membership.title === "New member" ? "new" : "returning") / 100}</p></div>)}<a className="button w-full" href={site.membershipUrl ?? "#contact"}>{site.membershipUrl ? "Become a member" : "Joining information"}<span aria-hidden="true">↗</span></a><p className="price-note">New faces and familiar ones. Everyone belongs.</p></div>
      </section>

      <SectionMorph from="#06271e" to="#07291f" />
      <section id="partners" className="partners-section section"><div className="container partners-grid"><SectionHeading eyebrow="04 / BETTER TOGETHER" title="Community makes it possible." description="Thank you to the people and local businesses helping Bengali student life thrive. Our first event, Asia Cup 2026, was supported by two Calgary realtors." /><div className="partner-placeholder"><span className="eyebrow">ASIA CUP 2026 SPONSORS</span><h3>Mohammad Emon & Imran Junaid</h3><p>With thanks for supporting our first event of the year and bringing our community together.</p><Link className="text-link" href="/sponsors">Meet our partners <span aria-hidden="true">↗</span></Link></div></div></section>

      <SectionMorph from="#07291f" to="#041e18" />
      <section id="contact" className="contact-section"><div className="container contact-grid"><div><p className="eyebrow">05 / LET’S CONNECT</p><h2>It starts with<br />a <em>hello.</em></h2><p>Want to join, volunteer, or partner with BSS?<br />We’d love to meet you.</p></div><div className="contact-card"><h3>Stay close. Get involved.</h3><p>Our {site.year} contact channels and joining details are coming soon. Check back here for the next update.</p><div className="contact-row"><span>Membership</span>{site.membershipUrl ? <a href={site.membershipUrl}>Register ↗</a> : <span className="contact-status">Opening soon</span>}</div><div className="contact-row"><span>Email</span>{site.email ? <a href={`mailto:${site.email}`}>{site.email}</a> : <span className="contact-status">To be announced</span>}</div><div className="contact-row"><span>Instagram</span>{site.instagramUrl ? <a href={site.instagramUrl}>Follow BSS ↗</a> : <span className="contact-status">To be announced</span>}</div></div></div></section>
    </main>
  );
}

