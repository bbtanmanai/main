"use client";

import { useEffect, useRef } from "react";

export function useLenisScroll(onScroll?: (scroll: number) => void) {
  const lenisRef = useRef<import("lenis").default | null>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    let raf: number;

    const init = async () => {
      const { default: Lenis } = await import("lenis");
      const lenis = new Lenis({
        duration: 1.4,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: "vertical",
        smoothWheel: true,
      });
      lenisRef.current = lenis;

      if (onScroll) {
        lenis.on("scroll", ({ scroll }: { scroll: number }) => onScroll(scroll));
      }

      const rafFn = (time: number) => {
        lenis.raf(time);
        raf = requestAnimationFrame(rafFn);
      };
      raf = requestAnimationFrame(rafFn);
    };

    init();

    return () => {
      cancelAnimationFrame(raf);
      lenisRef.current?.destroy();
      lenisRef.current = null;
    };
  }, []);

  return lenisRef;
}
