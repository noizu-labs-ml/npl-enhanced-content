/**
 * SemText — extraction entry point.
 *
 * Normative contract: spec/extraction.md
 *
 * Build note: this module is the intended entry for a second Vite lib
 * target emitting an IIFE global (`SemTextExtract`) at `dist/semtext-extract.js`,
 * so a portable document can load extraction with a classic <script> tag.
 * No runtime dependencies, no fetch, no top-level await.
 */

export type { SemRecord } from './records.js';
export {
  extractRecords,
  extractText,
  renderRecordsAsText,
  deriveSummary
} from './records.js';
