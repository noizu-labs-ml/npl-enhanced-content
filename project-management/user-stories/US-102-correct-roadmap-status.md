---
id: US-102
title: "Correct ROADMAP status column and add status-as-of line"
slug: correct-roadmap-status
personas: [P-005]
epic: "E1 Hygiene & Release Integrity"
priority: must-have
complexity: low
tags: [hygiene, docs]
---

# US-102: Correct ROADMAP Status Column

## User Story

**As a** spec steward
**I want to** ROADMAP.md to state the true current status (W0–W2.2 merged, v0.5 shipped)
**So that** contributors and evaluators are not misled about what has landed.

## Acceptance Criteria

- **Given** the current ROADMAP.md
  **When** a reader checks milestone/wave statuses
  **Then** no row claims "in PR" for work that is merged; a "status as of <date>" line
  names the checking date and develop SHA.
- **Given** a future wave exit
  **When** this file is updated
  **Then** the review-cadence rule (update at every exit) still governs.

## Notes

Repo finding F2 — the defect was the stale **status snapshot line** (dated 2026-09-22,
naming PR #30 as open after it merged), not the R-track rows, which were already
accurate. Being executed by the very PR that introduces the project-management tree
(2026-10-07) — the ROADMAP v2 restructure is this story's implementation.
