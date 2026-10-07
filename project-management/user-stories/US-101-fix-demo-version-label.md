---
id: US-101
title: "Fix /demo/ version label to v0.5 via build-injected stamp"
slug: fix-demo-version-label
personas: [P-005, P-008]
epic: "E1 Hygiene & Release Integrity"
priority: must-have
complexity: low
tags: [hygiene, dogfooding, funnel]
---

# US-101: Fix /demo/ Version Label to v0.5

## User Story

**As a** spec steward
**I want to** the demo page's version label to read v0.5, stamped from the build rather than hard-coded
**So that** the public demo never lies about which spec version it exercises.

## Acceptance Criteria

- **Given** a fresh build of the site
  **When** `/demo/` renders
  **Then** the version stamp matches the package/spec version (v0.5), not a stale literal.
- **Given** the next version bump
  **When** the build runs
  **Then** the stamp updates without a source edit (no hard-coded string survives).

## Notes

Repo finding F1 (demo self-labels "v0.4 baseline" while spec/site are v0.5) — the first
broken promise a P-008 evaluation finds (UC-7). In flight on the 2026-10-07 hygiene
thread.
