---
id: P-006
name: "Accessibility-first Reader"
slug: accessibility-first-reader
archetype: "Screen-reader / keyboard-only / reduced-motion user auditing the affordances"
segment: edge-case
tags: [a11y, keyboard]
---

# P-006: Accessibility-first Reader

## Demographics

| Attribute | Value |
|-----------|-------|
| Age | any |
| Occupation | Engineer or technical reader using assistive technology |
| Location | Anywhere |
| Tech comfort | high; interacts through screen readers, keyboard, reduced-motion settings |

## Bio

A reader who experiences the document through assistive technology: a screen reader, a
keyboard with no pointer, an OS set to reduce motion. She is also, in this project's
context, an auditor — the W0 wave promised reading affordances, and she is the one who
can tell whether the promise survives contact with real assistive tech.

## Goals
- Operate every reader control (outline, focus, audience, theme, source toggle) from
  the keyboard, with visible focus and announced state.
- No surprise motion: transitions respect `prefers-reduced-motion` (W0 shipped a pass;
  reader transitions in W3 must inherit it).
- Content announced in document order, with sort/disclosure state conveyed.

## Frustrations
- Reading affordances that are mouse-shaped: toggles reachable only by click, focus
  lost after a view switch.
- `sem-reader` controls that look like buttons but are not; state changes that are
  silent to a screen reader.

## Behaviors
- Tab-walks a new page before reading it.
- Trusts semantic HTML and ARIA state over visual styling.

## Job to Be Done
> "When I read a SemText document with assistive technology, I want every affordance
> operable and announced, so the reading experience works at my depth too."

## Relationship to Product

Edge-case persona anchoring E6's keyboard/print/reduced-motion stories (US-603–605) and
a stakeholder in W3's theme work (US-201, US-202). Her stories double as validation
questions: the repo has no assistive-tech user research, so these are hypotheses to
verify, not known-need items.

## Scenarios
- **Scenario 1: Keyboard pass** — she tab-walks a demo document: reader controls are
  reachable and operable, focus is visible, a view toggle announces its new state
  (US-603, US-605).
- **Scenario 2: Theme switch without motion** — she flips the reader to dark; the
  transition respects reduced motion and the switch itself is keyboard-reachable
  (US-201, US-202).
