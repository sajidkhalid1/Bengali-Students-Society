import { site } from "@/lib/site";
import Link from "next/link";
import Image from "next/image";

export function SiteFooter() {
  return <footer className="site-footer"><div className="container flex flex-wrap items-center justify-between gap-5"><Link className="footer-brand" href="/#home" aria-label="BSS home"><Image className="brand-logo" src="/bss-logo.png" alt="" width={48} height={48} /></Link><p>{site.name} · {site.year}</p><nav className="footer-links" aria-label="Contact and community"><a href={`mailto:${site.email}`}>Email BSS</a><a href={site.instagramUrl} target="_blank" rel="noopener noreferrer">Instagram ↗</a><Link href="/contribute">Contribute</Link><Link href="/#contact">Contact</Link></nav><Link href="/#home">Back to top ↑</Link></div></footer>;
}
