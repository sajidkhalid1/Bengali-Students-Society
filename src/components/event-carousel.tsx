'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { traditions } from '@/lib/events';
import './event-carousel.css';

const archivePhotos = ['outdoors', 'gathering', 'community', 'shared-table', 'shared-table', 'gathering', 'shared-table'];
const events = traditions.map((event, index) => ({ ...event, number: String(index + 1).padStart(2, '0'), image: event.image ?? `/images/${archivePhotos[index]}.webp` }));
const COPIES = 3;

export function EventCarousel() {
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean; pointerId: number } | null>(null);
  const movedClick = useRef(false);
  const cycleWidth = useRef(0);
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);

  const updateActive = useCallback(() => {
    const el = track.current;
    if (!el || !events.length) return;
    const center = el.scrollLeft + el.clientWidth / 2;
    let closest = Infinity;
    let selected = 0;
    Array.from(el.children).forEach((node, index) => {
      const card = node as HTMLElement;
      const distance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
      if (distance < closest) { closest = distance; selected = index % events.length; }
    });
    setActive(selected);
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const measure = () => {
      if (el.children.length < events.length * 2) return;
      cycleWidth.current = (el.children[events.length] as HTMLElement).offsetLeft - (el.children[0] as HTMLElement).offsetLeft;
      // Start in the center copy so the loop has room to travel either way.
      el.scrollLeft = cycleWidth.current;
      updateActive();
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(el);
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => setReduced(motion.matches);
    syncMotion();
    motion.addEventListener('change', syncMotion);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.05 });
    observer.observe(el);
    const onVisibility = () => { if (!document.hidden) updateActive(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => { resize.disconnect(); observer.disconnect(); motion.removeEventListener('change', syncMotion); document.removeEventListener('visibilitychange', onVisibility); };
  }, [updateActive]);

  useEffect(() => {
    const el = track.current;
    if (!el || hovered || focused || !visible || reduced) return;
    let frame = 0;
    let previous = 0;
    const speed = 16; // pixels per second: a quiet, continuous drift
    const tick = (now: number) => {
      if (document.hidden || drag.current) { previous = now; frame = requestAnimationFrame(tick); return; }
      if (previous) el.scrollLeft += speed * Math.min((now - previous) / 1000, 0.05);
      previous = now;
      const loop = cycleWidth.current;
      if (loop > 0) {
        if (el.scrollLeft >= loop * 2) el.scrollLeft -= loop;
        else if (el.scrollLeft < loop * 0.5) el.scrollLeft += loop;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [hovered, focused, visible, reduced]);

  const handleScroll = () => {
    const el = track.current;
    if (!el) return;
    const loop = cycleWidth.current;
    // Rebase the scroll offset by one full copy at either edge. Content stays
    // pixel-identical, so the user never sees the wrap in either direction.
    if (loop > 0) {
      if (el.scrollLeft >= loop * 2) { el.scrollLeft -= loop; if (drag.current) drag.current.left -= loop; }
      else if (el.scrollLeft < loop * 0.5) { el.scrollLeft += loop; if (drag.current) drag.current.left += loop; }
    }
    updateActive();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const step = event.key === 'ArrowLeft' ? -1 : 1;
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? events.length - 1 : (active + step + events.length) % events.length;
    const el = track.current;
    const card = el?.children[events.length + next] as HTMLElement | undefined;
    if (el && card) el.scrollTo({ left: card.offsetLeft - (el.children[0] as HTMLElement).offsetLeft, behavior: reduced ? 'instant' : 'smooth' });
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    drag.current = { x: event.clientX, left: event.currentTarget.scrollLeft, moved: false, pointerId: event.pointerId };
    movedClick.current = false;
    event.currentTarget.classList.add('is-dragging');
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const delta = event.clientX - current.x;
    if (Math.abs(delta) > 5) current.moved = true;
    if (current.moved) event.currentTarget.scrollLeft = current.left - delta;
  };
  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    movedClick.current = drag.current.moved;
    drag.current = null;
    event.currentTarget.classList.remove('is-dragging');
    if (event.pointerType !== 'mouse') setHovered(false);
  };

  return <div className="event-carousel" role="region" aria-roledescription="carousel" aria-label="BSS community events"
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
    <div className="carousel-hint" aria-hidden="true"><span>DRAG TO DISCOVER</span><span className="carousel-hint-line">←<i />→</span></div>
    <div ref={track} className="carousel-track" tabIndex={0} aria-label="Event slides. Use left and right arrow keys to browse."
      onKeyDown={onKeyDown} onScroll={handleScroll}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp} onLostPointerCapture={onPointerUp}
      onClickCapture={event => { if (movedClick.current) { event.preventDefault(); event.stopPropagation(); movedClick.current = false; } }}>
      {Array.from({ length: COPIES }, (_, copy) => events.map((item, index) => <article key={`${copy}-${item.number}`} className="event-card carousel-slide" role={copy === 1 ? 'group' : undefined}
        aria-roledescription={copy === 1 ? 'slide' : undefined} aria-label={copy === 1 ? `${index + 1} of ${events.length}: ${item.title}` : undefined} aria-hidden={copy === 1 ? undefined : true} style={{ animationDelay: `${index * -1.1}s` }}>
        <div className="event-poster"><Image src={item.image} alt="A gathering from the BSS community photo archive" fill sizes="(max-width: 760px) 76vw, (max-width: 1080px) 42vw, 31vw" draggable={false} /><div className="event-photo-shade" /><div className="event-photo-heading"><span className="event-category">{item.category}</span><span className="event-number">{item.number}</span></div><h3>{item.title}</h3><span className="event-year">BSS COMMUNITY ARCHIVE</span></div>
        <div className="event-body"><p className="status-label">{item.status ?? (item.completed ? '2026 EVENT COMPLETED' : 'NEXT DATE TO BE ANNOUNCED')}</p><p>{item.detail}</p></div>
      </article>))}
    </div>
    <div className="carousel-footer"><Link className="text-link" href={`/events#event-${active + 1}`}>Explore {events[active].title} ↗</Link><p className="carousel-position" aria-live="off">{String(active + 1).padStart(2, '0')} / {String(events.length).padStart(2, '0')}</p></div>
  </div>;
}
