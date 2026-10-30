import { CAPACITY } from './constants';
import type { Layout, Move } from './types';

const top = (bolt: readonly number[]): number | undefined => bolt[bolt.length - 1];

/** Whether the top nut of `from` may go onto `to`: a same-type top or an empty bolt, with room. */
export function canMove(layout: Layout, from: number, to: number): boolean {
  if (from === to) return false;
  const src = layout[from];
  const dst = layout[to];
  if (!src || !dst || src.length === 0 || dst.length >= CAPACITY) return false;
  return dst.length === 0 || top(dst) === top(src);
}

/** Applies one legal move and returns a new layout; the input is never mutated. */
export function applyMove(layout: Layout, move: Move): Layout {
  const [from, to] = move;
  if (!canMove(layout, from, to)) throw new Error(`Illegal move ${from} → ${to}`);
  const nut = top(layout[from]) as number;
  return layout.map((bolt, i) => {
    if (i === from) return bolt.slice(0, -1);
    if (i === to) return [...bolt, nut];
    return bolt;
  });
}

/** All legal moves, ordered by source bolt, then target bolt. */
export function legalMoves(layout: Layout): Move[] {
  const moves: Move[] = [];
  for (let from = 0; from < layout.length; from++) {
    for (let to = 0; to < layout.length; to++) {
      if (canMove(layout, from, to)) moves.push([from, to]);
    }
  }
  return moves;
}

/** Every non-empty bolt holds `CAPACITY` nuts of one type. */
export function isSolved(layout: Layout): boolean {
  return layout.every((bolt) => bolt.length === 0 || (bolt.length === CAPACITY && bolt.every((n) => n === bolt[0])));
}
