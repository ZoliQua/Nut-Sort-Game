import { CAPACITY } from '../logic/constants';
import { NOTCH_W } from './Nut';

/*
 * Board geometry in viewBox units; the SVG is `width: 100%`, so it scales with
 * its container. Up to 6 bolts sit in one row; more are split into two rows
 * (10 bolts → 5 + 5), which keeps nuts and notches large enough on a 360 px phone.
 */

export const PAD = 10;
export const COL_W = 132;
/** Width of the widest nut type. */
export const MAX_NUT_W = 116;
export const NUT_H = 34;
export const SLOT = 37;
export const LIFT_Y = 6;
export const ROD_TOP = LIFT_Y + NUT_H + 14;
export const BASE_Y = ROD_TOP + CAPACITY * SLOT + 10;
export const ROW_H = BASE_Y + 20;

/** How long a moving nut travels; input is ignored meanwhile. */
export const MOVE_MS = 250;

/**
 * Notch width floor in viewBox units at the 10-bolt layout. Ten bolts render
 * as two rows of five (680 units wide); on a 360 px phone one unit is about
 * 0.47 px, so a notch stays ≈ 3.8 px wide and clearly visible.
 */
export const MIN_NOTCH_PX = NOTCH_W;

export type BoardGeometry = { rows: number; perRow: number; width: number; height: number };

export function boardGeometry(bolts: number): BoardGeometry {
  const rows = bolts > 6 ? 2 : 1;
  const perRow = Math.ceil(bolts / rows);
  return { rows, perRow, width: 2 * PAD + perRow * COL_W, height: 2 * PAD + rows * ROW_H };
}

/** On-screen width in CSS px of one bolt's tap area when the board is `boardPx` wide (a touch target needs ≥ 44). */
export function hitWidthPx(bolts: number, boardPx: number): number {
  return ((COL_W - 6) * boardPx) / boardGeometry(bolts).width;
}

export function boltOrigin(b: number, bolts: number, g: BoardGeometry): { cx: number; top: number } {
  const row = Math.floor(b / g.perRow);
  const inRow = row === 0 ? Math.min(g.perRow, bolts) : bolts - g.perRow;
  const offset = ((g.perRow - inRow) * COL_W) / 2;
  return { cx: PAD + offset + (b % g.perRow) * COL_W + COL_W / 2, top: PAD + row * ROW_H };
}
