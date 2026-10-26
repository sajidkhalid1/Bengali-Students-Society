import type { Metadata } from "next";
import Link from "next/link";
import { Gallery } from "@/components/gallery";
import photos from "@/lib/gallery.json";

export const metadata: Metadata = { title: "Gallery", description: "Shared moments from Bengali Students Society events and gatherings." };
export default function GalleryPage() {
  return <main id="main-content"><div className="inner-page-hero"><div className="container"><p className="eyebrow">THE BSS PHOTO ALBUM</p><h1>Moments that<br /><em>bring us together.</em></h1><p>Familiar faces, shared tables, and memories worth keeping.</p><div className="flex flex-wrap gap-3 mb-6"><Link className="button button-outline" href="/events/career-workshop-2026">Career Workshop 2026 album ↗</Link><Link className="button button-outline" href="/events/asia-cup-2026">Asia Cup 2026 album ↗</Link></div><span className="album-count">{photos.length} photographs · From our community</span></div></div><section className="container section" aria-label="Event photos"><Gallery /></section></main>;
}
