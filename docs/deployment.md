# Publishing portfolio V2

This repository keeps both portfolio versions:

- `main`: the preserved V1 code.
- `codex/portfolio-v2`: the finished V2 and its production updates.

The existing Vercel project is `sohaibelahi-portfolio`, connected to this repository. Its production branch should be `codex/portfolio-v2`; the public address stays https://sohaibelahi-portfolio.vercel.app/.

## The GitHub basics

A repository is your project's files plus their history. A branch is an independent line of work within that repository. A commit is a saved snapshot with a message. A push uploads your local commits to GitHub. Switching branches does not delete the other version.

A pull request proposes merging one branch into another. For future V2 changes, create a small feature branch from `codex/portfolio-v2`, push it, check Vercel's preview, then merge the pull request into `codex/portfolio-v2`. Vercel builds the production branch and updates the current public address after a successful deployment. Do not target `main` if you want it to remain the V1 archive.

## Build settings

`vercel.json` keeps the V2 settings with the V2 code:

- Framework: Vite
- Install: `npm ci`
- Build: `npm run build`
- Output: `dist`
- Node: 24.x, declared in `package.json`
- Root directory: repository root

The build type-checks, bundles and prerenders the homepage. The prerendered page is static; `/api/notes` is a small Node serverless function for the shared visitor collection. Only that API needs storage credentials. Optimized browser assets are in `public`; originals stay in `raw` and are not copied into the website. Git ignores dependencies, generated builds, environment files and local Vercel credentials.

## Local checks

```sh
npm ci
npm run build
npm test
npm run preview -- --port 4173
```

Check immediate headline rendering, mobile layout, gallery, theme switch, music and visitor collection before publishing a change.

## Updating or rolling back

Vercel → this project → Settings → Environments → Production → Branch Tracking controls the production branch. Keep it on `codex/portfolio-v2` for V2 updates.

To undo a bad V2 change, revert its commit on the V2 branch and push; this preserves history. Vercel also supports rolling back to an earlier ready production deployment from its deployment menu. To return permanently to V1, change the production branch back to `main` and deploy that branch. There is no need to delete V2 or force-push either branch.

References: [Vercel environments](https://vercel.com/docs/deployments/environments), [project configuration](https://vercel.com/docs/project-configuration).

## Shared visitor collection
The full-width text canvas and PNG export work without a database. Public saving uses `/api/notes`, backed by Upstash Redis REST in production. Connect a dedicated database to this Vercel project, then provide `KV_REST_API_URL` and `KV_REST_API_TOKEN` (the `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` names also work). These are server-only environment variables: never prefix them with `VITE_` or commit their values. A new deployment is required to apply changed Vercel environment variables.

Local Vite dev/preview uses the same API with Node 24's built-in SQLite at `.local/visitor-notes.sqlite`, ignored by Git. It survives preview restarts and is shared by browsers connected to that local server. Local entries are not automatically migrated to the production database. Production returns an unavailable response when credentials are missing; it cannot silently save to temporary serverless disk.

Each note stores an ID, plain text, timestamp and hashed removal key. The raw removal key lives only in the visitor's browser. GET responses exclude ownership hashes. There is no automatic note expiry. Entries have a 32-character limit, URLs/contact details are rejected, and publishing is limited to one entry per IP per minute. Rate-limit IPs are hashed; their keys expire after a minute. Cross-origin JSON writes are rejected. Visitors can remove their own entries while they retain their browser key; clearing browser storage loses that control.

As site owner, review the public collection periodically and remove abusive entries in the database console: delete `portfolio:notes:<id>` and remove that ID from the sorted set `portfolio:notes:index`. Provider backups/exports and quota monitoring are needed for long-term retention. Do not reuse unrelated project databases, accept provider terms without the account owner's approval, or choose a paid plan without authorization.

Tests: `npm test` includes API validation, rate limits, owner deletion, pagination and persistence across a separate Node process. Browser QA should include two isolated visitor sessions, PNG download, reload and an unavailable API. Local SQLite coverage does not replace a production Redis connection smoke test before publishing.

## Preview verification — 7 October 2026
Before restoring the user-requested entrance, Chrome on localhost at 1280×800, 4× CPU slowdown, 150ms latency and approximately 1.6Mbps download measured LCP at 0.89s (2.90s baseline). The restored 5.3-second entrance is intentional presentation time; do not quote 0.89s as time to finish that animation. In the same five-second services scroll, script work fell from 797ms to 413ms and total task time from 2506ms to 1503ms. These are local lab measurements, not promises for every device or the production network.

Checked layouts at 320, 371, 390, 768, 1280 and 1920px in both themes; no horizontal page overflow. Chromium and mobile WebKit passed headline, film/destination switches and playground checks, including reduced motion. Two isolated browser sessions verified shared notes, reload persistence, owner deletion, 1200×360 PNG download and usable canvas/export during an API outage. The build, artwork checks and four API tests passed. The dedicated `portfolio-visitor-notes` Upstash Free database is now connected to the production environment only, with eviction disabled. Preview deployments intentionally have no access to production notes. Verify GET, save and removal on the live API after each storage-related release.

Release refinements: restored the approved greeting/square reveal without headline typing. Chromium and WebKit passed desktop/mobile intro completion, reduced-motion bypass, visible headline and a fixed-height carousel with 100 simulated entries. The row stays 150px tall and supports swipe, arrows, keyboard and paginated older entries. Removed dates, word counter and redundant helper text.
