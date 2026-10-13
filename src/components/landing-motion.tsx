"use client";
import { useEffect } from "react";

export function LandingMotion() {
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const sections = Array.from(document.querySelectorAll<HTMLElement>(".landing-page section"));
    let frame = 0;
    const update = () => {
      frame = 0;
      const height = window.innerHeight;
      // Section geometry stays fixed; only children scale, so scrolling never shifts layout.
      const values = sections.map(section => {
        const rect = section.getBoundingClientRect();
        const visible = Math.max(0, Math.min(1, Math.min(rect.bottom, height - rect.top) / (height * .55)));
        return media.matches ? 1 : .78 + .25 * (visible * visible * (3 - 2 * visible));
      });
      sections.forEach((section, index) => section.style.setProperty("--view-scale", String(values[index])));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule); media.addEventListener("change", schedule);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); media.removeEventListener("change", schedule); sections.forEach(section => section.style.removeProperty("--view-scale")); };
  }, []);
  return null;
}
