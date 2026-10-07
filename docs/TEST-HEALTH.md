# Test Health — npl-enhanced-content (SemText)
_Last measured: 2026-10-07 · before develop@4df29ee · after develop@8a0be46_

Two tiers, both in acceptance (no slow tier — the full suite fits the budget once sharded):

- **unit** — vitest, `test/unit/**` (45 tests, ~2s). Runs in CI job `unit` with the coverage gate.
  Before this change these specs existed but **no CI job ran them**.
- **e2e** — cypress against the built `dist/` (26 specs, 355 tests). Runs in CI job `test`,
  split across 3 parallel shards by `scripts/cypress-shard.mjs` (every spec lands in exactly one
  shard; new specs are picked up automatically).

| Metric | Before | After |
|---|---|---|
| CI PR wall-clock — critical path (warm / cold) | 3m16s (`test` job, single cypress run) | ~1m40s warm (1m38s–1m52s, slowest shard) / 1m42s cold — 3 e2e shards ‖ unit |
| Main release build (warm / cold) | — / 4m31s (test 3m30s → build-push 51s → bump 6s; docker cache cold after a 16-day release gap) | ≈ 1m40s tests → build-push → bump (≈ 2m40s total, est.); gated on unit + all e2e shards; nightly warms `scope=web` |
| CI acceptance test job (warm / cold) | e2e 3m16s (cypress step 2m53s); unit: not run | e2e shards 83–112s warm / 97–102s cold (npm ci 13s → 3–5s with the cypress-binary cache); unit 16–25s |
| Local full-suite runtime (uptime load) | unit 2.3s (load 28) · e2e not run locally | unchanged (no test changes) |
| Docker build (warm / cold) | — / 28s (19s of it is the gha cache export) | npm cache mount added; warm via nightly |
| Tests in acceptance / slow tier | 355 e2e (+45 unit not in CI) / 0 | 400 / 0 |
| Async modules / total | n/a (vitest + cypress; vitest files run in parallel workers by default) | n/a |
| Coverage — acceptance pass (unit, lines, whole `src/ scripts/ bin/` tree) | not measured | 21.14% |
| Coverage — full pass | not measured | same as acceptance (no slow tier); e2e is not instrumented |
| Coverage gate | — | 16% lines (`vite.config.ts` → `test.coverage.thresholds.lines`) |

Coverage is measured over the whole shipped tree (`src/**`, `scripts/**`, `bin/**`), not just the
files unit specs import — so the number is honest. Most of `src/lit`, `src/reading`, `src/extract`,
`src/md` is exercised only by cypress, which is not instrumented. Unit-imported files alone sit at
~68% lines.

## Caching status
- GitHub Actions: deps (npm via setup-node) ✅ · build n/a (vite build ~1s) · npm ✅ · cypress binary ✅ (new `~/.cache/Cypress` cache) · .next/cache n/a · PLT n/a · develop-ref seeding ✅ (new `push: develop`)
- Docker: buildx gha cache ✅ (`scope=web`, log-verified on the 2026-10-07 release — but it imported nothing: cold after a 16-day gap) · cache mounts ✅ (npm, new) · .dockerignore ✅ · release-cache warmer ✅ (new `nightly.yml` → `warm-docker-cache`)

## Slow tests (tier: nightly)
None — every test stays in acceptance. Heaviest e2e specs (CI seconds): `spec-pages` 20s,
`site` 12s, `sem-reader` 12s, `sem-source` 9s, `sem-table` 9s.

| Test | Time | Why slow | Fix idea |
|---|---|---|---|

## Test debt
| Item | Kind | Notes |
|---|---|---|
| `src/lit`, `src/reading`, `src/extract`, `src/md`, `src/shared` | coverage gap | Covered only by cypress e2e (uninstrumented). Either instrument cypress (`@cypress/code-coverage` + istanbul in the build) or grow vitest/happy-dom unit specs, then ratchet the 16% gate. |
| Shard weights in `scripts/cypress-shard.mjs` | maintenance | Hand-measured from one CI run; a stale weight only unbalances shards, never drops a spec. Re-measure when a spec grows. |
| ~2.5s browser relaunch per cypress spec | slow | 26 specs × ~2.5s ≈ 1 min of pure overhead in the unsharded run. `experimentalRunAllSpecs`/merging tiny specs would cut it; not done (test-structure change). |

## Nightly
`.github/workflows/nightly.yml` — cron `17 7 * * *` + `workflow_dispatch`, on `main`:
`full-suite` (unit + coverage report, unsharded cypress) and `warm-docker-cache` (build-only,
`push: false`, same `scope=web` as release `build-push`). Scheduled workflows run from the default
branch, so it activates once this reaches `main` with the next release.

## Release gating
`build-push` (image push → `bump-chart` → ArgoCD) now `needs: [unit, test]` — the unit tier and all
three e2e shards. Before, only the single e2e job gated it and the unit specs never ran.
`build-push` stays `if: push && refs/heads/main`; `develop` pushes run tests only.
