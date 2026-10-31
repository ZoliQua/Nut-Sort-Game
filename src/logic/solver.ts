import { CAPACITY } from './constants';
import { applyMove, legalMoves } from './rules';
import type { Layout, Move } from './types';

/*
 * Exact shortest-path solver (A*) used offline to prove each level's par.
 * Internally a state is its canonical key: every bolt written as a string of
 * type letters (bottom → top), the bolts sorted and joined by '|'. Sorting
 * makes bolt-order permutations the same state.
 */

const SEP = '|';
const A = 97; // 'a'

const boltString = (bolt: readonly number[]): string => String.fromCharCode(...bolt.map((t) => A + t));

const keyOf = (bolts: string[]): string => [...bolts].sort().join(SEP);

/** Bolt-order independent identity of a layout. */
export function canonicalKey(layout: Layout): string {
  return keyOf(layout.map(boltString));
}

function heuristicOf(bolts: readonly string[]): number {
  let above = 0;
  // Per type: the sum and the largest of its bottom runs.
  const runSum = new Map<string, number>();
  const runMax = new Map<string, number>();
  for (const bolt of bolts) {
    if (bolt.length === 0) continue;
    const base = bolt[0];
    let run = 1;
    while (run < bolt.length && bolt[run] === base) run++;
    above += bolt.length - run;
    runSum.set(base, (runSum.get(base) ?? 0) + run);
    runMax.set(base, Math.max(runMax.get(base) ?? 0, run));
  }
  let split = 0;
  for (const [type, sum] of runSum) split += sum - (runMax.get(type) as number);
  return above + split;
}

/**
 * Admissible lower bound on the moves left:
 * - every nut above a bolt's maximal single-type bottom run must move at least once;
 * - when bottom runs of one type sit on several bolts, all but the largest must move entirely.
 * Each nut is counted at most once, so the sum never overestimates.
 */
export function heuristic(layout: Layout): number {
  return heuristicOf(layout.map(boltString));
}

const isUniform = (bolt: string): boolean => {
  for (let i = 1; i < bolt.length; i++) if (bolt[i] !== bolt[0]) return false;
  return true;
};

const isSolvedKey = (bolts: readonly string[]): boolean =>
  bolts.every((b) => b.length === 0 || (b.length === CAPACITY && isUniform(b)));

/** Children of a canonical state. Pruned moves never shorten a solution. */
function children(bolts: readonly string[]): string[] {
  const out: string[] = [];
  for (let from = 0; from < bolts.length; from++) {
    const src = bolts[from];
    if (src.length === 0) continue;
    const uniform = isUniform(src);
    // A completed bolt never needs to move again.
    if (uniform && src.length === CAPACITY) continue;
    const nut = src[src.length - 1];
    let triedEmpty = false;
    for (let to = 0; to < bolts.length; to++) {
      if (to === from) continue;
      const dst = bolts[to];
      if (dst.length >= CAPACITY) continue;
      if (dst.length === 0) {
        // A single-type bolt gains nothing by splitting onto an empty bolt,
        // and all empty bolts are interchangeable.
        if (uniform || triedEmpty) continue;
        triedEmpty = true;
      } else if (dst[dst.length - 1] !== nut) {
        continue;
      }
      const next = bolts.slice();
      next[from] = src.slice(0, -1);
      next[to] = dst + nut;
      out.push(keyOf(next));
    }
  }
  return out;
}

/** Binary min-heap on (f, −g) storing state keys. */
class Heap {
  private f: number[] = [];
  private g: number[] = [];
  private k: string[] = [];

  get size(): number {
    return this.k.length;
  }

  private less(i: number, j: number): boolean {
    return this.f[i] < this.f[j] || (this.f[i] === this.f[j] && this.g[i] > this.g[j]);
  }

  private swap(i: number, j: number): void {
    [this.f[i], this.f[j]] = [this.f[j], this.f[i]];
    [this.g[i], this.g[j]] = [this.g[j], this.g[i]];
    [this.k[i], this.k[j]] = [this.k[j], this.k[i]];
  }

  push(f: number, g: number, key: string): void {
    this.f.push(f);
    this.g.push(g);
    this.k.push(key);
    let i = this.k.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!this.less(i, p)) break;
      this.swap(i, p);
      i = p;
    }
  }

  pop(): { g: number; key: string } {
    const g = this.g[0];
    const key = this.k[0];
    const last = this.k.length - 1;
    this.swap(0, last);
    this.f.pop();
    this.g.pop();
    this.k.pop();
    let i = 0;
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let m = i;
      if (l < last && this.less(l, m)) m = l;
      if (r < last && this.less(r, m)) m = r;
      if (m === i) break;
      this.swap(i, m);
      i = m;
    }
    return { g, key };
  }
}

export type SolveOptions = {
  /** Give up (return null) after expanding this many states. Default: unlimited. */
  maxExpanded?: number;
  /** Receives the number of expanded states when the search ends. */
  onStats?: (stats: { expanded: number }) => void;
};

/**
 * An optimal move list for `layout` (in its own bolt indices), or `null` when
 * the layout is unsolvable or the search runs over `maxExpanded`.
 */
export function solve(layout: Layout, opts: SolveOptions = {}): Move[] | null {
  const maxExpanded = opts.maxExpanded ?? Infinity;
  const startKey = canonicalKey(layout);
  const best = new Map<string, number>([[startKey, 0]]);
  const parent = new Map<string, string>();
  const open = new Heap();
  open.push(heuristicOf(startKey.split(SEP)), 0, startKey);
  let expanded = 0;
  let goal: string | null = null;

  while (open.size > 0) {
    const { g, key } = open.pop();
    if (g > (best.get(key) as number)) continue; // stale entry
    const bolts = key.split(SEP);
    if (isSolvedKey(bolts)) {
      goal = key;
      break;
    }
    if (++expanded > maxExpanded) break;
    for (const child of children(bolts)) {
      const known = best.get(child);
      if (known !== undefined && known <= g + 1) continue;
      best.set(child, g + 1);
      parent.set(child, key);
      open.push(g + 1 + heuristicOf(child.split(SEP)), g + 1, child);
    }
  }
  opts.onStats?.({ expanded });
  if (goal === null) return null;

  const path: string[] = [];
  for (let k: string | undefined = goal; k !== undefined && k !== startKey; k = parent.get(k)) path.push(k);
  path.reverse();

  // Map the canonical path back onto the original bolt order.
  const moves: Move[] = [];
  let current = layout;
  for (const target of path) {
    const move = legalMoves(current).find((m) => canonicalKey(applyMove(current, m)) === target);
    if (!move) throw new Error('Solver path does not map back onto the layout');
    moves.push(move);
    current = applyMove(current, move);
  }
  return moves;
}
