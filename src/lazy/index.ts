/**
 * semtext-lazy — the on-demand surface (src entry; built to
 * dist/semtext-lazy.js).
 *
 * SURFACE CONTRACT (the built artifact carries the same text as a banner —
 * minification strips this comment): pair semtext-lazy.js with semtext.css,
 * wrap a document in `<sem-text>…</sem-text>`, and the script scans each
 * wrapper for `sem-*` / `npl-*` tags, then imports only the component
 * chunks the build-time manifest maps those tags to. Components not on the
 * page never download; elements sit in the `:not(:defined)` base box until
 * their chunk arrives. A failed chunk leaves a role="alert" note on its
 * elements and never blocks the other chunks.
 *
 * Dynamic import needs a server: this script does not work from file://.
 * For saved single-file documents use semtext.js — the full bundle, which
 * has no runtime imports.
 *
 * DOM scanning and import bookkeeping live in ./scan.ts and ./loader.ts;
 * this entry only wires them to a real page: roots at load, roots and
 * elements added later.
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
const adopted = new WeakSet<Element>();

/** Track a `<sem-text>` root: load what is here now, and watch for what
 *  lands later. An inserted element hydrates per insertion — loader-level
 *  dedup makes overlapping scans cheap, and an inserted `sem-text` becomes
 *  a tracked root of its own. */
function adopt(root: Element): void {
  if (adopted.has(root)) return;
  adopted.add(root);
  void loader.hydrate(root);
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        const el = node as Element;
        if (el.localName === 'sem-text') adopt(el);
        else void loader.hydrate(el);
      }
    }
  });
  observer.observe(root, { childList: true, subtree: true });
}

function boot(): void {
  document.querySelectorAll('sem-text').forEach(adopt);
  // Root discovery after boot: an app that renders its <sem-text> wrapper
  // late still gets tracked. Component insertions OUTSIDE any root stay
  // unmanaged — the contract covers sem-text documents only.
  const rootFinder = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE && (node as Element).localName === 'sem-text') {
          adopt(node as Element);
        }
      }
    }
  });
  rootFinder.observe(document.documentElement, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
