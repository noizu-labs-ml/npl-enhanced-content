/* Shared foundation */
export { SemElement } from './lit/base.js';
export { parseTokens, elementTokens } from './shared/tokens.js';
export { mulberry32, shuffle, resolveSeed, randomFor } from './shared/rng.js';
export {
  parseProfiles,
  buildClosure,
  closureFor,
  matches,
  warn,
} from './shared/audience.js';
export type { Profile, AudienceClosure } from './shared/audience.js';
export {
  hashSegments,
  bareSegments,
  getParam,
  setParam,
  readLocal,
  writeLocal,
  removeLocal,
} from './shared/state.js';

/* Elements — importing registers the custom element */
export { SemNote } from './lit/sem-note.js';
import './lit/sem-note.js';
export { SemFacts } from './lit/sem-facts.js';
import './lit/sem-facts.js';
export { SemDetails } from './lit/sem-details.js';
import './lit/sem-details.js';
/* R/W1 prose elements — thin wrappers over src/reading/* */
export { SemCode } from './lit/sem-code.js';
import './lit/sem-code.js';
export { SemReferences } from './lit/sem-references.js';
import './lit/sem-references.js';
export { SemProperties } from './lit/sem-properties.js';
import './lit/sem-properties.js';
/* R/W2 chrome + data — thin wrappers over src/reading/* */
export { SemReader } from './lit/sem-reader.js';
import './lit/sem-reader.js';
export { SemTable } from './lit/sem-table.js';
import './lit/sem-table.js';
