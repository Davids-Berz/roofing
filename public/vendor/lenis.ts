/*
  src/config/lenis.ts
  ---------------------------------
  Lenis bootstrap in TypeScript (SSR‑safe) for Astro/Vite projects.
  - Works with Lenis loaded via CDN (window.Lenis) or placed on /public
  - Optional GSAP + ScrollTrigger integration (if present on window)
  - Smoothly hijacks same‑page hash links (configurable)

  Usage (Layout.astro):
  ---------------------------------
  <script defer src="https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.44/bundled/lenis.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>
  <script is:inline>
    import { initLenis } from "../config/lenis";
    initLenis({ headerOffset: 64 });
  </script>
*/

// Minimal Lenis typings so we don't force users to install @types
export interface LenisOptions {
  duration?: number;
  smoothWheel?: boolean;
  smoothTouch?: boolean;
  [key: string]: unknown;
}

export interface LenisInstance {
  on(event: 'scroll', handler: (e?: unknown) => void): void;
  raf(time: number): void;
  scrollTo(
    target: number | string | Element,
    opts?: { offset?: number; immediate?: boolean; lock?: boolean; force?: boolean; [k: string]: unknown }
  ): void;
}

export interface InitLenisOptions {
  /** Offset negative pixels when scrolling to anchors (e.g., fixed header height) */
  headerOffset?: number;
  /** Intercept same‑page hash links and use lenis.scrollTo */
  enableLinkHijack?: boolean;
  /** Extra Lenis options to merge with defaults */
  lenis?: LenisOptions;
}

interface GsapTicker {
  add: (cb: (time: number, deltaTime?: number, frame?: number) => void) => void;
  lagSmoothing: (threshold?: number, adjust?: number) => void;
}

interface GsapCore {
  ticker: GsapTicker;
}

declare global {
  interface Window {
    Lenis?: new (opts?: LenisOptions) => LenisInstance;
    lenis?: LenisInstance;           // exposed instance
    __lenis?: LenisInstance;         // alias
    gsap?: GsapCore & Record<string, unknown>;
    ScrollTrigger?: unknown;
  }
}

export function initLenis(options: InitLenisOptions = {}): LenisInstance | undefined {
  // SSR safety
  if (typeof window === 'undefined' || typeof document === 'undefined') return undefined;

  const { headerOffset = 0, enableLinkHijack = true, lenis: extra = {} } = options;

  const w = window;
  const LenisCtor = w.Lenis;
  const gsap = w.gsap;
  const ScrollTrigger = w.ScrollTrigger as unknown | undefined;

  if (!LenisCtor) {
    // eslint-disable-next-line no-console
    console.error('[Lenis] No se encontró window.Lenis. Carga el script de Lenis antes de initLenis().');
    return undefined;
  }

  // 1) Create Lenis instance
  const lenis = new LenisCtor({
    duration: 1.1,
    smoothWheel: true,
    smoothTouch: false,
    ...extra,
  });

  // 2) Integrate with GSAP ScrollTrigger if both exist
  if (gsap && ScrollTrigger) {
    // Forward scroll events so ScrollTrigger can update
    lenis.on('scroll', () => (w.ScrollTrigger as any)?.update?.());

    // Drive Lenis from GSAP's ticker
    gsap.ticker.add((time) => {
      // gsap provides seconds; Lenis expects ms
      lenis.raf(time * 1000);
    });
    // Avoid GSAP auto-smoothing to keep Lenis timing crisp
    gsap.ticker.lagSmoothing(0);
  } else {
    // Fallback RAF if GSAP isn't present
    const raf = (t: number) => {
      lenis.raf(t);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }

  // 3) Initial hash scroll (after mount)
  if (location.hash) {
    const sel = decodeURIComponent(location.hash);
    const target = document.querySelector(sel);
    if (target) {
      setTimeout(() => {
        lenis.scrollTo(target as Element, { offset: -headerOffset });
      }, 50);
    }
  }

  // 4) Intercept same‑page hash links
  if (enableLinkHijack) {
    document.addEventListener(
      'click',
      (e: MouseEvent) => {
        const el = e.target as HTMLElement | null;
        const anchor = el?.closest?.('a[href]') as HTMLAnchorElement | null;
        if (!anchor) return;

        const url = new URL(anchor.href, location.origin);
        const sameOrigin = url.origin === location.origin;
        const samePath = url.pathname === location.pathname;
        const hasHash = !!url.hash;

        if (sameOrigin && samePath && hasHash) {
          const id = decodeURIComponent(url.hash);
          const target = document.querySelector(id);
          if (target) {
            e.preventDefault();
            lenis.scrollTo(target, { offset: -headerOffset });
            // Keep URL in sync
            history.pushState(null, '', id);
          }
        }
      },
      true // capture to win against other handlers
    );
  }

  // 5) Expose global instance (handy for debugging/other scripts)
  w.lenis = lenis;
  (w as any).__lenis = lenis;

  return lenis;
}
