# Schema — `npl-intent`

Display-only render of an NPL intent block: goal, scope, outcomes and an
assumptions grid. Lit `NplIntent` (`src/lit/npl/npl-intent.ts`); this file
is the normative source of the BDD spec `test/unit/npl-intent.test.ts`.

## Authoring form

```html
<npl-intent id="launch" kind="initiative">
  <npl-intent-overview>Ship the fleet dashboard to stage.</npl-intent-overview>
  <npl-intent-scope>Metrics only; no alerting yet.</npl-intent-scope>
  <npl-intent-outcomes>
    <ul><li>One pane per service</li></ul>
  </npl-intent-outcomes>
  <npl-intent-assumptions>
    <npl-intent-assumption confidence="high">SigNoz keeps serving uptime queries.</npl-intent-assumption>
    <npl-intent-assumption data-confidence="medium">The chart repo stays ArgoCD-watched.</npl-intent-assumption>
  </npl-intent-assumptions>
</npl-intent>
```

Class-form alias (conventions Appendix A, npl namespace): every part has
both spellings — `npl-intent-assumptions` / `.npl-intent-assumptions` etc.
— with the `data-*` form winning on parameters, same dual-form contract
as the sem-* tier.

Children, in order: `npl-intent-overview` (the goal), `npl-intent-scope`,
`npl-intent-outcomes`, `npl-intent-assumptions` (the grid). The grid holds
rows `npl-intent-assumption`, each carrying its statement as authored text
plus an optional parameter:

- `confidence`: string — default `—`. Rendered into the grid's second
  column; either spelling, `data-confidence` wins.

`id`, `kind`, `tags` per the global attribute catalog — no bullet needed;
the component declares no own parameters.

## Rendered form

- Enhanced: `<npl-intent>` itself (Lit `NplIntent` — light DOM, no shadow
  root; content stays searchable/copyable). Each present section gets one
  generated label span `.npl-intent-label` as its first child — "Goal",
  "Scope", "Outcomes", "Assumptions". The assumptions rows are rendered
  as a table `.npl-intent-assumptions-table` inside the grid: header row
  `Assumption` / `Confidence`, then one row per authored
  `npl-intent-assumption` — statement text in `.npl-intent-assumption-text`,
  confidence in `.npl-intent-assumption-confidence`. The rows the author
  wrote are replaced by their table rows; every other child is untouched.
  A block with none of the four section children gets no chrome.
- JS-off: block boxes from the npl section of `themes/_vocabulary.css`
  (`npl-intent, .npl-intent { display: block; }` and one line per part
  tag). Nothing hidden, nothing generated — the block reads as authored
  prose, the grid as a list of assumption lines.

## Events

(None — display-only.)
