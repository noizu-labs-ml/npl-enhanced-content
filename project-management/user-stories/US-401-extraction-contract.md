---
id: US-401
title: "Publish the extraction contract with invariant evidence"
slug: extraction-contract
personas: [P-002]
epic: "E4 Agent Surface"
priority: must-have
complexity: medium
tags: [agent, extraction, spec]
---

# US-401: Publish the Extraction Contract

## User Story

**As an** LLM agent operator
**I want to** the extraction contract documented in spec §8 with the round-trip invariant stated as a guarantee
**So that** my agent can rely on extraction behavior instead of reverse-engineering it.

## Acceptance Criteria

- **Given** spec §8 (extraction)
  **When** the contract section ships
  **Then** the invariant E(D) = E(R(D)) = E(I(R(D))) is stated normatively, with the
  existing test suite (`test/e2e/extraction.cy.js`) cited as evidence.
- **Given** an extraction rule that changes
  **When** a spec version bumps
  **Then** the contract section changes with it and the suite still proves the stated
  invariant.

## Notes

The invariant is already tested (UC-2); it is just not published as a promise. This is
documentation of a real guarantee — the cheapest high-value story in E4.
