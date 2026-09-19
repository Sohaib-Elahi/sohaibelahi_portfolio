# Portfolio v2 progress

## 2026-09-19 — integrated v2 build

The current session request authorized implementing all phases sequentially and later asked to finalize testing and run the project. The reusable one-phase-per-session prompts were not executed as independent commands. Creative direction was delegated after presentation of DESIGN-BRIEF.md. No prior v1 source was reused.

Confirmed choices: Sohaib; dark default; mailto contact; optional WebAudio sound off by default; all 24 unique gallery images; headline “I design the brand. Then build its world.” Contact email and LinkedIn were read from the supplied résumé. Experience dates follow AGENTS.md where the résumé differs.

### Phase record

| Phase | Implementation | Verification / remaining gate |
| --- | --- | --- |
| 0 | Read all ten Figma images; no annotations or section assignments present. Wrote brief, plan, asset inventory. AVIF/WebP plus smaller responsive variants. Variable fonts inspected and subset. /type proves both fonts and Pixel ELSH axis. | Both fonts render; 49,092 bytes total. User delegated creative direction. |
| 1 | Atlas, stateless analytic sampling, intensity buffer, pointer-space warp, hard ink caps, DPR/low-core paths, /lab controls and sole application-owned scheduler. | Four forms pass finite/bounded checks. Desktop p95 2.6–3.1ms. Physical Android and exact allocation-timeline proof remain open. |
| 2 | Butterfly, torus-knot orbit, rose-family bloom, wave contours; shared-canvas service rules; deterministic erosion/condensation and handover scrub control. | All four inspected at full size and 25% in verification/silhouettes.png. No particles or bitmap tracing. Pointer changes on the next drawn frame and decays back to the baseline; two-form handover p95/max 3.4ms, within the 8ms desktop limit. See interaction-checks.json. |
| 3 | Persistent header, saved theme toggle, approved headline, 900ms figure condensation entrance, shared Lenis/GSAP scheduling. HTML is prerendered at build time. | CLS 0; LCP target still missed (3.3s vs 2.0s in final mobile simulation). |
| 4 | One gallery component twice, opposite directions, CSS sticky desktop pinning with ScrollTrigger progress; native mobile/reduced-motion scrolling and keyboard arrows. | 24 images, no captions/tags/detail pages. Desktop and mobile keyboard tests pass. Full AVIF set 2,218,584 bytes; small AVIF set 615,563 bytes, alternatives rather than both transferred. Real-device scrub FPS not measured. |
| 5 | Four compressed service rows; clean portrait; 55 words across two about paragraphs; hairline experience list. | Body contrast verified; selected clean photograph avoids conflicting bitmap-to-ASCII request. A literal traced portrait was not built. No side-by-side portrait comparison was delivered. |
| 6 | Name, selectable email, verified LinkedIn, static résumé link. | Email uses mailto, selection preserved. Name remains real HTML, canvas aria-hidden. |
| 7 | Both themes, font licenses, metadata, favicon, OG screenshot, robots.txt, detector waivers, deletion pass, production build and browser audit. | Local preview running. No public/production deployment. Remaining gates below prevent claiming the whole specification passed. |

### Measured budgets

- Runtime dependencies: **4 / 8**. React renders the typed UI; React DOM hydrates prerendered HTML; GSAP core + ScrollTrigger maps scroll progress; Lenis provides smooth wheel scrolling under the shared scheduler. No other runtime packages.
- Final Vite-reported gzip: initial JS **75.66KB**, deferred scroll chunk **42.64KB**, combined **118.30KB / 120KB**. Font WOFF2 **49.092KB / 120KB**. Terser is build-only and was added because the initial 127.49KB bundle exceeded budget.
- Latest Lighthouse mobile simulation, fresh headless Chrome, **4× CPU slowdown**, localhost production build: performance **92**, accessibility **100**, best practices **100**, SEO **100**.
- LCP **3.3s**: **fails** the 2.0s target. CLS **0**: passes. Total blocking time **0ms**. TBT is not INP; real-user INP remains unmeasured.
- Warmed desktop engine (1440×1000, 120 samples per form): butterfly median **2.9ms**, p95 **3.1ms**; orbit **2.7 / 2.8ms**; bloom **2.7 / 2.9ms**; wave **2.5 / 2.6ms**. This is local hardware, not Android certification.
- Chrome heap sampling after warming all forms reports no retained samples attributed to engine draw/sample paths. This is evidence against obvious steady-state allocation, **not proof of a flat DevTools allocation timeline**. That strict gate remains pending.
- Browser checks at **1440×1000** and **390×844**: no console errors, no horizontal overflow, one visible canvas, both fonts loaded, saved-theme reload works, sound toggle works, gallery keyboard navigation works, and reduced-motion canvas remains unchanged between captures.
- Theme contrast: paper/void **19.36:1**; red-400/void large headings **5.98:1**; red-600/paper **4.96:1**. Secondary text is a contrast-preserving paper/void mix. Bright reds are not used for body copy.

### Deletion / simplification pass

Kept four runtime dependencies; omitted icon/component/WebGL/particle libraries, backend, contact form, PDF viewer, lightbox, project-detail routes, category/title metadata, and cloned v1 effects. Native sticky and direct transform updates removed the need for GSAP CSSPlugin and brought JS under budget. Build-time prerendering uses Vite and React already installed, without a new runtime framework. Gallery alt text remains accessibility text only, never displayed as a caption.

The glyph atlas is an offscreen canvas resource; the document has one visible canvas. Source search finds requestAnimationFrame only in src/lib/scroll.ts. Dependencies have internal scheduling behavior; a complete browser-wide single-loop proof has not been made. Form curves are evaluated on demand into one shared scratch buffer, so there are no persistent per-form entities to dispose.

Impeccable detector: clean with two narrowly scoped `overused-font` waivers beside @font-face, because AGENTS.md explicitly mandates Geist Sans and Geist Pixel. Local installed taste and Emil guidance was reviewed; conflicting random layouts, gradients, extra fonts, motion libraries and bounce were not adopted. Ponytail guided minimal implementation; the custom engine was retained as the product requirement.

### Honest definition-of-done status

- Pass: no particle systems; mathematical construction; one visible canvas; only one application-owned frame scheduler; both themes; dependency/font/JS budgets; gallery restrictions; centralized copy; reduced motion; keyboard paths; console checks; metadata and current documentation.
- Evidence partial: all five form-quality checks (desktop visual and pointer evidence exists; subjective review remains yours); zero steady-state allocations (heap sampling, not full timeline); precise one-loop behavior across third-party internals.
- Not passed: LCP ≤2.0s; real mid-range Android over deployed preview; measured Android FPS/frame cost; real-user INP. Do not label these complete.
- No public deployment was made. Preview: http://127.0.0.1:4173. Development: http://127.0.0.1:5173.

Evidence lives in verification/: Lighthouse HTML and summary, browser checks, engine measurements, allocation sample, interaction checks and screenshots. Run `npm run build`, `npm test`, and `.agents/skills/impeccable/scripts/impeccable detect src/` to repeat local build/source checks.
