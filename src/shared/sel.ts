/**
 * sel — one vocabulary selector for both authoring forms.
 *
 * `sel('fact')` is `:is(sem-fact, .sem-fact)`: the canonical custom element
 * and its class-form alias (conventions Appendix A) match from one string.
 * `part('conclusion')` is the child-part twin: the bare tag inside an
 * element-form record (`<conclusion>`) or `.sem-conclusion` in the alias.
 */

export function sel(name: string): string {
  return ':is(sem-' + name + ', .sem-' + name + ')';
}

export function part(name: string): string {
  return ':is(' + name + ', .sem-' + name + ')';
}
