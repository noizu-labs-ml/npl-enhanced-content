#!/usr/bin/env node
/**
 * scripts/cypress-shard.mjs — split the cypress e2e specs across CI shards.
 *
 *   node scripts/cypress-shard.mjs <index> <total>   # index is 1-based
 *
 * Prints a comma-separated spec list for `cypress run --spec`.
 *
 * Every spec under test/e2e is assigned to exactly one shard — a new spec is
 * picked up automatically (weighted with DEFAULT_WEIGHT), so sharding can
 * never silently drop a spec. Assignment is greedy longest-first over the
 * measured weights below, which keeps the shards within a few seconds of
 * each other. The weights are CI wall seconds per spec (spec time plus the
 * ~2.5s browser relaunch cypress pays per spec), from the GitHub Actions run
 * of 2026-10-07. Re-measure them when a spec grows a lot; a stale weight only
 * unbalances the shards, it never skips anything.
 */

import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const E2E_DIR = 'test/e2e';
const DEFAULT_WEIGHT = 5;

const WEIGHTS = {
  'spec-pages.cy.js': 23,
  'site.cy.js': 15,
  'sem-reader.cy.js': 15,
  'sem-source.cy.js': 12,
  'sem-table.cy.js': 12,
  'extraction.cy.js': 9,
  'extraction-reading.cy.js': 8,
  'deep-links.cy.js': 7,
  'sem-md.cy.js': 7,
  'sem-references.cy.js': 6
};

const [index, total] = process.argv.slice(2).map(Number);
if (!Number.isInteger(index) || !Number.isInteger(total) || index < 1 || index > total) {
  console.error('usage: cypress-shard.mjs <index 1..total> <total>');
  process.exit(2);
}

const specs = readdirSync(resolve(root, E2E_DIR))
  .filter((f) => f.endsWith('.cy.js'))
  .sort()
  .map((f) => ({ f, w: WEIGHTS[f] ?? DEFAULT_WEIGHT }))
  .sort((a, b) => b.w - a.w || a.f.localeCompare(b.f));

const shards = Array.from({ length: total }, () => ({ load: 0, files: [] }));
for (const { f, w } of specs) {
  const lightest = shards.reduce((min, s) => (s.load < min.load ? s : min));
  lightest.files.push(`${E2E_DIR}/${f}`);
  lightest.load += w;
}

process.stdout.write(shards[index - 1].files.join(','));
