/**
 * semtext-demo plugin — the shell commands, as plugin CommandSpecs.
 *
 * Ported from the pre-plugin shell: ls, cat, cd, pwd operate on the
 * terminal's virtual file system; `semtext` runs the document operations
 * (src/shell/semtext-cli.ts — the CLI-parity module); `open` emits a
 * data-only WindowAction the element performs (blob URL, noopener).
 *
 * Published form: compiled to commands.js, referenced by manifest.json's
 * `load.src`. In-repo form: bundled with <sem-shell>, no fetch at all.
 */

import type { CommandContext, CommandSpec } from '../../terminal-core.js';
import { filterDoc, formatDoc, outlineDoc } from '../../../shell/semtext-cli.js';

function readArg(ctx: CommandContext, arg: string): { path: string; kind: 'file' | 'dir' } | { error: string } {
  const path = ctx.vfs.resolve(ctx.state.cwd, arg);
  const node = ctx.vfs.nodeAt(path);
  if (!node) return { error: `${arg}: no such file or directory` };
  return { path, kind: node.kind };
}

const ls: CommandSpec = {
  name: 'ls',
  usage: 'ls [-l] [path] — list entries; directories carry a trailing /',
  run(ctx) {
    const long = ctx.args.includes('-l');
    const target = ctx.args.find((a) => !a.startsWith('-')) ?? '.';
    const found = readArg(ctx, target);
    if ('error' in found) {
      ctx.err(found.error);
      return;
    }
    const node = ctx.vfs.nodeAt(found.path);
    if (!node) return;
    const entries = node.kind === 'file' ? [node] : [...node.children].sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    for (const entry of entries) {
      const name = entry.kind === 'dir' ? entry.name + '/' : entry.name;
      if (!long) {
        ctx.out(name);
        continue;
      }
      const type = entry.kind === 'dir' ? 'dir ' : 'text';
      const size = entry.kind === 'dir' ? '-' : String(entry.content.length);
      ctx.out(`${type}  ${size.padStart(7)}  ${name}`);
    }
  },
};

const cat: CommandSpec = {
  name: 'cat',
  usage: 'cat <file> [...] — print file text (no args: print piped input)',
  run(ctx) {
    if (ctx.args.length === 0) {
      if (ctx.stdin === null) {
        ctx.err('cat: missing file operand');
        return;
      }
      ctx.out(ctx.stdin);
      return;
    }
    for (const arg of ctx.args) {
      const found = readArg(ctx, arg);
      if ('error' in found) {
        ctx.err(found.error);
        continue;
      }
      if (found.kind === 'dir') {
        ctx.err(`cat: ${arg}: is a directory`);
        continue;
      }
      ctx.out(ctx.vfs.read(found.path) ?? '');
    }
  },
};

const cd: CommandSpec = {
  name: 'cd',
  usage: 'cd [path] — change directory (.. and / work; no arg: /)',
  run(ctx) {
    const target = ctx.args[0] ?? '/';
    const path = ctx.vfs.resolve(ctx.state.cwd, target);
    const node = ctx.vfs.nodeAt(path);
    if (!node) {
      ctx.err(`cd: ${target}: no such file or directory`);
      return;
    }
    if (node.kind !== 'dir') {
      ctx.err(`cd: ${target}: not a directory`);
      return;
    }
    ctx.state.cwd = path;
  },
};

const pwd: CommandSpec = {
  name: 'pwd',
  usage: 'pwd — print the working directory',
  run(ctx) {
    ctx.out(ctx.state.cwd);
  },
};

const semtext: CommandSpec = {
  name: 'semtext',
  usage: 'semtext <sub> [file] — filter [--type <el> | --text <s>] | format [--json] | outline',
  run(ctx) {
    const [sub, ...rest] = ctx.args;
    if (!sub) {
      ctx.err('semtext: missing subcommand — use filter, format or outline');
      return;
    }
    const fileArgs: string[] = [];
    let type: string | null = null;
    let text: string | null = null;
    let json = false;
    for (let i = 0; i < rest.length; i++) {
      const a = rest[i];
      if (a === '--type') type = rest[++i] ?? null;
      else if (a === '--text') text = rest[++i] ?? null;
      else if (a === '--json') json = true;
      else fileArgs.push(a);
    }
    let html: string;
    const fileArg = fileArgs[0];
    if (!fileArg || fileArg === '-') {
      if (ctx.stdin === null) {
        ctx.err('semtext: no input file (pipe one in: cat <file> | semtext <sub>)');
        return;
      }
      html = ctx.stdin;
    } else {
      const found = readArg(ctx, fileArg);
      if ('error' in found) {
        ctx.err(found.error);
        return;
      }
      if (found.kind === 'dir') {
        ctx.err(`semtext: ${fileArg}: is a directory`);
        return;
      }
      html = ctx.vfs.read(found.path) ?? '';
    }
    try {
      if (sub === 'filter') {
        if (!type && !text) {
          ctx.err('semtext filter: give --type <element> or --text <string>');
          return;
        }
        const result = filterDoc(html, { type, text });
        ctx.out(result === '' ? 'no matches' : result);
        return;
      }
      if (sub === 'format') {
        ctx.out(formatDoc(html, json ? 'json' : 'text'));
        return;
      }
      if (sub === 'outline') {
        for (const entry of outlineDoc(html)) {
          ctx.out('  '.repeat(Math.max(0, entry.depth - 1)) + entry.tag + ' ' + entry.label);
        }
        return;
      }
      ctx.err(`semtext: unknown subcommand "${sub}" — use filter, format or outline`);
    } catch (cause) {
      ctx.err(cause instanceof Error ? cause.message : String(cause));
    }
  },
};

const open: CommandSpec = {
  name: 'open',
  usage: 'open <file.html> — open a document in a new window (noopener)',
  run(ctx) {
    const target = ctx.args[0];
    if (!target) {
      ctx.err('open: missing file operand');
      return;
    }
    const found = readArg(ctx, target);
    if ('error' in found) {
      ctx.err(found.error);
      return;
    }
    const name = found.path.split('/').pop() ?? target;
    if (found.kind !== 'file' || !name.toLowerCase().endsWith('.html')) {
      ctx.err(`open: ${target}: not an HTML document (only .html files open)`);
      return;
    }
    ctx.emit({ kind: 'window', filename: name, blob: ctx.vfs.read(found.path) ?? '', contentType: 'text/html' });
  },
};

export const demoCommands: CommandSpec[] = [ls, cat, cd, pwd, semtext, open];
export default demoCommands;
