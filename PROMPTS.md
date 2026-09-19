# PROMPTS.md

Copy-paste prompts, one per session. Agent-agnostic — works with anything that reads `AGENTS.md` from the
repo root and edits files.

**Rules for me, not the agent:** one phase per session, clear context between phases, start in planning
mode, commit at the end of each phase. If a phase goes wrong, `git reset --hard` and re-run with a
correction rather than talking it back on track. Strongest model for Phase 1 — the engine is the only
genuinely hard part.

---

## Setup

```bash
git clone https://github.com/Sohaib-Elahi/sohaibelahi_portfolio.git portfolio-v2
cd portfolio-v2 && git checkout -b v2
# delete v1 source from the working tree, keep .git and .gitignore
git commit -m "v2: clear v1 source, history stays on main"
git config branch.main.pushRemote no_push   # guard against a stray push to production
```

Place by hand before the first session:

```
AGENTS.md
PROMPTS.md
raw/images/     raw/logos/     raw/portrait/     raw/resume/     raw/fonts/
```

Install skills (§11), connect the Figma MCP server, and symlink `AGENTS.md` if your agent reads a
different filename.

---

## Phase 0 — Figma and setup

```
Read AGENTS.md completely before doing anything. It is the specification and it overrides your
defaults and any conflicting skill guidance.

This is a greenfield build. The folder has no application code, only raw assets. Do not look
for an existing codebase.

Do Phase 0 only (AGENTS.md §12).

Start with Figma. Connect via MCP and read the whole file. Follow §6 exactly and produce
DESIGN-BRIEF.md: per section, what the references show described concretely, the specific
ingredient to take from each, the mathematics that would produce it, and what you are
deliberately not taking.

The third part is the one that matters. "Radial bloom with 8-fold symmetry" is a description;
"phyllotaxis spiral, golden-angle increment, intensity from radial distance with a sine
modulation on the angular term" is something I can build. Give me the second kind.

If the Figma connection fails, stop and tell me. Do not guess at the design direction.

Then: inventory raw/ into ASSETS.md (dimensions, aspect, file size, duplicates flagged,
anything under 1200px flagged), convert images to AVIF+WebP, scaffold the stack from §3, wire
both theme token sets from §4.1, and self-host the fonts with a /type route proving both
render.

Stop there. No section components, no ASCII engine. Show me DESIGN-BRIEF.md first and wait for
approval, then the rest.
```

---

## Phase 1 — The engine

Strongest model. This session decides whether the site is worth building.

```
Read AGENTS.md and DESIGN-BRIEF.md. Phase 1 only.

The most likely way to fail this phase is to build drifting noise behind text and call it an
ASCII site. Re-read §5.1 and §5.3. The form is the subject.

Build src/ascii/ standalone on a /lab route with live controls for every constant: field, form,
speed, density, ink threshold, sub-grid resolution, pointer falloff radius, radial/tangential
mix, decay time. No new dependency for the controls.

Deliver in this order, showing me each before continuing:
1. Grid, glyph atlas, composite loop. Prove with a static test pattern. Report frame cost.
2. The ground fields. They should be almost boring alone.
3. The hero form from DESIGN-BRIEF.md, built with the scatter-splat technique in §5.2.
4. The pointer interaction: space warping, radial plus tangential, eased decay.

Pass/fail: one canvas and one ticker; zero allocations in the steady-state frame, proven with a
flat DevTools allocation timeline; the §5.5 contract; reduced-motion renders one good static
frame.

Then run all five tests in §5.4 on the hero form yourself and report the results honestly,
including the 25% silhouette screenshot.
```

Follow-ups you will probably need:

```
The interaction feels mechanical. The decay is the problem, not the force. Longer decay, ease
out, so it keeps moving after the pointer stops. Show me three falloff radii side by side.
```

```
The silhouette is muddy. Raise the sub-grid resolution inside the form's bounding box and
sharpen the distance falloff. Do not fix this by adding more curve steps.
```

---

## Phase 2 — ASCII vocabulary

```
Read AGENTS.md and DESIGN-BRIEF.md. Phase 2 only.

The engine and hero form are the reference standard. Build the remaining forms and ASCII
components from DESIGN-BRIEF.md, still on /lab, still in isolation.

Remember §5.3: ASCII is not only a backdrop. If the references suggest a divider, a loader, a
hover state, a cursor, or a component type we have not named, build it. Show me anything you
invent before committing to it.

Then the section handover from §5.2: erode-and-condense, not an opacity fade.

Every form passes §5.4, including the no-particles test. Short screen recording of each.
```

---

## Phase 3 — Shell and hero

```
Read AGENTS.md. Phase 3 only.

Header, theme toggle, src/lib/scroll.ts with the Lenis and ticker wiring, mounted canvas, hero
section with its orchestrated entrance.

All copy from src/content/site.ts. Before writing the hero copy, give me three H1 options
following §8 and wait for me to choose. No placeholder.

Both themes working from the start, not retrofitted. Report LCP and CLS with the hero alone.
```

---

## Phase 4 — Gallery

```
Read AGENTS.md. Phase 4 only.

Gallery per §7. Read it twice: images only. No titles, client names, tags, years, categories,
lightbox, detail view, hover captions, or arrows.

One component, used twice with a direction parameter. Desktop pinned horizontal rail with
ScrollTrigger. Mobile native scroll-snap, no pinning at all.

Wire the gallery's ASCII scene and its handover from the hero.

Report FPS during the rail scrub, CLS after images load, total transferred image weight.
```

---

## Phase 5 — Services and about

```
Read AGENTS.md. Phase 5 only.

Both sections per §7. Services: no pill tags, no icon cards, no hover lift. About: two
paragraphs, 65 words combined maximum, from the résumé facts in §8 only. Experience as a plain
list with hairline rules.

The portrait treatment is your call per §5.3 — show me both the ASCII and the clean photograph
version before you commit.

Then run /impeccable critique on both sections and fix what it finds.
```

---

## Phase 6 — Footer and contact

```
Read AGENTS.md. Phase 6 only.

Footer per §7. mailto only, no form, no server. The email must be selectable — no select-none.
If the wordmark is rendered in ASCII, put visually-hidden real text behind it.
```

---

## Phase 7 — Themes and ship

```
Read AGENTS.md. Phase 7 only.

1. Verify both themes across every section. Tune the ASCII intensity ramp separately per theme
   — a ramp that reads on black will be mud on white. Contrast-check both.
2. Animation review against §4.3.
3. /impeccable audit, then polish.
4. npx impeccable detect src/ — fix each finding or write an inline waiver with a real reason.
   The palette and fonts are brief requirements, waive per §11.
5. Deletion pass across the whole repo.
6. Metadata: title, description, OG image, favicon, theme-color for both themes.
7. Lighthouse: mobile, incognito, 4x CPU throttle.

Then walk §13 line by line and give me the honest status of each item. Do not mark something
done because it compiles.
```

---

## Between phases

```
Run a deletion pass on this diff: everything removable without losing a stated requirement.
Show me the list before acting on it.
```

```
Update PROGRESS.md: what shipped, measured numbers against the §9 budgets, what you deferred
and why, and anything in AGENTS.md or DESIGN-BRIEF.md that turned out to be wrong.
```

---

## Corrections

```
Stop. You have added decoration not in AGENTS.md or DESIGN-BRIEF.md. Remove it, re-read §4.3
and §8.
```

```
This is drifting noise behind text. Re-read §5.1 and §5.3. Rebuild it as a constructed field
with interior logic.
```

```
That is a traced bitmap, not a constructed form. §5.4, construction test. Build it from
mathematics.
```

```
You have introduced a second animation loop. There is exactly one ticker, in src/lib/scroll.ts.
```

```
You added a dependency. The budget is 8 total (§3). Solve it with the platform or existing code.
```

```
That copy could sit on any designer's portfolio. Re-read §8 including the banned vocabulary and
rewrite so it could only describe Sohaib.
```
