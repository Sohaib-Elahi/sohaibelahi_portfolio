# Sohaib Elahi — portfolio v2

Design direction, current state and next phases: [AGENTS.md](AGENTS.md).
Original asset inventory: [docs/assets.md](docs/assets.md).

## Run

```sh
npm ci
npm run dev
npm run build
npm run preview -- --port 4173
```

## Project map

- `src/components/Landing.tsx`, `src/landing.css`: current hero and navigation.
- `src/ascii/ribbon.ts`: hero artwork; `src/lib/scroll.ts`: shared animation and scrolling.
- `src/App.tsx`, `src/style.css`: application shell and shared styles.
- `src/components/PortfolioBody.tsx`, `src/body.css`: logo marquee, gallery, capability cards, biography and footer.
- `src/ascii/body-art.ts`, `src/lib/sound.ts`: section artwork and optional interaction sounds.
- `src/content/`: visitor copy and gallery manifest.
- `public/`: browser-ready images, fonts, résumé and metadata assets.
- `raw/`: original portfolio images, logos, fonts, portrait and résumé; preserve these.
- `scripts/`: asset/font preparation, prerendering and legacy engine checks. Python preparation requires Pillow/fontTools; asset preparation writes `docs/assets.md`.

`/lab` and `/type` are existing development previews, not design instructions. `npm test` checks the legacy analytic engine. `node_modules/` and `dist/` are generated and ignored by Git.

The complete V2 includes the entrance reveal, responsive ASCII artwork, scroll-driven portfolio and personal bento. Deployment and the branch workflow are explained in [docs/deployment.md](docs/deployment.md).

The animated portrait is generated with `python scripts/prepare-portrait.py` (Pillow and ffmpeg required; `--ffmpeg /path/to/ffmpeg` is supported). The original GIF stays in `raw/portrait/`; only its optimized MP4 and still poster are served.
