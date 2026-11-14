import { useId, useState, type KeyboardEvent } from 'react';
import { useDental, useMessages } from '../arcade';
import { MESSAGES, type MessageKey } from '../i18n';
import { CAPACITY, NUT_TYPES } from '../logic/constants';
import type { Layout } from '../logic/types';
import type { Look } from '../hooks/useLook';
import { shade } from './geometry';
import { NOTCH_W, Nut } from './Nut';
import styles from './NutBoard.module.css';

/*
 * SVG board. Geometry is in viewBox units; the SVG is `width: 100%`, so it
 * scales with its container. Up to 6 bolts sit in one row; more are split into
 * two rows (10 bolts → 5 + 5), which keeps nuts and notches large enough on a
 * 360 px phone.
 */

const PAD = 10;
const COL_W = 132;
/** Width of the widest nut type. */
export const MAX_NUT_W = 116;
const NUT_H = 34;
const SLOT = 37;
const LIFT_Y = 6;
const ROD_TOP = LIFT_Y + NUT_H + 14;
const BASE_Y = ROD_TOP + CAPACITY * SLOT + 10;
const ROW_H = BASE_Y + 20;

/** How long a moving nut travels; input is ignored meanwhile. */
export const MOVE_MS = 250;

/**
 * Notch width floor in viewBox units at the 10-bolt layout. Ten bolts render
 * as two rows of five (680 units wide); on a 360 px phone one unit is about
 * 0.47 px, so a notch stays ≈ 3.8 px wide and clearly visible.
 */
export const MIN_NOTCH_PX = NOTCH_W;

const NEON_BG = '#14151e';
const GLASS_NOTCH = '#18181b';

type BoardGeometry = { rows: number; perRow: number; width: number; height: number };

function boardGeometry(bolts: number): BoardGeometry {
  const rows = bolts > 6 ? 2 : 1;
  const perRow = Math.ceil(bolts / rows);
  return { rows, perRow, width: 2 * PAD + perRow * COL_W, height: 2 * PAD + rows * ROW_H };
}

/** On-screen width in CSS px of one bolt's tap area when the board is `boardPx` wide (a touch target needs ≥ 44). */
export function hitWidthPx(bolts: number, boardPx: number): number {
  return ((COL_W - 6) * boardPx) / boardGeometry(bolts).width;
}

function boltOrigin(b: number, bolts: number, g: BoardGeometry): { cx: number; top: number } {
  const row = Math.floor(b / g.perRow);
  const inRow = row === 0 ? Math.min(g.perRow, bolts) : bolts - g.perRow;
  const offset = ((g.perRow - inRow) * COL_W) / 2;
  return { cx: PAD + offset + (b % g.perRow) * COL_W + COL_W / 2, top: PAD + row * ROW_H };
}

const slotY = (index: number): number => BASE_Y - (index + 1) * SLOT + (SLOT - NUT_H);

/** Stable ids for the nuts, so a moved nut keeps its element and glides. */
type NutIds = { layout: Layout; ids: number[][]; next: number };

function freshIds(layout: Layout, base: number): NutIds {
  let next = base;
  return { layout, ids: layout.map((bolt) => bolt.map(() => next++)), next };
}

/** Carries ids over when exactly one nut moved between two bolts; otherwise starts fresh. */
function carryIds(prev: NutIds, layout: Layout): NutIds {
  const a = prev.layout;
  if (a.length !== layout.length) return freshIds(layout, prev.next);
  let from = -1;
  let to = -1;
  for (let i = 0; i < a.length; i++) {
    const d = layout[i].length - a[i].length;
    if (d === 0) {
      if (layout[i].some((n, j) => n !== a[i][j])) return freshIds(layout, prev.next);
    } else if (d === -1 && from < 0 && layout[i].every((n, j) => n === a[i][j])) {
      from = i;
    } else if (d === 1 && to < 0 && a[i].every((n, j) => n === layout[i][j])) {
      to = i;
    } else {
      return freshIds(layout, prev.next);
    }
  }
  if (from < 0 || to < 0 || a[from][a[from].length - 1] !== layout[to][layout[to].length - 1]) {
    return freshIds(layout, prev.next);
  }
  const ids = prev.ids.map((bolt) => bolt.slice());
  ids[to].push(ids[from].pop() as number);
  return { layout, ids, next: prev.next };
}

type T = (key: MessageKey, vars?: Record<string, string | number>) => string;

function boltLabel(layout: Layout, b: number, lifted: number | null, t: T): string {
  const bolt = layout[b];
  if (bolt.length === 0) return t('boltEmpty', { n: b + 1 });
  const typeIndex = bolt[bolt.length - 1];
  const top = NUT_TYPES[typeIndex];
  const count = t(bolt.length === 1 ? 'nutsOne' : 'nutsMany', { n: bolt.length });
  const notches = t(top.notches === 1 ? 'notchesOne' : 'notchesMany', { n: top.notches });
  const name = t(`nut${typeIndex}` as MessageKey);
  const label = t('boltNuts', { n: b + 1, count, type: typeIndex + 1, name, notches });
  return lifted === b ? label + t('boltLifted') : label;
}

/**
 * Dental mode: the bolt is an implant — a threaded titanium fixture with an
 * abutment collar on top, set in the gum. Same footprint as the bolt it
 * replaces (the hit areas are separate and unchanged).
 */
function Implant({ glass, id }: { glass: boolean; id: string }) {
  const h = BASE_Y - ROD_TOP;
  // Abutment collar: a short cone that narrows towards the top of the post.
  const collar = `M-11 ${ROD_TOP + 6} L-6 ${ROD_TOP - 6} Q0 ${ROD_TOP - 9} 6 ${ROD_TOP - 6} L11 ${ROD_TOP + 6} Z`;
  if (glass) {
    return (
      <g data-testid="nut-implant">
        <rect x={-9} y={ROD_TOP} width={18} height={h + 4} rx={5} fill={`url(#${id}-ti)`} />
        <rect x={-9} y={ROD_TOP} width={18} height={h + 4} rx={5} fill={`url(#${id}-thread)`} />
        <path d={collar} fill={`url(#${id}-ti)`} stroke="rgba(0,0,0,.35)" />
        <ellipse cx={0} cy={BASE_Y + 9} rx={58} ry={9} fill="#7a2e3e" />
        <ellipse cx={0} cy={BASE_Y + 4} rx={62} ry={9} fill={`url(#${id}-gum)`} />
        <path d={`M-40 ${BASE_Y + 1} Q0 ${BASE_Y - 4} 40 ${BASE_Y + 1}`} fill="none" stroke="rgba(255,255,255,.45)" strokeWidth={2} strokeLinecap="round" />
      </g>
    );
  }
  return (
    <g data-testid="nut-implant">
      <rect x={-7} y={ROD_TOP} width={14} height={h} rx={4} fill="#2c3644" stroke="#9fdcef" strokeOpacity={0.6} />
      <rect x={-7} y={ROD_TOP} width={14} height={h} rx={4} fill={`url(#${id}-thread)`} opacity={0.8} />
      <path d={collar} fill="#2c3644" stroke="#9fdcef" strokeWidth={1.5} />
      <rect x={-60} y={BASE_Y} width={120} height={10} rx={5} fill="#4a2232" stroke="#ff8fa3" strokeOpacity={0.8} />
    </g>
  );
}

export type NutBoardProps = {
  layout: Layout;
  lifted: number | null;
  shake: { bolt: number; nonce: number } | null;
  look: Look;
  disabled?: boolean;
  onSelectBolt: (bolt: number) => void;
};

export function NutBoard({ layout, lifted, shake, look, disabled = false, onSelectBolt }: NutBoardProps) {
  const t = useMessages(MESSAGES);
  const [dental] = useDental();
  const id = `nb${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [nutIds, setNutIds] = useState<NutIds>(() => freshIds(layout, 0));
  let current = nutIds;
  if (nutIds.layout !== layout) {
    // Derived state: adjust during render so the moved nut keeps its key.
    current = carryIds(nutIds, layout);
    setNutIds(current);
  }

  const bolts = layout.length;
  const g = boardGeometry(bolts);
  const glass = look === 'glass';
  const notchFill = glass ? GLASS_NOTCH : NEON_BG;

  const select = (b: number) => {
    if (!disabled) onSelectBolt(b);
  };
  const onKey = (b: number) => (event: KeyboardEvent<SVGGElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    event.stopPropagation();
    select(b);
  };

  const nuts: JSX.Element[] = [];
  layout.forEach((bolt, b) => {
    const { cx, top } = boltOrigin(b, bolts, g);
    bolt.forEach((type, i) => {
      const isLifted = lifted === b && i === bolt.length - 1;
      const y = top + (isLifted ? LIFT_Y : slotY(i));
      const shaking = isLifted && shake !== null;
      nuts.push(
        <g
          key={current.ids[b][i]}
          className={styles.nut}
          style={{ transform: `translate(${cx}px, ${y}px)` }}
          data-nut=""
          data-bolt={b}
          data-type={type}
          data-notches={NUT_TYPES[type].notches}
          data-y={y}
          data-lifted={isLifted ? 'true' : undefined}
        >
          <g key={shaking ? `s${shake.nonce}` : 'n'} className={shaking ? styles.shake : undefined}>
            <Nut type={type} look={look} dental={dental} cx={0} y={0} maxWidth={MAX_NUT_W} height={NUT_H} defsId={id} notchFill={notchFill} />
          </g>
        </g>,
      );
    });
  });
  // Stable DOM order by id, so React moves nothing but the transform.
  nuts.sort((a, b) => Number(a.key) - Number(b.key));

  return (
    <svg
      className={`${styles.board} ${glass ? styles.glass : styles.neon} ${disabled ? styles.disabled : ''}`}
      viewBox={`0 0 ${g.width} ${g.height}`}
      data-dental={dental}
      role="group"
      aria-label={t('boardLabel', { n: bolts })}
    >
      <defs>
        <filter id={`${id}-glow`} x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <pattern id={`${id}-thread`} width="20" height="6" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="20" y2="4" stroke="rgba(0,0,0,.4)" strokeWidth="1.6" />
        </pattern>
        <linearGradient id={`${id}-steel`} x1="0" x2="1">
          <stop offset="0" stopColor="#55595f" />
          <stop offset=".45" stopColor="#d9dce0" />
          <stop offset="1" stopColor="#60646b" />
        </linearGradient>
        <linearGradient id={`${id}-ti`} x1="0" x2="1">
          <stop offset="0" stopColor="#6c7684" />
          <stop offset=".45" stopColor="#eef2f6" />
          <stop offset="1" stopColor="#737d8a" />
        </linearGradient>
        <linearGradient id={`${id}-gum`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0a7b2" />
          <stop offset="1" stopColor="#b8566a" />
        </linearGradient>
        <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#26262a" />
          <stop offset="1" stopColor="#0b0b0c" />
        </linearGradient>
        <linearGradient id={`${id}-wood`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7a4a2a" />
          <stop offset="1" stopColor="#3d2212" />
        </linearGradient>
        {NUT_TYPES.map((t, i) => (
          <linearGradient key={i} id={`${id}-g${i}`} x1="0" x2="1">
            <stop offset="0" stopColor={shade(t.color, -0.45)} />
            <stop offset=".3" stopColor={shade(t.color, 0.15)} />
            <stop offset=".5" stopColor={shade(t.color, 0.5)} />
            <stop offset=".72" stopColor={t.color} />
            <stop offset="1" stopColor={shade(t.color, -0.5)} />
          </linearGradient>
        ))}
      </defs>

      {glass ? (
        <>
          <rect width={g.width} height={g.height} fill={`url(#${id}-wall)`} />
          {Array.from({ length: g.rows }, (_, r) => (
            <rect key={r} x={0} y={PAD + r * ROW_H + BASE_Y - 22} width={g.width} height={ROW_H - BASE_Y + 22} fill={`url(#${id}-wood)`} />
          ))}
        </>
      ) : (
        <rect width={g.width} height={g.height} fill={NEON_BG} />
      )}

      {layout.map((_, b) => {
        const { cx, top } = boltOrigin(b, bolts, g);
        const shaking = shake !== null && shake.bolt === b;
        return (
          <g key={shaking ? `${b}-s${shake.nonce}` : b} className={shaking ? styles.shake : undefined}>
            <g transform={`translate(${cx} ${top})`} data-rod={b} data-top={top + ROD_TOP}>
              {dental ? (
                <Implant glass={glass} id={id} />
              ) : glass ? (
                <>
                  <rect x={-9} y={ROD_TOP} width={18} height={BASE_Y - ROD_TOP + 4} rx={5} fill={`url(#${id}-steel)`} />
                  <rect x={-9} y={ROD_TOP} width={18} height={BASE_Y - ROD_TOP + 4} rx={5} fill={`url(#${id}-thread)`} />
                  <ellipse cx={0} cy={BASE_Y + 8} rx={58} ry={9} fill="#2b2c30" />
                  <ellipse cx={0} cy={BASE_Y + 4} rx={62} ry={8} fill={`url(#${id}-steel)`} />
                </>
              ) : (
                <>
                  <rect x={-7} y={ROD_TOP} width={14} height={BASE_Y - ROD_TOP} rx={4} fill="#3a3e50" />
                  <rect x={-7} y={ROD_TOP} width={14} height={BASE_Y - ROD_TOP} rx={4} fill={`url(#${id}-thread)`} opacity={0.7} />
                  <rect x={-60} y={BASE_Y} width={120} height={10} rx={5} fill="#2a2d3a" stroke="#353849" />
                </>
              )}
            </g>
          </g>
        );
      })}

      {nuts}

      {layout.map((_, b) => {
        const { cx, top } = boltOrigin(b, bolts, g);
        return (
          <g
            key={b}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-label={boltLabel(layout, b, lifted, t)}
            aria-disabled={disabled || undefined}
            aria-pressed={lifted === b}
            className={styles.hit}
            onClick={() => select(b)}
            onKeyDown={onKey(b)}
          >
            <rect x={cx - COL_W / 2 + 3} y={top + 1} width={COL_W - 6} height={ROW_H - 2} rx={12} />
          </g>
        );
      })}
    </svg>
  );
}

export default NutBoard;
