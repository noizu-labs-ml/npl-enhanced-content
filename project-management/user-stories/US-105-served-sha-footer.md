---
id: US-105
title: "Show served commit SHA in live-site footer"
slug: served-sha-footer
personas: [P-005, P-008]
epic: "E1 Hygiene & Release Integrity"
priority: should-have
complexity: low
tags: [hygiene, dogfooding, provenance]
---

# US-105: Show Served Commit SHA in Live-Site Footer

## User Story

**As a** spec steward
**I want to** the live site footer to display the commit SHA that was served
**So that** anyone can verify which build they are looking at — including during a P-008 evaluation.

## Acceptance Criteria

- **Given** the deployed site
  **When** any page renders its footer
  **Then** the served commit SHA is visible (build-injected, same mechanism as US-101's
  version stamp).
- **Given** a fresh deploy
  **When** the SHA is compared to the release ref
  **Then** they match (a stale-image deploy is detectable on sight).

## Notes

Complements US-101: version + provenance in one place. In flight on the 2026-10-07
hygiene thread.
