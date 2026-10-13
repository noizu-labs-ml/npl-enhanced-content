/**
 * npl.js — the `npl-*` component namespace as its own bundle (dist/npl.js,
 * classic IIFE, global `NPL`).
 *
 * Core (src/index.ts → dist/semtext.js) deliberately carries no npl-* code:
 * an NPL document loads this ON TOP of the core vocabulary when it wants
 * every npl component without chunk loading — the same relationship
 * semtext-lazy.js has to semtext.js, minus the loading. The barrel owns
 * the per-component lines; this entry is one re-export, so a new npl
 * component (added per the barrel's recipe) ships in the next build with
 * no change here.
 */

export * from './lit/npl/index.js';
import './lit/npl/index.js';
