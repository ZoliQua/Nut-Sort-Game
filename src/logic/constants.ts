/** Nuts per bolt. */
export const CAPACITY = 4;

/**
 * Every nut type is told apart by width **and** notch count; colour is a bonus.
 * Widths are relative to the widest nut (n / 116). Width-neighbours always have
 * a different notch count, and equal notch counts differ by ≥ 32 / 116 in width.
 */
export const NUT_TYPES: readonly { color: string; name: string; width: number; notches: 1 | 2 | 3 | 4 }[] = [
  { color: '#e69f00', name: 'orange', width: 60 / 116, notches: 1 },
  { color: '#0072b2', name: 'blue', width: 68 / 116, notches: 3 },
  { color: '#009e73', name: 'bluish green', width: 76 / 116, notches: 2 },
  { color: '#cc79a7', name: 'reddish purple', width: 84 / 116, notches: 4 },
  { color: '#e8eaf2', name: 'white', width: 92 / 116, notches: 1 },
  { color: '#f0e442', name: 'yellow', width: 100 / 116, notches: 3 },
  { color: '#d55e00', name: 'vermillion', width: 108 / 116, notches: 2 },
  { color: '#56b4e9', name: 'sky blue', width: 116 / 116, notches: 4 },
];

/** Difficulty curve, 1-based inclusive level ranges. */
export const LEVEL_BANDS: readonly { from: number; to: number; types: number; bolts: number }[] = [
  { from: 1, to: 2, types: 2, bolts: 3 },
  { from: 3, to: 4, types: 3, bolts: 5 },
  { from: 5, to: 7, types: 4, bolts: 6 },
  { from: 8, to: 10, types: 5, bolts: 7 },
  { from: 11, to: 13, types: 6, bolts: 8 },
  { from: 14, to: 16, types: 7, bolts: 9 },
  { from: 17, to: 20, types: 8, bolts: 10 },
];

export const LEVEL_COUNT = 20;

/** The band a 1-based level number belongs to. */
export function bandFor(level: number): (typeof LEVEL_BANDS)[number] {
  const band = LEVEL_BANDS.find((b) => level >= b.from && level <= b.to);
  if (!band) throw new Error(`No band for level ${level}`);
  return band;
}
