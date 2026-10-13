import { SemElement } from './base.js';
import { param } from '../shared/attr.js';
import { sel } from '../shared/sel.js';

const EVENT = ':scope > ' + sel('event');
const MARK_CLASS = 'sem-search-hit';

/** Detail of `sem-chronology-change` — the current control state. */
export interface SemChronologyChangeDetail {
  sort: SortMode;
  /** free-text filter on entry text ('' when clear) */
  filter: string;
  /** date-range bounds as authored in the controls ('' when unset) */
  from: string;
  to: string;
  /** search query ('' when clear) */
  query: string;
}

/** The three sort states the Sort group offers; document order is default. */
export type SortMode = 'document' | 'oldest' | 'newest';

let uid = 0;

/**
 * Date parsing for `when` / `until`. The schema allows free text
 * ("ISO-8601 preferred"), so anything Date.parse rejects — "2026-Q4",
 * "someday" — has no time position: it never matches a range filter and
 * sorts after every dated event (stable, so unlabelled entries keep their
 * relative order).
 */
function timeOf(value: string | null): number | null {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

/**
 * Range membership as interval intersection. An event occupies
 * [when, until ?? when]; it matches a [from, to] ask when the two overlap.
 * A bound the event can't establish (no parseable `when`) fails the ask —
 * an undated event is never "in June".
 */
function inRange(ev: Element, fromMs: number | null, toMs: number | null): boolean {
  if (fromMs === null && toMs === null) return true;
  const start = timeOf(param(ev, 'when'));
  const end = timeOf(param(ev, 'until')) ?? start;
  if (fromMs !== null && (end === null || end < fromMs)) return false;
  if (toMs !== null && (start === null || start > toMs)) return false;
  return true;
}

/** Stable date sort; unparseable dates sink below every dated event. */
function sortByDate(events: Element[], dir: 'oldest' | 'newest'): Element[] {
  const key = (ev: Element): number => timeOf(param(ev, 'when')) ?? Number.POSITIVE_INFINITY;
  return [...events].sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    if (ka === kb) return 0;
    if (!Number.isFinite(ka)) return 1;
    if (!Number.isFinite(kb)) return -1;
    return dir === 'oldest' ? ka - kb : kb - ka;
  });
}

/**
 * Wrap every case-insensitive occurrence of `needle` in the element's text
 * nodes with `mark.sem-search-hit`. Presentation-only: the authored nodes
 * survive verbatim and `unhighlight` puts the DOM back byte-for-byte.
 * Returns the number of occurrences wrapped.
 */
function highlight(ev: Element, needle: string): number {
  const walker = ev.ownerDocument!.createTreeWalker(ev, NodeFilter.SHOW_TEXT);
  const targets: Text[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = n as Text;
    const parent = t.parentElement;
    if (parent && parent.closest('mark.' + MARK_CLASS)) continue;
    if ((t.nodeValue ?? '').toLowerCase().includes(needle)) targets.push(t);
  }
  let count = 0;
  for (const node of targets) {
    const text = node.nodeValue ?? '';
    const lower = text.toLowerCase();
    const frag = node.ownerDocument!.createDocumentFragment();
    let pos = 0;
    let at = lower.indexOf(needle);
    while (at >= 0) {
      if (at > pos) frag.appendChild(node.ownerDocument!.createTextNode(text.slice(pos, at)));
      const mark = node.ownerDocument!.createElement('mark');
      mark.className = MARK_CLASS;
      mark.textContent = text.slice(at, at + needle.length);
      frag.appendChild(mark);
      count++;
      pos = at + needle.length;
      at = lower.indexOf(needle, pos);
    }
    if (pos < text.length) frag.appendChild(node.ownerDocument!.createTextNode(text.slice(pos)));
    node.replaceWith(frag);
  }
  return count;
}

/** Undo `highlight`: unwrap marks and re-merge the text they were cut from. */
function unhighlight(ev: Element): void {
  ev.querySelectorAll('mark.' + MARK_CLASS).forEach((m) => {
    m.replaceWith(m.ownerDocument!.createTextNode(m.textContent ?? ''));
  });
  ev.normalize();
}

/**
 * sem-chronology — Lit upgrade of the dated event sequence (tag form or
 * class alias). The schema's zero-JS tier is untouched: pure CSS renders
 * every event in document order, and with no script there is nothing in
 * the DOM but the authored markup. This tier wires a contextual Controls
 * menu — sort, filter (text + date range), search — as chrome
 * (.sem-chronology-chrome, skipped whole by extraction, hidden in print).
 *
 * View state never rewrites the record. Filtering toggles `hidden` on the
 * authored sem-event elements; search highlights via marks it can unwrap;
 * sorting moves the authored elements (references, never copies) and the
 * original order is kept, so "Document order" + "Reset all" restores the
 * DOM exactly as authored. The chrome announces result counts through an
 * aria-live region and dispatches `sem-chronology-change` (bubbles,
 * composed) with {sort, filter, from, to, query} whenever the state moves.
 */
export class SemChronology extends SemElement {
  #wired = false;
  #awaitingEvents = false;
  #events: Element[] = [];
  #order: Element[] = [];
  #sort: SortMode = 'document';
  #filter = '';
  #from = '';
  #to = '';
  #query = '';
  #hits: Element[] = [];
  #hitIndex = -1;
  #toggle!: HTMLButtonElement;
  #menu!: HTMLElement;
  #status!: HTMLElement;
  #onDocClick: ((e: MouseEvent) => void) | null = null;

  updated(): void {
    if (this.#wired) return;
    this.#events = Array.from(this.querySelectorAll(EVENT));
    if (this.#events.length === 0) {
      // upgraded pre-parse: children aren't there yet at first update
      this.#awaitEvents();
      return;
    }
    this.#wired = true;
    this.#order = [...this.#events];
    this.#wire();
  }

  #awaitEvents(): void {
    if (this.#awaitingEvents) return;
    this.#awaitingEvents = true;
    void this.whenChildrenReady(EVENT).then(() => {
      this.#awaitingEvents = false;
      this.requestUpdate();
    });
  }

  disconnectedCallback(): void {
    this.#closeMenu(false);
    super.disconnectedCallback();
  }

  /* ------------------------------------------------------------- */

  #wire(): void {
    const id = 'sem-chronology-' + ++uid;
    const doc = this.ownerDocument!;

    const chrome = doc.createElement('div');
    chrome.className = 'sem-chronology-chrome';
    chrome.innerHTML =
      '<button type="button" class="sem-chronology-toggle" aria-haspopup="menu"' +
      ' aria-expanded="false" aria-controls="' + id + '-menu">Controls</button>' +
      '<div class="sem-chronology-menu" id="' + id + '-menu" role="menu" hidden' +
      ' aria-label="Chronology controls">' +
      ' <div role="group" aria-label="Sort" class="sem-menu-group">' +
      '  <span class="sem-menu-label" aria-hidden="true">Sort</span>' +
      '  <button type="button" role="menuitemradio" data-sort="document" aria-checked="true">Document order</button>' +
      '  <button type="button" role="menuitemradio" data-sort="oldest" aria-checked="false">Oldest first</button>' +
      '  <button type="button" role="menuitemradio" data-sort="newest" aria-checked="false">Newest first</button>' +
      ' </div>' +
      ' <div role="separator" class="sem-menu-sep"></div>' +
      ' <div role="group" aria-label="Filter" class="sem-menu-group">' +
      '  <span class="sem-menu-label" aria-hidden="true">Filter</span>' +
      '  <input type="search" data-role="filter" aria-label="Filter entries by text" placeholder="Filter text">' +
      '  <label class="sem-menu-daterange">From <input type="date" data-role="from"></label>' +
      '  <label class="sem-menu-daterange">To <input type="date" data-role="to"></label>' +
      ' </div>' +
      ' <div role="separator" class="sem-menu-sep"></div>' +
      ' <div role="group" aria-label="Search" class="sem-menu-group">' +
      '  <span class="sem-menu-label" aria-hidden="true">Search</span>' +
      '  <input type="search" data-role="query" aria-label="Search entries" placeholder="Search">' +
      '  <button type="button" role="menuitem" data-act="prev" aria-label="Previous match">Previous</button>' +
      '  <button type="button" role="menuitem" data-act="next" aria-label="Next match">Next</button>' +
      ' </div>' +
      ' <div role="separator" class="sem-menu-sep"></div>' +
      ' <button type="button" role="menuitem" data-act="reset">Reset all</button>' +
      '</div>' +
      '<p class="sem-chronology-status" role="status" aria-live="polite"></p>';
    this.insertBefore(chrome, this.firstChild);

    this.#toggle = chrome.querySelector('.sem-chronology-toggle')!;
    this.#menu = chrome.querySelector('.sem-chronology-menu')!;
    this.#status = chrome.querySelector('.sem-chronology-status')!;

    this.#items().forEach((el, i) => el.setAttribute('tabindex', i === 0 ? '0' : '-1'));
    this.#announce(this.#events.length + ' of ' + this.#events.length + ' entries');

    this.#toggle.addEventListener('click', () => {
      if (this.#menu.hidden) this.#openMenu();
      else this.#closeMenu(true);
    });
    this.#toggle.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.#openMenu();
      }
    });
    this.#menu.addEventListener('keydown', (e) => this.#onMenuKey(e as KeyboardEvent));
    this.#menu.addEventListener('click', (e) => this.#onMenuClick(e));

    const filter = this.#menu.querySelector('[data-role="filter"]') as HTMLInputElement;
    const from = this.#menu.querySelector('[data-role="from"]') as HTMLInputElement;
    const to = this.#menu.querySelector('[data-role="to"]') as HTMLInputElement;
    const query = this.#menu.querySelector('[data-role="query"]') as HTMLInputElement;
    filter.addEventListener('input', () => {
      this.#filter = filter.value;
      this.#apply();
      this.#dispatch();
    });
    from.addEventListener('change', () => {
      this.#from = from.value;
      this.#apply();
      this.#dispatch();
    });
    to.addEventListener('change', () => {
      this.#to = to.value;
      this.#apply();
      this.#dispatch();
    });
    query.addEventListener('input', () => {
      this.#query = query.value;
      this.#search();
      this.#dispatch();
    });
  }

  /** Roving-tabindex sequence: every button and input in the menu. */
  #items(): HTMLElement[] {
    return Array.from(this.#menu.querySelectorAll<HTMLElement>('button, input'));
  }

  #openMenu(): void {
    if (!this.#menu.hidden) return;
    this.#menu.hidden = false;
    this.#toggle.setAttribute('aria-expanded', 'true');
    const current = this.#items().find((el) => el.getAttribute('tabindex') === '0');
    (current ?? this.#items()[0]).focus();
    this.#onDocClick = (e) => {
      if (!e.composedPath().includes(this.#menu) && e.target !== this.#toggle) this.#closeMenu(true);
    };
    this.ownerDocument!.addEventListener('click', this.#onDocClick);
  }

  /** Close the menu; with `refocus`, hand focus back to the toggle. */
  #closeMenu(refocus: boolean): void {
    if (this.#onDocClick) {
      this.ownerDocument?.removeEventListener('click', this.#onDocClick);
      this.#onDocClick = null;
    }
    if (this.#menu && !this.#menu.hidden) {
      this.#menu.hidden = true;
      this.#toggle.setAttribute('aria-expanded', 'false');
      if (refocus) this.#toggle.focus();
    }
  }

  /**
   * Menu keyboard contract: Escape closes and refocuses the toggle;
   * ArrowUp/ArrowDown move the roving focus (wrapping) from any item,
   * inputs included — Left/Right are left to the caret. Home/End jump to
   * the ends except inside a text field, where they are caret moves.
   */
  #onMenuKey(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.#closeMenu(true);
      return;
    }
    const items = this.#items();
    const at = items.indexOf(this.#menu.ownerDocument!.activeElement as HTMLElement);
    if (at < 0) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = (at + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      this.#roving(items, next);
    } else if ((e.key === 'Home' || e.key === 'End') && !(this.#menu.ownerDocument!.activeElement instanceof this.#menu.ownerDocument!.defaultView!.HTMLInputElement)) {
      e.preventDefault();
      this.#roving(items, e.key === 'Home' ? 0 : items.length - 1);
    } else if ((e.key === 'Enter' || e.key === ' ') && (this.#menu.ownerDocument!.activeElement as HTMLElement).getAttribute('role')?.startsWith('menuitemradio')) {
      // radios don't natively activate on Enter; Space clicks the button
      if (e.key === 'Enter') {
        e.preventDefault();
        (this.#menu.ownerDocument!.activeElement as HTMLElement).click();
      }
    }
  }

  #roving(items: HTMLElement[], next: number): void {
    items.forEach((el, i) => el.setAttribute('tabindex', i === next ? '0' : '-1'));
    items[next].focus();
  }

  #onMenuClick(e: MouseEvent): void {
    const t = e.target as HTMLElement;
    const radio = t.closest('[data-sort]') as HTMLElement | null;
    if (radio) {
      const sort = radio.getAttribute('data-sort') ?? 'document';
      this.#sort = sort as SortMode;
      this.#menu.querySelectorAll('[data-sort]').forEach((b) =>
        b.setAttribute('aria-checked', String(b === radio)),
      );
      this.#apply();
      this.#dispatch();
      return;
    }
    const act = t.closest('[data-act]')?.getAttribute('data-act');
    if (act === 'prev') this.#step(-1);
    if (act === 'next') this.#step(1);
    if (act === 'reset') this.#reset();
  }

  /* --- view state ----------------------------------------------- */

  #apply(): void {
    const fromMs = this.#from ? timeOf(this.#from) : null;
    const toMs = this.#to ? timeOf(this.#to) : null;
    const needle = this.#filter.trim().toLowerCase();
    let visible = 0;
    for (const ev of this.#events) {
      const show =
        (needle === '' || (ev.textContent ?? '').toLowerCase().includes(needle)) &&
        inRange(ev, fromMs, toMs);
      ev.toggleAttribute('hidden', !show);
      if (show) visible++;
    }
    const sorted =
      this.#sort === 'document' ? this.#order : sortByDate(this.#order, this.#sort);
    for (const ev of sorted) this.appendChild(ev); // moves the authored nodes
    this.#announce(visible + ' of ' + this.#events.length + ' entries');
    if (this.#query) this.#search();
  }

  #search(): void {
    for (const ev of this.#events) unhighlight(ev);
    this.#hits = [];
    this.#hitIndex = -1;
    for (const ev of this.#events) ev.removeAttribute('data-sem-current-hit');
    const needle = this.#query.trim().toLowerCase();
    if (needle === '') {
      this.#announce(this.#visibleCount() + ' of ' + this.#events.length + ' entries');
      return;
    }
    for (const ev of this.#currentOrder()) {
      if (ev.hasAttribute('hidden')) continue; // search the visible view
      if (highlight(ev, needle) > 0) this.#hits.push(ev);
    }
    if (this.#hits.length > 0) {
      this.#hitIndex = 0;
      this.#markHit();
      this.#announce('1 of ' + this.#hits.length + ' matches');
    } else {
      this.#announce('0 matches');
    }
  }

  #step(dir: 1 | -1): void {
    if (this.#hits.length === 0) return;
    this.#hitIndex = (this.#hitIndex + dir + this.#hits.length) % this.#hits.length;
    this.#markHit();
    this.#announce(this.#hitIndex + 1 + ' of ' + this.#hits.length + ' matches');
  }

  #markHit(): void {
    for (const ev of this.#events) ev.removeAttribute('data-sem-current-hit');
    const hit = this.#hits[this.#hitIndex];
    hit.setAttribute('data-sem-current-hit', '');
    if (typeof hit.scrollIntoView === 'function') hit.scrollIntoView({ block: 'nearest' });
  }

  /** Reset every control: original order, nothing hidden, no marks. */
  #reset(): void {
    this.#sort = 'document';
    this.#filter = '';
    this.#from = '';
    this.#to = '';
    this.#query = '';
    this.#menu.querySelectorAll('[data-sort]').forEach((b) =>
      b.setAttribute('aria-checked', String(b.getAttribute('data-sort') === 'document')),
    );
    (this.#menu.querySelector('[data-role="filter"]') as HTMLInputElement).value = '';
    (this.#menu.querySelector('[data-role="from"]') as HTMLInputElement).value = '';
    (this.#menu.querySelector('[data-role="to"]') as HTMLInputElement).value = '';
    (this.#menu.querySelector('[data-role="query"]') as HTMLInputElement).value = '';
    for (const ev of this.#events) {
      ev.removeAttribute('hidden');
      ev.removeAttribute('data-sem-current-hit');
      unhighlight(ev);
    }
    for (const ev of this.#order) this.appendChild(ev);
    this.#hits = [];
    this.#hitIndex = -1;
    this.#announce(this.#events.length + ' of ' + this.#events.length + ' entries');
    this.#dispatch();
  }

  /** The events in the order they currently stand in the DOM. */
  #currentOrder(): Element[] {
    return Array.from(this.querySelectorAll(EVENT));
  }

  #visibleCount(): number {
    return this.#events.filter((ev) => !ev.hasAttribute('hidden')).length;
  }

  #announce(text: string): void {
    this.#status.textContent = text;
  }

  #dispatch(): void {
    this.emit<SemChronologyChangeDetail>('sem-chronology-change', {
      sort: this.#sort,
      filter: this.#filter,
      from: this.#from,
      to: this.#to,
      query: this.#query,
    });
  }
}

SemElement.register('sem-chronology', SemChronology);
