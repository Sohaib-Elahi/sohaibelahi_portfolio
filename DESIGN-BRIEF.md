# Portfolio v2 design brief

Status: creative direction delegated by Sohaib in session after reviewing this proposal. Proceed with the connected butterfly/orbit/bloom/wave direction.
Source: https://www.figma.com/design/k3QPtlQWjtd4ADtpRxY5QE/ASCII-Website-Inspiration
Read on 2026-09-19 through Figma MCP. Page 1 (0:1) contains ten image rectangles, no text annotations, section frames, components or section assignments. All ten were visually inspected. Assignments below are proposals, not claims about the source.

## Reference evidence

| Node | What it shows | Take | Leave behind |
| --- | --- | --- | --- |
| 1:3 image 1 | A pale editorial poster, large serif title and oblique character-built ring | A legible silhouette and generous empty field | Serif typography, tutorial copy and exact composition |
| 1:9 image 2 | Large luminous flower on black, broad rounded petals and dense center above compact text | Petal hierarchy and density describing depth | Multicolour bitmap-like shading, brand copy and badge |
| 1:12 image 3 | White digitized hands enclosing a bright object; concentrated light over a short title | Strong figure/ground separation | Anatomical tracing and simulated particle spray |
| 1:15 image 4 | Full-screen dotted contours with a broad horizontal text clearing | Negative space carved out of the field | Copied heading, navigation boxes and uniform dot wallpaper |
| 1:18 image 5 | Two pale ASCII hands reaching into a central white clearing | Deliberate clearance around readable copy | Traced hands, rounded CTA and third-party wording |
| 1:21 image 6 | A split photograph/ASCII butterfly, recognizable wing outline with internal veins | Bilateral organic silhouette and structural veins | Photo conversion, green palette and literal split treatment |
| 2:3 image 7 | Cyan spiral bands orbit an empty central area | Curved circulation and a quiet center | Cyan and dot-only rendering |
| 3:6 image 8 | Compact type specimen card with a low-resolution orange chart | ASCII as a bounded component, not only a backdrop | Card UI, orange, download metric and font branding |
| 3:9 image 9 | Sparse purple/cyan circular filaments enclosing copy | Discontinuous contour rhythm and protected reading space | Particle simulation, purple and promotional copy |
| 3:12 image 10 | Dense ASCII cloud ridges with bright crests and dark valleys | Layered wave contours and varying depth | Blue gradients, serif heading and traced clouds |

## Header
No header-specific reference exists. Follow AGENTS.md: persistent minimal navigation and theme toggle. Proposed ASCII interaction: a short thresholded glyph rule responds to focus/hover using the same renderer. Evaluate a one-dimensional distance field around the active link; no second canvas or animation loop. Do not import boxed menus or pill buttons from the references.

## Hero: constructed butterfly
Proposed assignment: image 6’s silhouette, image 2’s density hierarchy, and image 3’s concentrated figure/ground contrast. A large red form is the subject; text occupies a genuinely clear region rather than masking dense art.

Construct a bilateral butterfly curve: r(t) = exp(cos(t)) - 2 cos(4t) - sin(t/12)^5; x = sin(t) r(t), y = cos(t) r(t). Sample the outline and a small family of contracted, phase-modulated contours to establish wing veins. Project with shallow depth and scatter each sample to its nearest 3×3 sub-grid cells. Intensity follows distance falloff, depth and harmonics of arc position. Tune the result for distinct upper and lower wings rather than blindly accepting the raw curve.

Pointer deformation acts before projection: radial displacement plus tangential displacement weighted by pointer speed and a smooth spatial falloff; eased strength decays over approximately 600 ms. There are no moving particle entities. Brightness travels along veins without persistent per-sample state. The form must pass the 25% silhouette test before layout integration.

Do not reproduce the reference photograph, trace its silhouette, or use bitmap-to-ASCII conversion.

## Work: orbital contours
No gallery-specific reference exists. Proposed assignment: images 1, 7 and 9, expressed around the rails rather than over the work images. Use projected torus-knot curves: x=(R+r cos(qt)) cos(pt), y=(R+r cos(qt)) sin(pt), z=r sin(qt), initially p=2, q=3. A shallow projection exposes crossings; depth and arc harmonics produce circulation. The composition leaves broad horizontal image clearances.

Two rails use the same component with a direction parameter. Original image proportions guide varied widths. No captions, categories, titles or invented project metadata. Avoid the references’ bright cyan/purple and any per-particle state.

## Services: radial bloom
No services-specific reference exists. Proposed assignment: image 2’s broad petals and image 8’s bounded component logic. Use rose-family contours r(theta)=a+b cos(k theta), with k=5 and several radially contracted contours. A small depth term z=c sin(k theta) describes folds. Distance-to-sample falloff establishes edge clarity; brightness harmonics establish circulation. The sparse center and outer margin must preserve the service text.

ASCII rules can condense toward the focused service row; use shared field evaluation, no independent animation. Services remain compressed rows, without cards, tags, icons or bounce.

## About: wave contour and clean portrait
No about-specific reference exists. Proposed assignment: image 10’s layered ridges and image 5’s reading clearance. Sample a small family of analytic contours y_j(x)=j*d+A sin(k*x+phase_j)+B sin(2*k*x-phase_j); depth/occlusion and a narrow distance falloff produce structured ridges, not random noise. Keep the portrait clear and the typography unobstructed.

Recommend the clean supplied photograph. A procedural field framing the photo can provide the alternate treatment. A literal ASCII conversion would conflict with AGENTS.md §2.3; do not silently trace the portrait merely because a later reusable prompt requests an ASCII version. Show the treatments and resolve that distinction with Sohaib.

About copy remains two paragraphs, at most 65 words combined, with only supplied résumé facts. Experience remains a plain hairline-separated list.

## Footer/contact
No footer-specific reference exists. Follow the strict name/email/social structure. Proposed continuation: orbital contours condense into a quiet low band as the name becomes the dominant real-text element. Keep the name in accessible HTML; avoid a bitmap-derived ASCII wordmark. Email is selectable. No extra CTA blocks.

## Shared design and performance constraints
Use only the prescribed paper, void and five red tokens, with separate light/dark atlas ramps. Geist Pixel headings, Geist Sans body; no third UI font. One visible canvas, one ticker in src/lib/scroll.ts; atlas surfaces are offscreen resources. At most two scene resources during handover. Erode outgoing geometry using widening distance falloff and a deterministic cell threshold; condense incoming geometry with the reverse mapping over roughly 15vh, never an opacity crossfade.

Grid: 14/15/18px by device class, local figure sub-grid at half cell size; DPR ceilings 1.5/1.25. Lit-cell hard caps 2600 desktop and 1100 mobile. Allocate scratch buffers at init/resize only. Reduced motion renders a composed static view and stops the ticker, with event-driven redraw when the visible scene changes.

## Open decisions
- Approve or revise these proposed section assignments.
- Confirmed: Sohaib.
- Confirmed: dark default, email contact, optional sound off by default, all unique gallery images.
- Hero copy: present three options in Phase 3 for selection.
- Confirm clean portrait plus procedural framing comparison versus the conflicting request for literal ASCII portrait conversion.
