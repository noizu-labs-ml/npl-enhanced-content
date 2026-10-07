---
id: US-303
title: "GitHub Action wrapping the validator for corpus CI"
slug: validator-github-action
personas: [P-008, P-001]
epic: "E3 Authoring & Validation"
priority: should-have
complexity: medium
tags: [validation, ci, adoption]
---

# US-303: Validator GitHub Action

## User Story

**As a** content platform owner
**I want to** a packaged GitHub Action that runs `semtext-validate` over a docs corpus
**So that** adopting SemText in CI is a workflow file, not a build-system project.

## Acceptance Criteria

- **Given** a repository with SemText documents
  **When** the action runs on PR
  **Then** invalid documents fail with file:line annotations.
- **Given** the action inputs
  **When** configured with a glob and a spec version
  **Then** it validates that corpus against that published schema version (US-302's
  versioned schemas).

## Notes

Depends on US-301. This is what makes UC-8 (platform validates a corpus in CI) real —
the moment adoption stops requiring trust.
