import { NUT_TYPES } from '../logic/constants';
import type { NutType } from '../logic/types';
import type { Look } from '../hooks/useLook';
import { notchCentres, shade } from './geometry';

/** Notch width in viewBox units; never below `MIN_NOTCH_PX` (see NutBoard). */
export const NOTCH_W = 8;
/** Notch depth as a share of the nut height. */
const NOTCH_DEPTH = 0.4;

export type NutProps = {
  type: NutType;
  look: Look;
  /** Horizontal centre and top edge, in viewBox units. */
  cx: number;
  y: number;
  /** Width of the widest nut type; this nut is `NUT_TYPES[type].width × maxWidth`. */
  maxWidth: number;
  height: number;
  /** Prefix of the board's gradient / filter ids (glass and neon defs). */
  defsId?: string;
  /** Colour behind the board, used to cut the notches. */
  notchFill?: string;
};

/**
 * One nut: its width and the notches on its top edge identify the type without
 * colour; the colour is a bonus.
 */
export function Nut({ type, look, cx, y, maxWidth, height, defsId = 'nut', notchFill = '#14151e' }: NutProps) {
  const spec = NUT_TYPES[type];
  const w = spec.width * maxWidth;
  const x = cx - w / 2;
  const notches = notchCentres(cx, w, spec.notches).map((c, i) => (
    <rect
      key={i}
      data-notch=""
      x={c - NOTCH_W / 2}
      y={y - 1}
      width={NOTCH_W}
      height={height * NOTCH_DEPTH}
      rx={1.5}
      fill={notchFill}
    />
  ));

  if (look === 'glass') {
    const sparkles = [
      [-0.36, 0.25, 1.3],
      [-0.12, 0.7, 1],
      [0.16, 0.33, 1.4],
      [0.34, 0.78, 1],
      [-0.27, 0.6, 0.9],
      [0.4, 0.2, 0.9],
    ];
    return (
      <g opacity={0.94}>
        <rect x={x} y={y} width={w} height={height} rx={9} fill={`url(#${defsId}-g${type})`} stroke="rgba(255,255,255,.35)" />
        <line x1={cx - w * 0.2} y1={y + 3} x2={cx - w * 0.2} y2={y + height - 3} stroke="rgba(255,255,255,.35)" />
        <line x1={cx + w * 0.2} y1={y + 3} x2={cx + w * 0.2} y2={y + height - 3} stroke="rgba(0,0,0,.25)" />
        <rect x={x + 7} y={y + 5} width={6} height={height - 10} rx={3} fill="rgba(255,255,255,.35)" />
        {sparkles.map(([dx, dy, r], i) => (
          <circle key={i} cx={cx + dx * w} cy={y + dy * height} r={r} fill="#fff" />
        ))}
        {notches}
      </g>
    );
  }

  return (
    <g filter={`url(#${defsId}-glow)`}>
      <rect x={x} y={y} width={w} height={height} rx={7} fill={shade(spec.color, -0.72)} fillOpacity={0.9} stroke={spec.color} strokeWidth={2} />
      <rect x={cx - w * 0.2} y={y + 2} width={w * 0.4} height={height - 4} fill={spec.color} fillOpacity={0.4} />
      {notches}
    </g>
  );
}

export default Nut;
