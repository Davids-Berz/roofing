/*
  src/config/gsap.ts
  ---------------------------------
  Safe GSAP bootstrap for Astro/TS projects using CDN globals.
  - Registers ScrollTrigger if present (via window or gsap.plugins)
  - Optional intro animation on #gsap-title (same behavior as the JS version)
  - SSR‑safe: early‑returns on server
*/

// Minimal typings so we don't require gsap types at build time when loading from CDN
interface GsapCore {
  registerPlugin: (...plugins: any[]) => void;
  from: (...args: any[]) => unknown;
  plugins?: Record<string, any>;
}

interface GsapWindow extends Window {
  gsap?: GsapCore;
  ScrollTrigger?: any;
}

export function initGsap(): void {
  // SSR/Edge safety (Astro can render on the server)
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const w = window as GsapWindow;
  const gsap = w.gsap;

  if (!gsap) {
    // Keep the same behavior/message as your JS version
    // eslint-disable-next-line no-console
    console.error("[GSAP] No se encontró gsap en window. Carga primero el script de GSAP.");
    return;
  }

  // 1) Take ScrollTrigger from window or from gsap.plugins (if already registered)
  const ScrollTrigger = w.ScrollTrigger ?? gsap.plugins?.ScrollTrigger;

  // 2) Register if available but not yet registered
  if (ScrollTrigger && !gsap.plugins?.ScrollTrigger) {
    try {
      gsap.registerPlugin(ScrollTrigger);
      // Expose on window (optional parity with JS version)
      w.ScrollTrigger = ScrollTrigger;
      // console.debug("[GSAP] ScrollTrigger registrado");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[GSAP] Error registrando ScrollTrigger:", e);
    }
  }

  // 3) Optional boot animation (same selector/values as your JS snippet)
  const el = document.querySelector<HTMLElement>("#gsap-title");
  if (el) {
    gsap.from(el, { y: -80, opacity: 0, duration: 1, ease: "power3.out" });
  }
}
