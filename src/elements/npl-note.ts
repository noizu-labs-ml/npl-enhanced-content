import { NplElement } from './base.js';

/**
 * npl-note — Lit upgrade of the v0.4 class-based callout.
 * Light DOM per PRD §4 rule 5: content stays searchable/copyable;
 * Lit owns behavior (collapsed toggle, variant reaction), not markup.
 * Handoff contract (data-sem-upgraded / data-sem-fallback) comes from NplElement.
 */
export class NplNote extends NplElement {
  static properties = {
    variant: { type: String, reflect: true },
    collapsed: { type: Boolean, reflect: true },
  };

  declare variant: string;
  declare collapsed: boolean;

  #awaitingBody = false;

  constructor() {
    super();
    this.variant = 'info';
    this.collapsed = false;
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('role', 'note');
    this.addEventListener('click', this.#onSummaryClick);
  }

  disconnectedCallback(): void {
    this.removeEventListener('click', this.#onSummaryClick);
    super.disconnectedCallback();
  }

  updated(): void {
    // v0.4 CSS contract keys styling/tests off data-variant, not `variant`
    this.setAttribute('data-variant', this.variant);
    if (!this.collapsed) {
      this.#summary()?.remove();
      return;
    }
    if (this.#summary()) return;

    const body = this.querySelector('.sem-note-body');
    if (!body) {
      // element upgraded pre-parse: children aren't there yet at first update
      this.#awaitBody();
      return;
    }
    const sum = document.createElement('div');
    sum.className = 'sem-note-summary';
    sum.textContent = this.#bodyText().split(/\s+/).slice(0, 10).join(' ') + ' …';
    this.insertBefore(sum, body);
  }

  #awaitBody(): void {
    if (this.#awaitingBody) return;
    this.#awaitingBody = true;
    void this.whenChildrenReady('.sem-note-body').then(() => {
      this.#awaitingBody = false;
      this.requestUpdate();
    });
  }

  #summary(): Element | null {
    return this.querySelector(':scope > .sem-note-summary');
  }

  #bodyText(): string {
    const body = this.querySelector('.sem-note-body');
    return ((body ?? this).textContent || '').trim();
  }

  #onSummaryClick(e: Event): void {
    const t = e.target;
    if (t instanceof Element && t.classList.contains('sem-note-summary')) {
      this.collapsed = false;
    }
  }
}

NplElement.register('npl-note', NplNote);
