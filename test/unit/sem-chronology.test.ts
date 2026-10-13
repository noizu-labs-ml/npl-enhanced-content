// @vitest-environment happy-dom
// Unit spec — sem-chronology / SemChronology (spec/schema/sem-chronology.md)
//
// Feature: the Lit tier wires a contextual Controls menu over the unchanged
//          zero-JS timeline; controls are view state and never rewrite the
//          authored events
//   Scenario: sort — oldest first, newest first, document order restored
//   Scenario: text filter — matching entries stay, the rest hide
//   Scenario: date-range filter — interval intersection on when/until
//   Scenario: search — highlights, next/previous step with wrapping
//   Scenario: Escape closes the menu and returns focus to the toggle
//   Scenario: roving tabindex — arrows move between items and wrap
//   Scenario: sem-chronology-change carries {sort, filter, from, to, query}
//   Scenario: no-JS markup — the authored output carries no controls
//   Scenario: controls never rewrite the source markup

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SemChronology } from '../../src/lit/sem-chronology.js';
import { enhance } from '../../src/fallback/index.js';

const FIXTURE = `
<sem-chronology id="c" role="list">
  <sem-event role="listitem" id="e-mar" when="2026-03-02" status="done"><time datetime="2026-03-02">2 Mar 2026</time> v0.1 tagged — Lit bundle ships.</sem-event>
  <sem-event role="listitem" id="e-jan" when="2026-01-15"><time datetime="2026-01-15">15 Jan 2026</time> Spec draft circulates.</sem-event>
  <sem-event role="listitem" id="e-jun" when="2026-06" until="2026-08" status="current"><time datetime="2026-06">Jun–Aug 2026</time> Reading-experience waves.</sem-event>
  <sem-event role="listitem" id="e-q4" when="2026-Q4">Theme pipeline.</sem-event>
</sem-chronology>`;

let el: HTMLElement;
let menu: HTMLElement;

const eventIds = (): string[] =>
  Array.from(el.querySelectorAll(':scope > sem-event')).map((e) => e.id);

const visibleIds = (): string[] =>
  Array.from(el.querySelectorAll(':scope > sem-event'))
    .filter((e) => !e.hasAttribute('hidden'))
    .map((e) => e.id);

const q = <T extends Element>(selector: string): T => menu.querySelector<T>(selector)!;

const clickSort = (sort: string): void => q(`[data-sort="${sort}"]`).click();

const setFilter = (value: string): void => {
  const input = q<HTMLInputElement>('[data-role="filter"]');
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
};

const setRange = (from: string, to: string): void => {
  const f = q<HTMLInputElement>('[data-role="from"]');
  const t = q<HTMLInputElement>('[data-role="to"]');
  if (from !== undefined) {
    f.value = from;
    f.dispatchEvent(new Event('change', { bubbles: true }));
  }
  if (to !== undefined) {
    t.value = to;
    t.dispatchEvent(new Event('change', { bubbles: true }));
  }
};

const setQuery = (value: string): void => {
  const input = q<HTMLInputElement>('[data-role="query"]');
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
};

const status = (): string => menu.parentElement!.querySelector<HTMLElement>('.sem-chronology-status')!.textContent ?? '';

describe('sem-chronology controls', () => {
  beforeEach(async () => {
    document.body.innerHTML = FIXTURE;
    el = document.getElementById('c') as HTMLElement;
    await el.updateComplete;
    menu = el.querySelector<HTMLElement>('.sem-chronology-menu')!;
    expect(menu).not.toBeNull();
  });

  it('wires the chrome: toggle, live region, document order default', () => {
    const toggle = el.querySelector<HTMLButtonElement>('.sem-chronology-toggle')!;
    expect(toggle.getAttribute('aria-haspopup')).toBe('menu');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(menu.hidden).toBe(true);
    expect(menu.getAttribute('role')).toBe('menu');
    expect(el.querySelector<HTMLElement>('.sem-chronology-status')!.getAttribute('aria-live')).toBe('polite');
    expect(eventIds()).toEqual(['e-mar', 'e-jan', 'e-jun', 'e-q4']);
    expect(status()).toBe('4 of 4 entries');
  });

  it('sorts oldest first — unparseable dates sink below the dated ones', () => {
    clickSort('oldest');
    expect(eventIds()).toEqual(['e-jan', 'e-mar', 'e-jun', 'e-q4']);
    expect(q('[data-sort="oldest"]').getAttribute('aria-checked')).toBe('true');
    expect(q('[data-sort="document"]').getAttribute('aria-checked')).toBe('false');
  });

  it('sorts newest first', () => {
    clickSort('newest');
    expect(eventIds()).toEqual(['e-jun', 'e-mar', 'e-jan', 'e-q4']);
  });

  it('restores document order from the sort control', () => {
    clickSort('newest');
    expect(eventIds()).not.toEqual(['e-mar', 'e-jan', 'e-jun', 'e-q4']);
    clickSort('document');
    expect(eventIds()).toEqual(['e-mar', 'e-jan', 'e-jun', 'e-q4']);
  });

  it('filters by free text on entry text', () => {
    setFilter('waves');
    expect(visibleIds()).toEqual(['e-jun']);
    expect(status()).toBe('1 of 4 entries');
    setFilter('');
    expect(visibleIds()).toEqual(['e-mar', 'e-jan', 'e-jun', 'e-q4']);
    expect(status()).toBe('4 of 4 entries');
  });

  it('filters by date range: [from, to] brackets when; until extends a period', () => {
    setRange('2026-02-01', '2026-05-31');
    expect(visibleIds()).toEqual(['e-mar']);
    expect(status()).toBe('1 of 4 entries');
    setRange('2026-07-01', '');
    // Jun–Aug overlaps July through its `until`; the dated singles don't
    expect(visibleIds()).toEqual(['e-jun']);
    setRange('', '');
    expect(visibleIds()).toEqual(['e-mar', 'e-jan', 'e-jun', 'e-q4']);
  });

  it('hides unparseable dates once a range is set', () => {
    setRange('2026-01-01', undefined);
    expect(visibleIds()).toEqual(['e-mar', 'e-jan', 'e-jun']);
  });

  it('search highlights matches and steps next/previous with wrapping', () => {
    setQuery('e');
    const marks = el.querySelectorAll('mark.sem-search-hit');
    expect(marks.length).toBeGreaterThan(0);
    expect(status()).toBe('1 of 4 matches');
    const current = (): string | null =>
      el.querySelector('sem-event[data-sem-current-hit]')?.id ?? null;
    expect(current()).toBe('e-mar'); // document order
    const next = q('[data-act="next"]');
    const prev = q('[data-act="prev"]');
    next.click();
    expect(current()).toBe('e-jan');
    expect(status()).toBe('2 of 4 matches');
    prev.click();
    expect(current()).toBe('e-mar');
    prev.click(); // wraps to the last hit
    expect(current()).toBe('e-q4');
    expect(status()).toBe('4 of 4 matches');
    next.click(); // wraps forward again
    expect(current()).toBe('e-mar');
    next.click();
    next.click();
    next.click();
    next.click(); // a full loop returns to the start
    expect(current()).toBe('e-mar');
  });

  it('single hit reports itself; clearing the query unwraps every mark', () => {
    setQuery('waves');
    expect(status()).toBe('1 of 1 matches');
    expect(el.querySelectorAll('mark.sem-search-hit').length).toBe(1);
    setQuery('');
    expect(el.querySelectorAll('mark.sem-search-hit').length).toBe(0);
    expect(el.querySelector('sem-event[data-sem-current-hit]')).toBeNull();
  });

  it('Escape closes the menu and returns focus to the toggle', () => {
    const toggle = el.querySelector<HTMLButtonElement>('.sem-chronology-toggle')!;
    toggle.click();
    expect(menu.hidden).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    q<HTMLInputElement>('[data-role="filter"]').focus();
    q<HTMLInputElement>('[data-role="filter"]').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    expect(menu.hidden).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(toggle);
  });

  it('moves roving focus with the arrow keys, wrapping at both ends', () => {
    el.querySelector<HTMLButtonElement>('.sem-chronology-toggle')!.click();
    const items = Array.from(menu.querySelectorAll<HTMLElement>('button, input'));
    expect(document.activeElement).toBe(items[0]);
    items[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement).toBe(items[1]);
    items[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(document.activeElement).toBe(items[0]);
    items[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(document.activeElement).toBe(items[items.length - 1]); // wrap up
    items[items.length - 1].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    expect(document.activeElement).toBe(items[0]); // wrap down
    expect(items[0].getAttribute('tabindex')).toBe('0');
    expect(items[1].getAttribute('tabindex')).toBe('-1');
  });

  it('Enter activates a radio item', () => {
    el.querySelector<HTMLButtonElement>('.sem-chronology-toggle')!.click();
    const oldest = q<HTMLElement>('[data-sort="oldest"]');
    oldest.focus();
    oldest.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    expect(eventIds()).toEqual(['e-jan', 'e-mar', 'e-jun', 'e-q4']);
  });

  it('dispatches sem-chronology-change with the full state on every change', () => {
    const seen: unknown[] = [];
    el.addEventListener('sem-chronology-change', (e) => {
      const ev = e as CustomEvent;
      expect(ev.bubbles).toBe(true);
      expect(ev.composed).toBe(true);
      seen.push({ ...ev.detail });
    });
    clickSort('oldest');
    setFilter('waves');
    setRange('2026-02-01', undefined);
    setQuery('e');
    expect(seen).toEqual([
      { sort: 'oldest', filter: '', from: '', to: '', query: '' },
      { sort: 'oldest', filter: 'waves', from: '', to: '', query: '' },
      { sort: 'oldest', filter: 'waves', from: '2026-02-01', to: '', query: '' },
      { sort: 'oldest', filter: 'waves', from: '2026-02-01', to: '', query: 'e' },
    ]);
  });

  it('Reset all restores the authored events and chrome exactly', () => {
    // Moves leave sibling whitespace behind, so equality is asserted per
    // record: the events' own markup and the chrome must come back verbatim.
    const authoredEvents = eventIds()
      .map((id) => el.querySelector('#' + id)!.outerHTML)
      .join('\n');
    const authoredChrome = el.querySelector('.sem-chronology-chrome')!.outerHTML;
    clickSort('newest');
    setFilter('waves');
    setRange('2026-02-01', undefined);
    setQuery('e');
    q('[data-act="prev"]').click();
    q('[data-act="reset"]').click();
    expect(
      eventIds().map((id) => el.querySelector('#' + id)!.outerHTML).join('\n'),
    ).toBe(authoredEvents);
    expect(el.querySelector('.sem-chronology-chrome')!.outerHTML).toBe(authoredChrome);
    expect(eventIds()).toEqual(['e-mar', 'e-jan', 'e-jun', 'e-q4']);
    expect(visibleIds()).toEqual(['e-mar', 'e-jan', 'e-jun', 'e-q4']);
    expect(el.querySelectorAll('mark.sem-search-hit').length).toBe(0);
    expect(q<HTMLInputElement>('[data-role="filter"]').value).toBe('');
    expect(q<HTMLInputElement>('[data-role="query"]').value).toBe('');
    expect(q('[data-sort="document"]').getAttribute('aria-checked')).toBe('true');
    expect(status()).toBe('4 of 4 entries');
  });

  it('combined sort + filter keeps the visible set stable while reordering', () => {
    clickSort('oldest');
    setFilter('2026');
    // every entry text carries a date label except e-q4 ("Theme pipeline.")
    expect(visibleIds()).toEqual(['e-jan', 'e-mar', 'e-jun']);
    expect(eventIds()).toEqual(['e-jan', 'e-mar', 'e-jun', 'e-q4']);
  });
});

describe('sem-chronology no-JS contract', () => {
  it('registers the element this spec upgrades', () => {
    expect(customElements.get('sem-chronology')).toBe(SemChronology);
  });

  it('a not-yet-connected element carries no controls', () => {
    const detached = document.createElement('sem-chronology');
    detached.innerHTML = '<sem-event when="2026-01-01">Only.</sem-event>';
    expect(detached.querySelector('.sem-chronology-chrome')).toBeNull();
  });

  it('the vanilla fallback wires no chronology chrome (class form stays zero-JS)', () => {
    document.body.innerHTML =
      '<div class="sem-chronology" id="cc" role="list">' +
      '<div class="sem-event" role="listitem" data-when="2026-01-01">Only.</div></div>';
    enhance(document);
    const cc = document.getElementById('cc')!;
    expect(cc.hasAttribute('data-sem-upgraded')).toBe(false);
    expect(cc.querySelector('.sem-chronology-chrome')).toBeNull();
  });

  it('the server-rendered demo pages ship no controls markup', () => {
    for (const page of ['web/demo/reading.html', 'web/demo/reading-lit.html']) {
      const source = readFileSync(resolve(process.cwd(), page), 'utf8');
      expect(source).toContain('sem-chronology');
      expect(source).not.toContain('sem-chronology-chrome');
      expect(source).not.toContain('sem-chronology-toggle');
    }
  });
});
