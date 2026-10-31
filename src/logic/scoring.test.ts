import { describe, expect, it } from 'vitest';
import { levelScore, restartCap } from './scoring';

describe('restartCap', () => {
  it('drops 20 % per restart down to a 20 % floor', () => {
    expect(restartCap(0)).toBe(1);
    expect(restartCap(1)).toBeCloseTo(0.8);
    expect(restartCap(2)).toBeCloseTo(0.6);
    expect(restartCap(4)).toBeCloseTo(0.2);
    expect(restartCap(5)).toBeCloseTo(0.2);
    expect(restartCap(50)).toBeCloseTo(0.2);
  });
});

describe('levelScore', () => {
  const base = { types: 2, par: 4, moves: 4, restarts: 0 };

  it('pays 100 × types at par', () => {
    expect(levelScore(base)).toBe(200);
  });

  it('scales with par / moves', () => {
    expect(levelScore({ ...base, moves: 8 })).toBe(100);
    expect(levelScore({ ...base, moves: 6 })).toBe(133);
  });

  it('applies the restart cap', () => {
    expect(levelScore({ ...base, restarts: 1 })).toBe(160);
    expect(levelScore({ ...base, restarts: 9 })).toBe(40);
  });

  it('clamps efficiency to 1 below par', () => {
    expect(levelScore({ ...base, moves: 2 })).toBe(200);
    expect(levelScore({ ...base, moves: 0 })).toBe(200);
  });
});
