// @vitest-environment happy-dom
// Unit spec — src/lit/sem-chat.ts · the endpoint-driven chat element
//
// Feature: sem-chat turns composer input into a POST and streams the reply
//          into a role="log" transcript
//   Scenario: a send POSTs { model?, messages: [{role, content}, …] } as JSON
//   Scenario: an authored model is passed through; an absent model sends no key
//   Scenario: the completed user and assistant messages each dispatch
//             sem-chat-message (bubbles, composed, {role, content})
//   Scenario: a streamed non-JSON body appends chunks as they arrive
//   Scenario: a JSON { content } reply is the fallback path
//   Scenario: a non-2xx reply shows an inline role="alert" and re-enables input
//   Scenario: a network failure shows the same inline alert
//   Scenario: a send without an endpoint shows the alert and never fetches
//   Scenario: bare Enter sends; Shift+Enter inserts a newline
//   Scenario: the transcript is a labelled live log; the input is labelled

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
// the named import evaluates the module, which registers <sem-chat>
import { SemChat, consumeReply } from '../../src/lit/sem-chat.js';

const ENC = new TextEncoder();

/** A fetch-Response quack with a stubbed header map (no env-specific Headers). */
function jsonResponse(payload: unknown): Response {
  return {
    ok: true,
    status: 200,
    headers: { get: () => 'application/json' },
    body: null,
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  } as unknown as Response;
}

function streamResponse(chunks: string[], contentType = 'text/plain'): Response {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(ENC.encode(chunk));
      controller.close();
    },
  });
  return {
    ok: true,
    status: 200,
    headers: { get: () => contentType },
    body: stream,
  } as unknown as Response;
}

async function mount(attrs: Record<string, string> = {}): Promise<SemChat> {
  const el = document.createElement('sem-chat');
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

function composer(el: SemChat): { textarea: HTMLTextAreaElement; form: HTMLFormElement; button: HTMLButtonElement } {
  const textarea = el.querySelector('.sem-chat-input') as HTMLTextAreaElement;
  const form = el.querySelector('.sem-chat-composer') as HTMLFormElement;
  const button = el.querySelector('.sem-chat-send') as HTMLButtonElement;
  return { textarea, form, button };
}

/** Fill the textarea and submit the composer the way Enter would. */
async function send(el: SemChat, text: string): Promise<void> {
  const { textarea, form } = composer(el);
  textarea.value = text;
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await vi.waitFor(() => { expect(composer(el).button.disabled).toBe(false); });
  await el.updateComplete;
}

describe('sem-chat', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('POSTs { model, messages } as JSON with Content-Type application/json', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ content: 'hello back' }));
    const el = await mount({ endpoint: '/api/chat', model: 'glm-5.3' });

    await send(el, 'hello world');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/chat');
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(init.body)).toEqual({
      model: 'glm-5.3',
      messages: [{ role: 'user', content: 'hello world' }],
    });
  });

  it('passes an authored model through and omits the key when there is none', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ content: 'ok' }));
    const withModel = await mount({ endpoint: '/api/chat', model: 'glm-5.3' });
    await send(withModel, 'one');
    expect('model' in JSON.parse(fetchMock.mock.calls[0][1].body)).toBe(true);

    const withoutModel = await mount({ endpoint: '/api/chat' });
    await send(withoutModel, 'two');
    expect('model' in JSON.parse(fetchMock.mock.calls[1][1].body)).toBe(false);
  });

  it('sends the whole transcript as message context on later turns', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ content: 'first reply' }));
    fetchMock.mockResolvedValueOnce(jsonResponse({ content: 'second reply' }));
    const el = await mount({ endpoint: '/api/chat' });

    await send(el, 'q1');
    await send(el, 'q2');

    const second = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(second.messages).toEqual([
      { role: 'user', content: 'q1' },
      { role: 'assistant', content: 'first reply' },
      { role: 'user', content: 'q2' },
    ]);
  });

  it('dispatches sem-chat-message for each completed message, bubbles + composed', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ content: 'the reply' }));
    const el = await mount({ endpoint: '/api/chat' });
    const events: Array<{ role: string; content: string }> = [];
    el.addEventListener('sem-chat-message', (e) => {
      events.push((e as CustomEvent<{ role: string; content: string }>).detail);
    });

    await send(el, 'a question');

    expect(events).toEqual([
      { role: 'user', content: 'a question' },
      { role: 'assistant', content: 'the reply' },
    ]);
    // bubbled past the element and composed through any shadow boundary
    const fromOutside: Array<CustomEvent> = [];
    document.body.addEventListener('sem-chat-message', (e) => fromOutside.push(e as CustomEvent));
    await send(el, 'again');
    expect(fromOutside.length).toBe(2);
  });

  it('appends streamed chunks to the transcript as they arrive', async () => {
    fetchMock.mockResolvedValue(streamResponse(['Hel', 'lo', ' there']));
    const el = await mount({ endpoint: '/api/chat' });
    const events: Array<{ role: string; content: string }> = [];
    el.addEventListener('sem-chat-message', (e) =>
      events.push((e as CustomEvent<{ role: string; content: string }>).detail),
    );

    await send(el, 'stream me');

    const reply = el.querySelector('.sem-chat-msg[data-role="assistant"] .sem-chat-content')!;
    expect(reply.textContent).toBe('Hello there');
    expect(events).toEqual([
      { role: 'user', content: 'stream me' },
      { role: 'assistant', content: 'Hello there' },
    ]);
  });

  it('falls back to a plain JSON { content } reply when the body is not a stream', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ content: 'plain reply' }));
    const el = await mount({ endpoint: '/api/chat' });

    await send(el, 'json me');

    const reply = el.querySelector('.sem-chat-msg[data-role="assistant"] .sem-chat-content')!;
    expect(reply.textContent).toBe('plain reply');
  });

  it('shows a non-2xx reply inline as role="alert" and re-enables the input', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      headers: { get: () => '' },
      body: null,
      text: async () => 'boom',
    } as unknown as Response);
    const el = await mount({ endpoint: '/api/chat' });

    await send(el, 'will fail');

    const alert = el.querySelector('.sem-chat-error')!;
    expect(alert.getAttribute('role')).toBe('alert');
    expect(alert.hidden).toBe(false);
    expect(alert.textContent).toContain('500');
    const { textarea, button } = composer(el);
    expect(textarea.disabled).toBe(false);
    expect(button.disabled).toBe(false);
    // a failed reply is not a completed assistant message
    expect(el.querySelector('.sem-chat-msg[data-role="assistant"]')).toBeNull();
  });

  it('shows a network failure inline and re-enables the input', async () => {
    fetchMock.mockRejectedValue(new TypeError('network down'));
    const el = await mount({ endpoint: '/api/chat' });

    await send(el, 'offline');

    const alert = el.querySelector('.sem-chat-error')!;
    expect(alert.getAttribute('role')).toBe('alert');
    expect(alert.textContent).toContain('network down');
    expect(composer(el).textarea.disabled).toBe(false);
  });

  it('never fetches without an endpoint — the alert says so instead', async () => {
    const el = await mount({ model: 'glm-5.3' });

    await send(el, 'nowhere to go');

    expect(fetchMock).not.toHaveBeenCalled();
    const alert = el.querySelector('.sem-chat-error')!;
    expect(alert.getAttribute('role')).toBe('alert');
    expect(alert.textContent).toContain('endpoint');
    expect(composer(el).textarea.disabled).toBe(false);
  });

  it('bare Enter sends; Shift+Enter leaves the newline to the browser', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ content: 'ok' }));
    const el = await mount({ endpoint: '/api/chat' });
    const { textarea } = composer(el);

    textarea.value = 'press enter';
    textarea.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    textarea.value = 'line one';
    const shifted = new KeyboardEvent('keydown', {
      key: 'Enter',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    textarea.dispatchEvent(shifted);
    expect(fetchMock).toHaveBeenCalledTimes(1); // no second send
    expect(shifted.defaultPrevented).toBe(false); // the newline goes through
  });

  it('renders a labelled live log and a labelled input', async () => {
    const el = await mount({ endpoint: '/api/chat', placeholder: 'Say something…' });
    const log = el.querySelector('.sem-chat-log')!;
    expect(log.getAttribute('role')).toBe('log');
    expect(log.getAttribute('aria-live')).toBe('polite');
    const { textarea } = composer(el);
    expect(textarea.getAttribute('aria-label')).toBeTruthy();
    expect(textarea.getAttribute('placeholder')).toBe('Say something…');
  });

  it('ignores an empty composer', async () => {
    const el = await mount({ endpoint: '/api/chat' });
    await send(el, '   ');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(el.querySelector('.sem-chat-msg')).toBeNull();
  });
});

describe('consumeReply', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('emits each decoded chunk as it arrives and returns the full text', async () => {
    const deltas: string[] = [];
    const full = await consumeReply(streamResponse(['Hel', 'lo']), (d) => deltas.push(d));
    expect(deltas).toEqual(['Hel', 'lo']);
    expect(full).toBe('Hello');
  });

  it('reads a JSON body as { content } and never streams it', async () => {
    const deltas: string[] = [];
    const full = await consumeReply(
      {
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        body: null,
        json: async () => ({ content: 'one shot' }),
      } as unknown as Response,
      (d) => deltas.push(d),
    );
    expect(deltas).toEqual(['one shot']);
    expect(full).toBe('one shot');
  });
});
