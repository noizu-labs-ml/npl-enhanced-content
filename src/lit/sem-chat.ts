import { SemElement } from './base.js';

/**
 * sem-chat — endpoint-driven chat transcript + composer (Lit, light DOM).
 *
 * The one element in the bundle that speaks to a server. It holds no API
 * keys and sets no auth headers: the page author points `endpoint` at a
 * proxy they control, and the browser's ambient credentials are all this
 * element ever sends. Nothing it sends or receives is persisted anywhere.
 *
 * Contract (attributes, all read live at send time):
 *   endpoint    required, no default — POST target; without it a send
 *               surfaces the inline role="alert" error instead of a fetch
 *   model       optional, no default — passed through in the request body
 *               only when authored (an absent model sends no `model` key,
 *               so the server's default routing applies)
 *   placeholder — composer hint, default "Type a message…"
 *
 * Wire contract: POST { model?, messages: [{role, content}, …] } as JSON.
 * The reply streams when the response body is a stream and is not
 * `application/json` (each chunk is decoded text appended as it arrives);
 * a JSON body is read as a plain `{ content }` object. Either way the
 * finished assistant text lands in the transcript.
 *
 * Errors — network failures and non-2xx replies — render inline as a
 * role="alert" message and the composer is re-enabled; nothing is thrown
 * at the console beyond the shared author-warning channel.
 *
 * A `sem-chat-message` CustomEvent (bubbles, composed, detail
 * `{role, content}`) fires for each completed message: the user's on send,
 * the assistant's once the reply has fully arrived.
 *
 * Accessibility: the transcript is a role="log" with aria-live="polite";
 * the textarea is labelled; Enter sends, Shift+Enter inserts a newline
 * (left to the browser — the handler only intercepts bare Enter).
 */
export class SemChat extends SemElement {
  static properties = {
    endpoint: { type: String },
    model: { type: String },
    placeholder: { type: String },
  };

  declare endpoint: string;
  declare model: string;
  declare placeholder: string;

  #wired = false;
  #busy = false;
  #log: HTMLDivElement | null = null;
  #error: HTMLDivElement | null = null;
  #input: HTMLTextAreaElement | null = null;

  constructor() {
    super();
    // `endpoint` is required and deliberately has no default: an unset
    // attribute is an authoring mistake surfaced at send time, not a URL
    // invented here.
    this.endpoint = '';
    this.model = '';
    this.placeholder = 'Type a message…';
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('role', 'group');
  }

  updated(): void {
    if (!this.#wired) this.#wire();
    this.#syncPlaceholder();
  }

  #wire(): void {
    this.#wired = true;

    const log = document.createElement('div');
    log.className = 'sem-chat-log';
    log.setAttribute('role', 'log');
    log.setAttribute('aria-live', 'polite');
    log.setAttribute('aria-label', 'Conversation');
    this.#log = log;

    const error = document.createElement('div');
    error.className = 'sem-chat-error';
    error.setAttribute('role', 'alert');
    error.hidden = true;
    this.#error = error;

    const composer = document.createElement('form');
    composer.className = 'sem-chat-composer';

    const input = document.createElement('textarea');
    input.className = 'sem-chat-input';
    input.setAttribute('rows', '1');
    input.setAttribute('aria-label', 'Message');
    input.addEventListener('keydown', this.#onKeydown);
    this.#input = input;

    const send = document.createElement('button');
    send.type = 'submit';
    send.className = 'sem-chat-send';
    send.textContent = 'Send';

    composer.append(input, send);
    composer.addEventListener('submit', this.#onSubmit);
    this.append(log, error, composer);
  }

  #syncPlaceholder(): void {
    this.#input?.setAttribute('placeholder', this.placeholder ?? '');
  }

  #onKeydown = (e: KeyboardEvent): void => {
    // Bare Enter sends; Shift+Enter falls through so the browser inserts
    // the newline (never preventDefault for it).
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void this.#send();
    }
  };

  #onSubmit = (e: Event): void => {
    e.preventDefault();
    void this.#send();
  };

  async #send(): Promise<void> {
    if (this.#busy) return;
    const input = this.#input;
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    if (!this.endpoint) {
      this.#setError('sem-chat: no endpoint attribute set — the message was not sent.');
      this.warn('sem-chat requires an `endpoint` attribute (a POST URL you control).');
      return;
    }

    this.#busy = true;
    this.#setError(null);
    input.value = '';
    this.#setDisabled(true);

    this.#appendMessage('user', text);
    this.emit<{ role: string; content: string }>('sem-chat-message', { role: 'user', content: text });

    const body: { model?: string; messages: Array<{ role: string; content: string }> } = {
      messages: this.#history(),
    };
    if (this.model) body.model = this.model;

    try {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const assistant = this.#appendMessage('assistant', '');
      const contentSpan = assistant.querySelector('.sem-chat-content')!;
      let streamed = '';
      const content = await consumeReply(res, (delta) => {
        streamed += delta;
        contentSpan.textContent = streamed;
      });
      contentSpan.textContent = content;
      this.emit<{ role: string; content: string }>('sem-chat-message', {
        role: 'assistant',
        content,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.#setError(`sem-chat: ${message}`);
    } finally {
      this.#busy = false;
      this.#setDisabled(false);
      this.#input?.focus();
    }
  }

  /** Full transcript as the wire-format message list (context for the next turn). */
  #history(): Array<{ role: string; content: string }> {
    return Array.from(this.querySelectorAll('.sem-chat-msg')).map((msg) => ({
      role: msg.getAttribute('data-role') ?? 'user',
      content: contentText(msg),
    }));
  }

  #appendMessage(role: string, content: string): HTMLDivElement {
    const msg = document.createElement('div');
    msg.className = `sem-chat-msg sem-chat-${role}`;
    msg.setAttribute('data-role', role);

    const label = document.createElement('span');
    label.className = 'sem-chat-role';
    label.textContent = role;

    const text = document.createElement('span');
    text.className = 'sem-chat-content';
    text.textContent = content;

    msg.append(label, text);
    this.#log?.appendChild(msg);
    return msg;
  }

  #setError(message: string | null): void {
    if (!this.#error) return;
    this.#error.textContent = message ?? '';
    this.#error.hidden = message === null;
  }

  #setDisabled(disabled: boolean): void {
    if (this.#input) this.#input.disabled = disabled;
    const send = this.querySelector('.sem-chat-send');
    if (send instanceof HTMLButtonElement) send.disabled = disabled;
  }
}

function contentText(msg: Element): string {
  return msg.querySelector('.sem-chat-content')?.textContent ?? '';
}

/**
 * Read the assistant reply off a fetch Response, streaming when the body is
 * a stream and not JSON. `onDelta` receives each piece as it arrives; the
 * return value is the full text. A JSON body resolves as plain
 * `{ content }`; anything else with a body is consumed chunk by chunk as
 * decoded UTF-8 text. Exported for the unit tier — the DOM half of the
 * element is otherwise untestable without a network.
 */
export async function consumeReply(
  res: Pick<Response, 'ok' | 'status' | 'headers' | 'body' | 'json' | 'text'>,
  onDelta: (delta: string) => void,
): Promise<string> {
  const type = res.headers?.get?.('content-type') ?? '';

  if (type.includes('application/json')) {
    const data = (await res.json()) as { content?: unknown };
    const content = typeof data?.content === 'string' ? data.content : '';
    if (content) onDelta(content);
    return content;
  }

  if (res.body) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      const delta = decoder.decode(value, { stream: true });
      if (delta) {
        full += delta;
        onDelta(delta);
      }
    }
    const tail = decoder.decode();
    if (tail) {
      full += tail;
      onDelta(tail);
    }
    return full;
  }

  const text = await res.text();
  if (text) onDelta(text);
  return text;
}

SemElement.register('sem-chat', SemChat);
