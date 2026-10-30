import { describe, expect, it } from 'vitest';
import { applyMove, canMove, isSolved, legalMoves } from './rules';
import type { Layout } from './types';

describe('canMove', () => {
  const layout: Layout = [[1, 0, 0], [1, 0], [], [0, 1, 1, 1], [1]];

  it('rejects an empty source', () => {
    expect(canMove(layout, 2, 0)).toBe(false);
  });

  it('rejects moving a bolt onto itself', () => {
    expect(canMove(layout, 0, 0)).toBe(false);
  });

  it('rejects a full target', () => {
    expect(canMove(layout, 4, 3)).toBe(false);
  });

  it('rejects a mismatched top', () => {
    expect(canMove(layout, 0, 4)).toBe(false);
    expect(canMove(layout, 3, 0)).toBe(false);
  });

  it('accepts an empty target', () => {
    expect(canMove(layout, 0, 2)).toBe(true);
  });

  it('accepts a same-type top with room', () => {
    expect(canMove(layout, 0, 1)).toBe(true);
    expect(canMove(layout, 3, 4)).toBe(true);
  });

  it('rejects out-of-range bolts', () => {
    expect(canMove(layout, -1, 0)).toBe(false);
    expect(canMove(layout, 0, 9)).toBe(false);
  });
});

describe('applyMove', () => {
  it('moves exactly one nut and keeps the input intact', () => {
    const layout: Layout = [[1, 0, 0], [1, 0], []];
    const snapshot = JSON.stringify(layout);
    const next = applyMove(layout, [0, 1]);
    expect(next).toEqual([[1, 0], [1, 0, 0], []]);
    expect(JSON.stringify(layout)).toBe(snapshot);
  });

  it('throws on an illegal move', () => {
    expect(() => applyMove([[1], [0]], [0, 1])).toThrow();
  });
});

describe('legalMoves', () => {
  it('lists exactly the legal pairs of the level-1 shape', () => {
    // green = 1, red = 0
    const layout: Layout = [[1, 0, 0], [1, 0, 0], [1, 1]];
    expect(legalMoves(layout)).toEqual([
      [0, 1],
      [1, 0],
    ]);
  });

  it('includes moves onto empty bolts', () => {
    expect(legalMoves([[0, 1], []])).toEqual([[0, 1]]);
  });
});

describe('isSolved', () => {
  it('accepts sorted bolts with an empty one', () => {
    expect(isSolved([[0, 0, 0, 0], [1, 1, 1, 1], []])).toBe(true);
  });

  it('rejects mixed bolts', () => {
    expect(isSolved([[0, 0, 0, 1], [1, 1, 1, 0], []])).toBe(false);
  });

  it('rejects an incomplete bolt', () => {
    expect(isSolved([[0, 0, 0], [1, 1, 1, 1], [0]])).toBe(false);
  });
});
