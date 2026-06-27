"use client";

import { useEffect } from "react";

// Imposta --app-height = altezza della viewport realmente visibile.
// Su mobile, quando si apre la tastiera, questa si riduce: i contenitori
// agganciati a --app-height si accorciano e l'input resta visibile.
// Throttle con requestAnimationFrame per evitare sfarfallii.
export function ViewportHeight() {
  useEffect(() => {
    const root = document.documentElement;
    const vv = window.visualViewport;
    let raf = 0;

    const apply = () => {
      raf = 0;
      const h = vv ? vv.height : window.innerHeight;
      root.style.setProperty("--app-height", `${Math.round(h)}px`);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };

    apply();
    if (vv) {
      vv.addEventListener("resize", schedule);
      vv.addEventListener("scroll", schedule);
    }
    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", schedule);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (vv) {
        vv.removeEventListener("resize", schedule);
        vv.removeEventListener("scroll", schedule);
      }
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", schedule);
    };
  }, []);

  return null;
}
