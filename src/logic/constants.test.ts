import { describe, expect, it } from 'vitest';
import { CAPACITY, LEVEL_BANDS, LEVEL_COUNT, NUT_TYPES } from './constants';

describe('NUT_TYPES', () => {
  it('has 8 types with distinct widths', () => {
    expect(NUT_TYPES).toHaveLength(8);
    expect(new Set(NUT_TYPES.map((t) => t.width)).size).toBe(8);
  });

  it('gives width-neighbours different notch counts', () => {
    const sorted = [...NUT_TYPES].sort((a, b) => a.width - b.width);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].notches).not.toBe(sorted[i - 1].notches);
    }
  });

  it('separates equal notch counts by at least 32/116 in width', () => {
    for (let i = 0; i < NUT_TYPES.length; i++) {
      for (let j = i + 1; j < NUT_TYPES.length; j++) {
        if (NUT_TYPES[i].notches !== NUT_TYPES[j].notches) continue;
        expect(Math.abs(NUT_TYPES[i].width - NUT_TYPES[j].width)).toBeGreaterThanOrEqual(32 / 116 - 1e-9);
      }
    }
  });

  it('keeps widths relative to the widest nut', () => {
    expect(Math.max(...NUT_TYPES.map((t) => t.width))).toBe(1);
  });
});

describe('LEVEL_BANDS', () => {
  it('covers levels 1–20 without gaps or overlaps', () => {
    expect(LEVEL_COUNT).toBe(20);
    let next = 1;
    for (const band of LEVEL_BANDS) {
      expect(band.from).toBe(next);
      expect(band.to).toBeGreaterThanOrEqual(band.from);
      next = band.to + 1;
    }
    expect(next - 1).toBe(LEVEL_COUNT);
  });

  it('never has more types than bolts and rises in difficulty', () => {
    for (let i = 0; i < LEVEL_BANDS.length; i++) {
      const band = LEVEL_BANDS[i];
      expect(band.types).toBeLessThan(band.bolts);
      expect(band.types).toBeLessThanOrEqual(NUT_TYPES.length);
      if (i > 0) expect(band.types).toBeGreaterThan(LEVEL_BANDS[i - 1].types);
    }
  });

  it('adds up to a 10 800 run maximum', () => {
    let total = 0;
    for (const band of LEVEL_BANDS) total += (band.to - band.from + 1) * band.types * 100;
    expect(total).toBe(10800);
  });

  it('uses 4 nuts per bolt', () => {
    expect(CAPACITY).toBe(4);
  });
});
