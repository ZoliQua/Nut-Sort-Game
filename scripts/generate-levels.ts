/**
 * Offline level generator: `npm run levels:generate`.
 *
 * For every band it shuffles seeded layouts, proves each one's minimum with the
 * exact A* solver (seeds over the budget are skipped, never shipped with an
 * upper bound), then picks candidates spread over the band's par range so par
 * rises (non-decreasing) across the band. The seeds are written next to the
 * levels, so a re-run reproduces `src/logic/levels.json` byte for byte.
 */
import { writeFileSync } from 'node:fs';
import { CAPACITY, LEVEL_BANDS } from '../src/logic/constants';
import { isSolved } from '../src/logic/rules';
import { solve } from '../src/logic/solver';
import type { Layout, Move } from '../src/logic/types';

const OUT = new URL('../src/logic/levels.json', import.meta.url);
const MAX_EXPANDED = 2_000_000;
/** Proven candidates collected per band before picking. */
const CANDIDATES = 24;
/** Seeds tried per band before giving up. */
const MAX_SEEDS = 5_000;

/** mulberry32 */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffledLayout(seed: number, types: number, bolts: number): Layout {
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

const hasCompletedBolt = (layout: Layout): boolean =>
  layout.some((bolt) => bolt.length === CAPACITY && bolt.every((n) => n === bolt[0]));

type Candidate = { seed: number; layout: Layout; par: number; solution: Move[] };

const levels: unknown[] = [];
const started = performance.now();

LEVEL_BANDS.forEach((band, bandIndex) => {
  const count = band.to - band.from + 1;
  const candidates: Candidate[] = [];
  let overBudget = 0;
  let unsolvable = 0;
  let rejected = 0;
  for (let k = 1; k <= MAX_SEEDS && candidates.length < CANDIDATES; k++) {
    const seed = (bandIndex + 1) * 10_000 + k;
    const layout = shuffledLayout(seed, band.types, band.bolts);
    if (isSolved(layout) || hasCompletedBolt(layout)) {
      rejected++;
      continue;
    }
    let expanded = 0;
    const solution = solve(layout, { maxExpanded: MAX_EXPANDED, onStats: (s) => (expanded = s.expanded) });
    if (!solution) {
      if (expanded > MAX_EXPANDED) overBudget++;
      else unsolvable++;
      continue;
    }
    candidates.push({ seed, layout, par: solution.length, solution });
  }
  if (candidates.length < count) {
    throw new Error(`Band ${band.from}–${band.to}: only ${candidates.length} proven candidates`);
  }
  // Stable by par, then seed; pick at evenly spaced quantiles so par rises across the band.
  const sorted = [...candidates].sort((a, b) => a.par - b.par || a.seed - b.seed);
  const picks = Array.from({ length: count }, (_, i) => sorted[Math.round(((i + 1) * (sorted.length - 1)) / (count + 1))]);
  picks.forEach((c, i) => {
    levels.push({ id: band.from + i, seed: c.seed, types: band.types, layout: c.layout, par: c.par, solution: c.solution });
  });
  console.log(
    `levels ${band.from}–${band.to} (${band.types} types, ${band.bolts} bolts): par ${picks.map((p) => p.par).join(', ')}` +
      ` · ${candidates.length} proven, ${unsolvable} unsolvable, ${overBudget} over budget, ${rejected} rejected`,
  );
});

const file = {
  generator: { prng: 'mulberry32', seedScheme: '(bandIndex + 1) * 10000 + k', maxExpanded: MAX_EXPANDED, candidatesPerBand: CANDIDATES },
  levels,
};
writeFileSync(OUT, `${JSON.stringify(file, null, 2)}\n`);
console.log(`${levels.length} levels written in ${((performance.now() - started) / 1000).toFixed(1)} s`);
