---
id: US-305
title: "Best-effort md-to-sem converter flagging manual-pass items"
slug: md-to-sem-converter
personas: [P-001, P-008]
epic: "E3 Authoring & Validation"
priority: should-have
complexity: high
tags: [migration, adoption, md]
---

# US-305: Best-Effort Markdown-to-SemText Converter

## User Story

**As a** doc author with a Markdown corpus
**I want to** a converter that translates Markdown into SemText and flags what it could not translate
**So that** migration starts from a machine pass instead of a blank file.

## Acceptance Criteria

- **Given** a GFM document (the subset `sem-md` already parses: tables, headings, lists,
  code, inline marks)
  **When** converted
  **Then** the output is valid SemText per `semtext-validate` (US-301).
- **Given** content outside the best-effort envelope (admonitions, raw HTML, deep
  nesting)
  **When** conversion runs
  **Then** those ranges are flagged as manual-pass items, not silently mangled.
- **Given** the flagged output
  **When** the author finishes the manual passes
  **Then** the document validates clean.

## Notes

Direction matters: `sem-md` renders Markdown *inside* SemText; nothing converts Markdown
*into* the vocabulary (UC-9 gap). Reuses `src/md/parse.ts`'s GFM subset as the shared
front end.
