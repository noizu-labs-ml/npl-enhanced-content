---
id: US-301
title: "semtext-validate CLI with file:line errors and CI exit codes"
slug: validate-cli
personas: [P-001, P-008]
epic: "E3 Authoring & Validation"
priority: must-have
complexity: high
tags: [validation, cli, adoption]
---

# US-301: semtext-validate CLI

## User Story

**As a** doc author
**I want to** a `semtext-validate` CLI that schema-checks SemText documents and reports errors with file:line
**So that** I can know a document is valid v0.5 before anyone reads it.

## Acceptance Criteria

- **Given** a document with a vocabulary error (unknown element, bad `view-as`, malformed
  nesting)
  **When** `semtext-validate doc.xhtml` runs
  **Then** each error reports file:line and exits non-zero.
- **Given** a valid document
  **When** validation runs
  **Then** it exits 0 with a summary of what was checked (elements, schemas consulted).
- **Given** CI wiring (UC-8)
  **When** validation runs over a corpus
  **Then** exit codes are CI-usable without parsing output.

## Notes

The adoption gate (repo finding F5, High): today no tool answers "is this valid?".
In flight on the 2026-10-07 validation thread (schema + BDD-first per invariant 5).
