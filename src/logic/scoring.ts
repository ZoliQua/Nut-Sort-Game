/*
 * Nut Sort scoring, in one place so the numbers are easy to tune.
 *
 *   levelScore = round(100 × types × min(1, par / moves) × max(0.2, 1 − 0.2 × restarts))
 *
 * Undo never refunds a move: it adds UNDO_COST to the move counter.
 */
export const BASE_PER_TYPE = 100,
  RESTART_STEP = 0.2,
  RESTART_FLOOR = 0.2,
  UNDO_COST = 1;

/** 1 for no restart, then 0.8, 0.6 … down to RESTART_FLOOR. */
export function restartCap(restarts: number): number {
  return Math.max(RESTART_FLOOR, 1 - RESTART_STEP * restarts);
}

export function levelScore(i: { types: number; par: number; moves: number; restarts: number }): number {
  const efficiency = i.moves <= i.par ? 1 : i.par / i.moves;
  return Math.round(BASE_PER_TYPE * i.types * efficiency * restartCap(i.restarts));
}

/** The best score a level can pay. */
export const maxLevelScore = (types: number): number => BASE_PER_TYPE * types;
