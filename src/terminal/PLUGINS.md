# sem-terminal — plugin contract

`<sem-terminal>` is a reusable terminal core (input, history, transcript,
prompt, dispatch) that knows nothing about SemText. Everything it can do
beyond two builtins (`help`, `clear`) arrives through **plugins**.
`<sem-shell>` is just the core with the bundled `semtext-demo` plugin
mounted.

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

The in-repo example is `src/terminal/plugins/demo/`: `plugin.ts` is the
same manifest as a JS object (bundled, zero fetches), `commands.ts` is the
commands module, `files/` holds the demo documents, and `manifest.json` is
the JSON serialization for the shipped form. A test pins the two in sync.

## Command signature

```ts
interface CommandSpec {
  name: string;              // /^[a-z][a-z0-9-]*$/, unique per terminal
  usage: string;             // shown by `help`, e.g. "ls [-l] [path]"
  run(ctx: CommandContext): void;
}

interface CommandContext {
  args: string[];            // argv after the command name
  stdin: string | null;      // piped text from the previous stage, else null
  vfs: Vfs;                  // the terminal's virtual file system
  state: { cwd: string };    // shared across pipeline stages (cd mutates it)
  out(text: string): void;   // one stdout line (also piped stdout)
  err(text: string): void;   // one stderr line — errors print, never throw
  emit(action): void;        // side-effect request, currently one kind:
}                            //   { kind: "window", filename, blob, contentType }
```

Pipelines run left to right (`cat f | semtext outline`): each stage's
`out()` text becomes the next stage's `stdin`. Commands are synchronous;
a thrown exception is caught and printed as a stderr line.

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

## Programmatic mounting

```ts
const el = document.querySelector('sem-terminal');
el.core.mountPlugin({ name: 'x', version: '1.0.0', commands: [...], files: [...] });
```

Bundled JS-object manifests carry inline `content` files and real `run`
functions — nothing is fetched. A mount is all-or-nothing: a duplicate
command name or a bad file path fails the whole plugin with no partial
state.
