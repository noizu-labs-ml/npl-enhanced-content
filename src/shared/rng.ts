/**
 * rng — seeded pseudo-randomness for reproducible documents.
 *
 * Why this exists: quiz option ordering used `arr.sort(() => Math.random() - 0.5)`.
 * That comparator is inconsistent (it answers differently for the same pair), so
 * the result is neither a uniform permutation nor stable across JS engines —
 * V8's sort and JSC's sort produce different bias. This module replaces it with
 * a real Fisher-Yates draw fed by a seeded PRNG, so a document with a declared
 * seed shuffles identically everywhere and BDD specs can assert order.
 */

declare global {
  interface Window {
    __nplSeed?: number | string;
  }
}

const DOCUMENT_SELECTOR = 'npl-enhanced-document, .npl-enhanced-document';

/**
 * mulberry32 — 32-bit seeded PRNG. Small, fast, no dependencies, good enough
 * for shuffling presentation order (this is not a cryptographic generator).
 * Returns a function producing floats in [0, 1).
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Fisher-Yates shuffle. Returns a NEW array; the input is untouched.
 * Every permutation is equally likely given a uniform `rand`.
 */
export function shuffle<T>(items: readonly T[], rand: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

/** Strict integer parse — anything that is not a whole number yields null. */
function parseSeed(raw: unknown): number | null {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? Math.trunc(raw) : null;
  }
  if (typeof raw !== 'string') return null;
  const text = raw.trim();
  if (!/^[+-]?\d+$/.test(text)) return null;
  const value = Number.parseInt(text, 10);
  return Number.isFinite(value) ? value : null;
}

function seedFromAttribute(el: Element | null): number | null {
  if (!el) return null;
  return parseSeed(el.getAttribute('data-sem-seed'));
}

/**
 * Resolve the seed for an element, in precedence order:
 *   1. `data-sem-seed` on the element itself
 *   2. `data-sem-seed` on the nearest enhanced-document ancestor
 *   3. `window.__nplSeed`
 *   4. `Date.now()` (unseeded documents still shuffle, just not reproducibly)
 * A value that is not a whole number is treated as absent and falls through.
 */
export function resolveSeed(el: Element): number {
  const own = seedFromAttribute(el);
  if (own !== null) return own;

  const host = typeof el.closest === 'function' ? el.closest(DOCUMENT_SELECTOR) : null;
  const inherited = seedFromAttribute(host);
  if (inherited !== null) return inherited;

  const global = typeof window !== 'undefined' ? parseSeed(window.__nplSeed) : null;
  if (global !== null) return global;

  return Date.now();
}

/** Convenience: a PRNG already bound to the element's resolved seed. */
export function randomFor(el: Element): () => number {
  return mulberry32(resolveSeed(el));
}
