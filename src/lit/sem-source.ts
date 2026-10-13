import { SemElement } from './base.js';
import { enhanceSourceElement } from '../reading/source.js';
import { snapshotSourceElement } from '../fallback/source.js';

/**
 * sem-source — thin Lit wrapper over src/reading/source.ts.
 *
 * Takes its own snapshot immediately before building the chrome
 (`snapshotSourceElement`, the same pass the core handler runs): the
 component may upgrade and enhance before the bundle's DOMContentLoaded
 scan, so it cannot rely on the scan having snapshotted first. Snapshot
 is idempotent; chrome present means nothing is added.
 */
export class SemSource extends SemElement {
  #wired = false;

  updated(): void {
    if (this.#wired) return;
    this.#wired = true;
    const go = (): void => {
      snapshotSourceElement(this);
      enhanceSourceElement(this);
      this.setAttribute('data-sem-upgraded', '');
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go, { once: true });
    else go();
  }
}

SemElement.register('sem-source', SemSource);
