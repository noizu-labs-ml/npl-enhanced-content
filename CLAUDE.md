# CLAUDE.md — SemText

XHTML-first rich-content spec for NPL (Tier-0 schemas, Lit `SemNote` component + standalone demo, cypress e2e). Monorepo role: NPL-ecosystem spec + JS demo; couples to NPL framework and Libs Lit components.

## Stack & commands

Node/Vite demo + cypress. `npm install` · `npm test` / e2e via `cypress.config.js` (see `package.json` scripts).

## Layout

Top-level directories are domains — `spec/` (normative format specs),
`src/` (`lit/`, `fallback/`, `extract/`, `shared/`), `themes/` (CSS, kept
top-level as a subpath export + CDN asset), `web/` (`demo/`, `site/`),
`test/` (cypress `e2e/` + `support/`), `scripts/`, `docs/`.
Full tree: `docs/PROJ-LAYOUT.md` (summary: `docs/PROJ-LAYOUT.summary.md`).

Cypress runs against the BUILT pages in `dist/demo/`, not the marker sources
in `web/demo/` — run `npm run build` before `npm test`.

## Universal rules (monorepo policy)

- **Trinity Protocol (REQUIRED)**: substantive responses follow Orientation (assumption table, minds-eye, mermaid plan) → Friction (WEDGE/SHADOW/CRITIC) → Response + meta-review. Full text: monorepo `protocols/the-trinity-protocol.md`.
- **No shell in main thread** — delegate lookups/builds/greps to tasker subagents; batch and summarize.
- **Worktrees (REQUIRED)**: canonical placement `.claude/worktrees/<name>/`, created from this repo's own `.git` off `develop`; `.claude/worktrees/` is gitignored — see **Worktrees — Canonical Convention** below.

Monorepo-wide ops (secrets/dc, terraform, submodules, tiers): see `../../CLAUDE.md` at the trl-infra root.

## Branch & PR Policy

- Submodules sit on **`develop`** — keep your checkout on `develop`.
- All PRs target **`develop`** (feature/bug/task branches fork from `develop`).
- **`main` is CI/CD-only**: CI/CD automation performs all merges into `main` (release path). Never merge to or push `main` by hand.

## Worktrees — Canonical Convention (REQUIRED)

All work happens on git worktrees, created from **this repo's own `.git`** — never work directly on a shared checkout of `develop`/`main`.

- **Placement (fixed):** every worktree lives inside this repo's checkout at **`.claude/worktrees/<name>/`** — never siblings (`<repo>.worktrees/`), never ad-hoc paths. Matches Claude Code's native worktree tooling, so harness-created and manual worktrees coexist.
- **Naming:** `<name>` = branch name with `/` → `-` (branch `feature/vfs-wave1` → `.claude/worktrees/feature-vfs-wave1`).
- **Creation** — from this repo's own `.git`, based on `develop` (never `main`):

  ```bash
  git -C <this-repo> worktree add .claude/worktrees/<name> -b <branch> develop
  ```

- **Hygiene:** `.claude/worktrees/` is gitignored in this repo; never commit its contents. One worktree per task; remove it when the work lands (`git worktree remove .claude/worktrees/<name>` — keep the branch).
- **Addressing:** `git -C <this-repo>/.claude/worktrees/<name> …`; verify branch + clean index before any git write; no `git stash`.
- **Elixir projects:** the MAIN checkout owns `deps/` + `_build/`; each worktree symlinks `deps` (and `_build` where needed) to the canonical checkout by **absolute path** — no per-worktree re-fetch/recompile.
- **Legacy placements** (`.worktrees/`, `.wt/`, `<repo>.worktrees/` siblings, `staging/`) are grandfathered — do not create new ones; migrate opportunistically. `staging/` remains local-only experiments (never pushed/submoduled).
