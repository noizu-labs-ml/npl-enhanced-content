/**
 * attr — read a parameter in either authoring form.
 *
 * v0.4 class form spells parameters `data-<name>`; v0.3 element form spells
 * them bare (`<sem-code lang="ts">`). `data-` wins when both are present,
 * matching extraction (spec/extraction.md §3.6). Shared by the reading
 * bundle and the Lit wrappers so one element reads the same way in both.
 */

export function param(el: Element, name: string): string | null {
  const d = el.getAttribute('data-' + name);
  return d !== null ? d : el.getAttribute(name);
}

export function hasParam(el: Element, name: string): boolean {
  return el.hasAttribute('data-' + name) || el.hasAttribute(name);
}
