# Contributing to SemText

All work lands on **`develop`**. `main` is the release branch and is
CI/CD-only — nobody merges into it by hand.

## Day-to-day

- Checkouts sit on `develop`. Feature/bug/task branches fork from `develop`
  and their PRs target `develop`.
- Work happens in worktrees under `.claude/worktrees/<name>/`, created from
  this repo's own `.git` off `develop` (see the monorepo `CLAUDE.md` for the
  canonical convention).
- PRs into `develop` are **squash-merged** once checks are green.
- Cypress runs against the BUILT pages in `dist/` — run `npm run build`
  before `npm test`.

## Budget gate

CI builds with `npm run build:strict` (`scripts/build.mjs --strict-budget`):
a bundle over its size budget fails the run. Local `npm run build` is
deliberately lenient — a budget overrun is always printed, but never silently
blocks local work. If CI goes red on budget, shrink the bundle or consciously
raise the budget in `scripts/build.mjs` **and** the table recorded in
`ROADMAP.md` ("R — Reading experience") in the same change.

## Release policy

The release path is git-driven; the chart is never hand-edited.

1. **Release = a manual `develop` → `main` PR, merged with a regular merge
   commit. Never squash a release PR** — the merge commit pair
   (merge + develop tip) is what the deploy provenance is read from.
2. No workflow promotes branches automatically; a human opens and merges the
   release PR.
3. On the push to `main`, CI (`.github/workflows/ci.yml`) builds the
   `sha-<7>` image, and the `bump-chart` job commits the new tag into
   `helm/semtext/values.yaml` as `[skip ci]`. **Agents and humans never touch
   chart tags for release** — that commit is CI's job.
4. ArgoCD auto-syncs from the chart repo; confirm the running pod image with
   `gh-wait deploy` after a release (Synced/Healthy alone can serve a stale
   image).
5. Component bundles are additionally published to `cdn.semtext.dev` under an
   immutable `/<version>/` prefix plus a mutable `/latest/` pointer by the
   `publish-cdn` job (gated on the `CDN_PUBLISH` repo variable).

## Release state (verified 2026-10-07)

Both recorded release PRs are merged into `origin/main` with regular merge
commits, and each was followed by a CI chart-tag commit:

- **#31** "release: sem-* tags canonical — spec v0.5, tag-form fallback
  parity" — merged 2026-09-21 (`31bab3b`), chart bump `7e55102`.
- **#33** "release: ship spec pages, themes and root bundles in the image" —
  merged 2026-09-21 (`6111edf`), chart bump `726307b`.

`origin/main` is the source of truth for release history; a stale local
`main` stub is cosmetic — `git fetch origin` is enough, local `main` is never
pushed to.
