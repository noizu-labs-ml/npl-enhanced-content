/**
 * lazy/scan — find the SemText vocabulary in a DOM subtree.
 *
 * The lazy loader's one assumption about a page: `<sem-text>` marks a
 * document, and any element whose tag starts with `sem-` or `npl-` under
 * one may be a component. Which of those tags actually have a component is
 * the manifest's job (generated at build time from the component list, see
 * scripts/build.mjs) — the scan stays tag-shaped so it needs no component
 * knowledge: an `npl-*` element from a sibling package is picked up here
 * and simply matches nothing until its chunk ships.
 *
 * Class-form aliases (`.sem-note` etc.) are deliberately out of scope:
 * they are not tags, so they cannot trigger a download. Documents authored
 * in the alias form need the full bundle (semtext.js), whose vanilla
 * handlers own them.
 */

const VOCABULARY_TAG = /^(?:sem|npl)-[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** A `sem-*` / `npl-*` tag name. `localName` is always lowercase in HTML
 *  documents, so author casing cannot split one tag across two manifest
 *  lookups. */
export function isVocabularyTag(name: string): boolean {
  return VOCABULARY_TAG.test(name);
}

/** The vocabulary elements in `root` — the root itself included — in
 *  document order. Including the root is harmless (`sem-text` itself has
 *  no component chunk) and lets one routine serve both the boot scan of a
 *  `<sem-text>` document and the hydration of a single inserted element. */
export function collectVocabularyElements(root: Element): Element[] {
  const found: Element[] = [];
  if (isVocabularyTag(root.localName)) found.push(root);
  for (const el of root.querySelectorAll('*')) {
    if (isVocabularyTag(el.localName)) found.push(el);
  }
  return found;
}

/** Distinct vocabulary tag names under `root` (root included). */
export function collectTags(root: Element): Set<string> {
  return new Set(collectVocabularyElements(root).map((el) => el.localName));
}
