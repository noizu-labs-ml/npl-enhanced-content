/**
 * popover — one hover / focus preview surface per document.
 *
 * Used by sem-references (citation → reference preview) and glossary-mode
 * sem-properties (term → definition preview). One `.sem-popover` element
 * is created lazily on first show and reused: content is swapped, the
 * box is positioned under the anchor, and `aria-describedby` on the
 * anchor points at it while it is open. Native `popover` (top layer) is
 * used where the browser has it; otherwise a fixed-position div does the
 * same job. `Esc` closes; leaving or blurring the anchor closes; clicking
 * the anchor closes so navigation is never hidden behind the preview.
 *
 * PLACEMENT TRACKS THE ANCHOR. The box is `position: fixed`, so it is
 * placed from the anchor's viewport rect — and that rect moves. Focusing
 * an off-screen anchor scrolls it into view, and with the vocabulary's
 * `scroll-behavior: smooth` that scroll is an animation: the `focus` event
 * fires while the anchor is still off-screen, so a one-shot placement
 * parked the preview outside the viewport (CI caught it; a fast local
 * scroll had already landed). While open, every scroll and resize
 * re-places the box, and the placement is clamped into the viewport.
 *
 * Content is CLONED from the source element with ids and chrome stripped
 * (`cloneContent`), so a preview can never mint a duplicate id, and the
 * box itself carries a chrome class extraction skips (spec/extraction.md
 * §3.4). The box lives at the end of <body>, outside the root wrapper.
 */

let box: HTMLElement | null = null;
let current: Element | null = null;

function ensure(): HTMLElement {
  if (box) return box;
  box = document.createElement('div');
  box.className = 'sem-popover';
  box.id = 'sem-popover';
  box.setAttribute('role', 'tooltip');
  box.hidden = true;
  if ('popover' in box) box.setAttribute('popover', 'manual');
  document.body.appendChild(box);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hide();
  });
  const track = (): void => {
    if (current && box && !box.hidden) place(current, box);
  };
  window.addEventListener('scroll', track, { passive: true, capture: true });
  window.addEventListener('resize', track, { passive: true });
  return box;
}

function place(anchor: Element, b: HTMLElement): void {
  const r = anchor.getBoundingClientRect();
  const w = b.offsetWidth;
  const h = b.offsetHeight;
  let left = r.left;
  if (left + w > window.innerWidth - 8) left = Math.max(8, window.innerWidth - w - 8);
  let top = r.bottom + 6;
  if (top + h > window.innerHeight - 8 && r.top - h - 6 > 0) top = r.top - h - 6;
  top = Math.max(8, Math.min(top, window.innerHeight - h - 8));
  b.style.left = left + 'px';
  b.style.top = top + 'px';
}

function show(anchor: Element, render: () => Node | null): void {
  const content = render();
  if (!content) return;
  const b = ensure();
  if (current && current !== anchor) current.removeAttribute('aria-describedby');
  b.replaceChildren(content);
  current = anchor;
  b.hidden = false;
  if (b.hasAttribute('popover')) {
    try { b.hidePopover(); } catch { /* not open */ }
    try { b.showPopover(); } catch { /* disconnected */ }
  }
  place(anchor, b);
  anchor.setAttribute('aria-describedby', b.id);
}

/** Hide the preview. With an anchor, only if that anchor owns it. */
export function hide(anchor?: Element): void {
  if (!box || box.hidden) return;
  if (anchor && current !== anchor) return;
  if (box.hasAttribute('popover')) {
    try { box.hidePopover(); } catch { /* not open */ }
  }
  box.hidden = true;
  current?.removeAttribute('aria-describedby');
  current = null;
}

/**
 * Wire an anchor to show `render()` on hover / focus. Idempotency is the
 * caller's job (it stamps a runtime class on the anchor and checks it).
 */
export function attachPreview(anchor: Element, render: () => Node | null): void {
  anchor.addEventListener('mouseenter', () => show(anchor, render));
  anchor.addEventListener('focus', () => show(anchor, render));
  anchor.addEventListener('mouseleave', () => hide(anchor));
  anchor.addEventListener('blur', () => hide(anchor));
  anchor.addEventListener('click', () => hide(anchor));
}

/**
 * Deep-clone `source`'s children into a fragment, dropping anything that
 * matches `skip` and every `id` / `role` attribute so the copy is inert.
 */
export function cloneContent(source: Element, skip: string): DocumentFragment {
  const frag = document.createDocumentFragment();
  source.childNodes.forEach((n) => {
    if (n.nodeType === 1 && (n as Element).matches(skip)) return;
    frag.appendChild(n.cloneNode(true));
  });
  frag.querySelectorAll('[id], [role]').forEach((el) => {
    el.removeAttribute('id');
    el.removeAttribute('role');
  });
  return frag;
}
