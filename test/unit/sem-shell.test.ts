// @vitest-environment happy-dom
// Unit spec — the elements: <sem-terminal> (core) and <sem-shell> (the
// SemText demo configured on top of it)
//
// Feature: zero-JS contract
//   Scenario: authored children are the static transcript (no input element)
//   Scenario: the upgrade replaces them with a live region + prompt
// Feature: the core stays SemText-free
//   Scenario: a bare <sem-terminal> has no demo commands
// Feature: the demo plugin on <sem-shell>
//   Scenario: boot reports the local mount and the refused CDN demo plugin
//   Scenario: ls / semtext run through the prompt
// Feature: terminal mechanics
//   Scenario: up/down history with draft restore; Ctrl+L clears
// Feature: open
//   Scenario: non-HTML refused with a stderr line, no window
//   Scenario: .html opens a blob window with noopener,noreferrer
// Feature: plugins attribute
//   Scenario: a failing manifest URL prints a line and is recorded; the terminal keeps working

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '../../src/terminal/sem-terminal.js';
import '../../src/shell/sem-shell.js';
import { SemTerminal } from '../../src/terminal/sem-terminal.js';
import { SemShell } from '../../src/shell/sem-shell.js';

type Opened = { url: string; target: string; features: string };

let opened: Opened[];
let realOpen: typeof window.open;

const inputOf = (el: SemTerminal): HTMLInputElement =>
  el.querySelector('.sem-shell-input') as HTMLInputElement;

function type(el: SemTerminal, command: string): void {
  const input = inputOf(el);
  input.value = command;
  input.closest('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

async function attach(tag: string): Promise<SemTerminal> {
  const el = document.createElement(tag) as SemTerminal;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

beforeEach(() => {
  opened = [];
  realOpen = window.open;
  window.open = ((url: string, target: string, features: string) => {
    opened.push({ url, target, features });
    return window;
  }) as typeof window.open;
});

afterEach(() => {
  window.open = realOpen;
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('zero-JS contract', () => {
  it('authored children are the static transcript, with no input element', () => {
    const el = document.createElement('sem-shell') as SemShell;
    el.innerHTML =
      '<div class="sem-shell-frame"><div class="sem-shell-transcript" role="log"><div class="sem-shell-line">$ ls</div></div></div>';
    expect(el.querySelector('.sem-shell-input')).toBeNull();
    document.body.appendChild(el);
    return el.updateComplete.then(() => {
      expect(el.querySelector('.sem-shell-input')).not.toBeNull();
      expect(el.textContent).not.toContain('$ ls');
      expect(el.querySelector('[role="log"]')).not.toBeNull();
      expect(el.querySelector('[role="log"]')!.getAttribute('aria-live')).toBe('polite');
    });
  });
});

describe('the core stays SemText-free', () => {
  it('a bare <sem-terminal> has no demo commands', async () => {
    const el = await attach('sem-terminal');
    type(el, 'ls');
    await el.updateComplete;
    expect(el.lines.some((l) => l.kind === 'stderr' && l.text.includes('command not found: ls'))).toBe(true);
    expect(el.lines.some((l) => l.text.includes('demo/'))).toBe(false);
  });

  it('a failing plugins URL prints a line, is recorded, and the terminal keeps working', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('network down');
      }),
    );
    const el = document.createElement('sem-terminal') as SemTerminal;
    el.setAttribute('plugins', 'one.json two.json');
    document.body.appendChild(el);
    await el.updateComplete;
    await vi.waitFor(() => expect(el.core.loadErrors).toHaveLength(2));
    await el.updateComplete;
    expect(el.lines.some((l) => l.kind === 'stderr' && l.text.includes('one.json'))).toBe(true);
    type(el, 'help');
    await el.updateComplete;
    expect(el.lines.some((l) => l.kind === 'stdout' && l.text === 'commands:')).toBe(true);
  });
});

describe('<sem-shell> — the demo plugin', () => {
  it('boots with the local mount and the refused CDN demo plugin', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const el = await attach('sem-shell');
    expect(el.lines.some((l) => l.text.includes('semtext-demo 0.1.0 mounted'))).toBe(true);
    await vi.waitFor(() =>
      expect(el.lines.some((l) => l.kind === 'stderr' && l.text.includes('integrity'))).toBe(true),
    );
    expect(fetchMock).not.toHaveBeenCalled(); // refused before any network request
    expect(el.core.loadErrors).toHaveLength(1);
    expect(el.core.hasCommand('semtext')).toBe(true);
  });

  it('ls and semtext run through the prompt', async () => {
    const el = await attach('sem-shell');
    type(el, 'ls');
    type(el, 'semtext outline demo/welcome.html');
    await el.updateComplete;
    expect(el.lines.some((l) => l.kind === 'stdout' && l.text === 'demo/')).toBe(true);
    expect(el.lines.some((l) => l.kind === 'stdout' && l.text.startsWith('h1 Welcome'))).toBe(true);
    expect(el.cwd).toBe('/');
  });
});

describe('terminal mechanics', () => {
  it('up/down history with draft restore; Ctrl+L clears', async () => {
    const el = await attach('sem-shell');
    type(el, 'ls');
    type(el, 'pwd');
    const input = inputOf(el);
    input.value = 'draft text';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(input.value).toBe('ls');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(input.value).toBe('pwd');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(input.value).toBe('draft text');
    el.lines = [...el.lines, { kind: 'stdout', text: 'filler' }];
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'l', ctrlKey: true }));
    expect(el.lines).toEqual([]);
  });
});

describe('open', () => {
  it('non-HTML refused with a stderr line, no window', async () => {
    const el = await attach('sem-shell');
    type(el, 'open README.md');
    await el.updateComplete;
    expect(el.lines.some((l) => l.kind === 'stderr' && l.text.includes('not an HTML document'))).toBe(true);
    expect(opened).toEqual([]);
  });

  it('.html opens a blob window with noopener,noreferrer', async () => {
    const el = await attach('sem-shell');
    type(el, 'open demo/welcome.html');
    await el.updateComplete;
    expect(opened).toHaveLength(1);
    expect(opened[0].target).toBe('_blank');
    expect(opened[0].features).toBe('noopener,noreferrer');
    expect(opened[0].url).toMatch(/^blob:/);
  });
});
