'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { traditions } from '@/lib/events';
import './event-carousel.css';

const archivePhotos = ['outdoors', 'gathering', 'community', 'shared-table', 'shared-table', 'gathering', 'shared-table'];
const events = traditions.map((event, index) => ({ ...event, number: String(index + 1).padStart(2, '0'), image: event.image ?? `/images/${archivePhotos[index]}.webp` }));
const COPIES = 3;
const MIN_FLING_VELOCITY = 0.035;
const MAX_FLING_VELOCITY = 1.1;
const DECAY_TIME_MS = 360;

type PointerSample = { x: number; time: number };
type DragState = { x: number; left: number; moved: boolean; pointerId: number; samples: PointerSample[] };

export function EventCarousel() {
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | null>(null);
  const inertia = useRef<{ frame: number; velocity: number; previous: number } | null>(null);
  const movedClick = useRef(false);
  const cycleWidth = useRef(0);
  const initialized = useRef(false);
  const [active, setActive] = useState(0);
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

  const stopInertia = useCallback(() => {
    if (inertia.current) cancelAnimationFrame(inertia.current.frame);
    inertia.current = null;
    track.current?.classList.remove('is-coasting');
  }, []);

  const startInertia = useCallback((initialVelocity: number) => {
    stopInertia();
    const el = track.current;
    if (!el || reduced || !visible || document.hidden || Math.abs(initialVelocity) < MIN_FLING_VELOCITY) return;
    const state = { frame: 0, velocity: Math.max(-MAX_FLING_VELOCITY, Math.min(MAX_FLING_VELOCITY, initialVelocity)), previous: 0 };
    inertia.current = state;
    el.classList.add('is-coasting');
    const tick = (now: number) => {
      if (inertia.current !== state) return;
      if (document.hidden || !visible || reduced || drag.current) { stopInertia(); return; }
      if (state.previous) {
        const elapsed = Math.min(now - state.previous, 40);
        const decay = Math.exp(-elapsed / DECAY_TIME_MS);
        el.scrollLeft += state.velocity * DECAY_TIME_MS * (1 - decay);
        state.velocity *= decay;
        if (Math.abs(state.velocity) < 0.012) { stopInertia(); return; }
      }
      state.previous = now;
      state.frame = requestAnimationFrame(tick);
    };
    state.frame = requestAnimationFrame(tick);
  }, [reduced, stopInertia, visible]);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const measure = () => {
      if (el.children.length < events.length * 2) return;
      const nextWidth = (el.children[events.length] as HTMLElement).offsetLeft - (el.children[0] as HTMLElement).offsetLeft;
      if (nextWidth <= 0) return;
      const previousWidth = cycleWidth.current;
      cycleWidth.current = nextWidth;
      if (!initialized.current || previousWidth <= 0) {
        el.scrollLeft = nextWidth;
        initialized.current = true;
      } else {
        const progress = (el.scrollLeft - previousWidth) / previousWidth;
        el.scrollLeft = nextWidth + progress * nextWidth;
      }
      updateActive();
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(el);
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => { setReduced(motion.matches); if (motion.matches) stopInertia(); };
    syncMotion();
    motion.addEventListener('change', syncMotion);
    const observer = new IntersectionObserver(([entry]) => { setVisible(entry.isIntersecting); if (!entry.isIntersecting) stopInertia(); }, { threshold: 0.05 });
    observer.observe(el);
    const onVisibility = () => { if (document.hidden) stopInertia(); else updateActive(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => { resize.disconnect(); observer.disconnect(); motion.removeEventListener('change', syncMotion); document.removeEventListener('visibilitychange', onVisibility); stopInertia(); };
  }, [stopInertia, updateActive]);

  const handleScroll = () => {
    const el = track.current;
    if (!el) return;
    const loop = cycleWidth.current;
    if (loop > 0) {
      if (el.scrollLeft >= loop * 2) { el.scrollLeft -= loop; if (drag.current) drag.current.left -= loop; }
      else if (el.scrollLeft < loop * 0.5) { el.scrollLeft += loop; if (drag.current) drag.current.left += loop; }
    }
    updateActive();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    stopInertia();
    const step = event.key === 'ArrowLeft' ? -1 : 1;
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? events.length - 1 : (active + step + events.length) % events.length;
    const el = track.current;
    const card = el?.children[events.length + next] as HTMLElement | undefined;
    if (el && card) el.scrollTo({ left: card.offsetLeft - (el.children[0] as HTMLElement).offsetLeft, behavior: reduced ? 'instant' : 'smooth' });
  };

  const addPointerSample = (state: DragState, event: React.PointerEvent<HTMLDivElement>) => {
    const sample = { x: event.clientX, time: event.timeStamp };
    const previous = state.samples[state.samples.length - 1];
    if (!previous || sample.time > previous.time) state.samples.push(sample);
    while (state.samples.length > 2 && sample.time - state.samples[0].time > 100) state.samples.shift();
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !event.isPrimary) return;
    stopInertia();
    const state: DragState = { x: event.clientX, left: event.currentTarget.scrollLeft, moved: false, pointerId: event.pointerId, samples: [{ x: event.clientX, time: event.timeStamp }] };
    drag.current = state;
    movedClick.current = false;
    event.currentTarget.classList.add('is-dragging');
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const finishPointer = (event: React.PointerEvent<HTMLDivElement>, coast: boolean) => {
    const state = drag.current;
    if (!state || state.pointerId !== event.pointerId) return;
    addPointerSample(state, event);
    movedClick.current = coast && state.moved;
    drag.current = null;
    event.currentTarget.classList.remove('is-dragging');
    if (!coast || !state.moved || reduced) return;
    const first = state.samples[0];
    const last = state.samples[state.samples.length - 1];
    const elapsed = last.time - first.time;
    if (elapsed < 1) return;
    startInertia((first.x - last.x) / elapsed);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state || state.pointerId !== event.pointerId) return;
    const delta = event.clientX - state.x;
    if (Math.abs(delta) > 5) state.moved = true;
    if (state.moved) {
      event.currentTarget.scrollLeft = state.left - delta;
      addPointerSample(state, event);
    }
  };

  const onPointerCancel = (event: React.PointerEvent<HTMLDivElement>) => finishPointer(event, false);

  return <div className="event-carousel" role="region" aria-roledescription="carousel" aria-label="BSS community events">
    <div className="carousel-hint" aria-hidden="true"><span>DRAG TO DISCOVER</span><span className="carousel-hint-line">←<i />→</span></div>
    <div ref={track} className="carousel-track" tabIndex={0} aria-label="Event slides. Use left and right arrow keys to browse."
      onKeyDown={onKeyDown} onScroll={handleScroll}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove}
      onPointerUp={event => finishPointer(event, true)} onPointerCancel={onPointerCancel} onLostPointerCapture={onPointerCancel}
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
