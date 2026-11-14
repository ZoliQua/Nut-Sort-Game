import { LEVELS } from './levels';

/** The most bolts any level has; the bolt keys cover exactly this many. */
export const MAX_BOLTS = Math.max(...LEVELS.map((l) => l.layout.length));

const DIGITS = Math.min(MAX_BOLTS, 9);
const ZERO = MAX_BOLTS >= 10;

/** Key-help label of the bolt keys, e.g. `1–9 0` (key `0` is bolt 10). */
export const SELECT_KEYS = `1–${DIGITS}${ZERO ? ' 0' : ''}`;
/** The same keys inside a sentence, e.g. `1–9, 0`. */
export const SELECT_KEYS_TEXT = `1–${DIGITS}${ZERO ? ', 0' : ''}`;
