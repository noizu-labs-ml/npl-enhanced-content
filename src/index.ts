/**
 * SemText — the one bundle (spec v0.6, three-file surface).
 *
 * `dist/semtext.js` — one classic IIFE, global `SemText`. This entry:
 *
 *   1. Defines every custom element (src/lit/*): sem-note, sem-facts,
 *      sem-details, sem-code, sem-references, sem-properties, sem-reader,
 *      sem-table, sem-source, sem-md, sem-chat.
 *   2. Re-exports the extraction contract (src/extract/*) and the shared
 *      foundation the npm surface documents — the former
 *      `SemTextExtract` / `SemTextMd` / `SemTextReading` /
 *      `SemTextFallback` globals are all names on this one global now.
 *   3. On DOMContentLoaded runs the vanilla handlers over the document,
 *      in load-bearing order — core (snapshot FIRST), then Markdown,
 *      then prose reading — for the elements no component defines and
 *      for class-alias authoring. Handlers skip anything already claimed
 *      (`data-sem-upgraded`), so component-owned elements are untouched.
 *
 * No smaller script falls back to: with the script absent or JS off, the
 * document reads as plain prose and extraction is unavailable.
 */

/* Shared foundation */
export { SemElement } from './lit/base.js';
export { parseTokens, elementTokens } from './shared/tokens.js';
export { mulberry32, shuffle, resolveSeed, randomFor } from './shared/rng.js';
export {
  parseProfiles,
  buildClosure,
  closureFor,
  matches,
  warn,
} from './shared/audience.js';
export type { Profile, AudienceClosure } from './shared/audience.js';
export {
  hashSegments,
  bareSegments,
  getParam,
  setParam,
  readLocal,
  writeLocal,
  removeLocal,
} from './shared/state.js';

/* Extraction — the former dist/semtext-extract.js (global SemTextExtract) */
export type { SemRecord } from './extract/records.js';
export {
  extractRecords,
  extractText,
  renderRecordsAsText,
  deriveSummary,
} from './extract/records.js';

/* Elements — importing registers the custom element */
export { SemNote } from './lit/sem-note.js';
import './lit/sem-note.js';
export { SemFacts } from './lit/sem-facts.js';
import './lit/sem-facts.js';
export { SemDetails } from './lit/sem-details.js';
import './lit/sem-details.js';
/* R/W1 prose elements — thin wrappers over src/reading/* */
export { SemCode } from './lit/sem-code.js';
import './lit/sem-code.js';
export { SemReferences } from './lit/sem-references.js';
import './lit/sem-references.js';
export { SemProperties } from './lit/sem-properties.js';
import './lit/sem-properties.js';
/* R/W2 chrome + data — thin wrappers over src/reading/* */
export { SemReader } from './lit/sem-reader.js';
import './lit/sem-reader.js';
export { SemTable } from './lit/sem-table.js';
import './lit/sem-table.js';
/* sem-source — rendered/source section wrapper (thin wrapper over src/reading/source.ts) */
export { SemSource } from './lit/sem-source.js';
import './lit/sem-source.js';
/* R/W2.2 Markdown block — thin wrapper over src/md/* */
export { SemMd } from './lit/sem-md.js';
import './lit/sem-md.js';
/* Media gallery + upload (agent-kit demo stubs) */
export { SemMediaGallery } from './lit/sem-media-gallery.js';
import type { MediaItem } from './lit/sem-media-gallery.js';
import './lit/sem-media-gallery.js';
export { SemUploadDrop } from './lit/sem-upload-drop.js';
import type { MediaAddedDetail } from './lit/sem-upload-drop.js';
import './lit/sem-upload-drop.js';
export type { MediaItem, MediaAddedDetail };

/* agent-kit upsell stubs — interaction-only, fixture-fed, zero network
 *   sem-chat: endpoint-driven chat transcript + composer
 *   sem-review-canvas: the agent-kit upsell stub (phase 1) */
export { SemChat, consumeReply } from './lit/sem-chat.js';
import './lit/sem-chat.js';
export { SemReviewCanvas } from './lit/sem-review-canvas.js';
import './lit/sem-review-canvas.js';

/* Media gallery + upload (agent-kit demo stubs) */
export { SemMediaGallery } from './lit/sem-media-gallery.js';
import type { MediaItem } from './lit/sem-media-gallery.js';
import './lit/sem-media-gallery.js';
export { SemUploadDrop } from './lit/sem-upload-drop.js';
import type { MediaAddedDetail } from './lit/sem-upload-drop.js';
import './lit/sem-upload-drop.js';
export type { MediaItem, MediaAddedDetail };

/* The npl-* namespace does NOT live here: it ships as its own bundle
 * (dist/npl.js, entry src/npl.ts) and its own lazy loader
 * (dist/npl-lazy.js). Core keeps only the sem-* components. */

/* agent-kit upsell stubs — interaction-only, fixture-fed, zero network */
export { SemArtifactCard } from './lit/sem-artifact-card.js';
import './lit/sem-artifact-card.js';

/* Vanilla handlers — the former dist/semtext-fallback.js,
 * dist/semtext-md.js and dist/semtext-reading.js entry points. */
import {
  enhance as enhanceCore,
  type FallbackHandler,
} from './fallback/index.js';
export type { FallbackHandler } from './fallback/index.js';
export {
  enhanceSource,
  enhanceAttrs,
  enhanceFacts,
  enhanceDetails,
  enhanceNote,
  enhanceProperties,
  enhanceViews,
  enhanceReveal,
  enhanceProgress,
  enhanceAudience,
  enhanceTarget,
} from './fallback/index.js';
import { enhance as enhanceMdScan } from './md/index.js';
export { enhanceMd, enhanceMdElement, normalizeMd, parseBlocks, safeUrl } from './md/index.js';
import { enhance as enhanceReading } from './reading/index.js';
export {
  enhanceCodeElement,
  enhanceReferencesElement,
  enhanceGlossaryElement,
  enhanceTableElement,
  enhanceSourceElement,
  enhanceReaderElement,
  disposeReaderElement,
} from './reading/index.js';
export { enhanceCore, enhanceMdScan as enhanceMdDocument, enhanceReading };

function init(): void {
  // Load-bearing order: the core's sem-source snapshot pass must precede
  // every handler that adds chrome; the reader is generated last.
  enhanceCore(document);
  enhanceMdScan(document);
  enhanceReading(document);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
}
