---
id: US-604
title: "Print stylesheet per reading element"
slug: print-stylesheets
personas: [P-003, P-006]
epic: "E6 Accessibility & Degradation"
priority: should-have
complexity: medium
tags: [a11y, print, reading]
---

# US-604: Print Stylesheets per Reading Element

## User Story

**As a** human reader
**I want to** each reading element to have a considered print rendering
**So that** PDF/print export is a first-class output, not an accident of screen CSS.

## Acceptance Criteria

- **Given** the vocabulary's reading elements
  **When** a document is printed (or `beforeprint` fires)
  **Then** each element renders sensibly: reveals disclosed, views collapsed to their
  default, reader chrome suppressed, source fences not duplicated.
- **Given** W0's existing print stylesheet
  **When** elements added in W1–W2.2 are printed
  **Then** they inherit or extend it — no element ships print-blind.

## Notes

W0 shipped the initial print pass; this story closes the gap for everything since.
Also UC-6.
