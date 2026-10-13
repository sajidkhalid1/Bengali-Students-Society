import type { Metadata } from "next";
import Link from "next/link";
import { Gallery } from "@/components/gallery";
import photos from "@/lib/gallery.json";
export const metadata: Metadata = { title: "Asia Cup 2026", description: "The BSS Asia Cup 2026 recap and photo album." };
export default function AsiaCupPage() {
  return <main id="main-content"><div className="inner-page-hero"><div className="container"><p className="eyebrow">ASIA CUP / 2026</p><h1>Our teams.<br /><em>Our spirit.</em></h1><p>Bangladesh A won one match, while Bangladesh were unable to secure a victory. Both Bangladesh teams were knocked out in the group stage. We hope to do better next year!</p><p>Thank you to our players, supporters, and sponsors for bringing the community together.</p><Link href="/sponsors" className="text-link">Meet our Asia Cup sponsors ↗</Link></div></div><section className="container section" aria-label="Asia Cup 2026 photo album"><Gallery items={photos.filter(photo => photo.name === "Asia Cup 2026")} /></section></main>;
}
