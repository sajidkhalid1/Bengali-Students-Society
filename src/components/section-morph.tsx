"use client";

import { useEffect, useRef } from "react";

/** A decorative boundary only: section contents and scroll positions stay unchanged. */
export function SectionMorph({ from, to }: { from: string; to: string }) {
  const boundary = useRef<HTMLDivElement>(null);
  const path = useRef<SVGPathElement>(null);
  useEffect(() => {
    const node = boundary.current;
    if (!node) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let visible = false;
    const paint = () => {
      frame = 0;
      if (reduced.matches || !visible) return;
      const progress = Math.max(0, Math.min(1, 1 - node.getBoundingClientRect().top / innerHeight));
      const bend = Math.sin(progress * Math.PI * 2) * 36;
      path.current?.setAttribute("d", `M0 50 C250 ${50 + bend} 360 ${50 - bend} 520 50 S800 ${50 + bend} 1000 50 L1000 100 L0 100Z`);
    };
    const update = () => { if (!frame && visible && !reduced.matches) frame = requestAnimationFrame(paint); };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); }, { rootMargin: "100px" });
    observer.observe(node);
    const preference = () => { if (reduced.matches) path.current?.setAttribute("d", "M0 50 H1000 V100 H0Z"); else update(); };
    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
    reduced.addEventListener("change", preference);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); removeEventListener("scroll", update); removeEventListener("resize", update); reduced.removeEventListener("change", preference); };
  }, []);
  return <div className="section-morph" ref={boundary} aria-hidden="true" style={{ background: from }}><svg viewBox="0 0 1000 100" preserveAspectRatio="none"><path ref={path} d="M0 50 H1000 V100 H0Z" fill={to} /></svg></div>;
}
