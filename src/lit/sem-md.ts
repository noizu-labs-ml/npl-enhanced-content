import { SemElement } from './base.js';
import { enhanceMdElement } from '../md/element.js';
import { enhanceCodeElement } from '../reading/code.js';

/**
 * sem-md — thin Lit wrapper over the Markdown bundle's enhance function.
 *
 * One behaviour implementation (src/md/element.ts) serves both tiers: this
 * element only owns the lifecycle. SemElement claims `data-sem-upgraded`
 * on connect, so the bundle's document scan skips the element; once the
 * document has finished parsing (the content is text, so there is no child
 * element to wait for) the same idempotent enhance runs here.
 */
export class SemMd extends SemElement {
  #wired = false;

  updated(): void {
    if (this.#wired) return;
    this.#wired = true;
    // afterParse: the content is text, so there is no child element to
    // wait for, but writes must not land mid-parse (sem-source snapshots).
    this.afterParse(() => {
      enhanceMdElement(this, enhanceCodeElement);
      this.setAttribute('data-sem-upgraded', '');
      this.removeAttribute('data-sem-fallback');
    });
  }
}

SemElement.register('sem-md', SemMd);
