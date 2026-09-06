/**
 * npl-enhanced-content — fallback tier entry point.
 *
 * This module and everything it imports must stay free of Lit. It ships as
 * `dist/npl-fallback.js`, a classic IIFE script that runs standalone in a
 * document that never loads the component bundle: the fallback tier is what
 * makes a portable `file://` document interactive with zero network.
 *
 * TIER HANDOFF. Each handler marks what it wired with `data-sem-fallback`.
 * When the Lit bundle is also present, `NplElement.connectedCallback` claims
 * `data-sem-upgraded` and clears that marker, and every hide-rule in the
 * theme CSS is gated on one marker or the other — so with neither script
 * running, nothing is hidden and the document reads as plain prose.
 *
 * SIZE BUDGET: 8 KB minified. The PRD asks for 2-4 KB across the nine
 * elements; the built artifact measures 7.1 KB minified and 2.6 KB gzipped,
 * so the target is met on the wire but NOT in raw bytes — and raw bytes are
 * what a file:// document actually carries, since nothing gzips an inlined
 * <script>. The budget is therefore stated at the honest raw number rather
 * than quietly kept at 4 KB. Most of the weight is irreducible string
 * literals: markup templates, class names and warning text, which minify to
 * roughly themselves. `scripts/build.mjs` prints measured size against this
 * constant on every build; raise it deliberately, never silently.
 */

import { enhanceFacts } from './facts.js';
import { enhanceDetails } from './details.js';
import { enhanceNote } from './note.js';
import { enhanceProperties } from './properties.js';
import { enhanceViews } from './views.js';
import { enhanceReveal } from './reveal.js';
import { enhanceProgress } from './progress.js';

declare global {
  interface Window {
    /** Test hook: simulate a JS-off document without stripping the script. */
    __nplJsOff?: boolean;
  }
}

export type FallbackHandler = (scope: ParentNode) => void;

/**
 * Registry order is the original inline handler's order and is load-bearing:
 * `enhanceDetails` rewrites `.npl-highlight` nodes that later handlers must
 * not see twice, and `enhanceReveal` moves `.npl-reveal` children into a
 * `<details>` after `enhanceProgress`'s targets have been located.
 */
export const handlers: FallbackHandler[] = [
  enhanceFacts,
  enhanceDetails,
  enhanceNote,
  enhanceProperties,
  enhanceViews,
  enhanceReveal,
  enhanceProgress,
];

/** Run every handler over a scope. Exported so a host can re-run on new DOM. */
export function enhance(scope: ParentNode = document): void {
  for (const handler of handlers) handler(scope);
}

export {
  enhanceFacts,
  enhanceDetails,
  enhanceNote,
  enhanceProperties,
  enhanceViews,
  enhanceReveal,
  enhanceProgress,
};

function init(): void {
  if (typeof window !== 'undefined' && window.__nplJsOff) return;
  enhance(document);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}
