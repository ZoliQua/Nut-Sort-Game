import { describe, expect, it } from 'vitest';
import { LEVEL_COUNT } from './constants';
import { advanceGame, createInitialState, runScore, type GameAction, type GameState } from './game';
import { LEVELS } from './levels';
import type { Move } from './types';

const run = (state: GameState, ...actions: GameAction[]) => actions.reduce(advanceGame, state);
const play = (state: GameState, moves: readonly Move[]) =>
  run(state, ...moves.flatMap(([from, to]): GameAction[] => [{ type: 'select', bolt: from }, { type: 'select', bolt: to }]));

/** A legal first move and an illegal target for it, found on level 1. */
function firstLegalAndIllegal(state: GameState): { move: Move; illegal: number } {
  const move = LEVELS[0].solution[0];
  const illegal = state.layout.findIndex(
    (bolt, i) =>
      i !== move[0] && bolt.length > 0 && (bolt.length === 4 || bolt[bolt.length - 1] !== state.layout[move[0]][state.layout[move[0]].length - 1]),
  );
  return { move, illegal };
}

describe('createInitialState', () => {
  it('starts level 1 fresh', () => {
    const s = createInitialState();
    expect(s.levelIndex).toBe(0);
    expect(s.layout).toEqual(LEVELS[0].layout);
    expect(s).toMatchObject({ history: [], moves: 0, restarts: 0, lifted: null, shake: null, levelScores: [], phase: 'playing' });
  });
});

describe('advanceGame — select', () => {
  const s0 = createInitialState();

  it('lifts a non-empty bolt and drops it back on a second click', () => {
    const from = s0.layout.findIndex((b) => b.length > 0);
    const lifted = advanceGame(s0, { type: 'select', bolt: from });
    expect(lifted.lifted).toBe(from);
    const dropped = advanceGame(lifted, { type: 'select', bolt: from });
    expect(dropped.lifted).toBeNull();
    expect(dropped.moves).toBe(0);
    expect(dropped.layout).toEqual(s0.layout);
  });

  it('ignores an empty bolt when nothing is lifted', () => {
    const empty = s0.layout.findIndex((b) => b.length === 0);
    expect(advanceGame(s0, { type: 'select', bolt: empty })).toBe(s0);
  });

  it('applies a legal move', () => {
    const [from, to] = LEVELS[0].solution[0];
    const s = run(s0, { type: 'select', bolt: from }, { type: 'select', bolt: to });
    expect(s.moves).toBe(1);
    expect(s.history).toEqual([[from, to]]);
    expect(s.lifted).toBeNull();
    expect(s.layout[to].length).toBe(s0.layout[to].length + 1);
  });

  it('shakes an illegal target, keeps the lift and bumps the nonce', () => {
    const { move, illegal } = firstLegalAndIllegal(s0);
    expect(illegal).toBeGreaterThanOrEqual(0);
    const a = run(s0, { type: 'select', bolt: move[0] }, { type: 'select', bolt: illegal });
    expect(a.lifted).toBe(move[0]);
    expect(a.shake).toEqual({ bolt: illegal, nonce: 1 });
    expect(a.moves).toBe(0);
    const b = advanceGame(a, { type: 'select', bolt: illegal });
    expect(b.shake).toEqual({ bolt: illegal, nonce: 2 });
  });

  it('ignores out-of-range bolts', () => {
    expect(advanceGame(s0, { type: 'select', bolt: 99 })).toBe(s0);
    expect(advanceGame(s0, { type: 'select', bolt: -1 })).toBe(s0);
  });

  it('cancel drops the lifted nut', () => {
    const lifted = advanceGame(s0, { type: 'select', bolt: LEVELS[0].solution[0][0] });
    expect(advanceGame(lifted, { type: 'cancel' }).lifted).toBeNull();
    expect(advanceGame(s0, { type: 'cancel' })).toBe(s0);
  });
});

describe('advanceGame — undo and restart', () => {
  const s0 = createInitialState();

  it('undo at the level start is a no-op', () => {
    expect(advanceGame(s0, { type: 'undo' })).toBe(s0);
  });

  it('a move followed by undo costs 2 moves and restores the layout', () => {
    const s = play(s0, [LEVELS[0].solution[0]]);
    const u = advanceGame(s, { type: 'undo' });
    expect(u.moves).toBe(2);
    expect(u.history).toEqual([]);
    expect(u.layout).toEqual(s0.layout);
    // Nothing left to undo: the counter stays put.
    expect(advanceGame(u, { type: 'undo' })).toBe(u);
  });

  it('undo restores layouts that a forward move could not reach back', () => {
    const s = play(s0, LEVELS[0].solution.slice(0, 3));
    const u = run(s, { type: 'undo' }, { type: 'undo' }, { type: 'undo' });
    expect(u.layout).toEqual(s0.layout);
    expect(u.moves).toBe(6);
  });

  it('restart reloads the level, resets moves and counts the restart', () => {
    const s = play(s0, LEVELS[0].solution.slice(0, 2));
    const r = advanceGame(s, { type: 'restart' });
    expect(r.layout).toEqual(LEVELS[0].layout);
    expect(r).toMatchObject({ moves: 0, history: [], restarts: 1, lifted: null });
    // Undo right after a restart does nothing.
    expect(advanceGame(r, { type: 'undo' })).toBe(r);
  });

  it('restart with nothing to reset is a no-op', () => {
    expect(advanceGame(s0, { type: 'restart' })).toBe(s0);
  });
});

describe('advanceGame — levels and run', () => {
  it('solving level 1 completes it at par for 200', () => {
    const s = play(createInitialState(), LEVELS[0].solution);
    expect(s.phase).toBe('levelComplete');
    expect(s.levelScores).toEqual([200]);
    expect(runScore(s)).toBe(200);
    // Nothing but `next` moves on from here.
    expect(advanceGame(s, { type: 'undo' })).toBe(s);
    expect(advanceGame(s, { type: 'restart' })).toBe(s);
    expect(advanceGame(s, { type: 'select', bolt: 0 })).toBe(s);
  });

  it('next loads level 2 with fresh counters', () => {
    const s = advanceGame(play(createInitialState(), LEVELS[0].solution), { type: 'next' });
    expect(s.levelIndex).toBe(1);
    expect(s.layout).toEqual(LEVELS[1].layout);
    expect(s).toMatchObject({ moves: 0, restarts: 0, history: [], phase: 'playing', levelScores: [200] });
  });

  it('next does nothing while playing', () => {
    const s0 = createInitialState();
    expect(advanceGame(s0, { type: 'next' })).toBe(s0);
  });

  it('a restart lowers the level score', () => {
    const s = play(advanceGame(play(createInitialState(), [LEVELS[0].solution[0]]), { type: 'restart' }), LEVELS[0].solution);
    expect(s.levelScores).toEqual([160]);
  });

  it('solving all 20 levels finishes the run at 10 800', () => {
    let s = createInitialState();
    for (let i = 0; i < LEVEL_COUNT; i++) {
      s = play(s, LEVELS[i].solution);
      if (i < LEVEL_COUNT - 1) {
        expect(s.phase).toBe('levelComplete');
        s = advanceGame(s, { type: 'next' });
      }
    }
    expect(s.phase).toBe('finished');
    expect(s.levelScores).toHaveLength(20);
    expect(runScore(s)).toBe(10800);
    expect(advanceGame(s, { type: 'next' })).toBe(s);
    expect(advanceGame(s, { type: 'newRun' })).toEqual(createInitialState(0));
  });
});
