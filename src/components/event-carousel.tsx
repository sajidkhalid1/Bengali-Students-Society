"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { traditions } from "@/lib/events";
const archivePhotos = ["outdoors", "gathering", "community", "shared-table", "shared-table", "gathering", "shared-table"];
const events = traditions.map((event, index) => ({ ...event, number: String(index + 1).padStart(2, "0"), image: event.image ?? `/images/${archivePhotos[index]}.webp` }));

// Native scrolling keeps touch momentum and the content usable without JavaScript.
export function EventCarousel() {
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const [playing, setPlaying] = useState(false);
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(true);
  const go = (index: number) => {
    const el = track.current;
    const slide = el?.children[index] as HTMLElement | undefined;
    if (el && slide) el.scrollTo({ left: slide.offsetLeft - (el.children[0] as HTMLElement).offsetLeft, behavior: reduced ? "instant" : "smooth" });
  };
  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => { setReduced(mq.matches); setPlaying(!mq.matches); };
    change(); mq.addEventListener("change", change);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .3 });
    if (track.current) observer.observe(track.current);
    return () => { mq.removeEventListener("change", change); observer.disconnect(); };
  }, []);
  useEffect(() => {
    if (!playing || hovered || focused || !visible || reduced) return;
    const timer = setInterval(() => {
      if (document.hidden || drag.current) return;
      const el = track.current;
      if (!el) return;
      const index = (active + 1) % events.length;
      const slide = el.children[index] as HTMLElement;
      el.scrollTo({ left: slide.offsetLeft - (el.children[0] as HTMLElement).offsetLeft, behavior: "smooth" });
    }, 5500);
    return () => clearInterval(timer);
  }, [playing, hovered, focused, visible, reduced, active]);
  return <div className="event-carousel" role="region" aria-roledescription="carousel" aria-label="BSS community events"
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
    <div className="carousel-controls"><span>Drag to discover <span aria-hidden="true">↔</span></span><div>
      <button type="button" className="carousel-control" onClick={() => setPlaying(!playing)} aria-label={playing ? "Pause automatic rotation" : "Start automatic rotation"} disabled={reduced}>{playing ? "Pause" : "Play"}</button>
      <button type="button" className="carousel-control" aria-label="Previous event" onClick={() => { setPlaying(false); go((active + events.length - 1) % events.length); }}>←</button>
      <button type="button" className="carousel-control" aria-label="Next event" onClick={() => { setPlaying(false); go((active + 1) % events.length); }}>→</button>
    </div></div>
    <div ref={track} className="carousel-track" tabIndex={0} aria-label="Event slides. Use left and right arrow keys to browse."
      onKeyDown={event => { if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return; event.preventDefault(); setPlaying(false); go(event.key === "Home" ? 0 : event.key === "End" ? events.length - 1 : (active + (event.key === "ArrowRight" ? 1 : events.length - 1)) % events.length); }}
      onScroll={() => { const el = track.current; if (!el) return; const first = (el.children[0] as HTMLElement).offsetLeft; let best = 0; let distance = Infinity; Array.from(el.children).forEach((child, i) => { const d = Math.abs((child as HTMLElement).offsetLeft - first - el.scrollLeft); if (d < distance) { best = i; distance = d; } }); setActive(best); }}
      onPointerDown={event => { if (event.pointerType !== "mouse" || event.button !== 0) return; setPlaying(false); drag.current = { x: event.clientX, left: event.currentTarget.scrollLeft, moved: false }; event.currentTarget.setPointerCapture(event.pointerId); event.currentTarget.classList.add("dragging"); }}
      onPointerMove={event => { if (!drag.current) return; const delta = event.clientX - drag.current.x; if (Math.abs(delta) > 4) drag.current.moved = true; event.currentTarget.scrollLeft = drag.current.left - delta; }}
      onPointerUp={event => { drag.current = null; event.currentTarget.classList.remove("dragging"); }}
      onLostPointerCapture={event => { drag.current = null; event.currentTarget.classList.remove("dragging"); }}
      onPointerCancel={event => { drag.current = null; event.currentTarget.classList.remove("dragging"); }}>
      {events.map((event, index) => <article key={event.number} className="event-card carousel-slide" role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${events.length}: ${event.title}`}>
        <div className="event-poster"><Image src={event.image} alt="A gathering from the BSS community photo archive" fill sizes="(max-width: 760px) 72vw, (max-width: 1080px) 40vw, 28vw" draggable={false} /><div className="event-photo-shade" /><div className="event-photo-heading"><span className="event-category">{event.category}</span><span className="event-number">{event.number}</span></div><h3>{event.title}</h3><span className="event-year">BSS COMMUNITY ARCHIVE</span></div>
        <div className="event-body"><p className="status-label">{event.status ?? (event.completed ? "2026 EVENT COMPLETED" : "NEXT DATE TO BE ANNOUNCED")}</p><p>{event.detail}</p></div>
      </article>)}
    </div><div className="carousel-footer"><Link className="text-link" href={`/events#event-${active + 1}`}>Explore {events[active].title} ↗</Link><p className="carousel-position" aria-live={playing ? "off" : "polite"}>{String(active + 1).padStart(2, "0")} / {String(events.length).padStart(2, "0")}</p></div>
  </div>;
}
