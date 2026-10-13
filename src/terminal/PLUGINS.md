# sem-terminal — plugin contract

`<sem-terminal>` is a reusable terminal core (input, history, transcript,
prompt, dispatch) that knows nothing about SemText. Everything it can do
beyond two builtins (`help`, `clear`) arrives through **plugins**.
`<sem-shell>` is the core with two bundled plugins mounted: `posix-sh`
(the POSIX-style commands over the virtual file system) and `semtext-demo`
(the demo documents and the `semtext`/`open` commands).

## Manifest

A plugin manifest is a JSON object or an equivalent JS object:

```jsonc
{
  "name": "semtext-demo",            // required, unique per terminal
  "version": "0.1.0",                // required
  "description": "…",                // optional
  "load": {                          // optional: where shipped code lives
    "src": "./commands.js",          //   relative to the manifest URL, or
    "integrity": "sha256-<64 hex>"   //   absolute https — which REQUIRES this
  },
  "commands": [ … ],                 // JS-object manifests: full specs
  "files": [ … ]                     // virtual file-system entries
}
```

One line, as you would declare it on the element (hash rides the URL as a
fragment):

```html
<sem-terminal plugins="https://cdn.example.com/semtext/manifest.json#sha256-9f2c… demo/manifest.json">
```

## File structure a plugin ships

```
my-plugin/
  manifest.json      the manifest above (name, version, load, files)
  commands.js        ES module, default-exports the CommandSpec[] array
  files/             the documents the plugin mounts (referenced by files[].src)
```

The in-repo examples are `src/terminal/plugins/demo/` (the same manifest
as a JS object in `plugin.ts`, bundled, zero fetches) and
`src/terminal/plugins/posix/` (the POSIX command set, bundled-only).
`manifest.json` is the JSON serialization for the shipped form; a test
pins the two in sync.

## Command signature

```ts
interface CommandSpec {
  name: string;              // /^[a-z][a-z0-9-]*$/, unique per terminal
  usage: string;             // shown by `help`, e.g. "ls [-l] [path]"
  run(ctx: CommandContext): void;
}

interface CommandContext {
  args: string[];            // argv after the command name — expanded
  stdin: string | null;      // piped text from the previous stage, else null
  vfs: Vfs;                  // the terminal's virtual file system
  state: ShellState;         // shared, persistent (see below)
  color: boolean;            // stdout goes to the terminal (a "tty"), so
                             //   ANSI color is welcome; false when piped
                             //   or redirected
  commands: ReadonlyMap;     // every registered command (for `which`-likes)
  out(text: string): void;   // one stdout line (also piped stdout)
  err(text: string): void;   // one stderr line — errors print, never throw
  emit(action): void;        // side-effect requests, DATA only:
  exit(code): void;          // set the exit status (default: 1 if stderr
}                            //   was written, else 0)
```

`ShellState` is the persistent shell, shared by every command of a
terminal: `cwd`, `env` (HOME/PWD/SHELL seeded; `export`/`unset` mutate),
`aliases`, `history` (every executed line), `oldpwd`, and `lastStatus`
(`$?`). Commands mutate `state.cwd`/`state.env` directly; the core keeps
`env.PWD` in step with `cwd` after each line.

## Shell grammar (src/terminal/sh-parse.ts)

Pipelines run left to right (`cat f | grep x > out.txt`). Before a command
runs, the core parses the line:

- `|` splits stages; `>` truncates, `>>` appends a stage's stdout to a
  virtual file (`> f` alone creates an empty f). Redirect targets are never
  glob-expanded.
- Quoting: `'…'` literal; `"…"` expands `$VAR`/`${VAR}`/`$?`; `\` escapes.
- `~` and `~/…` expand from `$HOME` on unquoted words.
- `$VAR`, `${VAR}` expand from `state.env`; `$?` is the previous exit
  status. Unset variables expand empty.
- `*` and `?` glob against the VFS on unquoted words (leading-dot names
  need a literal leading dot); no match leaves the pattern literal.
- The first word of a stage may be an `alias` — its space-split value
  becomes the stage's leading words; an alias never re-expands itself.
- Every executed command appends a `status` transcript line (`exit 0`).
  Exit statuses: explicit `ctx.exit(code)` wins; unknown commands are 127;
  a thrown exception or any stderr means 1; otherwise 0.

## Actions (the one side-effect channel, DATA only)

```ts
{ kind: 'window', filename, blob, contentType }  // open content in a window
{ kind: 'tui', title, cards: [{front, back, meta}] }  // the flashcard view
```

The element performs both; the core stays DOM-free. A `tui` action opens
the read-only card view (boxed panels; `j`/`k`/arrows move, `Enter`
expands, `/` filters, `q` closes). Emit it only when `ctx.color` is true —
a piped `semtext tui` prints its summary line and does not hijack the
terminal. The card/state machine lives in src/terminal/tui.ts.

## Files and mounting

`files[]` entries mount into the terminal's (initially empty) virtual file
system: `{ path: "/demo/welcome.html", content: "…" }` in a JS-object
manifest, or `{ "path": "/demo/welcome.html", "src": "files/welcome.html" }`
in a JSON manifest (fetched relative to the manifest URL). Paths must be
absolute; intermediate directories are created; a later mount replaces an
earlier file at the same path (last write wins). Plugins see the whole
tree — mount under your plugin's own prefix (`/demo`, `/my-plugin`) to
avoid stepping on others.

## CDN load rules

- `<sem-terminal plugins="URL …">` loads each URL independently: one
  failure prints a stderr line and is recorded in `core.loadErrors`; the
  other plugins still mount.
- **Absolute https only.** `http://` and protocol-relative `//` are
  refused outright. Relative / same-origin paths always load.
- **Integrity:** recommended everywhere, REQUIRED for absolute https.
  - Manifest URL: `https://cdn/…/manifest.json#sha256-<64 hex>`.
  - Commands module: the manifest's `load.integrity`.
  - `sha256-<hex>`, hex over the exact fetched text.
- A https source with no hash is **refused before any network request**.
- Verified remote code is imported from a blob URL — there is no `eval`,
  no `new Function`, and no inline `<script>` anywhere in this loader.
  Without a verified hash, no remote code is imported at all.
- Integrity pins bytes; it is not a signature. Rotate hashes when you
  publish new bytes.

## Scripted playback

`<sem-terminal script='[ … ]'>` (or the `playback` property: the same
array as a JS value) makes the terminal demo itself on open. A script is
a list of steps:

```jsonc
[
  { "type": "comment", "text": "A 40-second tour." },
  { "type": "type",  "text": "ls -l", "delayMs": 55 }, // typed char by char
  { "type": "key",   "key": "Enter" },                 // ArrowDown, j, q, …
  { "type": "wait",  "ms": 600 },
  { "type": "run" }                                    // executes the line
]
```

- `type` types into the prompt (`delayMs` per character, default 45);
- `key` presses a named key — routed to the input line, or to the open
  TUI view when one is up;
- `wait` pauses; `run` executes the typed line; `comment` prints a note
  that is not executed.
- On open the script starts typing. **Escape stops it and hands the
  terminal to the user**; a `replay` button restarts from the top.
- `prefers-reduced-motion: reduce` runs the whole script at full speed —
  no typing delay, no waits.
- No `script` attribute and no `playback` property → no playback.
- The zero-JS fallback is untouched: the authored static transcript stays
  exactly what it was.

The runner is src/terminal/playback.ts — pure scheduling with an
injected driver and timer, unit-tested without a DOM.

## Programmatic mounting

```ts
const el = document.querySelector('sem-terminal');
el.core.mountPlugin({ name: 'x', version: '1.0.0', commands: [...], files: [...] });
```

Bundled JS-object manifests carry inline `content` files and real `run`
functions — nothing is fetched. A mount is all-or-nothing: a duplicate
command name or a bad file path fails the whole plugin with no partial
state.
