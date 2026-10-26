"use client";
import Image from "next/image";
import Link from "next/link";
export const careerRegistration = "https://www.eventbrite.ca/e/2026-professional-development-workshop-mentoring-program-tickets-2001779556540?aff=oddtdtcreator";
export function SeasonHighlights() {
  return <div className="season-highlights" onPointerMove={event => { const card = (event.target as HTMLElement).closest<HTMLElement>(".season-card"); if (!card) return; const rect = card.getBoundingClientRect(); card.style.setProperty("--glow-x", `${event.clientX - rect.left}px`); card.style.setProperty("--glow-y", `${event.clientY - rect.top}px`); }}>
    <article className="season-card welcome-announcement"><span className="announcement-stamp">FREE EVENT</span><p className="eyebrow">YOUR NEXT HELLO</p><h3>New faces.<br /><em>Instant connections.</em></h3><p>Our Meet and Greet is coming soon. Bring a friend, meet the community, and make yourself at home.</p><p className="announcement-date">Date & venue to be announced</p><p className="form-help">Keep an eye on our socials and website for the announcement.</p><Link href="/events#event-1" className="text-link">Meet and Greet ↗</Link></article>
    <article className="season-card career-announcement"><div className="announcement-image"><Image src="/images/career-workshop-2026/career-workshop-15.webp" alt="Panel discussion at Career Workshop 2026" width={1800} height={1200} sizes="(max-width: 760px) 90vw, 25vw" /></div><div><p className="eyebrow">OCT 23, 2026 / COMPLETED</p><h3>Career Workshop<br /><em>2026.</em></h3><p>Industry insights, an expert panel, and conversations that continued over coffee and desi snacks.</p><p className="announcement-date">Friday, October 23 · 5 PM<br />Hunter Student Commons · HNSC 122</p><Link href="/events/career-workshop-2026" className="button">Recap & photo album ↗</Link></div></article>
  </div>;
}
