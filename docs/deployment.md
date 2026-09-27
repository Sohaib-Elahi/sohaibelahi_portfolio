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

The build type-checks, bundles and prerenders the homepage. It is a static deployment: no server or environment secrets are required. Optimized browser assets are in `public`; originals stay in `raw` and are not copied into the website. Git ignores dependencies, generated builds, environment files and local Vercel credentials.

## Local checks

```sh
npm ci
npm run build
npm test
npm run preview -- --port 4173
```

Check the entrance, mobile layout, gallery, theme switch and music before publishing a change.

## Updating or rolling back

Vercel → this project → Settings → Environments → Production → Branch Tracking controls the production branch. Keep it on `codex/portfolio-v2` for V2 updates.

To undo a bad V2 change, revert its commit on the V2 branch and push; this preserves history. Vercel also supports rolling back to an earlier ready production deployment from its deployment menu. To return permanently to V1, change the production branch back to `main` and deploy that branch. There is no need to delete V2 or force-push either branch.

References: [Vercel environments](https://vercel.com/docs/deployments/environments), [project configuration](https://vercel.com/docs/project-configuration).
