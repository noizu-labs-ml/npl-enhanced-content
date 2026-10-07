---
id: US-306
title: "Editor LSP: completion + live validation for SemText"
slug: editor-lsp
personas: [P-001]
epic: "E3 Authoring & Validation"
priority: could-have
complexity: high
tags: [authoring, tooling, lsp]
---

# US-306: Editor LSP for SemText

## User Story

**As a** doc author
**I want to** editor completion and inline validation for the vocabulary
**So that** mistakes surface as I type, not at the next CI run.

## Acceptance Criteria

- **Given** an editor speaking LSP
  **When** the author types `<sem-`
  **Then** the vocabulary's elements and their attributes are offered with docs.
- **Given** an invalid attribute value
  **When** the document is open
  **Then** the diagnostics match `semtext-validate`'s verdicts (same schemas, US-302).

## Notes

Deliberately `could-have`: the CLI validator (US-301) is the gate; the LSP is the same
engine moved into the editor. Do not build before US-301/302 exist — it would fork the
vocabulary encoding.
