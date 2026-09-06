# Schema — extraction (DOM → records → annotated text)

Contract per conventions.md v0.4 §8 ("Machine-readability contract"). BDD
source of truth for `cypress/e2e/extraction.cy.js`. Reference
implementation: `src/extract/records.ts`. Changes here precede spec changes
precede code.

This is the reference recipe conventions.md §8 has promised since v0.1. It is
normative, not illustrative: the per-element "Machine contract" sections in
`syntax/schema/*.md` say *what* each element means; this file says what a
consumer actually receives, in what order, and what it is guaranteed never to
see.

## 1. Scope decision (recorded)

Extraction is defined over the **authored document**, not the rendered one.

Three readings were available:

1. **Adopted — authored projection.** Extraction reads only authored
   semantics. Generated chrome, runtime state classes, and mutable
   presentation attributes are invisible to it. The output is therefore a
   function of the source markup alone.
2. *Rejected — rendered projection.* Extracting what the reader currently
   sees would make the output depend on JS availability, `view-as`, and
   session history. Every downstream contract (citation, audience, recall
   keys) would then be unstable.
3. *Rejected — dual projection.* Shipping both an authored and a rendered
   extractor doubles the contract surface and invites consumers to compare
   two things that are not comparable. If a rendered probe is ever needed it
   will be specified separately and named so no one mistakes it for this.

Consequence, stated plainly: **extraction is not a screen reader.** It is the
machine-facing reading of the file, and the file is the same file whether or
not a browser ran its scripts.

## 2. Record shape

Extraction returns a flat array of records in document order.

```ts
interface NplRecord {
  type: string;                    // 'npl-fact', or a tag name for a minted record
  id: string | null;               // citation token
  kind: string | null;             // data-kind / kind
  tags: string[];                  // data-tags / tags, comma-split, [] when absent
  audience: string | null;         // forward-declared (§7); null in v0.4
  parent: number | null;           // sourceOrder of the enclosing record
  fields: Record<string, unknown>; // per-type payload (§4)
  text: string;                    // one-line human rendering of this record
  sourceOrder: number;             // 0-based; equals the array index
}
```

- `type` is normalized across authoring forms. `<npl-fact>` (v0.3) and
  `div.npl-fact` (v0.4) both yield `npl-fact`; `<agent>` yields `npl-agent`.
- `parent` carries containment. A fact inside `#auth-facts` cites as
  `#auth-facts/f-jwt`, which the consumer composes from the fact's `id` and
  its parent record's `id`. Containment is a number, not an id, because
  containers are not required to carry one — the flashcards deck in
  `demo/index.html` does not.
- `text` is always present and always a single line: whitespace runs are
  collapsed to one space and the result is trimmed. Container records carry
  `text: ""`; their content lives in their children.
- `fields` is the only place a type-specific key may appear. Nothing is
  invented: every key below is populated from something an element actually
  carries.

**Not in the shape, deliberately:** `view`. See §5.

## 3. Emission rules

1. **One record per vocabulary element**, in document order. Fourteen element
   types mint records: `npl-agent`, `npl-note`, `npl-facts`, `npl-fact`,
   `npl-details`, `npl-detail`, `npl-procedure`, `npl-step`,
   `npl-properties`, `npl-property`, `npl-views`, `npl-view`, `npl-reveal`,
   `npl-progress`.
2. **Parts are not records.** `.npl-statement`, `.npl-conclusion`,
   `.npl-distractor`, `.npl-highlight`, `.npl-note-body`, and the
   `.npl-agent-*` children are fields of their owning record, never entries
   of their own.
3. **The root wrapper is scope, not content.** `.npl-enhanced-document`
   delimits extraction and mints nothing. Given a `Document`, extraction
   scopes to the wrapper when present, otherwise to `<body>`.
4. **Generated nodes are invisible.** The following are skipped entirely,
   contributing neither records nor text: `.npl-facts-chrome`,
   `.npl-facts-meter`, `.npl-quiz-options`, `.npl-views-tabs`,
   `.npl-note-summary`, `.npl-progress-track`, `.npl-progress-fill`, and the
   `<summary>` the reveal fallback synthesizes inside its `<details>`. An
   authored `<details>`/`<summary>` elsewhere in the document is ordinary
   content and is not skipped.
5. **Extraction never writes.** No attribute is set or removed, no node is
   inserted, moved, or deleted, no event is dispatched. Running extraction
   against a live interactive page leaves that page byte-identical.
6. **Both authoring forms are accepted.** Parameters are read as
   `data-<name>` first (v0.4 class form), then as a bare `<name>` attribute
   (v0.3 custom-element form). The repo is mid-migration; a consumer should
   not have to know which wave a document came from.

## 4. Per-element field mapping

### `npl-agent`

`fields: { name, bio, instructions }` from `.npl-agent-name` / `<name>`,
`.npl-agent-bio` / `<bio>`, `.npl-agent-instructions` / `<instructions>`.
Missing children yield `""`. `text` = `name`.

### `npl-note`

`fields: { variant }` — `data-variant` / `variant`, defaulting to `info` per
`syntax/schema/npl-note.md`. `text` = the note body: `.npl-note-body` when
present, otherwise the note's own prose.

`collapsed` is **not** extracted. It is initial disclosure state, and the
fallback removes the attribute when the reader opens the note (see §5).

### `npl-facts` / `npl-fact`

`npl-facts` is a container: `fields: {}`, `text: ""`, carrying `id`, `kind`,
`tags` for citation and grouping.

`npl-fact` yields
`fields: { statement, conclusion, distractors: string[], highlights: string[] }`.

- `statement` / `conclusion` from `.npl-statement` / `<statement>` and
  `.npl-conclusion` / `<conclusion>`.
- When neither child is present, the compact form applies: the fact's own
  text is split on the first `::`, left → `statement`, right → `conclusion`.
  With no `::`, the whole text is the `statement` and `conclusion` is `""`.
  Children always win over the compact form (conventions §3).
- `distractors` are extracted **as distractors and never as claims**, which
  is exactly what `syntax/schema/npl-facts.md` requires: they appear in their
  own array, never in `text`, never as a `conclusion`.
- `highlights` are the fact's recall prompts, in either the authored
  (`.npl-highlight`, `<highlight>`) or occluded (`.npl-occluded`) form.
- `text` = `statement :: conclusion` when both exist, otherwise `statement`.

Implicit distractors — the sibling conclusions the quiz view borrows when a
fact has no `.npl-distractor` child — are a **rendering** decision and are not
extracted. They are already in the output as other facts' conclusions.

### `npl-details` / `npl-detail`

`npl-details` is a container: `fields: {}`, `text: ""`.

`npl-detail` yields `fields: { highlights: string[] }` and `text` = the
passage prose. This is the `{container, passage, cloze}` shape
`syntax/schema/npl-details.md` promises, spelled as `parent`, `text`, and
`highlights`.

A highlight is reported identically whether it is authored
(`span.npl-highlight`), occluded by the quiz view (`span.npl-occluded`), or
revealed (`span.npl-highlight.npl-revealed`). The occlusion is a mask over
text that is still in the DOM; extraction reads through it.

### `npl-procedure` / `npl-step`

`npl-procedure` is a container: `fields: {}`, `text: ""`, typically carrying
`kind` (`runbook`, `recipe`, …).

`npl-step` yields `fields: { status, ordinal }`.

- `status` = `data-status` / `status`, defaulting to `todo`.
- `ordinal` is **positional and 1-based**, counted among sibling steps. There
  is deliberately no ordinal attribute: `syntax/schema/npl-procedure.md`
  makes DOM order the execution order, and extraction is where that becomes a
  number a consumer can use.
- Status sugar (`✅`, `→`, `❌`) in step text is display-only and is not
  parsed; the attribute is canonical.

"A procedure with any blocked step is itself blocked" stays derivable, not
extracted — the consumer computes it from the step records.

### `npl-properties` / `npl-property`

`npl-properties` is a container: `fields: {}`, `text: ""`.

`npl-property` yields `fields: { key, value }`; `text` = `key :: value`.

- `key` = `data-key` / `key`; `value` = the property's own text.
- When `data-key` is absent, the compact `term :: value` sugar is parsed.
  `data-key` wins when both are present. **Extraction parses `::` here even
  though the v0.4 fallback does not** — conventions §3 declares the sugar
  legal, and a machine reader that dropped the key would silently lose the
  subject of the assertion. The divergence is intentional and one-directional
  (extraction is more permissive than render).
- Duplicate keys within one container are an authoring error. Extraction
  reports both records faithfully and does not deduplicate; diagnosing the
  duplicate is the fallback's job (console warning) and the linter's.

### `npl-views` / `npl-view`

`npl-views` is a container: `fields: {}`, `text: ""`, carrying the `id` that
deep links cite.

`npl-view` yields `fields: { name, index }`; `text` = the view's own prose.

- `name` = `data-name` / `name`; `index` is 0-based among sibling views.
- Citation form `#<views-id>/<view-name>` is composed from the parent
  record's `id` and this record's `name`.
- `data-active` is **not** extracted. See §5.

### `npl-reveal`

`fields: { summary, summarySource }`; `text` = the reveal body.

- `summary` = `data-summary` / `summary` when authored
  (`summarySource: "authored"`).
- Otherwise it is **derived** (`summarySource: "derived"`) from the body:
  the leading run of the normalized body text, at most 60 characters, cut at
  the last word boundary, with no ellipsis. The derivation is a pure function
  of the body, which is what lets it survive the fallback's `<details>`
  rewrite unchanged.
- The body is read from `.npl-reveal-body` when the fallback has wrapped the
  reveal, and from the element itself otherwise. Both yield the same text.
- `collapsed` is not extracted (§5).

**Recorded divergence.** The v0.4 fallback derives its `<summary>` as the
first eight words plus `" …"`. `syntax/schema/npl-reveal.md` specifies "first
line of body, max 60 chars". The two rules disagree. Extraction implements
the schema's rule; the fallback's string is a display artifact and is skipped
outright. Reconciling the fallback to the schema is tracked separately —
extraction does not wait on it.

### `npl-progress`

`fields: { value, rawValue, label }`, plus `status` when `data-status` is
present; `text` = `label :: N%` with `N` the rounded clamped percentage.

- `value` is the clamped number in `[0,1]`; a non-numeric or absent attribute
  clamps to `0`.
- `rawValue` is the **authored attribute string, untouched**.
  `syntax/schema/npl-progress.md` is explicit that render clamps while the
  attribute stays as written, so a machine reader must be able to see
  `1.4` and know the author asserted something out of range.
- `text` is **derived from the attributes, never read from the DOM**. The
  fallback overwrites the element's text content when it builds the meter,
  so reading `textContent` here would break the §5 invariant outright. This
  is the one record whose text is not a reading of the element's children,
  and the reason is recorded here so no one "fixes" it later.

### Minted plain-HTML records

Plain semantic HTML carrying an npl global qualifier is extracted as a record
too: `type` is the lowercased tag name (`figure`, `table`, `blockquote`,
`h1`, …), `fields: {}`, `text` = the element's own prose, with `id`, `kind`,
and `tags` read as usual.

`kind` or `tags` mints. `id` alone does not — ids are ubiquitous anchors, not
semantic claims, and minting on `id` would fill the output with navigation
targets.

This is the **minting test** in operational form: if plain HTML plus the
global attribute catalog already carries the meaning, we do not mint a new
element for it. `<figure kind="diagram">` is a record without
`<npl-figure>` ever existing. A new element earns its place only when it
needs fields, interaction, or degradation behavior that attributes on plain
HTML cannot express.

## 5. The central invariant

> **Extraction output is identical whether or not JS ran, and identical
> regardless of `view-as`.**

Formally, for any document `D`, where `E` is extraction, `R(D)` is `D` after
the fallback handler (or the Lit upgrade) has run, `I(D)` is `D` after any
sequence of user interactions the vocabulary supports, and `V(D, m)` is `D`
with any container's `view-as` set to any legal mode `m`:

```
E(D) = E(R(D)) = E(I(R(D))) = E(V(D, m)) = E(V(R(D), m))
```

Equality is deep equality of the record array, including `sourceOrder`.

This is a testable claim, and `cypress/e2e/extraction.cy.js` is the test. It
is the executable form of the format's central promise: one file, three
consumers, and the machine consumer does not get a degraded reading of what
the human consumer saw.

Three rules make it hold, and each is a rule about what extraction refuses to
look at.

**(a) Generated chrome is skipped** (§3.4). Everything the fallback adds is
enumerated and excluded by class.

**(b) Runtime state classes are ignored.** `.npl-current`, `.npl-flipped`,
`.npl-answered`, `.npl-wrong-pick`, `.npl-revealed`, `data-npl-fallback`,
`data-npl-upgraded`, `data-answered` are session facts, not document facts.
Extraction matches on vocabulary classes only.

**(c) Mutable presentation attributes are excluded from the record.** Three
attributes describe initial *display* state and are rewritten at runtime:

| Attribute | Who mutates it | Why it is excluded |
| :-- | :-- | :-- |
| `data-view-as` | author only (today) | Presentation parameter by definition (conventions §2: "identity unchanged"). Including it would make `E(V(D, m)) ≠ E(D)` by construction and contradict every schema's "`view-as` never changes extraction". |
| `data-active` | fallback normalizes it onto the first view; every tab click moves it | Reports which tab a reader is looking at. Not a property of the document. |
| `collapsed` | fallback removes it when the reader expands a note | Initial disclosure state. Not a property of the document. |

The cost is real and worth naming: a consumer cannot learn from extraction
which view an author intended to show first. That is correct. `data-active`
is a *state marker*, not a semantic claim, and it is not durable enough to
carry one — the fallback overwrites it before the reader touches anything. An
author who needs to mark a semantically primary perspective should say so
with a durable qualifier (`kind`, `tags`) on the view, which extraction does
report. This is a gap in the vocabulary, not a gap in extraction.

## 6. Annotated plain text

The record array renders to annotated plain text for terminal and LLM
pipelines — the deliverable conventions §8 names. The renderer is a pure
function of the records, so it inherits §5 unchanged.

Line form, indented by containment depth:

```
<type>[ (#id kind=… tags=a|b audience=…)][: text]
  <field>: <value>
```

Array-valued fields join with ` | `. Only fields that carry meaning a reader
would lose otherwise are emitted (a fact's distractors, a detail's
highlights, a step's status, a progress element's raw value, a reveal's
summary, a note's variant, an agent's bio and instructions, a view's name);
`text` already carries the rest.

## 7. Forward declaration — the audience qualifier

The next wave adds an `audience` qualifier to the global attribute catalog.
It is declared here now so that the record shape does not churn when it
lands:

- `audience` is **already a field on every record**, populated from
  `data-audience` / `audience`, `null` when absent. In v0.4 it is always
  `null`.
- **Audience never removes a record from canonical extraction.** Filtering by
  audience is a consumer operation performed on the extracted array, never a
  suppression performed during extraction. An extractor that dropped
  off-audience records would produce different output for different readers,
  which is the same failure mode as extracting the rendered document (§1).
- Audience contract rules stated in terms of "what extraction sees" therefore
  have a fixed referent: the full array, every record, `audience` carried as
  a qualifier on each.

The wave-1 audience spec may add rules about *inheritance* (does a record
inherit its container's audience?) and *conflict* (a record whose audience
contradicts its container's). Those are open; the field and the
never-suppress rule are not.

## 8. Worked example

Input:

```html
<div class="npl-enhanced-document">
  <h2 data-kind="section" data-tags="auth, tokens">Token handling</h2>
  <div class="npl-facts" id="auth-facts" data-view-as="quiz">
    <div class="npl-fact" id="f-jwt" data-kind="concept">
      <div class="npl-statement">JWTs rotate per session</div>
      <div class="npl-conclusion">Short-lived access; refresh issues a new pair.</div>
      <div class="npl-distractor">Store them in localStorage.</div>
    </div>
  </div>
  <div class="npl-progress" id="p-cov" data-value="1.4" data-label="coverage"></div>
</div>
```

Output:

```json
[
  { "type": "h2", "id": null, "kind": "section", "tags": ["auth", "tokens"],
    "audience": null, "parent": null, "fields": {},
    "text": "Token handling", "sourceOrder": 0 },

  { "type": "npl-facts", "id": "auth-facts", "kind": null, "tags": [],
    "audience": null, "parent": null, "fields": {},
    "text": "", "sourceOrder": 1 },

  { "type": "npl-fact", "id": "f-jwt", "kind": "concept", "tags": [],
    "audience": null, "parent": 1,
    "fields": {
      "statement": "JWTs rotate per session",
      "conclusion": "Short-lived access; refresh issues a new pair.",
      "distractors": ["Store them in localStorage."],
      "highlights": []
    },
    "text": "JWTs rotate per session :: Short-lived access; refresh issues a new pair.",
    "sourceOrder": 2 },

  { "type": "npl-progress", "id": "p-cov", "kind": null, "tags": [],
    "audience": null, "parent": null,
    "fields": { "value": 1, "rawValue": "1.4", "label": "coverage" },
    "text": "coverage :: 100%", "sourceOrder": 3 }
]
```

Rendered as annotated plain text:

```
h2 (kind=section tags=auth|tokens): Token handling
npl-facts (#auth-facts)
  npl-fact (#f-jwt kind=concept): JWTs rotate per session :: Short-lived access; refresh issues a new pair.
    distractors: Store them in localStorage.
npl-progress (#p-cov): coverage :: 100%
  rawValue: 1.4
```

Note what did not appear: `data-view-as="quiz"` (presentation), the
`.npl-quiz-options` the fallback would build (chrome), and the clamped-vs-raw
distinction collapsing (both `value` and `rawValue` are reported).

## 9. Machine contract

- Extraction is a **total, pure function** from a `Document` or root
  `Element` to `NplRecord[]`. It has no configuration, no I/O, and no
  dependencies.
- The array is ordered; `sourceOrder` is the index and is stable.
- Containment is a tree over `parent`; citation tokens compose from `id`
  along that tree.
- The invariant in §5 is the contract consumers may rely on. Any change that
  weakens it is a breaking change to the format, not to the library.
