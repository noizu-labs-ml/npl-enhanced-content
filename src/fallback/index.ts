/**
 * SemText — fallback tier entry point.
 *
 * This module and everything it imports must stay free of Lit. It ships as
 * `dist/semtext-fallback.js`, a classic IIFE script that runs standalone in a
 * document that never loads the component bundle: the fallback tier is what
 * makes a portable `file://` document interactive with zero network.
 *
 * TIER HANDOFF. Each handler marks what it wired with `data-sem-fallback`.
 * When the Lit bundle is also present, `SemElement.connectedCallback` claims
 * `data-sem-upgraded` and clears that marker, and every hide-rule in the
 * theme CSS is gated on one marker or the other — so with neither script
 * running, nothing is hidden and the document reads as plain prose. The
 * document root (`<html>`) carries the same marker once `enhance` has run,
 * for hide rules whose host element is deliberately unmarked (a list-view
 * deck's distractors).
 *
 * SIZE BUDGET: 12 KB minified, raised from 8 KB in the reading-experience
 * W0 wave (deep-link resolver + audience gating). Raw bytes are what a
 * file:// document carries, since nothing gzips an inlined <script>, so the
 * budget is stated raw. Most of the weight is irreducible string literals:
 * markup templates, class names and warning text. `scripts/build.mjs`
 * prints measured size against its budget on every build; raise it
 * deliberately, never silently.
 */

import { enhanceSource } from './source.js';
import { enhanceFacts } from './facts.js';
import { enhanceDetails } from './details.js';
import { enhanceNote } from './note.js';
import { enhanceProperties } from './properties.js';
import { enhanceViews } from './views.js';
import { enhanceReveal } from './reveal.js';
import { enhanceProgress } from './progress.js';
import { enhanceAudience } from './audience.js';
import { enhanceTarget } from './target.js';

declare global {
  interface Window {
    /** Test hook: simulate a JS-off document without stripping the script. */
    __semJsOff?: boolean;
  }
}

export type FallbackHandler = (scope: ParentNode) => void;

/**
 * Registry order is the original inline handler's order and is load-bearing:
 * `enhanceDetails` rewrites `.sem-highlight` nodes that later handlers must
 * not see twice, and `enhanceReveal` moves `.sem-reveal` children into a
 * `<details>` after `enhanceProgress`'s targets have been located.
 * `enhanceTarget` is LAST: it drives the others' listeners (note summary,
 * `sem-activate` on views and cards), which must exist before it resolves
 * the hash.
 */
export const handlers: FallbackHandler[] = [
  enhanceSource, // FIRST: snapshots sem-source markup before anything touches it
  enhanceFacts,
  enhanceDetails,
  enhanceNote,
  enhanceProperties,
  enhanceViews,
  enhanceReveal,
  enhanceProgress,
  enhanceAudience,
  enhanceTarget,
];

/** Run every handler over a scope. Exported so a host can re-run on new DOM. */
export function enhance(scope: ParentNode = document): void {
  if (scope === document) document.documentElement.setAttribute('data-sem-fallback', '');
  for (const handler of handlers) handler(scope);
}

export {
  enhanceSource,
  enhanceFacts,
  enhanceDetails,
  enhanceNote,
  enhanceProperties,
  enhanceViews,
  enhanceReveal,
  enhanceProgress,
  enhanceAudience,
  enhanceTarget,
};

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
