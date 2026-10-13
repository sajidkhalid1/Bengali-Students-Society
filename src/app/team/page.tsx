import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = { title: "Executive Committee", description: "Meet the student team behind the Bengali Students Society at the University of Calgary." };

// Populate with the owner's confirmed roster; an empty list never invents officers.
const committee: { name: string; role: string; bio?: string; photo?: string }[] = [
  { name: "Sajid Khalid", role: "President" },
  { name: "Ashna Hossain", role: "VP Internal" },
  { name: "Sufian Showrine", role: "VP Events" },
  { name: "Asif Rahman", role: "VP Events" },
  { name: "Wasef Daiyan", role: "VP Sports" },
  { name: "Samiu Hossain", role: "VP External" },
  { name: "Sefat Rajib", role: "VP Marketing" },
  { name: "Nasif Islam", role: "VP Marketing" },
  { name: "Ariq Sohran", role: "VP Marketing" },
];

export default function TeamPage() {
  return <main id="main-content"><div className="inner-page-hero"><div className="container"><p className="eyebrow">OUR EXECUTIVE COMMITTEE / 2026–2027</p><h1>Students at heart.<br /><em>Community in mind.</em></h1><p>The people who help bring our events, traditions, and shared experiences to life. A student-run club, built with care for our community.</p></div></div><section className="container section"><div className="section-top"><div><p className="eyebrow">THE PEOPLE BEHIND BSS</p><h2>Meet your committee.</h2></div><p className="section-description">Our 2026–2027 team, working together to make campus feel a little more like home.</p></div>{committee.length ? <div className="committee-grid">{committee.map(member => <article className="committee-card" key={`${member.role}-${member.name}`}>{member.photo ? <Image src={member.photo} alt={member.name} width={400} height={480} /> : <div className="committee-initials" aria-hidden="true">{member.name.split(" ").map(part => part[0]).slice(0, 2).join("")}</div>}<div><p className="eyebrow">{member.role}</p><h3>{member.name}</h3>{member.bio && <p>{member.bio}</p>}</div></article>)}</div> : <div className="committee-announcement"><Image src="/bss-logo.png" alt="" width={100} height={100} /><div><p className="eyebrow">INTRODUCTIONS COMING SOON</p><h3>A new chapter. Familiar purpose.</h3><p>We’re preparing the 2026–2027 committee introductions. Names, roles, and photos will be shared here soon.</p></div></div>}<aside className="partner-invitation"><div><p className="eyebrow">BE PART OF THE STORY</p><h2>Good things happen together.</h2><p>Get to know BSS through our events and community.</p></div><Link className="button" href="/events">Explore our events ↗</Link></aside></section></main>;
}
