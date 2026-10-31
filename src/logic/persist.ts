import { CAPACITY, LEVEL_COUNT } from './constants';
import type { GameState, Phase } from './game';
import { LEVELS } from './levels';
import { applyMove, canMove, isSolved } from './rules';
import { levelScore, maxLevelScore } from './scoring';
import type { Layout } from './types';

/** What a saved session stores: the whole run state. */
export type SavedGame = GameState;

const PHASES: readonly Phase[] = ['playing', 'levelComplete', 'finished'];

const isNonNegInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

const sameLayout = (a: Layout, b: unknown): boolean =>
  Array.isArray(b) &&
  a.length === b.length &&
  a.every((bolt, i) => Array.isArray(b[i]) && bolt.length === b[i].length && bolt.every((n, j) => n === b[i][j]));

/**
 * Guards a saved Nut Sort session before it is trusted as game state.
 * Besides field types it replays `history` from the level's start layout and
 * requires the result to equal `layout`, checks the counters against each
 * other (every undo adds one move and removes one history entry, so the gap is
 * even), and requires `levelScores` to match the phase: one per finished level,
 * none above the level's maximum, and the current level's score recomputed
 * exactly once it is complete. A tampered or stale save can therefore never
 * load an impossible layout or count a level twice.
 */
export function isNutSortSession(v: unknown): v is SavedGame {
  if (!isRecord(v)) return false;
  const s = v;

  if (!isNonNegInt(s.levelIndex) || s.levelIndex >= LEVEL_COUNT) return false;
  if (!PHASES.includes(s.phase as Phase)) return false;
  if (!isNonNegInt(s.moves) || !isNonNegInt(s.restarts)) return false;
  if (!Array.isArray(s.history) || !Array.isArray(s.levelScores)) return false;
  const level = LEVELS[s.levelIndex];
  const bolts = level.layout.length;

  // Replay: every move must be legal from the level start.
  let layout: Layout = level.layout;
  for (const m of s.history as unknown[]) {
    if (!Array.isArray(m) || m.length !== 2 || !isNonNegInt(m[0]) || !isNonNegInt(m[1])) return false;
    if (!canMove(layout, m[0], m[1])) return false;
    layout = applyMove(layout, [m[0], m[1]]);
  }
  // Undo pops the history, so the live layout is always the replay of what is left.
  if (!Array.isArray(s.layout) || !s.layout.every((b) => Array.isArray(b) && b.length <= CAPACITY)) return false;
  if (!sameLayout(layout, s.layout)) return false;

  if (s.moves < s.history.length || (s.moves - s.history.length) % 2 !== 0) return false;

  if (!(s.lifted === null || (isNonNegInt(s.lifted) && s.lifted < bolts && layout[s.lifted].length > 0))) return false;
  if (!(s.shake === null || (isRecord(s.shake) && isNonNegInt(s.shake.bolt) && s.shake.bolt < bolts && isNonNegInt(s.shake.nonce)))) {
    return false;
  }

  const scores = s.levelScores as unknown[];
  if (!scores.every((x, i) => isNonNegInt(x) && x <= maxLevelScore(LEVELS[i]?.types ?? 0))) return false;

  const phase = s.phase as Phase;
  const solved = isSolved(layout);
  if (phase === 'playing') return !solved && scores.length === s.levelIndex;

  // levelComplete / finished: the level is solved and scored exactly once.
  if (!solved || s.lifted !== null || s.history.length === 0) return false;
  if (phase === 'finished' ? s.levelIndex !== LEVEL_COUNT - 1 : s.levelIndex === LEVEL_COUNT - 1) return false;
  if (scores.length !== s.levelIndex + 1) return false;
  return scores[s.levelIndex] === levelScore({ types: level.types, par: level.par, moves: s.moves, restarts: s.restarts });
}
