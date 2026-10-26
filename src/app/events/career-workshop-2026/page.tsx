import type { Metadata } from "next";
import { Gallery } from "@/components/gallery";
import photos from "@/lib/career-workshop-gallery.json";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Career Workshop 2026",
  description: "Photos and a recap of the BSS Career Workshop 2026, held October 23.",
};

export default function CareerWorkshopPage() {
  return (
    <main id="main-content">
      <div className="inner-page-hero">
        <div className="container">
          <p className="eyebrow">CAREER WORKSHOP / 2026</p>
          <h1>Preparing for<br /><em>what comes next.</em></h1>
          <p>
            On October 23, 2026, Career Workshop 2026 brought engineering students together for a
            panel with Minaor Tanzil, Shafquat, Sidney, Sajid Shad, and Niaz.
          </p>
          <p>
            The conversation explored the futures of engineering students, what recruiters expect
            to see on resumes, and the power and misuse of AI in hiring. Guests also had time to
            network over coffee and desi snacks.
          </p>
          <p>The workshop was organized by the BUETian Alumni Association of Calgary in collaboration with the University of Calgary’s Bangladeshi Students Association and Bengali Students Society.</p>
          <a className="text-link" href="https://www.eventbrite.ca/e/2026-professional-development-workshop-mentoring-program-tickets-2001779556540" target="_blank" rel="noopener noreferrer">Original event listing ↗</a><br />
          <Link className="text-link" href="/events">Explore all BSS events ↗</Link>
        </div>
      </div>
      <section className="container section" aria-label="Career Workshop 2026 photo album">
        <Gallery items={photos} />
      </section>
    </main>
  );
}
