import { describe, expect, it } from 'vitest';
import { CAPACITY } from './constants';
import { applyMove, isSolved, legalMoves } from './rules';
import { canonicalKey, heuristic, solve } from './solver';
import type { Layout, Move } from './types';

/** Brute-force oracle: plain BFS over raw layouts, no pruning, no symmetry. */
function bfsOptimum(start: Layout): number {
  const key = (l: Layout) => l.map((b) => b.join(',')).join('|');
  let frontier: Layout[] = [start];
  const seen = new Set([key(start)]);
  for (let depth = 0; frontier.length > 0; depth++) {
    const next: Layout[] = [];
    for (const layout of frontier) {
      if (isSolved(layout)) return depth;
      for (const move of legalMoves(layout)) {
        const child = applyMove(layout, move);
        const k = key(child);
        if (seen.has(k)) continue;
        seen.add(k);
        next.push(child);
      }
    }
    frontier = next;
  }
  return -1;
}

/** mulberry32, so the random cases are reproducible. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomLayout(seed: number, types: number, bolts: number): Layout {
  const rand = rng(seed);
  const nuts: number[] = [];
  for (let t = 0; t < types; t++) for (let i = 0; i < CAPACITY; i++) nuts.push(t);
  for (let i = nuts.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [nuts[i], nuts[j]] = [nuts[j], nuts[i]];
  }
  const layout: number[][] = [];
  for (let b = 0; b < types; b++) layout.push(nuts.slice(b * CAPACITY, (b + 1) * CAPACITY));
  for (let b = types; b < bolts; b++) layout.push([]);
  return layout;
}

const replay = (layout: Layout, moves: Move[]): Layout => moves.reduce(applyMove, layout);

/** The ad's three-bolt red/green shape: with single-nut moves it is a dead end. */
const AD_SHAPE: Layout = [[1, 0, 0], [1, 0, 0], [1, 1]];

const HAND_MADE: Layout[] = [
  [[0, 1, 0, 1], [1, 0, 1, 0], []],
  [[0, 0, 1, 0], [1, 1, 0, 1], []],
  [[0, 0, 1, 1], [1, 1, 0, 0], []],
  [[0, 1, 2, 0], [1, 2, 0, 1], [2, 0, 1, 2], [], []],
  [[2, 2, 1, 0], [0, 1, 1, 2], [0, 0, 1, 2], [], []],
];

describe('heuristic', () => {
  it('is 0 for solved layouts', () => {
    expect(heuristic([[0, 0, 0, 0], [1, 1, 1, 1], []])).toBe(0);
    expect(heuristic([[], [2, 2, 2, 2], [0, 0, 0, 0], [1, 1, 1, 1]])).toBe(0);
  });

  it('never exceeds the true optimum', () => {
    for (const layout of HAND_MADE) {
      const optimum = bfsOptimum(layout);
      expect(optimum).toBeGreaterThan(0);
      expect(heuristic(layout)).toBeLessThanOrEqual(optimum);
    }
  });

  it('handles the unsolvable ad shape', () => {
    expect(bfsOptimum(AD_SHAPE)).toBe(-1);
    expect(heuristic(AD_SHAPE)).toBeGreaterThan(0);
  });

  it('is positive for unsolved layouts', () => {
    for (const layout of HAND_MADE) expect(heuristic(layout)).toBeGreaterThan(0);
  });
});

describe('canonicalKey', () => {
  it('ignores bolt order', () => {
    const a: Layout = [[1, 0, 0], [1, 0, 0], [1, 1], []];
    const b: Layout = [[], [1, 1], [1, 0, 0], [1, 0, 0]];
    expect(canonicalKey(a)).toBe(canonicalKey(b));
  });

  it('distinguishes nut order within a bolt', () => {
    expect(canonicalKey([[0, 1], []])).not.toBe(canonicalKey([[1, 0], []]));
  });
});

describe('solve', () => {
  it('returns an empty list for a solved layout', () => {
    expect(solve([[0, 0, 0, 0], [1, 1, 1, 1], []])).toEqual([]);
  });

  it('solves the hand-made layouts optimally', () => {
    for (const layout of HAND_MADE) {
      const moves = solve(layout);
      expect(moves).not.toBeNull();
      expect(isSolved(replay(layout, moves as Move[]))).toBe(true);
      expect(moves?.length).toBe(bfsOptimum(layout));
    }
  });

  it('matches the BFS optimum on random 2–3-type layouts', () => {
    const cases: [types: number, bolts: number][] = [
      [2, 3],
      [2, 4],
      [3, 4],
      [3, 5],
    ];
    for (const [types, bolts] of cases) {
      for (let seed = 1; seed <= 12; seed++) {
        const layout = randomLayout(seed * 7919 + types * 31 + bolts, types, bolts);
        const optimum = bfsOptimum(layout);
        const moves = solve(layout);
        if (optimum < 0) {
          expect(moves).toBeNull();
          continue;
        }
        expect(moves).not.toBeNull();
        expect(isSolved(replay(layout, moves as Move[]))).toBe(true);
        expect(moves?.length).toBe(optimum);
        expect(heuristic(layout)).toBeLessThanOrEqual(optimum);
      }
    }
  }, 60_000);

  it('finds the same optimum without pruning', () => {
    for (const layout of HAND_MADE) expect(solve(layout, { prune: false })?.length).toBe(solve(layout)?.length);
  });

  it('returns null for an unsolvable layout', () => {
    expect(solve(AD_SHAPE)).toBeNull();
  });

  it('returns null when the budget is too small', () => {
    expect(solve([[0, 1, 2, 0], [1, 2, 0, 1], [2, 0, 1, 2], [], []], { maxExpanded: 10 })).toBeNull();
  });
});
