/**
 * audience — profile declarations and visibility matching.
 *
 * Pure functions only: nothing here touches the DOM beyond reading it.
 * Callers decide what to do with a `false`.
 *
 * Failure policy is fail-OPEN throughout. A document is a readable artifact
 * first; an authoring typo must never make content unreachable, so an
 * unrecognized audience token warns and shows the content.
 */

import { parseTokens } from './tokens.js';

export interface Profile {
  id: string;
  label: string | null;
  implies: string[];
}

/** id → every id it satisfies, transitively, including itself. */
export type AudienceClosure = Map<string, Set<string>>;

/**
 * Warning channel. Matches the `console.warn` precedent set by the vanilla
 * fallback's duplicate-`data-key` check, so authors see one consistent voice.
 */
export function warn(message: string): void {
  if (typeof console !== 'undefined' && typeof console.warn === 'function') {
    console.warn('semtext: ' + message);
  }
}

function attr(el: Element, name: string): string | null {
  return el.getAttribute(name) ?? el.getAttribute('data-' + name);
}

type ProfileRoot = Document | DocumentFragment | Element;

/**
 * Read the `.sem-audiences` / `<sem-audiences>` block and return its profiles.
 * Both attribute forms are accepted: bare `id`/`label`/`implies` and the
 * `data-` prefixed spellings.
 */
export function parseProfiles(root: ProfileRoot): Profile[] {
  if (!root || typeof root.querySelectorAll !== 'function') return [];

  const blocks = Array.from(root.querySelectorAll('.sem-audiences, sem-audiences'));
  const profiles: Profile[] = [];
  const seen = new Set<string>();

  for (const block of blocks) {
    for (const node of Array.from(block.querySelectorAll('.sem-profile, sem-profile'))) {
      const id = (attr(node, 'id') || '').trim();
      if (id === '') {
        warn('sem-audiences: profile without an id was ignored');
        continue;
      }
      if (seen.has(id)) {
        warn('sem-audiences: duplicate profile id "' + id + '" was ignored');
        continue;
      }
      seen.add(id);
      profiles.push({
        id,
        label: attr(node, 'label'),
        implies: parseTokens(attr(node, 'implies')),
      });
    }
  }
  return profiles;
}

/**
 * Transitive closure of `implies`. Cycles are an authoring error: we warn once
 * per offending id and break the edge rather than looping forever.
 */
export function buildClosure(profiles: readonly Profile[]): AudienceClosure {
  const declared = new Map<string, Profile>();
  for (const p of profiles) declared.set(p.id, p);

  const closure: AudienceClosure = new Map();

  for (const p of profiles) {
    const reached = new Set<string>([p.id]);
    const stack = [...p.implies];
    const onPath = new Set<string>([p.id]);

    while (stack.length > 0) {
      const next = stack.pop()!;
      if (!declared.has(next)) {
        warn('sem-audiences: profile "' + p.id + '" implies unknown profile "' + next + '"');
        reached.add(next); // fail-open: honor the author's intent anyway
        continue;
      }
      if (reached.has(next)) {
        if (onPath.has(next)) {
          warn('sem-audiences: implies cycle involving "' + next + '" was broken');
        }
        continue;
      }
      reached.add(next);
      onPath.add(next);
      stack.push(...declared.get(next)!.implies);
    }
    closure.set(p.id, reached);
  }
  return closure;
}

/** Does `active` satisfy the requirement `term`, directly or by implication? */
function satisfies(active: string | null, term: string, closure: AudienceClosure): boolean {
  if (active === null) return false;
  if (active === term) return true;
  return closure.get(active)?.has(term) === true;
}

function isKnown(term: string, closure: AudienceClosure): boolean {
  if (closure.has(term)) return true;
  for (const reached of closure.values()) {
    if (reached.has(term)) return true;
  }
  return false;
}

/**
 * Visibility test for an audience spec.
 *
 *   null / ""      → universal, always visible
 *   "a,b"          → visible when the active profile is (or implies) a or b
 *   "!a"           → visible unless the active profile is (or implies) a
 *   "a,!b"         → authoring error; warn and honor the positive terms only
 *   unknown token  → authoring error; warn and return TRUE (fail-open)
 *
 * With no profiles declared anywhere the closure is empty, every token is
 * unknown, and every element is therefore visible.
 */
export function matches(
  spec: string | null | undefined,
  activeProfile: string | null,
  closure: AudienceClosure,
): boolean {
  const terms = parseTokens(spec);
  if (terms.length === 0) return true;

  const positives: string[] = [];
  const negatives: string[] = [];

  for (const term of terms) {
    const negated = term.startsWith('!');
    const name = negated ? term.slice(1).trim() : term;
    if (name === '') {
      warn('audience: empty term in spec "' + spec + '" was ignored');
      continue;
    }
    if (!isKnown(name, closure)) {
      warn('audience: unknown profile "' + name + '" in spec "' + spec + '" — showing content');
      return true;
    }
    (negated ? negatives : positives).push(name);
  }

  if (positives.length > 0 && negatives.length > 0) {
    warn(
      'audience: spec "' + spec + '" mixes positive and negative terms — ' +
      'using the positive terms only',
    );
  }

  if (positives.length > 0) {
    return positives.some((term) => satisfies(activeProfile, term, closure));
  }
  if (negatives.length > 0) {
    return !negatives.some((term) => satisfies(activeProfile, term, closure));
  }
  return true;
}

/** Convenience: parse + close over a root in one call. */
export function closureFor(root: ProfileRoot): AudienceClosure {
  return buildClosure(parseProfiles(root));
}
