/**
 * reading/reader — sem-reader: outline, progress and reader-side controls.
 *
 * Spec: spec/schema/sem-reader.md. One chrome per document, idempotent on
 * the chrome's presence so the bundle scan and the Lit wrapper may both
 * run. The reader writes three places and reads them back: attributes on
 * <html> (`data-sem-mode`, `data-sem-type`, `data-sem-font`,
 * `data-color-mode`) which the vocabulary CSS keys on; the `sem-audience`
 * hash parameter (shared/state) which the audience fallback applies; and
 * localStorage (fail-open) for the per-reader preferences. It never sets
 * `hidden` and never touches content — extraction skips it entirely.
 *
 * No global key bindings: `Escape` is handled only while focus is inside
 * the reader (spec a11y contract). Written tight: this is the largest
 * module in a budgeted bundle.
 */

import { param } from '../shared/attr.js';
import { parseProfiles } from '../shared/audience.js';
import { getParam, setParam, readLocal, writeLocal } from '../shared/state.js';

export const READER = ':is(sem-reader, .sem-reader)';
const WRAPPER = ':is(sem-enhanced-document, .sem-enhanced-document)';
const SIZES = ['s', 'm', 'l'];
const KEY = 'sem-reader:';
/** Attribute on <html> per persisted preference. */
const ATTR: Record<string, string> = {
  mode: 'data-sem-mode', type: 'data-sem-type', font: 'data-sem-font', color: 'data-color-mode',
};
/** Two-state toggles: act → [preference, on-value]. */
const TOGGLE: Record<string, [string, string]> = { focus: ['mode', 'focus'], font: ['font', 'serif'] };

const root = (): HTMLElement => document.documentElement;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.className = cls;
  if (text) e.textContent = text;
  return e;
}

function get(pref: string): string {
  return root().getAttribute(ATTR[pref]) || '';
}

/** Apply a preference to <html> (empty removes) and persist it, fail-open. */
function set(pref: string, value: string): void {
  if (value) root().setAttribute(ATTR[pref], value);
  else root().removeAttribute(ATTR[pref]);
  writeLocal(KEY + pref, value);
}

function outline(reader: Element, depth: number): HTMLElement {
  const nav = el('nav', 'sem-reader-outline');
  nav.setAttribute('aria-label', 'Contents');
  const scope = reader.closest(WRAPPER) || document.body;
  let sel = '';
  for (let l = 2; l <= depth; l++) sel += (sel ? ',h' : 'h') + l;
  // The root list is the h2 level: sibling h2s stay flat, an h3 nests
  // under the h2 before it, a leading h3 with no h2 sits at the root.
  const stack: { level: number; list: HTMLOListElement }[] = [{ level: 2, list: el('ol', '') }];
  nav.appendChild(stack[0].list);
  let n = 0;
  scope.querySelectorAll<HTMLElement>(sel).forEach((h) => {
    if (reader.contains(h)) return;
    // an id on a heading that mints a record would change extraction
    if (!h.id && (param(h, 'kind') !== null || param(h, 'tags') !== null)) return;
    if (!h.id) h.id = 'sem-h-' + ++n;
    const level = +h.tagName[1];
    while (stack.length > 1 && stack[stack.length - 1].level >= level) stack.pop();
    let top = stack[stack.length - 1];
    const last = top.list.lastElementChild;
    if (level > top.level && last) {
      top = { level, list: el('ol', '') };
      last.appendChild(top.list);
      stack.push(top);
    }
    const a = el('a', '', h.textContent!.trim() || h.id);
    a.href = '#' + h.id;
    top.list.appendChild(el('li', '')).appendChild(a);
  });
  return nav;
}

/** `aria-current="location"` on the link of the topmost heading in view. */
function track(nav: HTMLElement): void {
  if (typeof IntersectionObserver == 'undefined') return;
  const links = new Map<Element, Element>();
  nav.querySelectorAll('a[href^="#"]').forEach((a) => {
    const t = document.getElementById(decodeURIComponent(a.getAttribute('href')!.slice(1)));
    if (t) links.set(t, a);
  });
  const targets = Array.from(links.keys());
  const visible = new Set<Element>();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
    const first = targets.find((t) => visible.has(t));
    if (first) links.forEach((a, t) => (t == first ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current')));
  }, { rootMargin: '0px 0px -40% 0px' });
  targets.forEach((t) => io.observe(t));
}

function progress(chrome: HTMLElement): void {
  const bar = el('div', 'sem-reader-progress');
  bar.setAttribute('aria-hidden', 'true');
  const fill = bar.appendChild(el('div', 'sem-reader-progress-fill'));
  chrome.appendChild(bar);
  const update = (): void => {
    const d = root();
    const max = d.scrollHeight - d.clientHeight;
    fill.style.width = (max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0).toFixed(1) + '%';
  };
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  update();
}

function select(cls: string, label: string, options: [string, string][]): HTMLSelectElement {
  const s = el('select', cls);
  s.setAttribute('aria-label', label);
  options.forEach(([v, t]) => {
    const o = s.appendChild(el('option', '', t));
    o.value = v;
  });
  return s;
}

export function enhanceReaderElement(reader: Element): void {
  if (reader.querySelector(':scope > .sem-reader-chrome')) return;
  for (const pref in ATTR) {
    const v = readLocal(KEY + pref);
    if (v) root().setAttribute(ATTR[pref], v);
  }
  const controls = (param(reader, 'controls') ?? 'outline,progress').split(/[,\s]+/);
  const has = (c: string): boolean => controls.indexOf(c) >= 0;

  const chrome = el('div', 'sem-reader-chrome');
  chrome.setAttribute('role', 'region');
  chrome.setAttribute('aria-label', 'Reading controls');
  const button = (act: string, text: string, pressed?: boolean): HTMLButtonElement => {
    const b = chrome.appendChild(el('button', '', text));
    b.type = 'button';
    b.setAttribute('data-act', act);
    if (pressed !== undefined) b.setAttribute('aria-pressed', String(pressed));
    return b;
  };

  let nav: HTMLElement | null = null;
  let toggle: HTMLButtonElement | null = null;
  if (has('outline')) {
    nav = reader.querySelector<HTMLElement>(':scope > nav[aria-label="Contents"]');
    if (!nav) {
      const depth = Math.min(6, Math.max(2, +(param(reader, 'outline-depth') || 3) || 3));
      nav = reader.appendChild(outline(reader, depth));
    }
    if (!nav.id) nav.id = (reader.id || 'sem-reader') + '-outline';
    nav.hidden = true;
    toggle = button('outline', 'Contents');
    toggle.className = 'sem-reader-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', nav.id);
    track(nav);
  }
  if (has('progress')) progress(chrome);
  if (has('focus')) button('focus', 'Focus', get('mode') == 'focus');

  const size = (): number => Math.max(0, SIZES.indexOf(get('type') || 'm'));
  const steps: HTMLButtonElement[] = [];
  if (has('type')) {
    steps.push(button('type-down', 'A−'), button('type-up', 'A+'));
    steps[0].setAttribute('aria-label', 'Smaller type');
    steps[1].setAttribute('aria-label', 'Larger type');
    button('font', 'Serif', get('font') == 'serif');
  }
  const syncType = (): void => {
    if (!steps.length) return;
    steps[0].disabled = size() == 0;
    steps[1].disabled = size() == 2;
  };
  syncType();

  if (has('color')) {
    const s = chrome.appendChild(select('sem-reader-color', 'Colour scheme', [['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']]));
    s.value = get('color') || 'auto';
    s.addEventListener('change', () => set('color', s.value == 'auto' ? '' : s.value));
  }
  if (has('print')) button('print', 'Print');
  if (has('audience')) {
    const profiles = parseProfiles(document);
    if (profiles.length) {
      const s = chrome.appendChild(select('sem-reader-audience', 'Audience',
        [['', 'Everyone'] as [string, string]].concat(profiles.map((p) => [p.id, p.label || p.id] as [string, string]))));
      const reflect = (): void => { s.value = getParam('sem-audience') || ''; };
      s.addEventListener('change', () => setParam('sem-audience', s.value || null));
      addEventListener('hashchange', reflect);
      reflect();
    }
  }

  reader.insertBefore(chrome, reader.firstChild);

  const open = (on: boolean): void => {
    if (!nav) return;
    nav.hidden = !on;
    toggle!.setAttribute('aria-expanded', String(on));
  };

  chrome.addEventListener('click', (e) => {
    const b = (e.target as Element).closest('button');
    const act = b && b.getAttribute('data-act');
    if (!act) return;
    if (act == 'outline') open(nav!.hidden);
    else if (act == 'print') window.print();
    else if (TOGGLE[act]) {
      const [pref, on] = TOGGLE[act];
      const next = get(pref) != on;
      set(pref, next ? on : '');
      b.setAttribute('aria-pressed', String(next));
    } else {
      const i = size() + (act == 'type-up' ? 1 : -1);
      if (SIZES[i]) set('type', SIZES[i]);
      syncType();
    }
  });

  if (nav) {
    nav.addEventListener('click', (e) => { if ((e.target as Element).closest('a')) open(false); });
    reader.addEventListener('keydown', (e) => {
      if ((e as KeyboardEvent).key != 'Escape' || nav!.hidden) return;
      open(false);
      toggle!.focus();
    });
  }
}
