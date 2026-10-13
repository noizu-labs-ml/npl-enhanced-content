// @vitest-environment happy-dom
// Unit spec — the semtext-demo plugin: the shell commands and the shipped
// manifest (src/terminal/plugins/demo/)
//
// Feature: the shell commands over the mounted demo tree
//   Scenario: ls lists entries with dirs marked; -l adds size and type
//   Scenario: cat prints several files; missing files and directories error per file
//   Scenario: cd/pwd with .. and absolute paths; cd onto a file is refused
//   Scenario: semtext filter / format --json / outline on the demo documents
//   Scenario: open refuses non-HTML with a clear message and emits nothing
//   Scenario: open accepts .html and emits a data-only window action
// Feature: the shipped manifest.json stays in sync with plugin.ts
//   Scenario: same name, version and file paths; every src exists on disk

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { TerminalCore, type ExecResult } from '../../src/terminal/terminal-core.js';
import { demoPlugin } from '../../src/terminal/plugins/demo/plugin.js';
import manifestJson from '../../src/terminal/plugins/demo/manifest.json';

let core: TerminalCore;

const out = (r: ExecResult): string[] => r.lines.filter((l) => l.kind === 'stdout').map((l) => l.text);
const errs = (r: ExecResult): string[] => r.lines.filter((l) => l.kind === 'stderr').map((l) => l.text);

beforeEach(() => {
  core = new TerminalCore();
  const result = core.mountPlugin(demoPlugin);
  if (!result.ok) throw new Error(result.error ?? 'demo plugin failed to mount');
});

describe('ls', () => {
  it('lists entries with directories marked', () => {
    const lines = out(core.execLine('ls'));
    expect(lines).toContain('demo/');
    expect(lines).toContain('README.md');
  });

  it('-l adds size and type', () => {
    const text = out(core.execLine('ls -l')).join('\n');
    expect(text).toMatch(/dir +- +demo\//);
    expect(text).toMatch(/text +\d+ +README\.md/);
  });

  it('a missing path errors', () => {
    expect(errs(core.execLine('ls nope'))).toEqual(['nope: no such file or directory']);
  });
});

describe('cat', () => {
  it('prints several files', () => {
    const text = out(core.execLine('cat demo/welcome.html demo/quiz.html')).join('\n');
    expect(text).toContain('<h1>Welcome</h1>');
    expect(text).toContain('<h1>Recall check</h1>');
  });

  it('missing files and directories error per file', () => {
    const result = core.execLine('cat nope demo');
    expect(errs(result)).toEqual(['nope: no such file or directory', 'cat: demo: is a directory']);
  });
});

describe('cd / pwd', () => {
  it('navigates with .. and absolute paths', () => {
    core.execLine('cd demo');
    expect(out(core.execLine('pwd'))).toEqual(['/demo']);
    core.execLine('cd ..');
    expect(out(core.execLine('pwd'))).toEqual(['/']);
    core.execLine('cd /demo');
    expect(out(core.execLine('pwd'))).toEqual(['/demo']);
  });

  it('cd onto a file or a missing path is refused', () => {
    expect(errs(core.execLine('cd README.md'))).toEqual(['cd: README.md: not a directory']);
    expect(errs(core.execLine('cd nope'))).toEqual(['cd: nope: no such file or directory']);
  });
});

describe('semtext', () => {
  it('outline renders the document skeleton', () => {
    const lines = out(core.execLine('semtext outline demo/token-rotation.html'));
    expect(lines[0]).toBe('h1 Token Rotation');
    expect(lines).toContain('  sem-properties glossary');
    expect(lines).toContain('  h2 Rotation');
    expect(lines).toContain('    sem-note tip');
    expect(lines).toContain('    sem-code src/rotate.ts');
  });

  it('format --json emits the canonical record array', () => {
    const records = JSON.parse(out(core.execLine('semtext format demo/quiz.html --json')).join('\n'));
    expect(records.some((r: { type: string }) => r.type === 'sem-fact')).toBe(true);
  });

  it('filter selects by type and by text', () => {
    expect(out(core.execLine('semtext filter demo/token-rotation.html --type sem-note')).join('\n')).toContain('<sem-note variant="tip">');
    expect(out(core.execLine('semtext filter demo/token-rotation.html --text Proof Key')).join('\n')).toContain('key="PKCE"');
  });

  it('filter without criteria and unknown subcommands error', () => {
    expect(errs(core.execLine('semtext filter demo/quiz.html')).join(' ')).toMatch(/--type/);
    expect(errs(core.execLine('semtext bogus demo/quiz.html')).join(' ')).toMatch(/unknown subcommand/);
  });
});

describe('open', () => {
  it('refuses non-HTML with a clear message and emits nothing', () => {
    const result = core.execLine('open README.md');
    expect(errs(result)).toEqual(['open: README.md: not an HTML document (only .html files open)']);
    expect(result.actions).toEqual([]);
  });

  it('accepts .html and emits a data-only window action with the exact bytes', () => {
    const result = core.execLine('open demo/welcome.html');
    expect(errs(result)).toEqual([]);
    expect(result.actions).toHaveLength(1);
    expect(result.actions[0].kind).toBe('window');
    expect(result.actions[0].filename).toBe('welcome.html');
    expect(result.actions[0].contentType).toBe('text/html');
    expect((result.actions[0] as { blob: string }).blob).toContain('<h1>Welcome</h1>');
  });

  it('a missing file errors', () => {
    expect(errs(core.execLine('open nope.html'))).toEqual(['nope.html: no such file or directory']);
  });
});

describe('manifest.json <-> plugin.ts sync', () => {
  it('same name, version and file paths; every src exists on disk', () => {
    expect(manifestJson.name).toBe(demoPlugin.name);
    expect(manifestJson.version).toBe(demoPlugin.version);
    const jsonPaths = manifestJson.files.map((f) => f.path).sort();
    const tsPaths = demoPlugin.files.map((f) => f.path).sort();
    expect(jsonPaths).toEqual(tsPaths);
    const base = resolve('src/terminal/plugins/demo');
    for (const entry of manifestJson.files) {
      expect(readFileSync(join(base, entry.src!), 'utf8').length).toBeGreaterThan(0);
    }
  });
});
