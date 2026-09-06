/* Shared foundation */
export { SemElement } from './elements/base.js';
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
export { SemNote } from './elements/sem-note.js';
import './elements/sem-note.js';
export { SemFacts } from './elements/sem-facts.js';
import './elements/sem-facts.js';
export { SemDetails } from './elements/sem-details.js';
import './elements/sem-details.js';
