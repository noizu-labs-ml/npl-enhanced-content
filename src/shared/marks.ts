/**
 * marks — the `mark="2,4-5"` line-set grammar of sem-code.
 *
 * One parser for render (which wraps marked lines in <mark>) and extraction
 * (which reports `fields.marks`), so both agree on what "2,4-5" means:
 * 1-based line numbers, ranges inclusive, unparsable pieces ignored,
 * output ascending and de-duplicated. `max` (the line count, when known)
 * drops out-of-range entries per spec/schema/sem-code.md.
 */

export function parseMarks(raw: string | null | undefined, max = Infinity): number[] {
  const out = new Set<number>();
  if (!raw) return [];
  for (const piece of raw.split(',')) {
    const m = /^\s*(\d+)\s*(?:-\s*(\d+)\s*)?$/.exec(piece);
    if (!m) continue;
    const a = parseInt(m[1], 10);
    const b = m[2] === undefined ? a : parseInt(m[2], 10);
    for (let n = Math.min(a, b); n <= Math.max(a, b); n++) {
      if (n >= 1 && n <= max) out.add(n);
    }
  }
  return Array.from(out).sort((x, y) => x - y);
}
