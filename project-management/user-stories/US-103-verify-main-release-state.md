---
id: US-103
title: "Verify remote main release state and codify release policy"
slug: verify-main-release-state
personas: [P-005]
epic: "E1 Hygiene & Release Integrity"
priority: must-have
complexity: low
tags: [hygiene, release, process]
---

# US-103: Verify Remote main Release State and Codify Release Policy

## User Story

**As a** spec steward
**I want to** verification that remote `main` reflects the real release path, with the policy written down
**So that** release state is a checked fact, not a hope, and nobody re-learns the policy by archaeology.

## Acceptance Criteria

- **Given** remote `main`
  **When** the release state is checked (fetch; #31/#33 merge commits)
  **Then** the verified result is recorded (repo finding F3: local main is a stub;
  remote state unverified).
- **Given** a contributor reading CONTRIBUTING
  **When** they look for the release policy
  **Then** the develop→main release path is documented there.

## Notes

In flight on the 2026-10-07 hygiene thread.
