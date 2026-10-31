import { describe, expect, it } from 'vitest';
import { bandFor, CAPACITY, LEVEL_COUNT } from './constants';
import { LEVELS } from './levels';
import { applyMove, isSolved } from './rules';

// The full independent re-solve lives in `npm run verify:levels`; here the stored solutions are replayed.
describe('LEVELS', () => {
  it('has 20 levels numbered 1–20', () => {
    expect(LEVELS).toHaveLength(LEVEL_COUNT);
    LEVELS.forEach((level, i) => expect(level.id).toBe(i + 1));
  });

  it('matches each band in types and bolts', () => {
    for (const level of LEVELS) {
      const band = bandFor(level.id);
      expect(level.types).toBe(band.types);
      expect(level.layout).toHaveLength(band.bolts);
    }
  });

  it('holds at most 4 nuts per bolt and exactly 4 of each type', () => {
    for (const level of LEVELS) {
      const counts = new Map<number, number>();
      for (const bolt of level.layout) {
        expect(bolt.length).toBeLessThanOrEqual(CAPACITY);
        for (const nut of bolt) counts.set(nut, (counts.get(nut) ?? 0) + 1);
      }
      expect([...counts.keys()].sort((a, b) => a - b)).toEqual(Array.from({ length: level.types }, (_, i) => i));
      for (const count of counts.values()) expect(count).toBe(CAPACITY);
    }
  });

  it('is never pre-solved and has no completed bolt at the start', () => {
    for (const level of LEVELS) {
      expect(isSolved(level.layout)).toBe(false);
      for (const bolt of level.layout) {
        expect(bolt.length === CAPACITY && bolt.every((n) => n === bolt[0])).toBe(false);
      }
    }
  });

  it('replays its solution to solved in exactly par moves', () => {
    for (const level of LEVELS) {
      expect(level.solution).toHaveLength(level.par);
      expect(isSolved(level.solution.reduce(applyMove, level.layout))).toBe(true);
    }
  });

  it('keeps par non-decreasing within each band', () => {
    for (let i = 1; i < LEVELS.length; i++) {
      if (bandFor(LEVELS[i].id) !== bandFor(LEVELS[i - 1].id)) continue;
      expect(LEVELS[i].par).toBeGreaterThanOrEqual(LEVELS[i - 1].par);
    }
  });
});
