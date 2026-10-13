/**
 * semtext-lazy — the core on-demand surface (src entry; built to
 * dist/semtext-lazy.js).
 *
 * SURFACE CONTRACT (the built artifact carries the same text as a banner —
 * minification strips this comment): pair semtext-lazy.js with semtext.css
 * and the script scans the whole document — the `<sem-text>` wrapper is
 * optional — for `sem-*` tags, then imports only the component chunks the
 * build-time manifest maps those tags to. Components not on the page never
 * download; elements sit in the `:not(:defined)` base box until their chunk
 * arrives. A failed chunk leaves a role="alert" note on its elements and
 * never blocks the other chunks. Class-form aliases (`.sem-note` etc.) are
 * not tags: they never trigger a load.
 *
 * This loader owns the `sem-*` namespace only; `npl-*` documents load
 * npl-lazy.js (dist/npl-chunks/), which runs the same contract against the
 * npl manifest.
 *
 * Dynamic import needs a server: this script does not work from file://.
 * For saved single-file documents use semtext.js — the full bundle, which
 * has no runtime imports.
 */

import { bootLazyLoader, installOnDocumentReady } from './boot.js';
import manifest from 'virtual:semtext-manifest';

installOnDocumentReady(() => bootLazyLoader(manifest, { pattern: /^sem-/ }));
