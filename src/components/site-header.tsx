"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { navigation, site } from "@/lib/site";

export function SiteHeader() {
  const pathname = usePathname();
  return <HeaderContent key={pathname} />;
}

function HeaderContent() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand" aria-label="Bengali Students Society home" onClick={() => setOpen(false)}>
          <Image className="brand-logo" src="/bss-logo.png" alt="" width={64} height={64} priority />
          <span className="brand-name">Bengali Students<br />Society <span className="brand-year">{site.year}</span></span>
        </Link>
        <button className="menu-toggle" aria-expanded={open} aria-controls="main-navigation" onClick={() => setOpen(!open)}>{open ? "Close" : "Menu"}<span aria-hidden="true">{open ? " ×" : " +"}</span></button>
        <nav id="main-navigation" aria-label="Main navigation" className={open ? "navigation is-open" : "navigation"} onKeyDown={(event) => { if (event.key === "Escape") { setOpen(false); document.querySelector<HTMLButtonElement>(".menu-toggle")?.focus(); } }}>
          {navigation.map((item) => <Link key={item.label} href={item.href} onClick={() => setOpen(false)}>{item.label}</Link>)}
          <Link className="button button-small" href="/membership" onClick={() => setOpen(false)}>Join the community <span aria-hidden="true">↗</span></Link>
        </nav>
      </div>
    </header>
  );
}
