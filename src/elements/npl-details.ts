import { LitElement } from 'lit';

/**
 * npl-details — Lit upgrade of the v0.4 class-based prose-with-cloze block.
 * Light DOM per PRD §4 rule 5. quiz view occludes .npl-highlight recall
 * targets (.npl-occluded spans); plain view leaves prose untouched.
 * Handoff contract: sets data-npl-upgraded, removes data-npl-fallback.
 */
export class NplDetails extends LitElement {
  #wired = false;
  #retrying = false;

  /* light DOM — theme CSS styles .npl-* classes */
  createRenderRoot() { return this; }

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('data-npl-upgraded', '');
    this.removeAttribute('data-npl-fallback');
  }

  updated() {
    if (this.#wired) return;
    const view = this.getAttribute('data-view-as') || 'plain';
    const highlights = Array.from(this.querySelectorAll('.npl-highlight'));
    if (view !== 'quiz' || highlights.length === 0) {
      if (view === 'quiz' && highlights.length === 0 && !this.#retrying) {
        // element defined pre-parse: children aren't there yet at first update
        this.#retrying = true;
        requestAnimationFrame(() => this.requestUpdate());
      }
      return;
    }
    this.#wired = true;

    highlights.forEach((h) => {
      const span = document.createElement('span');
      span.className = 'npl-occluded';
      span.textContent = h.textContent;
      span.setAttribute('role', 'button');
      span.setAttribute('tabindex', '0');
      span.setAttribute('aria-label', 'reveal');
      const reveal = () => {
        span.className = 'npl-highlight npl-revealed';
        span.removeAttribute('role');
        span.removeAttribute('tabindex');
      };
      span.addEventListener('click', reveal);
      span.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); reveal(); }
      });
      h.replaceWith(span);
    });
  }
}

customElements.define('npl-details', NplDetails);
