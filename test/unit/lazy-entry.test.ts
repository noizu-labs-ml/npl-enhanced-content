// @vitest-environment happy-dom
// Unit spec — the real lazy entry (src/lazy/index.ts) end to end
//
// The scan/loader specs prove the parts; this one proves the WIRING: boot
// hydrates the whole document — the <sem-text> wrapper is optional — the
// entry's own watcher picks up anything inserted later, and a chunk that
// cannot be imported surfaces as the role="alert" note, through the same
// code the built semtext-lazy.js runs.
//
// The manifest comes from the vitest alias (vite.config.ts →
// test/unit/fixtures/lazy-manifest.stub.ts); the chunk URL deliberately
// does not exist under the test runner, so every attempt takes the failure
// path deterministically — exactly the report-don't-throw contract.
// Successful chunk import (real dynamic import over http) is covered by
// the built artifact, not unit-reachable without a server.

import { describe, it, expect, beforeAll } from 'vitest';

const tick = () => new Promise((resolve) => setTimeout(resolve, 4));

describe('lazy entry wiring', () => {
  beforeAll(async () => {
    document.body.innerHTML =
      '<sem-note id="loose">n</sem-note><sem-text><sem-note id="wrapped">n</sem-note></sem-text>';
    await import('../../src/lazy/index.js');
    await tick();
  });

  it('boots document-wide: an element under no sem-text wrapper is processed like a wrapped one', () => {
    for (const id of ['loose', 'wrapped']) {
      const el = document.getElementById(id)!;
      expect(el.getAttribute('data-sem-lazy-error')).toBe('sem-note');
      expect(el.querySelector('[role="alert"]')?.textContent).toContain('sem-note');
    }
  });

  it('watches the document: an element inserted anywhere later is processed too', async () => {
    document.body.insertAdjacentHTML('beforeend', '<sem-note id="late">n</sem-note>');
    await tick();
    expect(document.getElementById('late')!.hasAttribute('data-sem-lazy-error')).toBe(true);
  });
});
