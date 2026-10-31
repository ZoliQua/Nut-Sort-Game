import { bandFor, CAPACITY, LEVEL_COUNT } from './constants';
import data from './levels.json';
import { applyMove, isSolved } from './rules';
import type { Level, Move } from './types';

/*
 * The 20 fixed levels, generated offline by `npm run levels:generate` and
 * re-proven by `npm run verify:levels`. Validated here at import so a broken
 * file fails loudly instead of shipping an unsolvable level.
 */

type RawLevel = { id: number; types: number; layout: number[][]; par: number; solution: number[][] };

function validate(raw: RawLevel, index: number): Level {
  const fail = (why: string): never => {
    throw new Error(`levels.json level ${index + 1}: ${why}`);
  };
  if (raw.id !== index + 1) fail('wrong id');
  const band = bandFor(raw.id);
  if (raw.types !== band.types || raw.layout.length !== band.bolts) fail('does not match its band');
  const counts = new Array<number>(raw.types).fill(0);
  for (const bolt of raw.layout) {
    if (bolt.length > CAPACITY) fail('overfull bolt');
    for (const nut of bolt) {
      if (!Number.isInteger(nut) || nut < 0 || nut >= raw.types) fail('bad nut type');
      counts[nut]++;
    }
  }
  if (counts.some((c) => c !== CAPACITY)) fail('wrong nut counts');
  const solution: Move[] = raw.solution.map((m) => {
    if (m.length !== 2) fail('bad move');
    return [m[0], m[1]] as const;
  });
  if (solution.length !== raw.par) fail('solution length differs from par');
  if (!isSolved(solution.reduce(applyMove, raw.layout))) fail('solution does not solve the level');
  return { id: raw.id, types: raw.types, layout: raw.layout, par: raw.par, solution };
}

export const LEVELS: readonly Level[] = (data.levels as RawLevel[]).map(validate);

if (LEVELS.length !== LEVEL_COUNT) throw new Error(`levels.json: expected ${LEVEL_COUNT} levels`);
