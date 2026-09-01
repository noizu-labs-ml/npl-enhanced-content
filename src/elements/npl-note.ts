import { LitElement } from 'lit';

/**
 * npl-note — Lit upgrade of the v0.4 class-based callout.
 * Light DOM per PRD §4 rule 5: content stays searchable/copyable;
 * Lit owns behavior (collapsed toggle, variant reaction), not markup.
 * Handoff contract: sets data-npl-upgraded, removes data-npl-fallback.
 */
export class NplNote extends LitElement {
  static properties = {
    variant: { type: String, reflect: true },
    collapsed: { type: Boolean, reflect: true },
  };

  constructor() {
    super();
    this.variant = 'info';
    this.collapsed = false;
  }

  /* light DOM — no shadow root; theme CSS styles .npl-* classes */
  createRenderRoot() { return this; }

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('role', 'note');
    this.setAttribute('data-npl-upgraded', '');
    this.removeAttribute('data-npl-fallback');
    this.addEventListener('click', this.#onSummaryClick);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.#onSummaryClick);
    super.disconnectedCallback();
  }

  updated() {
    // v0.4 CSS contract keys styling/tests off data-variant, not `variant`
    this.setAttribute('data-variant', this.variant);
    if (!this.collapsed) {
      this.#summary()?.remove();
      return;
    }
    if (!this.#summary()) {
      const body = this.querySelector('.npl-note-body');
      if (!body) {
        // element defined pre-parse: children aren't there yet at first update
        requestAnimationFrame(() => this.requestUpdate());
        return;
      }
      const sum = document.createElement('div');
      sum.className = 'npl-note-summary';
      sum.textContent = this.#bodyText().split(/\s+/).slice(0, 10).join(' ') + ' …';
      this.insertBefore(sum, body);
    }
  }

  #summary() { return this.querySelector(':scope > .npl-note-summary'); }

  #bodyText() {
    const body = this.querySelector('.npl-note-body');
    return ((body ?? this).textContent || '').trim();
  }

  #onSummaryClick(e) {
    const t = e.target;
    if (t instanceof Element && t.classList.contains('npl-note-summary')) {
      this.collapsed = false;
    }
  }
}

customElements.define('npl-note', NplNote);
