/**
 * sem-terminal — the virtual file system plugins mount into.
 *
 * An in-memory POSIX-ish tree with NO built-in content: a fresh `Vfs` is
 * empty, and everything in it arrives through a plugin manifest
 * (`mountFile`, usually via `TerminalCore.mountPlugin`). Paths are absolute
 * strings resolved against a cwd; there is no IO, no async, no browser
 * dependency — the whole module unit-tests in plain Node.
 */

export interface VfsFile {
  kind: 'file';
  name: string;
  content: string;
}

export interface VfsDir {
  kind: 'dir';
  name: string;
  children: VfsNode[];
}

export type VfsNode = VfsFile | VfsDir;

/**
 * Resolve `input` against `cwd` to a normalized absolute path. Pure string
 * math — no tree lookup, so it never fails: `.` and empty segments
 * collapse, `..` pops (clamped at the root), a leading `/` escapes the cwd.
 */
export function resolvePath(cwd: string, input: string): string {
  const base = cwd.startsWith('/') ? cwd : '/' + cwd;
  const raw = input === '' ? base : input.startsWith('/') ? input : base + '/' + input;
  const out: string[] = [];
  for (const part of raw.split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..') {
      out.pop();
      continue;
    }
    out.push(part);
  }
  return '/' + out.join('/');
}

/** Mount paths must be absolute and traversable — no escapes, no mistakes. */
function assertMountPath(path: string): string[] {
  if (!path.startsWith('/')) {
    throw new Error(`vfs: mount path must be absolute: "${path}"`);
  }
  const parts: string[] = [];
  for (const part of path.split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..') throw new Error(`vfs: mount path must not contain "..": "${path}"`);
    parts.push(part);
  }
  if (parts.length === 0) throw new Error('vfs: cannot mount the root');
  return parts;
}

const dir = (name: string, children: VfsNode[] = []): VfsDir => ({ kind: 'dir', name, children });

/** One mounted tree per terminal; plugins merge into it, last write wins. */
export class Vfs {
  readonly root: VfsDir = dir('');

  /** Resolve `input` against `cwd` to a normalized absolute path. */
  resolve(cwd: string, input: string): string {
    return resolvePath(cwd, input);
  }

  /** Node at an absolute path, or null when nothing lives there. */
  nodeAt(path: string): VfsNode | null {
    let node: VfsNode = this.root;
    for (const part of path.split('/')) {
      if (part === '') continue;
      if (node.kind !== 'dir') return null;
      const next: VfsNode | undefined = node.children.find((c) => c.name === part);
      if (!next) return null;
      node = next;
    }
    return node;
  }

  /** Children of the dir at `path`; files and missing paths list empty. */
  list(path: string): VfsNode[] {
    const node = this.nodeAt(path);
    return node && node.kind === 'dir' ? node.children : [];
  }

  /** Content of the file at `path`; null when missing or a directory. */
  read(path: string): string | null {
    const node = this.nodeAt(path);
    return node && node.kind === 'file' ? node.content : null;
  }

  /**
   * Put (or replace) a file at `path`, creating intermediate directories.
   * Returns the file node. Throws on a relative/`..` path or when an
   * existing directory occupies the spot.
   */
  mountFile(path: string, content: string): VfsFile {
    const parts = assertMountPath(path);
    let node: VfsDir = this.root;
    for (let i = 0; i < parts.length - 1; i++) {
      const name = parts[i];
      const existing = node.children.find((c) => c.name === name);
      if (!existing) {
        const created = dir(name);
        node.children.push(created);
        node = created;
      } else if (existing.kind === 'dir') {
        node = existing;
      } else {
        throw new Error(`vfs: "${path}" walks through a file ("${name}")`);
      }
    }
    const name = parts[parts.length - 1];
    const existing = node.children.find((c) => c.name === name);
    if (existing && existing.kind === 'dir') {
      throw new Error(`vfs: "${path}" is a directory`);
    }
    if (existing && existing.kind === 'file') {
      existing.content = content;
      return existing;
    }
    const file: VfsFile = { kind: 'file', name, content };
    node.children.push(file);
    return file;
  }
}
