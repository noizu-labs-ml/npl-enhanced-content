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
