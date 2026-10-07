# arch/extraction — the extraction invariant

`spec/extraction.md` is the normative DOM → records → annotated-text contract
(BDD source of truth for `test/e2e/extraction*.cy.js`; reference
implementation `src/extract/records.ts`). The machine-readability clause it
implements is `spec/conventions.md` §8.

## The central invariant (spec/extraction.md §5)

```
E(D) = E(R(D)) = E(I(R(D)))
```

Extracting the authored document `D` yields exactly the same records as
extracting the reading bundle's enhanced version `R(D)` — or the full Lit
upgrades `I(R(D))`. Every interactive layer is **chrome**: reader shells,
popovers, backlinks, copy buttons, view-as mode switches, sort/filter state,
and runtime classes are invisible to extraction. Chrome mints nothing.

This holds because extraction is defined over the **authored projection**
(spec/extraction.md §1, decision recorded): it reads only authored semantics,
never rendered state. Output is a function of the source markup alone — a
guarantee consumers can rely on without knowing which tier served the page.

## Enforcement

- `test/e2e/extraction.cy.js` — per-element record shape and annotated text.
- `test/e2e/extraction-reading.cy.js` — the invariant scenarios: JS-off equals
  JS-on, every view-as mode, reader controls, copy/wrap/backlink, and **tag
  form equals class form** (both authoring spellings extract identically).
- `spec/extraction.md` §9 — the machine contract any change must not break.

Change order: `spec/extraction.md` → `spec/conventions.md` §8 →
`src/extract/` → e2e.
