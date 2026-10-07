---
id: US-402
title: "llms.txt plus per-document plain-text representation"
slug: llms-txt-plain-text
personas: [P-002, P-008]
epic: "E4 Agent Surface"
priority: must-have
complexity: medium
tags: [agent, extraction, site]
---

# US-402: llms.txt + Per-Document Plain Text

## User Story

**As an** LLM agent
**I want to** a site-level llms.txt and a plain-text representation linked from every served page
**So that** ingestion is cheap and lossless without a DOM walk.

## Acceptance Criteria

- **Given** the served site
  **When** `/llms.txt` is fetched
  **Then** it indexes the document set with links to plain-text forms.
- **Given** any served SemText page
  **When** its head/link layer renders
  **Then** a link to that document's plain-text representation is present, and the
  representation satisfies the extraction invariant (US-401).

## Notes

Plain text is exactly what the extraction tier already computes; this story *serves* it.
P-002's frustration ("undocumented extraction contract, no plain-text parity") resolves
here together with US-401.
