/**
 * semtext-demo plugin — the shell commands, as plugin CommandSpecs.
 *
 * POSIX-style commands (ls/cat/cd/pwd and friends) live in the posix-sh
 * plugin (src/terminal/plugins/posix/); this plugin carries the SemText
 * commands over the demo documents:
 *
 *   semtext render <file>   text render: embeds, record summaries, skeleton
 *   semtext tui <file>      flashcard view — emits a DATA-only TuiAction
 *                           the element performs (boxed panels, q closes)
 *   semtext outline|filter|format|expand  — the CLI-parity operations
 *   open <file.html>        emits a data-only WindowAction (blob, noopener)
 *
 * Published form: compiled to commands.js, referenced by manifest.json's
 * `load.src`. In-repo form: bundled with <sem-shell>, no fetch at all.
 */

import type { CommandContext, CommandSpec } from '../../terminal-core.js';
import { filterDoc, formatDoc, outlineDoc, parseHtml } from '../../../shell/semtext-cli.js';
import { extractRecords, type SemRecord } from '../../../extract/records.js';
import { deriveSummary } from '../../../shared/summary.js';
import type { TuiCard } from '../../tui.js';

function readArg(ctx: CommandContext, arg: string): { path: string; kind: 'file' | 'dir' } | { error: string } {
  const path = ctx.vfs.resolve(ctx.state.cwd, arg);
  const node = ctx.vfs.nodeAt(path);
  if (!node) return { error: `${arg}: no such file or directory` };
  return { path, kind: node.kind };
}

/** Resolve the input document: the named file, else piped stdin. */
function readDoc(ctx: CommandContext, fileArgs: string[]): { html: string; label: string } | { error: string } {
  const fileArg = fileArgs[0];
  if (!fileArg || fileArg === '-') {
    if (ctx.stdin === null) return { error: 'semtext: no input file (pipe one in: cat <file> | semtext <sub>)' };
    return { html: ctx.stdin, label: '(stdin)' };
  }
  const found = readArg(ctx, fileArg);
  if ('error' in found) return { error: found.error };
  if (found.kind === 'dir') return { error: `semtext: ${fileArg}: is a directory` };
  return { html: ctx.vfs.read(found.path) ?? '', label: fileArg };
}

/* ------------------------------------------------------------------ *
 * semtext render / tui — record and card projections
 * ------------------------------------------------------------------ */

function recordsToCards(html: string): { title: string; cards: TuiCard[] } {
  const doc = parseHtml(html);
  const title = doc.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim() || 'document';
  const cards: TuiCard[] = [];
  for (const r of extractRecords(doc)) {
    if (!r.text) continue;
    const front = r.text.includes(' :: ') ? r.text.split(' :: ')[0]! : deriveSummary(r.text);
    const fieldLines: string[] = [];
    for (const [key, value] of Object.entries(r.fields)) {
      if (value === undefined || value === null || value === '') continue;
      fieldLines.push(`${key}: ${Array.isArray(value) ? value.join(' | ') : String(value)}`);
    }
    const back = [r.text, ...fieldLines].join('\n');
    const meta = [r.id ? `#${r.id}` : null, r.kind ? `kind=${r.kind}` : null, r.tags.length ? `tags=${r.tags.join(',')}` : null]
      .filter((bit): bit is string => bit !== null)
      .join(' · ');
    cards.push({ front, back, meta });
    if (cards.length >= 50) break;
  }
  return { title, cards };
}

const OUTLINE_INDENT = (depth: number): string => '  '.repeat(Math.max(0, depth - 1));

/* ------------------------------------------------------------------ *
 * the semtext command
 * ------------------------------------------------------------------ */

const HELP: Record<string, string[]> = {
  outline: ['usage: semtext outline <file>', '', 'The document skeleton in reading order: headings at their own', 'level, structural sem-* blocks one under the last heading.'],
  filter: [
    'usage: semtext filter <file> [--type <el>] [--text <s>]',
    '',
    "Elements by type and/or text, one outerHTML per line. --text reports",
    'minimal matches only: no ancestors of a deeper match.',
  ],
  format: ['usage: semtext format <file> [--json]', '', 'The document as plain text (the extractText recipe) or as the', 'canonical SemRecord[] JSON.'],
  expand: [
    'usage: semtext expand <file> [order]',
    '',
    'Every record fully expanded: the header line, the record text, then',
    'each field. A numeric order (1-based) prints just that record.',
  ],
  render: [
    'usage: semtext render <file>',
    '',
    'The text render of a document — what a machine reads: the embeds it',
    'loaded, each element with its record summary (the extractText shape the',
    'landing page shows), then the skeleton tree.',
    '',
    '  semtext render demo/token-rotation.html',
  ],
  tui: [
    'usage: semtext tui <file>',
    '',
    'Read-only flashcard view of the document records, as boxed panels.',
    '',
    '  j / ArrowDown   next card          k / ArrowUp   previous card',
    '  Enter           expand or collapse the back of the card',
    '  /               filter cards by text (Enter or Esc ends the filter)',
    '  q / Esc         close the view and return to the prompt',
    '',
    '  semtext tui demo/token-rotation.html',
  ],
};

const GENERAL_USAGE = [
  'usage: semtext <sub> [file] — render | tui | outline | filter | format | expand',
  '',
  'Document operations; `semtext <sub> --help` explains one.',
].join('\n');

const semtext: CommandSpec = {
  name: 'semtext',
  usage: 'semtext <sub> [file] — render | tui | outline | filter | format | expand',
  run(ctx) {
    const [sub, ...rest] = ctx.args;
    if (!sub) {
      ctx.err('semtext: missing subcommand — use render, tui, outline, filter, format or expand');
      ctx.exit(2);
      return;
    }
    if (sub === '--help' || sub === '-h') {
      ctx.out(GENERAL_USAGE);
      return;
    }
    const help = HELP[sub];
    if (!help) {
      ctx.err(`semtext: unknown subcommand "${sub}" — use render, tui, outline, filter, format or expand`);
      ctx.exit(2);
      return;
    }
    if (rest.includes('--help') || rest.includes('-h')) {
      for (const line of help) ctx.out(line);
      return;
    }

    const fileArgs: string[] = [];
    let type: string | null = null;
    let text: string | null = null;
    let json = false;
    for (let i = 0; i < rest.length; i++) {
      const a = rest[i]!;
      if (a === '--type') type = rest[++i] ?? null;
      else if (a === '--text') text = rest[++i] ?? null;
      else if (a === '--json') json = true;
      else fileArgs.push(a);
    }
    const doc = readDoc(ctx, fileArgs);
    if ('error' in doc) {
      ctx.err(doc.error);
      ctx.exit(1);
      return;
    }
    try {
      if (sub === 'outline') {
        for (const entry of outlineDoc(doc.html)) {
          ctx.out(OUTLINE_INDENT(entry.depth) + entry.tag + ' ' + entry.label);
        }
        return;
      }
      if (sub === 'filter') {
        if (!type && !text) {
          ctx.err('semtext filter: give --type <element> or --text <string>');
          ctx.exit(2);
          return;
        }
        const result = filterDoc(doc.html, { type, text });
        ctx.out(result === '' ? 'no matches' : result);
        return;
      }
      if (sub === 'format') {
        ctx.out(formatDoc(doc.html, json ? 'json' : 'text'));
        return;
      }
      if (sub === 'render') {
        renderDoc(ctx, doc.html, doc.label);
        return;
      }
      if (sub === 'tui') {
        const { title, cards } = recordsToCards(doc.html);
        if (cards.length === 0) {
          ctx.err('semtext tui: no records in this document');
          ctx.exit(1);
          return;
        }
        ctx.out(`tui: ${title} — ${cards.length} cards (j/k move, Enter expands, / filters, q closes)`);
        if (ctx.color) ctx.emit({ kind: 'tui', title, cards }); // interactive only on a terminal
        return;
      }
      if (sub === 'expand') {
        const records = extractRecords(parseHtml(doc.html));
        const orderArg = fileArgs[1];
        if (orderArg !== undefined) {
          const order = Number.parseInt(orderArg, 10);
          const record = records[order - 1];
          if (!record) {
            ctx.err(`semtext expand: no record ${orderArg} (document has ${records.length})`);
            ctx.exit(1);
            return;
          }
          expandRecord(ctx, order, record);
          return;
        }
        for (let i = 0; i < records.length; i++) expandRecord(ctx, i + 1, records[i]!);
        return;
      }
    } catch (cause) {
      ctx.err(cause instanceof Error ? cause.message : String(cause));
      ctx.exit(1);
    }
  },
};

const indent = '   ';

function expandRecord(ctx: CommandContext, order: number, record: SemRecord): void {
  const head = [`${order}.`, record.type, record.id ? `#${record.id}` : null, record.kind ? `kind=${record.kind}` : null]
    .filter((part): part is string => part !== null)
    .join(' ');
  ctx.out(head);
  if (record.text) ctx.out(`${indent}${record.text}`);
  for (const [key, value] of Object.entries(record.fields)) {
    if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) continue;
    ctx.out(`${indent}${key}: ${Array.isArray(value) ? value.join(' | ') : String(value)}`);
  }
}

/** The `render` projection: embeds, then record summaries, then the skeleton. */
function renderDoc(ctx: CommandContext, html: string, label: string): void {
  const parsed = parseHtml(html);
  ctx.out(`# semtext render — ${label}`);
  const embeds = parsed.querySelectorAll('script[src], link[href], iframe[src], img[src], object[data]');
  if (embeds.length === 0) {
    ctx.out('# embeds: (none)');
  } else {
    ctx.out(`# embeds: ${embeds.length}`);
    for (const embed of embeds) {
      const url = embed.getAttribute('src') ?? embed.getAttribute('href') ?? embed.getAttribute('data') ?? '';
      ctx.out(`#   ${url} (${embed.tagName.toLowerCase()})`);
    }
  }
  ctx.out('# records:');
  const text = formatDoc(html, 'text');
  if (text !== '') for (const line of text.split('\n')) ctx.out(line);
  ctx.out('# skeleton:');
  for (const entry of outlineDoc(html)) ctx.out(OUTLINE_INDENT(entry.depth) + entry.tag + ' ' + entry.label);
}

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

export const demoCommands: CommandSpec[] = [semtext, open];
export default demoCommands;
