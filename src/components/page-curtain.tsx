"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

/** Keep the cloth closed until the destination route has committed. */
export function PageCurtain() {
  const overlay = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const fallback = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    clearTimeout(fallback.current);
    const element = overlay.current;
    if (!element || !busy.current) return;
    const panels = element.querySelectorAll<HTMLElement>(".curtain-panel");
    const animations = Array.from(panels).map((panel, index) => panel.animate(
      [{ transform: "translateX(0)" }, { transform: `translateX(${index === 0 ? "-" : ""}102%)` }],
      { duration: 650, easing: "cubic-bezier(.65,0,.25,1)", fill: "forwards" },
    ));
    Promise.all(animations.map((animation) => animation.finished)).catch(() => {}).finally(() => {
      element.hidden = true;
      animations.forEach((animation) => animation.cancel());
      busy.current = false;
    });
  }, [pathname]);

  useEffect(() => {
    const navigate = async (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest("a") : null;
      if (!anchor || anchor.hasAttribute("download") || (anchor.target && anchor.target !== "_self")) return;
      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.pathname === window.location.pathname || !["/", "/events", "/gallery", "/sponsors", "/membership", "/team", "/benefits"].includes(destination.pathname)) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const element = overlay.current;
      if (!element) return;
      event.preventDefault();
      event.stopPropagation();
      if (busy.current) return;
      busy.current = true;
      element.hidden = false;
      const panels = element.querySelectorAll<HTMLElement>(".curtain-panel");
      const animations = Array.from(panels).map((panel, index) => panel.animate(
        [{ transform: `translateX(${index === 0 ? "-" : ""}102%)` }, { transform: "translateX(0)" }],
        { duration: 420, easing: "cubic-bezier(.65,0,.25,1)", fill: "forwards" },
      ));
      try {
        await Promise.all(animations.map((animation) => animation.finished));
        // Inline transforms hold the curtain after closing animations are removed.
        panels.forEach((panel) => { panel.style.transform = "translateX(0)"; });
        animations.forEach((animation) => animation.cancel());
        router.push(destination.pathname + destination.search + destination.hash);
        fallback.current = setTimeout(() => { element.hidden = true; busy.current = false; }, 5000);
      } catch { element.hidden = true; busy.current = false; }
    };
    document.addEventListener("click", navigate, true);
    return () => { document.removeEventListener("click", navigate, true); clearTimeout(fallback.current); };
  }, [router]);

  return <div ref={overlay} className="page-curtain" aria-hidden="true" hidden><div className="curtain-panel curtain-left" /><div className="curtain-panel curtain-right" /></div>;
}
