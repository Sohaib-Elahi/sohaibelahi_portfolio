# Sohaib portfolio v2

Vite 6 / React 19 / TypeScript / Tailwind 4. Four runtime dependencies: React, React DOM, GSAP and Lenis.

```sh
npm install
npm run dev
npm run build
npm run preview
node --experimental-strip-types scripts/check-engine.ts
```

Routes: `/` portfolio, `/lab` procedural form controls and frame-cost readout, `/type` self-hosted font proof including the ELSH axis.

All visitor copy is in `src/content/site.ts`. Gallery data contains only image paths and dimensions. The two rails share one component. Mobile and reduced-motion views use native horizontal scrolling. Keyboard arrows navigate a focused rail. Sound is off on every visit and only plays after enabling the toggle.

One application-owned animation scheduler lives in `src/lib/scroll.ts`. It advances Lenis, GSAP core and the canvas renderer. Native sticky handles gallery pinning; ScrollTrigger maps scroll progress to horizontal translation. The full GSAP CSSPlugin is unnecessary; the small checkPrefix utility covers the native CSS properties used by ScrollTrigger in current browsers.

`src/ascii/engine.ts` evaluates four stateless analytic curve families into a reusable intensity buffer, then draws from an offscreen glyph atlas. It never converts images to ASCII and never integrates particles. Pointer force deforms the sample coordinates. Changing scene uses deterministic threshold erosion and condensation. The canvas also draws reactive service rules.

Asset preparation: `scripts/prepare-assets.py` requires Pillow with AVIF support. Font preparation: `scripts/prepare-fonts.py` requires fontTools and Brotli. Raw assets are untouched. Shipped WOFF2 subsets cover Latin-1 plus the punctuation used by the site; extend the subset before adding other scripts or languages.

See PROGRESS.md for measured budgets and incomplete physical-device verification. Local desktop/mobile emulation is not a substitute for real Android testing. No production deployment has been performed.
