/**
 * SemText — reading bundle entry point (`dist/semtext-reading.js`,
 * global `SemTextReading`).
 *
 * The prose-reading behaviours that would not fit the fallback core's
 * 12 KB budget: sem-code chrome, sem-references previews and backlinks,
 * glossary-mode sem-properties previews, and (R/W2) the sem-reader chrome
 * and sem-table sort/filter. Same rules as the core: no Lit,
 * classic IIFE, no fetch, runs standalone in a file:// document, marks
 * what it wired with `data-sem-fallback`. `<!-- sem:inline reading -->`
 * inlines it (scripts/build-standalone.mjs).
 *
 * TIER HANDOFF. An element that already carries `data-sem-upgraded` is
 * skipped here: the Lit wrapper (src/lit/sem-code.ts etc.) imports the
 * same per-element enhance function and calls it itself. The per-element
 * functions are idempotent on DOM state, not on a marker, so either
 * script may run first.
 *
 * SIZE BUDGET: 14 KB minified (ROADMAP R/W2: 8 KB in W1, raised for
 * sem-reader + sem-table); printed by scripts/build.mjs.
 */

import { CODE, enhanceCodeElement } from './code.js';
import { REFERENCES, enhanceReferencesElement } from './references.js';
import { PROPERTIES, enhanceGlossaryElement } from './glossary.js';
import { READER, enhanceReaderElement, disposeReaderElement } from './reader.js';
import { TABLE, enhanceTableElement } from './table.js';

declare global {
  interface Window {
    __semJsOff?: boolean;
  }
}

const upgraded = (el: Element): boolean => el.hasAttribute('data-sem-upgraded');

export function enhanceCode(scope: ParentNode): void {
  scope.querySelectorAll(CODE).forEach((el) => {
    if (upgraded(el)) return;
    enhanceCodeElement(el);
    if (el.querySelector(':scope > .sem-code-chrome')) el.setAttribute('data-sem-fallback', '');
  });
}

export function enhanceReferences(scope: ParentNode): void {
  scope.querySelectorAll(REFERENCES).forEach((el) => {
    if (upgraded(el)) return;
    enhanceReferencesElement(el);
    el.setAttribute('data-sem-fallback', '');
  });
}

export function enhanceGlossary(scope: ParentNode): void {
  scope.querySelectorAll(PROPERTIES).forEach((el) => {
    if (upgraded(el)) return;
    if (enhanceGlossaryElement(el)) el.setAttribute('data-sem-fallback', '');
  });
}

export function enhanceTable(scope: ParentNode): void {
  scope.querySelectorAll(TABLE).forEach((el) => {
    if (upgraded(el)) return;
    enhanceTableElement(el);
    if (el.querySelector(':scope > .sem-table-chrome')) el.setAttribute('data-sem-fallback', '');
  });
}

/** The reader runs LAST: its outline reads the headings other handlers leave alone. */
export function enhanceReader(scope: ParentNode): void {
  scope.querySelectorAll(READER).forEach((el) => {
    if (upgraded(el)) return;
    enhanceReaderElement(el);
    if (el.querySelector(':scope > .sem-reader-chrome')) el.setAttribute('data-sem-fallback', '');
  });
}

export const handlers = [enhanceCode, enhanceReferences, enhanceGlossary, enhanceTable, enhanceReader];

/** Run every reading handler over a scope. */
export function enhance(scope: ParentNode = document): void {
  if (scope === document) document.documentElement.setAttribute('data-sem-fallback', '');
  for (const handler of handlers) handler(scope);
}

export { enhanceCodeElement, enhanceReferencesElement, enhanceGlossaryElement, enhanceTableElement, enhanceReaderElement, disposeReaderElement };

function init(): void {
  if (typeof window !== 'undefined' && window.__semJsOff) return;
  enhance(document);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}
