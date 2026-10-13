/**
 * sem-terminal — the terminal core: plugin registry, command dispatch.
 *
 * Knows nothing about SemText. Two generic builtins (`help`, `clear`);
 * everything else arrives through plugins. A plugin manifest is a JSON or
 * JS object with `name`, `version`, `commands` (name, usage, run), `files`
 * (virtual file-system entries, mounted at absolute paths such as /demo)
 * and an optional `load` descriptor (src URL + integrity) — the full
 * contract is src/terminal/PLUGINS.md.
 *
 * Dispatch is pipeline-shaped (`cat f | semtext outline`): stages run left
 * to right against a shared cwd, each stage's `out()` text becomes the next
 * stage's stdin, and errors are stderr lines — never thrown. The one side
 * effect a command may request (`open` a document in a window) is emitted
 * as DATA (`ShellAction`) for the element to perform; the core stays
 * DOM-free and unit-testable in plain Node.
 */

import { Vfs, type VfsNode } from './vfs.js';
import {
  checkSourceAllowed,
  fetchText,
  importCommandsModule,
  isIntegrityFormat,
  PluginRefusedError,
  splitIntegrityFragment,
  verifyIntegrity,
  type LoadDescriptor,
  type MountedPlugin,
} from './loader.js';

export interface ShellState {
  cwd: string;
}

export type ShellLineKind = 'cmd' | 'stdout' | 'stderr';

export interface ShellLine {
  kind: ShellLineKind;
  text: string;
}

/** Data-only request to show content in a window; the element performs it. */
export interface WindowAction {
  kind: 'window';
  filename: string;
  blob: string;
  contentType: string;
}

export type ShellAction = WindowAction;

/** What a command run receives. `state` is shared across pipeline stages. */
export interface CommandContext {
  args: string[];
  /** Text piped in from the previous stage; null in stage one. */
  stdin: string | null;
  vfs: Vfs;
  state: ShellState;
  /** One output line (and a chunk of piped stdout). */
  out(text: string): void;
  /** One error line — errors are printed, never thrown. */
  err(text: string): void;
  /** Request a side effect (currently: open content in a window). */
  emit(action: ShellAction): void;
}

export interface CommandSpec {
  name: string;
  /** Full usage string, shown by `help`, e.g. `ls [-l] [path]`. */
  usage: string;
  run(ctx: CommandContext): void;
}

/** One virtual file-system entry a plugin contributes. */
export interface PluginFileEntry {
  /** Absolute mount path, e.g. /demo/welcome.html. */
  path: string;
  /** Inline content (bundled / JS-object manifests). */
  content?: string;
  /** Fetched relative to the manifest URL (JSON manifests). */
  src?: string;
}

export interface PluginManifest {
  name: string;
  version: string;
  description?: string;
  commands: CommandSpec[];
  files: PluginFileEntry[];
  load?: LoadDescriptor;
}

/** The JSON-manifest shape: commands arrive via the module `load.src`. */
export interface RemoteJsonManifest {
  name: string;
  version: string;
  description?: string;
  load?: LoadDescriptor;
  files?: Array<{ path: string; src?: string; content?: string }>;
}

export interface MountResult {
  ok: boolean;
  error: string | null;
  /** The mounted plugin provenance (ok only). */
  plugin?: MountedPlugin;
}

export interface LoadError {
  plugin: string;
  url: string;
  message: string;
}

export interface ExecResult {
  lines: ShellLine[];
  state: ShellState;
  /** `clear` wipes the transcript instead of appending. */
  clear: boolean;
  actions: ShellAction[];
}

const NAME_PATTERN = /^[a-z][a-z0-9-]*$/;

/**
 * The registry + dispatcher. One terminal owns one; the element
 * (`sem-terminal.ts`) wraps it with input/history/DOM.
 */
export class TerminalCore {
  readonly vfs = new Vfs();
  state: ShellState = { cwd: '/' };
  readonly commands = new Map<string, CommandSpec>();
  readonly plugins: MountedPlugin[] = [];
  readonly loadErrors: LoadError[] = [];

  constructor() {
    this.#register(
      {
        name: 'help',
        usage: 'help — list commands',
        run: (ctx) => {
          ctx.out('commands:');
          for (const spec of [...this.commands.values()].sort((a, b) => a.name.localeCompare(b.name))) {
            ctx.out('  ' + spec.usage);
          }
        },
      },
      '(builtin)',
    );
    this.#register(
      {
        name: 'clear',
        usage: 'clear — wipe the transcript (also Ctrl+L)',
        run: () => {},
      },
      '(builtin)',
    );
  }

  /** Register one command; refuses duplicates and malformed names. */
  #register(spec: CommandSpec, plugin: string): void {
    if (!NAME_PATTERN.test(spec.name)) {
      throw new Error(`invalid command name "${spec.name}" [${plugin}]`);
    }
    if (this.commands.has(spec.name)) {
      throw new Error(`command "${spec.name}" already registered [${plugin}]`);
    }
    if (typeof spec.run !== 'function') {
      throw new Error(`command "${spec.name}" has no run function [${plugin}]`);
    }
    this.commands.set(spec.name, spec);
  }

  hasCommand(name: string): boolean {
    return this.commands.has(name);
  }

  /**
   * Mount a JS-object manifest: all commands are checked before any is
   * registered, then files mount (last write wins). All-or-nothing per
   * plugin — a failed mount changes nothing.
   */
  mountPlugin(manifest: PluginManifest): MountResult {
    const label = manifest?.name ?? '(unnamed)';
    try {
      if (typeof manifest?.name !== 'string' || manifest.name === '') {
        throw new Error('plugin manifest needs a name');
      }
      if (typeof manifest.version !== 'string' || manifest.version === '') {
        throw new Error(`plugin manifest ${label} needs a version`);
      }
      const commands = manifest.commands ?? [];
      const seen = new Set<string>();
      for (const spec of commands) {
        if (!NAME_PATTERN.test(spec.name)) {
          throw new Error(`invalid command name "${spec.name}" [${label}]`);
        }
        if (typeof spec.run !== 'function') {
          throw new Error(`command "${spec.name}" has no run function [${label}]`);
        }
        if (this.commands.has(spec.name) || seen.has(spec.name)) {
          throw new Error(`command "${spec.name}" already registered [${label}]`);
        }
        seen.add(spec.name);
      }
      for (const entry of manifest.files ?? []) {
        if (typeof entry?.content !== 'string') {
          throw new Error(`file ${entry?.path} has no inline content (src loads only from a manifest URL)`);
        }
        this.vfs.mountFile(entry.path, entry.content);
      }
      for (const spec of commands) this.#register(spec, label);
      const plugin: MountedPlugin = { name: manifest.name, version: manifest.version };
      this.plugins.push(plugin);
      return { ok: true, error: null, plugin };
    } catch (cause) {
      return { ok: false, error: cause instanceof Error ? cause.message : String(cause) };
    }
  }

  /**
   * Fetch + mount one manifest URL. Manifest URL rules: absolute https
   * needs an integrity fragment and is refused (pre-fetch) without one;
   * relative/same-origin loads freely. Failures print nothing here — they
   * are recorded (this.loadErrors) and returned so the caller decides how
   * to surface them; one plugin failing never stops the others.
   */
  async loadPluginFromUrl(url: string): Promise<MountResult> {
    const { base, integrity } = splitIntegrityFragment(url);
    try {
      checkSourceAllowed({ src: base, integrity }, 'manifest');
      if (integrity !== null && !isIntegrityFormat(integrity)) {
        throw new PluginRefusedError(`bad integrity format in ${url} (want sha256-<64 hex>)`);
      }
      const text = await fetchText(base);
      if (integrity !== null && !(await verifyIntegrity(text, integrity))) {
        throw new PluginRefusedError(`refused: integrity mismatch for manifest ${base}`);
      }
      const json = JSON.parse(text) as RemoteJsonManifest;
      const name = typeof json?.name === 'string' ? json.name : '(unnamed)';
      const mounted = await this.#mountRemote(json, base, name, url);
      return { ok: true, error: null, plugin: mounted };
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      this.loadErrors.push({ plugin: '(unknown)', url, message });
      return { ok: false, error: message };
    }
  }

  /** Files resolve inline or relative to the manifest; commands via load.src. */
  async #mountRemote(json: RemoteJsonManifest, baseUrl: string, name: string, url: string): Promise<MountedPlugin> {
    checkSourceAllowed(json.load, `manifest ${name}`);
    const commands = (json.load?.src ? await importCommandsModule(json.load, baseUrl) : []) as CommandSpec[];
    const files: PluginFileEntry[] = [];
    for (const entry of json.files ?? []) {
      files.push({ path: entry.path, content: entry.content ?? (await fetchText(new URL(entry.src ?? '', baseUrl).toString())) });
    }
    const result = this.mountPlugin({ name, version: json.version, description: json.description, commands, files });
    if (!result.ok) throw new Error(result.error ?? 'mount failed');
    return result.plugin!;
  }

  /**
   * Run one input line — `cmd args | cmd args` pipelines included. The
   * first line is always the echo of what was typed; unknown commands and
   * failing commands come back as stderr lines; actions accumulate for the
   * element to perform. Never throws.
   */
  execLine(input: string): ExecResult {
    const lines: ShellLine[] = [{ kind: 'cmd', text: `${this.state.cwd} $ ${input}` }];
    const result: ExecResult = { lines, state: this.state, clear: false, actions: [] };
    let stdin: string | null = null;
    for (const stage of input.split('|')) {
      const argv = stage.trim().split(/\s+/).filter((a) => a !== '');
      if (argv.length === 0) continue; // empty stage: stdin passes through
      if (argv[0] === 'clear') {
        result.clear = true;
        continue;
      }
      const spec = this.commands.get(argv[0]);
      if (!spec) {
        lines.push({ kind: 'stderr', text: `sh: command not found: ${argv[0]}` });
        continue;
      }
      let stdout = '';
      const ctx: CommandContext = {
        args: argv.slice(1),
        stdin,
        vfs: this.vfs,
        state: this.state,
        out: (text) => {
          lines.push({ kind: 'stdout', text });
          stdout += text + '\n';
        },
        err: (text) => lines.push({ kind: 'stderr', text }),
        emit: (action) => result.actions.push(action),
      };
      try {
        spec.run(ctx);
      } catch (cause) {
        lines.push({ kind: 'stderr', text: `${argv[0]}: ${cause instanceof Error ? cause.message : String(cause)}` });
      }
      stdin = stdout;
    }
    return result;
  }
}

/** Node-type helpers re-exported for plugin authors' convenience. */
export type { VfsNode };
