import { describe, expect, it } from 'vitest';
import { LEVEL_COUNT } from './constants';
import { advanceGame, createInitialState, type GameAction, type GameState } from './game';
import { LEVELS } from './levels';
import { isNutSortSession } from './persist';
import type { Move } from './types';

const run = (state: GameState, ...actions: GameAction[]) => actions.reduce(advanceGame, state);
const play = (state: GameState, moves: readonly Move[]) =>
  run(state, ...moves.flatMap(([from, to]): GameAction[] => [{ type: 'select', bolt: from }, { type: 'select', bolt: to }]));
const roundTrip = (s: unknown): unknown => JSON.parse(JSON.stringify(s));

function finishedRun(): GameState {
  let s = createInitialState();
  for (let i = 0; i < LEVEL_COUNT; i++) {
    s = play(s, LEVELS[i].solution);
    if (i < LEVEL_COUNT - 1) s = advanceGame(s, { type: 'next' });
  }
  return s;
}

describe('isNutSortSession', () => {
  const fresh = createInitialState();
  const mid = run(play(fresh, LEVELS[0].solution.slice(0, 3)), { type: 'undo' }, { type: 'select', bolt: LEVELS[0].solution[0][0] });
  const restarted = advanceGame(play(fresh, LEVELS[0].solution.slice(0, 2)), { type: 'restart' });
  const complete = play(fresh, LEVELS[0].solution);
  const level2 = play(advanceGame(complete, { type: 'next' }), LEVELS[1].solution.slice(0, 1));
  const finished = finishedRun();

  it('accepts reducer states after a JSON round trip', () => {
    for (const s of [fresh, mid, restarted, complete, level2, finished]) expect(isNutSortSession(roundTrip(s))).toBe(true);
  });

  it('rejects non-objects', () => {
    for (const v of [null, undefined, 42, 'x', [], true]) expect(isNutSortSession(v)).toBe(false);
  });

  const tamper = (s: GameState, patch: Record<string, unknown>) => isNutSortSession({ ...(roundTrip(s) as object), ...patch });

  it('rejects a layout that the history does not produce', () => {
    const layout = roundTrip(mid.layout) as number[][];
    const from = layout.findIndex((b) => b.length > 0);
    const to = layout.findIndex((b, i) => i !== from && b.length < 4);
    layout[to].push(layout[from].pop() as number);
    expect(tamper(mid, { layout })).toBe(false);
    expect(tamper(mid, { history: [[0, 0]] })).toBe(false);
    expect(tamper(mid, { history: [[0, 99]] })).toBe(false);
  });

  it('rejects level scores inconsistent with the phase and level', () => {
    expect(tamper(fresh, { levelScores: [200] })).toBe(false);
    expect(tamper(complete, { levelScores: [] })).toBe(false);
    expect(tamper(level2, { levelScores: [] })).toBe(false);
    expect(tamper(level2, { levelScores: [200, 300] })).toBe(false);
    expect(tamper(complete, { phase: 'playing' })).toBe(false);
    expect(tamper(complete, { phase: 'finished' })).toBe(false);
    expect(tamper(finished, { phase: 'levelComplete' })).toBe(false);
  });

  it('rejects a score above 100 × types or one that disagrees with the finished level', () => {
    expect(tamper(level2, { levelScores: [201] })).toBe(false);
    expect(tamper(complete, { levelScores: [199] })).toBe(false);
    expect(tamper(level2, { levelScores: [-1] })).toBe(false);
  });

  it('rejects impossible counters', () => {
    expect(tamper(mid, { moves: mid.history.length - 1 })).toBe(false);
    expect(tamper(mid, { moves: mid.moves + 1 })).toBe(false); // undo pairs keep the gap even
    expect(tamper(mid, { restarts: -1 })).toBe(false);
  });

  it('rejects out-of-range indices and non-integer fields', () => {
    expect(tamper(fresh, { levelIndex: 20 })).toBe(false);
    expect(tamper(fresh, { levelIndex: -1 })).toBe(false);
    expect(tamper(fresh, { levelIndex: 0.5 })).toBe(false);
    expect(tamper(mid, { moves: 3.5 })).toBe(false);
    expect(tamper(mid, { restarts: '0' })).toBe(false);
    expect(tamper(mid, { lifted: 99 })).toBe(false);
    expect(tamper(mid, { lifted: 1.5 })).toBe(false);
    expect(tamper(fresh, { shake: { bolt: 0, nonce: -1 } })).toBe(false);
    expect(tamper(fresh, { phase: 'won' })).toBe(false);
    expect(tamper(complete, { lifted: 0 })).toBe(false);
  });

  it('rejects a lifted empty bolt', () => {
    const empty = fresh.layout.findIndex((b) => b.length === 0);
    expect(tamper(fresh, { lifted: empty })).toBe(false);
  });
});
