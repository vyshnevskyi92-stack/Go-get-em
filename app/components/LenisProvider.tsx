"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import Snap from "lenis/snap";

declare global {
  interface Window {
    scrollToResults?: () => void;
    scrollToSection?: (selector: string) => void;
  }
}

export default function LenisProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      smoothWheel: true,
    });

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    const snap = new Snap(lenis, {
      type: "proximity",
      distanceThreshold: "45%",
      duration: 0.9,
      debounce: 700,
    });

    let removeSnap: (() => void) | undefined;
    const tryRegister = () => {
      const el = document.getElementById("input-section");
      if (el) {
        removeSnap = snap.addElement(el, { align: "start" });
        return true;
      }
      return false;
    };
    if (!tryRegister()) {
      requestAnimationFrame(() => tryRegister());
    }

    window.scrollToResults = () => {
      // Force Lenis to pick up any newly-revealed content (ResultsSection
      // just transitioned from height:0 → auto) before computing the target.
      lenis.resize();
      lenis.scrollTo("#results", {
        duration: 1.5,
        easing: (t: number) => 1 - Math.pow(1 - t, 3),
      });
    };
    window.scrollToSection = (selector: string) => lenis.scrollTo(selector);

    return () => {
      cancelAnimationFrame(rafId);
      removeSnap?.();
      snap.destroy();
      lenis.destroy();
      delete window.scrollToResults;
      delete window.scrollToSection;
    };
  }, []);

  return <>{children}</>;
}
