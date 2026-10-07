---
id: US-403
title: "JSON-LD / schema.org output mode from extraction"
slug: json-ld-output
personas: [P-002]
epic: "E4 Agent Surface"
priority: should-have
complexity: medium
tags: [agent, extraction, seo]
---

# US-403: JSON-LD Output Mode from Extraction

## User Story

**As an** LLM agent (or search indexer)
**I want to** an extraction output mode that emits JSON-LD/schema.org
**So that** SemText documents plug into ecosystems that already speak structured data.

## Acceptance Criteria

- **Given** the extraction pipeline
  **When** the JSON-LD mode runs on a valid document
  **Then** the output is schema.org-valid for the mapped types and lossless against the
  extraction record (invariant holds for this serialization too).
- **Given** an unmapped element
  **When** serialization runs
  **Then** the mapping is explicit (documented skip or generic type) — never silent data
  loss.

## Notes

A serialization *of* the extraction record, not a second extractor — same invariant
evidence applies.
