/**
 * state — document-level state that survives a reload or a shared link.
 *
 * Two stores, deliberately separate:
 *   • the hash, for state a reader would want to send to someone else
 *     (which view is open, which audience the document is filtered to);
 *   • localStorage, for state that is this reader's business alone.
 *
 * HASH FORMAT. The hash is a `&`-joined list of segments. A segment is either
 * `name=value` or a bare token. The bare form is load-bearing: sem-views already
 * deep-links as `#<container-id>/<view-id>`, and that link must keep working
 * unchanged when audience state joins it. The composed form is therefore
 *
 *     #deploy/argocd&sem-audience=operator
 *
 * so every reader/writer here edits exactly one segment and copies the rest
 * through verbatim — bare segments are never re-encoded or reordered.
 *
 * STORAGE ACCESS CANNOT THROW. Safari raises SecurityError for `localStorage`
 * on `file://`, and a double-clicked file:// document is this project's zeroth
 * acceptance bar. Every accessor below is wrapped; a dead store reads as empty
 * and writes as `false`.
 */

/* ------------------------------------------------------------------ hash */

function rawHash(): string {
  if (typeof location === 'undefined') return '';
  const hash = location.hash || '';
  return hash.startsWith('#') ? hash.slice(1) : hash;
}

/** Split the current hash into its `&` segments (empty segments dropped). */
export function hashSegments(): string[] {
  const raw = rawHash();
  if (raw === '') return [];
  return raw.split('&').filter((segment) => segment !== '');
}

/** The segments that carry no `=` — e.g. the sem-views `id/view` deep link. */
export function bareSegments(): string[] {
  return hashSegments().filter((segment) => !segment.includes('='));
}

function splitSegment(segment: string): { name: string; value: string } | null {
  const eq = segment.indexOf('=');
  if (eq < 0) return null;
  return { name: segment.slice(0, eq), value: segment.slice(eq + 1) };
}

function decode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Read one named hash parameter. Returns null when absent. */
export function getParam(name: string): string | null {
  for (const segment of hashSegments()) {
    const pair = splitSegment(segment);
    if (pair && pair.name === name) return decode(pair.value);
  }
  return null;
}

/**
 * Write one named hash parameter, leaving every other segment — bare segments
 * included — byte-for-byte intact. A null or empty value removes the parameter.
 * No write happens when the composed hash would be unchanged, so this never
 * fires a spurious `hashchange` at other listeners.
 */
export function setParam(name: string, value: string | null): void {
  if (typeof location === 'undefined') return;

  const segments = hashSegments();
  const encoded = value == null || value === '' ? null : name + '=' + encodeURIComponent(value);
  const next: string[] = [];
  let written = false;

  for (const segment of segments) {
    const pair = splitSegment(segment);
    if (pair && pair.name === name) {
      if (encoded !== null && !written) {
        next.push(encoded);
        written = true;
      }
      continue; // drop the old occurrence (and any duplicates)
    }
    next.push(segment);
  }
  if (encoded !== null && !written) next.push(encoded);

  const composed = next.join('&');
  if (composed === rawHash()) return;
  location.hash = composed === '' ? '' : '#' + composed;
}

/* -------------------------------------------------------------- storage */

function store(): Storage | null {
  try {
    // Property access itself throws in Safari on file:// and with site data blocked.
    const s = typeof window !== 'undefined' ? window.localStorage : null;
    return s ?? null;
  } catch {
    return null;
  }
}

/** Read a persisted value. Returns null when absent or when storage is unusable. */
export function readLocal(key: string): string | null {
  try {
    return store()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

/** Persist a value. Returns false when storage is unusable or full. */
export function writeLocal(key: string, value: string): boolean {
  try {
    const s = store();
    if (!s) return false;
    s.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/** Remove a persisted value. Returns false when storage is unusable. */
export function removeLocal(key: string): boolean {
  try {
    const s = store();
    if (!s) return false;
    s.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
