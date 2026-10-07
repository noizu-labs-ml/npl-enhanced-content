---
id: US-104
title: "Make --strict-budget the CI default"
slug: strict-budget-ci-default
personas: [P-005]
epic: "E1 Hygiene & Release Integrity"
priority: should-have
complexity: low
tags: [ci, budgets]
---

# US-104: Make --strict-budget the CI Default

## User Story

**As a** spec steward
**I want to** the size-budget check to gate CI by default, not require a flag
**So that** a bundle-size regression fails the build instead of being noticed later.

## Acceptance Criteria

- **Given** a build that exceeds any artifact budget (e.g. fallback 14 KB)
  **When** CI runs
  **Then** the budget step fails and names the offending artifact.
- **Given** a deliberate budget raise
  **When** it lands
  **Then** it goes through ROADMAP.md's budget section and `scripts/build.mjs` together,
  per the recorded guardrail.

## Notes

The budgets are already enforced by `npm run build:strict`; this story makes strict the
default lane so the flag cannot be forgotten. In flight on the 2026-10-07 hygiene thread.
