import type { Metadata } from "next";
import Link from "next/link";
import { Gallery } from "@/components/gallery";
import photos from "@/lib/cha-chill-gallery.json";

export const metadata: Metadata = {
  title: "Cha & Chill 2026",
  description: "Photos from BSS Cha & Chill, our October 31, 2026 meet & greet in Calgary.",
};

export default function ChaChillPage() {
  return (
    <main id="main-content">
      <div className="inner-page-hero">
        <div className="container">
          <p className="eyebrow">CHA & CHILL / 2026–27</p>
          <h1>A warm start<br /><em>to a new year.</em></h1>
          <p>
            BSS Cha & Chill, our meet & greet, took place on October 31, 2026, at Bangladesh
            Centre in Calgary. It was a successful start to our 2026–27 year.
          </p>
          <p>
            Thank you to event sponsor Eakbal Rhaman and food partner Utsav Restaurant for their
            support.
          </p>
          <Link className="text-link" href="/events">Explore all BSS events ↗</Link>
        </div>
      </div>
      <section className="container section" aria-label="Cha & Chill 2026 photo album">
        <Gallery items={photos} />
      </section>
    </main>
  );
}
