/**
 * semtext-lazy — the on-demand surface (src entry; built to
 * dist/semtext-lazy.js).
 *
 * SURFACE CONTRACT (the built artifact carries the same text as a banner —
 * minification strips this comment): pair semtext-lazy.js with semtext.css
 * and the script scans the whole document — the `<sem-text>` wrapper is
 * optional — for `sem-*` / `npl-*` tags, then imports only the component
 * chunks the build-time manifest maps those tags to. Components not on the
 * page never download; elements sit in the `:not(:defined)` base box until
 * their chunk arrives. A failed chunk leaves a role="alert" note on its
 * elements and never blocks the other chunks. Class-form aliases
 * (`.sem-note` etc.) are not tags: they never trigger a load.
 *
 * Dynamic import needs a server: this script does not work from file://.
 * For saved single-file documents use semtext.js — the full bundle, which
 * has no runtime imports.
 *
 * DOM scanning and import bookkeeping live in ./scan.ts and ./loader.ts;
 * this entry only wires them to a real page: the document at load, and
 * anything inserted later.
 */

import { createLoader } from './loader.js';
import manifest from 'virtual:semtext-manifest';

/** Chunks resolve relative to THIS script (dist/semtext-lazy.js), so the
 *  same relative manifest paths work from any host page depth or CDN
 *  layout. `@vite-ignore` keeps Rollup from trying to bundle the dynamic
 *  specifier — these chunks are already built, next to this file. */
function importChunk(chunkPath: string): Promise<unknown> {
  return import(/* @vite-ignore */ new URL(chunkPath, import.meta.url).href);
}

const loader = createLoader(manifest, importChunk);

/** One document, one watcher. Any added element hydrates (itself and its
 *  subtree), wherever it lands — loader-level dedup makes overlapping
 *  additions (a wrapper and its children in one mutation record) cheap,
 *  and hydration is the same call whether or not a `<sem-text>` wrapper
 *  is in play. */
const watcher = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType === Node.ELEMENT_NODE) void loader.hydrate(node as Element);
    }
  }
});

function boot(): void {
  // The whole document, wrapper or not: `html` is not vocabulary and
  // hydrate includes the root, so one call covers every authored element.
  void loader.hydrate(document.documentElement);
  watcher.observe(document.documentElement, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
