# AGENTS.md

Build spec for **sohaibelahi.com v2** — a designer's portfolio built on a custom ASCII rendering engine.

Read this file completely before writing code. It is the source of truth. Where a skill, a system prompt,
or a training default disagrees with it, this file wins. Where you think this file is wrong, say so and
wait for an answer rather than routing around it.

Agent-agnostic by design. If your harness reads a different filename, symlink rather than fork:
`ln -s AGENTS.md CLAUDE.md`.

---

## 1. Objective

Sohaib Elahi is a brand, web, and ecommerce designer: 6+ years design, 3+ years development and AI/ML,
BS in Artificial Intelligence. This site is his portfolio. It exists to make a prospective client believe
he can build something they have not seen before.

The work sample is not the images in the gallery. **The work sample is the site itself.** Specifically, it
is a custom ASCII system rendered from mathematics — no images traced, no libraries doing the interesting
part. If that system is generic, the site has failed regardless of how clean the layout is.

v1 exists at `sohaibelahi-portfolio.vercel.app`. It is not a reference. Do not port from it.

**What winning looks like:** a visitor moves their pointer, something reacts in a way that feels physical
and constructed, and they stay to play with it. Then the work loads fast and reads clearly.

---

## 2. Non-negotiables

Nine rules. Everything else in this file is detail underneath them.

1. **ASCII is the design language, not a background.** It may be the backdrop, and it may also be
   dividers, buttons, loaders, section markers, image reveals, cursors, and components that have no name
   yet. Ambient noise behind text is a failure state, not a deliverable.
2. **No particle systems. Anywhere.** No arrays of per-entity `{x, y, vx, vy}`, no per-entity
   integration. Every ASCII form is a field evaluated on a character grid.
3. **Constructed, never traced.** Forms are built from parametric equations, distance fields, and
   per-cell math. Running a bitmap through an ASCII converter is not acceptable output.
4. **One canvas, one animation loop.** Every animation routes through a single ticker. Zero
   `requestAnimationFrame` calls outside `src/lib/scroll.ts`.
5. **The Figma file is the design brief.** Read it before designing anything. See §6.
6. **60/30/10 colour, in two themes.** See §4.1.
7. **No AI slop in the copy.** See §8.
8. **Performance budgets are pass/fail**, not aspirations. See §9.
9. **Ask rather than assume.** Open questions live in §14. Do not invent answers to them.

---

## 3. Stack

```
Vite 6 · React 19 · TypeScript (strict) · Tailwind v4 · GSAP + ScrollTrigger · Lenis
```

**Runtime dependency budget: 8 maximum.** Every addition needs a written justification in `PROGRESS.md`.

Explicitly not used: Three.js, any WebGL library, framer-motion or motion, pdfjs, Express, nodemailer, any
component library, any icon package beyond inline SVG.

Résumé is a static `/resume.pdf` link. Contact is `mailto:` unless §14 says otherwise. There is no server.

---

## 4. Design system

### 4.1 Colour — the 60/30/10 rule

Two themes, both built on the same rule. A theme toggle ships; the default is an open question (§14).

**Light theme**

| Share | Role | Token |
|---|---|---|
| 60% | Surface — page background, generous empty space | `--paper` |
| 30% | Structure — type, ASCII ink, rules, dark blocks | `--void` |
| 10% | Accent — one red, used where attention should go | `--red-600` |

**Dark theme**

| Share | Role | Token |
|---|---|---|
| 60% | Surface — page background, tinted black not pure | `--void` |
| 30% | Structure — the ASCII field, headings, rules, atmosphere | red scale |
| 10% | Accent — primary body copy, the brightest thing present | `--paper` |

The dark theme inverts which colour carries structure. Red stops being a highlight and becomes the ink the
site is drawn in, spanning the full scale from near-black through to bright; white becomes precious and
marks only what must be read. This is the more distinctive of the two. Build it first.

**Tokens** (`@theme` in Tailwind v4):

```css
--color-paper:   #FAFAF8;   /* warm white, never #FFF */
--color-void:    #070606;   /* red-tinted black, never #000 */
--color-red-950: #240806;
--color-red-800: #5E1712;
--color-red-600: #C9362E;   /* the brand red, carried from v1 */
--color-red-400: #F0584C;
--color-red-200: #FF8A7E;
--color-mute:    /* derived per theme, one step off the surface */
--color-hair:    /* hairline rules, 8–12% opacity of the structure colour */
```

Rules: the five red steps exist so that red has depth rather than being one flat highlight. Never introduce
a sixth. No gradients as decoration — if a surface needs texture, the ASCII field provides it. No colour
outside these tokens, including in the ASCII glyph ramp.

Both themes must be checked for contrast (§10), and the ASCII intensity ramp needs separate tuning per
theme — a ramp that reads on black will be mud on white.

### 4.2 Type

- **Geist Pixel** — headings only, 28px and above, never body text. Self-host the woff2 in
  `public/fonts/`; do not install the `geist` npm package, its `next/font` wrappers do not work in Vite.
  Check at build time whether the variable `ELSH` axis ships before deciding how many files to load.
- **Geist Sans** — everything else.
- **No third family. Geist Mono is banned from the UI**, including in the ASCII canvas, which draws from a
  pre-rendered glyph atlas rather than from live text.

Scale: a clear jump between levels, no more than six steps total. Body no smaller than 16px.

### 4.3 Space, shape, motion

- Two border radii exist: `0` and `12px`. Nothing else.
- Motion tokens: `120ms` (state), `240ms` (element), `520ms` (section), all on
  `cubic-bezier(0.22, 1, 0.36, 1)`. Bounce and elastic curves are banned.
- Scroll-driven motion is the default. Entrance animations are the exception, not the rule — uniform
  fade-up-on-every-section is a banned pattern.
- `prefers-reduced-motion` renders one composed static frame and stops. That frame must still look good.

---

## 5. The ASCII system

### 5.1 What it is

A single `<canvas>` behind and within the page, driven by one loop, rendering a character grid. Two layers:

- **Ground** — an ambient field. Deliberately understated. It is atmosphere.
- **Figure** — a constructed form that dominates the field. This is the artwork.

A section with ground and no figure is unfinished. Drifting noise behind text is a gradient with extra
steps.

### 5.2 Technique

**Grid:** 14px cells desktop, 15px tablet, 18px mobile. DPR capped at 1.5 desktop, 1.25 mobile. Forms
render into a **half-size sub-grid inside their own bounding box** (7px / 9px), because silhouettes need
resolution that ambient fields do not.

**Rendering:** a pre-rendered glyph atlas (roughly 11 glyphs × 5 colour steps), `drawImage` per lit cell.
Full `clearRect` then sparse draw. Dirty-rect diffing only if profiling demands it.

**Intensity buffer:** one `Float32Array`, allocated at init, `fill()`-reset per frame. **Zero allocations
in the steady-state loop** — prove it with a flat line on a DevTools allocation timeline.

**The recommended technique for line-based forms — scatter, not gather:**

Walk a parametric curve in N steps. Project each sample to grid space. Splat it into a scratch buffer: for
the 3×3 cells around the sample, keep `min(existing, distance)`, and record the sample's depth and arc
position. Intensity is then `falloff(distance)` modulated by depth.

Cost is `N × 9` rather than `cols × rows × N` — roughly 3,600 operations per frame, **independent of
viewport size**. This single decision is what makes a complex form affordable on a mid-range phone. Use it
wherever a form can be expressed as a curve, a surface, or a signed distance field.

**Motion without moving anything:** run a travelling brightness wave along arc position,
`0.5 + 0.5·sin(arc·k − t·ω)`, with two or three harmonics so it does not read as one repeating band. The
form appears to circulate while no state advances.

**Interaction: warp the space, not the object.** Displace sample coordinates before projection with a
field centred on the pointer — a radial term plus a tangential term scaled by pointer velocity, multiplied
by an eased strength scalar that decays over roughly 600ms after the pointer stops. Applying displacement
before the splat is what makes a form genuinely deform rather than shift. Tune the falloff radius, the
radial/tangential mix, and the decay by hand until it feels physical. This is the site's headline
interaction and it deserves a full session.

**Ink budget:** cap lit cells at ~2600 desktop, ~1100 mobile. Exceeding it is a bug, not a look.

**Section handover:** forms do not cross-fade. The outgoing form erodes (falloff widens while a noise
threshold eats into it) as the incoming form condenses by the same process reversed, over a ~15vh band. At
most two forms are allocated at once; `init()` on approach, `dispose()` two sections away.

### 5.3 What to build — deliberately open

**This spec does not prescribe a catalogue of forms.** Earlier drafts did, and that was a mistake: it
turned a creative problem into a checklist.

What each section gets is derived from the Figma references (§6) and from your own judgement about what
the mathematics can do well. The references lean toward complex, organic, mathematically-generated
patterns — butterflies, flowers, orbital systems, wave interference, phyllotaxis, strange attractors,
knots — because that is the ambition: forms with interior logic, not decoration.

Freedoms you explicitly have:

- Choose a different form for each section, or let one form evolve across the whole scroll.
- Use ASCII for **components**, not only backdrops: dividers, hover states, loaders, the cursor, gallery
  transitions, a section index, the footer wordmark. Invent component types that do not exist yet.
- Decide whether the portrait photograph becomes ASCII at all. It may be stronger as a clean photograph
  against an ASCII field. Make the call, show both if you are unsure.
- Propose something not discussed here, if it is better. Show it before committing a phase to it.

Constraints that still bind: §2 rules 1–4, the performance contract in §9, and the quality bar below.

### 5.4 Quality bar — every form must pass

- **Silhouette test.** Screenshot at 25% scale. The form must still be identifiable. If it turns to noise,
  the falloff is too wide or the grid too coarse.
- **Poke test.** Pointer response visible within 2 frames, and it decays rather than snapping.
- **Construction test.** If the output could have been produced by running an image through an ASCII
  converter, it is not finished. There must be interior logic a bitmap cannot have.
- **No-particles test.** Search the source for an array of per-entity state. If one exists, rewrite as a
  field. The only permitted arrays are per-column or per-sample scratch buffers reset every frame.
- **Screenshot test.** Look at it yourself before showing it. If you cannot render it in your environment,
  say so at the start of the phase.

### 5.5 Performance contract

| Metric | Desktop | Mobile |
|---|---|---|
| Engine frame cost | ≤5ms | ≤7ms |
| During section handover | ≤8ms | ≤8ms |
| Frame rate | 60fps | ≥50fps |

Measured on a real mid-range Android over a preview deployment, not in device emulation. Emulation lies
about GPU and thermal behaviour.

---

## 6. Figma — the design brief

Sohaib maintains a Figma file of references: Pinterest boards and collected work showing complex ASCII
patterns and animations, organised by the section each belongs to. It is connected over MCP.

**Read it in Phase 0, before designing anything.** Then produce `DESIGN-BRIEF.md` containing, per section:

1. **What the references show** — described concretely. "Radial ASCII bloom, density falling off from a
   bright core, roughly 8-fold symmetry" is useful. "Modern and clean" is not.
2. **The specific ingredient to take** — layout structure, motion behaviour, density, symmetry, contrast,
   or rhythm. One or two per reference, named precisely.
3. **The mathematics that would produce it** — the actual approach: which curve, field, or distance
   function, and how it maps to intensity. This is where the reference becomes buildable.
4. **What you are deliberately not taking**, and why.

Rules for reading Figma:

- References are **inspiration, not templates**. Extract the principle; do not reproduce a frame. If a
  reference is someone's finished work, taking its structure wholesale is plagiarism and it will be
  obvious.
- Frame names and any annotations Sohaib has written are instructions. Read them.
- If a section has no references, say so rather than inventing a direction for it.
- If the Figma MCP connection is unavailable, **stop and tell Sohaib**. Do not proceed on guesswork — the
  entire point of this workflow is that the design direction comes from him.

`DESIGN-BRIEF.md` is reviewed and approved before Phase 1 starts. Once approved it joins this file as
binding context.

---

## 7. Sections

Structure, not design. Design comes from §6.

- **Header** — minimal, persistent. Theme toggle lives here.
- **Hero** — the site's strongest ASCII moment and its headline interaction. One orchestrated entrance,
  ~900ms, once. Everything after is scroll- or pointer-driven.
- **Work / gallery** — **images only**. No titles, no client names, no tags, no years, no categories, no
  lightbox, no detail pages, no hover captions. If you write a `title` field into the image data you have
  misread this. One component, used twice with a direction parameter: desktop is a pinned horizontal rail,
  mobile is native scroll-snap with no pinning.
- **Services** — what he does, compressed. No pill tags, no icon cards, no hover lift. A pill grid here is
  exactly the pattern the brief calls slop.
- **About** — two short paragraphs (65 words combined, maximum), the portrait, and a plain list of
  experience separated by hairline rules.
- **Footer / contact** — the name, the email as a selectable `mailto:` link, social links. Nothing else.

---

## 8. Copy

All copy lives in one typed object at `src/content/site.ts`. No string literals in components.

**Rules:** sentence case throughout. No eyebrow labels above headings. No em dashes. No invented metrics or
fake client counts. Every sentence must be something only Sohaib could say — if it would sit unchanged on
another designer's portfolio, rewrite it.

**Banned vocabulary:** crafting, bridging, seamless, elevate, journey, passionate about, at the
intersection of, pixel-perfect, cutting-edge, leverage, empower, unlock, transform your, we believe,
let's create something amazing.

**Résumé facts** (do not invent beyond these):

| Company | Location | Period |
|---|---|---|
| The JAQ Group | UK | 2025–present |
| Petra Brands / SwiftStart | — | 2024–2025 |
| FIGO Homes | US | 2022–2025 |
| BrandLiners | — | 2021–2024 |
| Dequanis | — | 2020–2021 |

v1's hero line was "Creativity Comes From Within". It is a fortune cookie. Propose three alternatives in
the hero phase and wait for Sohaib to choose.

---

## 9. Budgets — pass/fail

| Metric | Target |
|---|---|
| JS, gzipped | ≤120KB |
| Fonts, total | ≤120KB |
| LCP, mobile 4G | ≤2.0s |
| CLS | ≤0.02 |
| INP | ≤200ms |
| Lighthouse performance | ≥90 |
| Lighthouse accessibility | ≥95 |
| Runtime dependencies | ≤8 |

Plus the engine contract in §5.5. Report measured numbers at the end of every phase. Do not report a phase
as done because the code compiles.

---

## 10. Accessibility

- Contrast checked in **both themes**. Red on black needs care; the brightest red steps are for large text
  and ASCII only, never for body copy.
- The ASCII canvas is `aria-hidden`. Anything it depicts that carries meaning (the footer wordmark) has
  visually-hidden real text behind it.
- Full keyboard path through the site, visible focus rings, no keyboard trap in the pinned gallery.
- The horizontal rail is keyboard-navigable or has an equivalent vertical fallback.
- No `cursor: none`, no global `select-none`. The email address must be selectable.
- `prefers-reduced-motion` honoured throughout (§4.3).

---

## 11. Skills

Four optional packs. Precedence, highest first: **this file → `DESIGN-BRIEF.md` → Sohaib in session →
impeccable → taste-skill → emilkowalski → ponytail.**

```bash
npx impeccable install                                  # then /impeccable init
npx skills add https://github.com/Leonxlnx/taste-skill
npx skills@latest add emilkowalski/skills
# ponytail: install via your harness's plugin system, or copy its ruleset in manually
```

taste-skill dials: `DESIGN_VARIANCE: 7`, `MOTION_INTENSITY: 7`, `VISUAL_DENSITY: 3`.

**None of these are required.** They raise the ceiling; this file sets the floor. If one will not install,
say so and continue — but run the equivalent check by hand:

| Instead of | Do this |
|---|---|
| `/impeccable critique` | Re-read §4 and §8, list every element that fails a rule |
| `/impeccable audit` | Walk §9 and §10 as an explicit checklist |
| `npx impeccable detect src/` | Works standalone, no agent needed. Always run it. |
| `/ponytail-review` | List everything in the diff removable without losing a requirement |
| emil's `animate` | Check every animation against §4.3 |

**Pre-resolved conflicts:** detectors flag "near-black plus one bright accent" and "overused fonts" as
AI tells. Both are deliberate brief requirements here. Waive with an inline comment and a reason. Ponytail
pushes toward less code — accept that everywhere except the ASCII engine, which is the product.

---

## 12. Phases

One phase per session. Fresh context each time, carrying only this file, `DESIGN-BRIEF.md`, and the last
`PROGRESS.md` entry. Use planning mode if your harness has one. Each phase ends with budgets measured, a
deletion pass, `npx impeccable detect src/` clean or waived, one squashed commit, and **a stop** — show
Sohaib before continuing.

| # | Phase | Done when |
|---|---|---|
| **0** | **Figma + setup.** Read the Figma file, write `DESIGN-BRIEF.md` (§6). Inventory `raw/`, write `ASSETS.md`, convert images to AVIF+WebP. Scaffold the stack, wire both theme token sets, self-host and prove both fonts. | `DESIGN-BRIEF.md` approved by Sohaib. A blank page renders in both themes with fonts proven. |
| **1** | **Engine.** `src/ascii/` standalone on a `/lab` route with live controls for every constant. Atlas renderer, composite pipeline, ground fields, ticker, reduced-motion and low-end paths. Then the **hero form**, built to the standard the rest will follow. | §5.5 passes on desktop and a real phone. Hero form passes all five tests in §5.4. Allocation timeline is flat. |
| **2** | **ASCII vocabulary.** The remaining forms and components from `DESIGN-BRIEF.md`, still on `/lab`. Section handover (§5.2). | Every form passes §5.4. Scrubbing between scenes shows erode-and-condense with no popping. |
| **3** | **Shell + hero.** Header, theme toggle, scroll wiring, mounted canvas, hero section with its entrance. Three H1 options proposed, one chosen. | LCP and CLS measured against §9 with the hero alone. |
| **4** | **Gallery.** Images only. Pinned rail desktop, scroll-snap mobile. | FPS during scrub, CLS after load, total image weight, all reported. |
| **5** | **Services + about.** Both per §7. | `/impeccable critique` run and its findings fixed. |
| **6** | **Footer + contact.** | Email selectable. Wordmark has real text behind it. |
| **7** | **Themes + ship.** Both themes verified across every section including ASCII ramp tuning. Animation review, audit, detect, metadata, favicon, OG image. Full Lighthouse: mobile, incognito, 4× CPU throttle. | §13 walked line by line, honestly. |

---

## 13. Definition of done

- [ ] Zero particle systems in `src/`. No per-entity state arrays exist.
- [ ] Every ASCII form passes all five tests in §5.4.
- [ ] Exactly one animation loop. No `requestAnimationFrame` outside `src/lib/scroll.ts`.
- [ ] Zero allocations in the steady-state frame, proven.
- [ ] Both themes complete, contrast-checked, ASCII ramp tuned per theme.
- [ ] Every §9 budget met and measured, not estimated.
- [ ] ≤8 runtime dependencies.
- [ ] Gallery has no titles, tags, or detail views.
- [ ] All copy from `src/content/site.ts`, passing §8.
- [ ] `prefers-reduced-motion` path renders a static frame that looks intentional.
- [ ] Tested on a real mid-range Android over a preview deploy.
- [ ] No console errors or warnings in production build.
- [ ] `ASSETS.md`, `DESIGN-BRIEF.md`, `PROGRESS.md` all current.

---

## 14. Open questions — ask, do not assume

1. **Default theme** — light or dark on first load?
2. **H1 line** — three options proposed in Phase 3, Sohaib chooses.
3. **Contact** — `mailto:` only, or a real form? (A form means a serverless function and a mail provider.)
4. **Gallery images** — how many, and what aspect ratios? Determines editorial-varied versus uniform rail.
5. **"SFX on micro-animations"** — actual audio (WebAudio-generated, no files, off by default with a
   toggle), or purely visual feedback?
6. **Portrait** — your call per §5.3, but show Sohaib both treatments before committing.

---

## 15. Notes for the executing agent

- Build the engine before the pages. If the engine is wrong, the pages are wasted work.
- The forms are the portfolio's actual work sample. The copy and photographs support that judgement; the
  ASCII is what makes it.
- When in doubt about adding something: don't. Slop is almost always addition.
- v1's problem was not too few effects. It had more than this site will. It had too many, fighting each
  other. v2 is one good idea executed precisely, everywhere.
- Report honestly. A missed budget or a check you could not run gets written down plainly. An overstated
  "done" costs more than a delay, because the next phase builds on top of it.
- If something here turns out to be technically wrong once you are in the code, name the section, say why,
  and propose an alternative. Do not substitute quietly.
