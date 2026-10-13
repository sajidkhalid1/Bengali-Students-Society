import type { Metadata } from "next";
import localFont from "next/font/local";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { site } from "@/lib/site";
import { PageCurtain } from "@/components/page-curtain";
import "./globals.css";

const montserrat = localFont({
  src: "../../public/fonts/montserrat-latin-variable.woff2",
  variable: "--font-montserrat",
  weight: "100 900",
  style: "normal",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: `${site.name} | ${site.year}`, template: `%s | ${site.shortName}` },
  description: site.description,
  icons: { icon: "/bss-logo.png", apple: "/bss-logo.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={montserrat.variable}><body><a href="#main-content" className="skip-link">Skip to content</a><PageCurtain /><SiteHeader />{children}<SiteFooter /></body></html>;
}
