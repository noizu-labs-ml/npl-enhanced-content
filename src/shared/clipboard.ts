/**
 * clipboard — copy with announcement, shared by sem-code (reading bundle)
 * and sem-md (Markdown bundle) so both copy buttons behave alike.
 *
 * Clipboard API first, `execCommand('copy')` on a hidden textarea as the
 * fallback (file:// documents in some browsers deny the async API). The
 * status region gets `Copied` / `Copy failed` and is cleared two seconds
 * later, so a `role="status"` live region announces once per click.
 */

function legacyCopy(text: string): boolean {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('aria-hidden', 'true');
  ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch { ok = false; }
  ta.remove();
  return ok;
}

export function copyText(text: string, status: HTMLElement): void {
  let timer = 0;
  const done = (ok: boolean): void => {
    status.textContent = ok ? 'Copied' : 'Copy failed';
    clearTimeout(timer);
    timer = window.setTimeout(() => { status.textContent = ''; }, 2000);
  };
  const clip = navigator.clipboard;
  if (clip && typeof clip.writeText === 'function') {
    clip.writeText(text).then(() => done(true), () => done(legacyCopy(text)));
  } else {
    done(legacyCopy(text));
  }
}

/** Is any copy mechanism available? A button that cannot copy is not rendered. */
export const canCopy = (): boolean => !!(navigator.clipboard || document.queryCommandSupported?.('copy'));
