/**
 * SemText — Markdown bundle entry point (`dist/semtext-md.js`, global
 * `SemTextMd`).
 *
 * Renders `sem-md` blocks (spec/schema/sem-md.md). Its own bundle rather
 * than part of the reading bundle so a document with no Markdown never
 * pays for the parser: same rules as the other vanilla tiers — no Lit,
 * classic IIFE, no fetch, runs standalone in a file:// document, marks what
 * it wired with `data-sem-fallback`. `<!-- sem:inline md -->` inlines it
 * (scripts/build-standalone.mjs).
 *
 * TIER HANDOFF. An element that already carries `data-sem-upgraded` is
 * skipped here: the Lit wrapper (src/lit/sem-md.ts) imports the same
 * enhance function and calls it itself. The function is idempotent on DOM
 * state (the chrome's presence), so either script may run first.
 *
 * SIZE BUDGET: 8 KB minified (ROADMAP R/W2.2); printed by scripts/build.mjs.
 */

import { MD, enhanceMdElement } from './element.js';

declare global {
  interface Window {
    __semJsOff?: boolean;
  }
}

declare global {
  interface Window {
    SemTextReading?: { enhanceCodeElement?: (el: Element) => void };
  }
}

/** The raw fence's copy / wrap chrome is sem-code's — borrowed from the
 *  reading bundle's global when that script is on the page. */
const fenceEnhancer = (): ((el: Element) => void) | undefined =>
  typeof window !== 'undefined' ? window.SemTextReading?.enhanceCodeElement : undefined;

export function enhanceMd(scope: ParentNode): void {
  const enhanceFence = fenceEnhancer();
  scope.querySelectorAll(MD).forEach((el) => {
    if (el.hasAttribute('data-sem-upgraded')) return;
    enhanceMdElement(el, enhanceFence);
    if (el.querySelector(':scope > .sem-md-chrome')) el.setAttribute('data-sem-fallback', '');
  });
}

/** Run the Markdown handler over a scope. */
export function enhance(scope: ParentNode = document): void {
  if (scope === document) document.documentElement.setAttribute('data-sem-fallback', '');
  enhanceMd(scope);
}

export { enhanceMdElement };
export { normalizeMd } from '../shared/mdsource.js';
export { parseBlocks, render } from './parse.js';

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
