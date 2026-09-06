import { LitElement } from 'lit';
import { parseTokens } from '../shared/tokens.js';
import { closureFor, matches, warn as semWarn, type AudienceClosure } from '../shared/audience.js';

/**
 * SemElement — the shared base for every SemText custom element.
 *
 * Repays debt D2. Three things were being copy-pasted per element and drifting:
 * the light-DOM render root, the fallback→upgrade handoff, and a
 * requestAnimationFrame retry for the pre-parse children problem.
 *
 * The rAF retry was wrong in both directions. sem-note had no guard, so a note
 * whose `.sem-note-body` was never authored re-queued a frame forever. sem-facts
 * and sem-details had a one-shot `#retrying` flag, so children streamed in by a
 * slow parse (or injected later) after that single frame were never picked up.
 * `whenChildrenReady` replaces both with a MutationObserver: it costs nothing
 * while idle, fires the moment the children exist however late that is, and
 * disconnects on resolve or on disconnect.
 *
 * Lit is a reactive-attribute and lifecycle harness here, nothing more. There is
 * no shadow DOM and no `static styles`: content must stay searchable, copyable
 * and styleable by plain theme CSS (PRD §4 rule 5).
 */
export class SemElement extends LitElement {
  #observers = new Set<MutationObserver>();

  /** Light DOM — theme CSS styles the `.sem-*` classes directly. */
  createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  /**
   * Fallback→upgrade handoff. The vanilla inline handler marks what it wired
   * with `data-sem-fallback`; the upgraded element takes ownership by claiming
   * `data-sem-upgraded` and clearing that marker. CSS hide-rules key off both.
   */
  connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('data-sem-upgraded', '');
    this.removeAttribute('data-sem-fallback');
  }

  disconnectedCallback(): void {
    for (const observer of this.#observers) observer.disconnect();
    this.#observers.clear();
    super.disconnectedCallback();
  }

  /**
   * Resolve once at least one descendant matches `selector`.
   *
   * Custom elements upgrade before their children are parsed, so the first
   * `updated()` of a document-authored element routinely sees an empty subtree.
   * Checks immediately, then watches childList/subtree until a match appears.
   * Never resolves if the element disconnects first — by design; the caller is
   * gone.
   *
   * While the document is still parsing, resolution is held until
   * DOMContentLoaded. Otherwise the observer would fire on the *first* child
   * the streaming parser appends and a caller like sem-facts would wire itself
   * against a partial deck. Callers get the full match set either way.
   */
  whenChildrenReady(selector: string): Promise<Element[]> {
    const found = (): Element[] => Array.from(this.querySelectorAll(selector));

    const settle = (resolve: (v: Element[]) => void): void => {
      if (typeof document !== 'undefined' && document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => resolve(found()), { once: true });
        return;
      }
      resolve(found());
    };

    if (found().length > 0) {
      return new Promise<Element[]>(settle);
    }

    return new Promise<Element[]>((resolve) => {
      const observer = new MutationObserver(() => {
        if (found().length === 0) return;
        observer.disconnect();
        this.#observers.delete(observer);
        settle(resolve);
      });
      this.#observers.add(observer);
      observer.observe(this, { childList: true, subtree: true });
    });
  }

  /** Bubbling, composed CustomEvent — sem-navigate / sem-flip / sem-complete. */
  emit<T>(name: string, detail?: T): boolean {
    return this.dispatchEvent(
      new CustomEvent<T>(name, { bubbles: true, composed: true, detail: detail as T }),
    );
  }

  /** Parse a comma/space separated attribute on this element. */
  tokens(attr: string): string[] {
    return parseTokens(this.getAttribute(attr));
  }

  /**
   * Is this element visible to the document's active audience profile?
   *
   * The active profile lives on the document root as `data-sem-audience`; the
   * profile declarations live in the `sem-audiences` block. With neither
   * declared — which is every document today — this returns true for
   * everything, and an unknown token fails open for the same reason.
   */
  audienceMatches(spec?: string | null): boolean {
    const requested = spec === undefined ? this.getAttribute('data-sem-audience-spec') : spec;
    return matches(requested, this.#activeProfile(), this.#closure());
  }

  #root(): Element | Document {
    return this.closest('sem-enhanced-document, .sem-enhanced-document') ?? this.ownerDocument;
  }

  #activeProfile(): string | null {
    const root = this.#root();
    if (root instanceof Element) return root.getAttribute('data-sem-audience');
    return root.documentElement?.getAttribute('data-sem-audience') ?? null;
  }

  #closure(): AudienceClosure {
    return closureFor(this.ownerDocument ?? this);
  }

  /** Author-facing warning, same channel as the vanilla fallback handler. */
  warn(message: string): void {
    semWarn(message);
  }

  /**
   * Idempotent registration. Standalone documents inline their bundle, so two
   * concatenated documents (or a page that loads the bundle twice) would
   * otherwise throw on the second `customElements.define`.
   */
  static register(tag: string, ctor: CustomElementConstructor): void {
    if (typeof customElements === 'undefined') return;
    if (customElements.get(tag)) return;
    customElements.define(tag, ctor);
  }
}
