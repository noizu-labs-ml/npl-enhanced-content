/**
 * The build-time manifest the lazy build injects (scripts/build.mjs, the
 * `semtext-manifest` inline plugin): tag → chunk path relative to dist/.
 * There is no source file to resolve — vite serves it virtually, and this
 * declaration keeps `tsc --noEmit` honest about the shape. Unit specs never
 * import it; they exercise scan.ts / loader.ts, which take the manifest as
 * a plain argument.
 */
declare module 'virtual:semtext-manifest' {
  const manifest: Record<string, string>;
  export default manifest;
}
