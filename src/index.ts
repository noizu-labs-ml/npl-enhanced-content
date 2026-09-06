/* Shared foundation */
export { NplElement } from './elements/base.js';
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
export { NplNote } from './elements/npl-note.js';
import './elements/npl-note.js';
export { NplFacts } from './elements/npl-facts.js';
import './elements/npl-facts.js';
export { NplDetails } from './elements/npl-details.js';
import './elements/npl-details.js';
