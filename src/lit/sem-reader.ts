import { SemElement } from './base.js';
import { enhanceReaderElement } from '../reading/reader.js';

/**
 * sem-reader — thin Lit wrapper over src/reading/reader.ts.
 *
 * The reader has no required children (an authored contents nav is
 * optional, and the generated outline reads the document's headings), so
 * instead of `whenChildrenReady` it waits for the parse to finish: the
 * outline must see every heading, not the ones streamed so far. The same
 * idempotent enhance the bundle runs; chrome present means nothing added.
 */
export class SemReader extends SemElement {
  #wired = false;

  updated(): void {
    if (this.#wired) return;
    this.#wired = true;
    const go = (): void => {
      enhanceReaderElement(this);
      this.setAttribute('data-sem-upgraded', '');
      this.removeAttribute('data-sem-fallback');
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go, { once: true });
    else go();
  }
}

SemElement.register('sem-reader', SemReader);
