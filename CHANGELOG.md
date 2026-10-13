# Changelog — SemText

## 2026-10-13

- feat(lit): `sem-quota-meter` — rolling-usage meter component (used/limit
  clamped to [0,limit], 75%/90% colour tiers via `--sem-quota-meter-*`
  tokens, optional `resets-at` relative line on a per-minute timer cleared
  at disconnect, `role="meter"` ARIA, no credential access). Unit spec
  `test/unit/quota-meter.test.ts` (11 tests). Bundle +2.4 KB raw / +0.7 KB
  gzip (72.3 KB against the 96 KB budget). Branch `feat/lit-quota-meter`.
