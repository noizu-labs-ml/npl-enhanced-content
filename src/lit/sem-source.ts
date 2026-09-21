import { SemElement } from './base.js';
import { enhanceSourceElement } from '../reading/source.js';

/**
 * sem-source — thin Lit wrapper over src/reading/source.ts.
 *
 * Waits for the parse to finish rather than for a child: the fallback
 * core's snapshot pass (registered first, run on DOMContentLoaded) must
 * have captured the authored markup before the chrome is built. Same
 * idempotent enhance the reading bundle runs; chrome present means
 * nothing is added.
 */
export class SemSource extends SemElement {
  #wired = false;

  updated(): void {
    if (this.#wired) return;
    this.#wired = true;
    const go = (): void => {
      enhanceSourceElement(this);
      this.setAttribute('data-sem-upgraded', '');
      this.removeAttribute('data-sem-fallback');
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go, { once: true });
    else go();
  }
}

SemElement.register('sem-source', SemSource);
