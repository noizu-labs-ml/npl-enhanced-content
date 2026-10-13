// @vitest-environment happy-dom
// Unit spec — the real lazy entry (src/lazy/index.ts) end to end
//
// The scan/loader specs prove the parts; this one proves the WIRING: boot
// adopts the page's <sem-text> roots, the entry's own observers pick up
// later insertions, and a chunk that cannot be imported surfaces as the
// role="alert" note — through the same code the built semtext-lazy.js runs.
//
// The manifest comes from the vitest alias (vite.config.ts →
// test/unit/fixtures/lazy-manifest.stub.ts); the chunk URL deliberately
// does not exist under the test runner, so every attempt takes
// the failure path deterministically — exactly the report-don't-throw
// contract. Successful chunk import (real dynamic import over http) is
// covered by the built artifact, not unit-reachable without a server.

import { describe, it, expect, beforeAll } from 'vitest';

const tick = () => new Promise((resolve) => setTimeout(resolve, 4));

describe('lazy entry wiring', () => {
  beforeAll(async () => {
    document.body.innerHTML = '<sem-text><p>prose</p><sem-note id="early">n</sem-note></sem-text>';
    await import('../../src/lazy/index.js');
    await tick();
  });

  it('boots: an element present at load is processed (and its missing chunk reported, not thrown)', () => {
    const el = document.getElementById('early')!;
    expect(el.getAttribute('data-sem-lazy-error')).toBe('sem-note');
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('sem-note');
  });

  it('watches the root: an element inserted after boot is processed too', async () => {
    document.querySelector('sem-text')!.insertAdjacentHTML('beforeend', '<sem-note id="late">n</sem-note>');
    await tick();
    expect(document.getElementById('late')!.hasAttribute('data-sem-lazy-error')).toBe(true);
  });
});
