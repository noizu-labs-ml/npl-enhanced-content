// Unit spec — the virtual file system plugins mount into (src/terminal/vfs.ts)
//
// Feature: POSIX-style path resolution over the in-memory tree
//   Scenario: relative paths resolve against the cwd
//   Scenario: absolute paths escape the cwd
//   Scenario: `..` pops, clamped at the root; `.` and empty segments collapse
//   Scenario: empty input resolves to the cwd itself
// Feature: mounting
//   Scenario: a fresh Vfs is empty
//   Scenario: mountFile creates intermediate directories
//   Scenario: remounting a path replaces its content (last write wins)
//   Scenario: relative and `..` mount paths are refused; walking through a file is refused

import { describe, it, expect } from 'vitest';
import { resolvePath, Vfs } from '../../src/terminal/vfs.js';

describe('resolvePath', () => {
  it('resolves relative paths against the cwd', () => {
    expect(resolvePath('/', 'demo')).toBe('/demo');
    expect(resolvePath('/demo', 'quiz.html')).toBe('/demo/quiz.html');
  });

  it('absolute paths escape the cwd', () => {
    expect(resolvePath('/demo', '/README.md')).toBe('/README.md');
  });

  it('pops `..`, clamped at the root, and collapses `.` and empty segments', () => {
    expect(resolvePath('/demo', '..')).toBe('/');
    expect(resolvePath('/demo', '../demo/quiz.html')).toBe('/demo/quiz.html');
    expect(resolvePath('/a/b', '../../..')).toBe('/');
    expect(resolvePath('/', '.')).toBe('/');
    expect(resolvePath('/a', 'b//c/')).toBe('/a/b/c');
  });

  it('empty input resolves to the cwd itself', () => {
    expect(resolvePath('/', '')).toBe('/');
    expect(resolvePath('/demo', '')).toBe('/demo');
  });
});

describe('Vfs mounting', () => {
  it('a fresh Vfs is empty', () => {
    const vfs = new Vfs();
    expect(vfs.nodeAt('/')).not.toBeNull();
    expect(vfs.list('/')).toEqual([]);
    expect(vfs.read('/README.md')).toBeNull();
  });

  it('mountFile creates intermediate directories', () => {
    const vfs = new Vfs();
    vfs.mountFile('/demo/nested/doc.html', 'x');
    expect(vfs.nodeAt('/demo/nested')?.kind).toBe('dir');
    expect(vfs.read('/demo/nested/doc.html')).toBe('x');
  });

  it('remounting a path replaces its content (last write wins)', () => {
    const vfs = new Vfs();
    vfs.mountFile('/demo/doc.html', 'one');
    vfs.mountFile('/demo/doc.html', 'two');
    expect(vfs.read('/demo/doc.html')).toBe('two');
    expect(vfs.list('/demo')).toHaveLength(1);
  });

  it('refuses relative and `..` mount paths, and walking through a file', () => {
    const vfs = new Vfs();
    expect(() => vfs.mountFile('demo/doc.html', 'x')).toThrow(/absolute/);
    expect(() => vfs.mountFile('/a/../doc.html', 'x')).toThrow(/\.\./);
    expect(() => vfs.mountFile('/', 'x')).toThrow(/root/);
    vfs.mountFile('/f.txt', 'x');
    expect(() => vfs.mountFile('/f.txt/child', 'x')).toThrow(/walks through a file/);
    expect(() => vfs.mountFile('/f.txt', 'ok')).not.toThrow(); // file overwrite is fine
  });
});
