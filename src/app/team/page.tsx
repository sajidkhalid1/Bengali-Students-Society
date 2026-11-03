import type { Metadata } from "next";
import Link from "next/link";
import "./team.css";

export const metadata: Metadata = {
  title: "Executive Committee",
  description: "Meet the student team behind the Bengali Students Society at the University of Calgary.",
};

const departments = [
  { title: "President", members: ["Sajid Khalid"] },
  { title: "VP Internal", members: ["Ashna Hossain"] },
  { title: "VP External", members: ["Samiu Hossain"] },
  { title: "VP Events", members: ["Sufian Showrine", "Asif Rahman"] },
  { title: "VP Marketing", members: ["Fahyim Ahmmed"] },
  { title: "VP Operations", members: ["Nasif Islam", "Safat Arick"] },
  { title: "VP Sports", members: ["Wasef Daiyan"] },
];

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).slice(0, 2).join("");
}

export default function TeamPage() {
  return (
    <main id="main-content" className="team-page">
      <div className="inner-page-hero team-hero">
        <div className="container">
          <p className="eyebrow">OUR EXECUTIVE COMMITTEE / 2026–2027</p>
          <h1>Students at heart.<br /><em>Community in mind.</em></h1>
          <p>The students behind our events, traditions, and shared experiences. A student-run team with care for our community.</p>
        </div>
      </div>

      <section className="container section team-section" aria-labelledby="committee-heading">
        <div className="team-intro">
          <div>
            <p className="eyebrow">THE PEOPLE BEHIND BSS</p>
            <h2 id="committee-heading">Meet your committee.</h2>
          </div>
          <p className="section-description">Our 2026–2027 team, working together to make campus feel a little more like home.</p>
        </div>

        <div className="team-departments">
          {departments.map((department, index) => (
            <section className={`team-department${index === 0 ? " team-department-president" : ""}`} key={department.title} aria-labelledby={`department-${index}`}>
              <div className="team-department-heading">
                <span className="team-department-index">0{index + 1}</span>
                <h3 id={`department-${index}`}>{department.title}</h3>
                <span className="team-department-rule" aria-hidden="true" />
              </div>
              <div className="team-members">
                {department.members.map((name) => (
                  <article className="team-member" key={name}>
                    <div className="team-member-initials" aria-hidden="true">{initials(name)}</div>
                    <div className="team-member-copy">
                      <p className="eyebrow">{department.title}</p>
                      <h4>{name}</h4>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="partner-invitation team-invitation">
          <div>
            <p className="eyebrow">BE PART OF THE STORY</p>
            <h2>Good things happen together.</h2>
            <p>Get to know BSS through our events and community.</p>
          </div>
          <Link className="button" href="/events">Explore our events <span aria-hidden="true">↗</span></Link>
        </aside>
      </section>
    </main>
  );
}
