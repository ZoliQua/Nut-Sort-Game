import { LEVEL_COUNT } from './constants';
import { LEVELS } from './levels';
import { applyMove, canMove, isSolved } from './rules';
import { levelScore, maxLevelScore, UNDO_COST } from './scoring';
import type { Layout, Move } from './types';

export type Phase = 'playing' | 'levelComplete' | 'finished';

export type GameState = {
  /** 0..19 */
  levelIndex: number;
  layout: Layout;
  /** Net applied moves since the level start or the last restart (undo pops). */
  history: Move[];
  /** The scored counter: one per move plus UNDO_COST per undo. */
  moves: number;
  restarts: number;
  /** Bolt whose top nut is lifted. */
  lifted: number | null;
  /** Last rejected target; the nonce re-triggers the shake animation. */
  shake: { bolt: number; nonce: number } | null;
  /** One score per completed level. */
  levelScores: number[];
  phase: Phase;
  /** The player ended the run with the Finish button; the score is the levels solved so far. */
  finishedEarly?: boolean;
};

export type GameAction =
  | { type: 'select'; bolt: number }
  | { type: 'cancel' }
  | { type: 'undo' }
  | { type: 'restart' }
  | { type: 'next' }
  | { type: 'newRun' }
  | { type: 'finishEarly' };

function levelStart(levelIndex: number, levelScores: number[], restarts = 0): GameState {
  return {
    levelIndex,
    layout: LEVELS[levelIndex].layout,
    history: [],
    moves: 0,
    restarts,
    lifted: null,
    shake: null,
    levelScores,
    phase: 'playing',
  };
}

/**
 * A fresh run at `levelIndex` (default level 1). Starting further in fills the
 * skipped levels with 0 points, which keeps the state consistent (tests / dev only).
 */
export function createInitialState(levelIndex = 0): GameState {
  return levelStart(levelIndex, new Array<number>(levelIndex).fill(0));
}

/** Moves the top nut of `to` back onto `from`, bypassing the rules (an undo may restore any earlier layout). */
function revertMove(layout: Layout, [from, to]: Move): Layout {
  const nut = layout[to][layout[to].length - 1];
  return layout.map((bolt, i) => {
    if (i === to) return bolt.slice(0, -1);
    if (i === from) return [...bolt, nut];
    return bolt;
  });
}

function select(state: GameState, bolt: number): GameState {
  if (!Number.isInteger(bolt) || bolt < 0 || bolt >= state.layout.length) return state;
  const { lifted } = state;
  // A new lift, drop or move ends any shake, so it never replays on the next lift.
  if (lifted === null) return state.layout[bolt].length > 0 ? { ...state, lifted: bolt, shake: null } : state;
  if (lifted === bolt) return { ...state, lifted: null, shake: null };
  if (!canMove(state.layout, lifted, bolt)) {
    return { ...state, shake: { bolt, nonce: (state.shake?.nonce ?? 0) + 1 } };
  }
  const move: Move = [lifted, bolt];
  const next: GameState = {
    ...state,
    layout: applyMove(state.layout, move),
    history: [...state.history, move],
    moves: state.moves + 1,
    lifted: null,
    shake: null,
  };
  if (!isSolved(next.layout)) return next;
  const level = LEVELS[state.levelIndex];
  const score = levelScore({ types: level.types, par: level.par, moves: next.moves, restarts: next.restarts });
  return {
    ...next,
    levelScores: [...state.levelScores, score],
    phase: state.levelIndex === LEVEL_COUNT - 1 ? 'finished' : 'levelComplete',
  };
}

/** Every state transition. Actions that do not apply return the same state object. */
export function advanceGame(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'newRun':
      return createInitialState(0);
    case 'finishEarly':
      return state.phase === 'finished' ? state : { ...state, lifted: null, shake: null, phase: 'finished', finishedEarly: true };
    case 'next':
      return state.phase === 'levelComplete' ? levelStart(state.levelIndex + 1, state.levelScores) : state;
    default:
      break;
  }
  if (state.phase !== 'playing') return state;
  switch (action.type) {
    case 'select':
      return select(state, action.bolt);
    case 'cancel':
      return state.lifted === null ? state : { ...state, lifted: null };
    case 'undo': {
      const last = state.history[state.history.length - 1];
      if (!last) return state;
      return {
        ...state,
        layout: revertMove(state.layout, last),
        history: state.history.slice(0, -1),
        moves: state.moves + UNDO_COST,
        lifted: null,
      };
    }
    case 'restart':
      // Nothing to reset: do not charge a restart.
      if (state.moves === 0) return state;
      return levelStart(state.levelIndex, state.levelScores, state.restarts + 1);
  }
}

/** Σ of the completed level scores. */
export function runScore(state: GameState): number {
  return state.levelScores.reduce((sum, s) => sum + s, 0);
}

/** The highest possible run score (100 × Σ types over all levels). */
export const RUN_MAX_SCORE = LEVELS.reduce((sum, l) => sum + maxLevelScore(l.types), 0);
