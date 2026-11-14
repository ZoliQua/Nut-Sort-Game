import { useId, type ReactNode } from 'react';
import {
  formatNumber,
  useDental,
  useIsTouch,
  useKitMessages,
  useLang,
  useMessages,
  type RulesSection,
} from './arcade';
import { Nut } from './components/Nut';
import { CAPACITY, LEVEL_COUNT } from './logic/constants';
import { RUN_MAX_SCORE } from './logic/game';
import { LEVELS } from './logic/levels';
import { BASE_PER_TYPE, restartCap, RESTART_FLOOR, UNDO_COST } from './logic/scoring';
import { MESSAGES, type MessageKey } from './i18n';

/* Diagram geometry, in viewBox units. */
const ROW_H = 78;
const BASE = 66;
const SLOT = 14;
const NUT_H = 12;
const NUT_W = 44;
const SRC_X = 40;
const DST_X = 130;
const SCREEN = '#14151e';
const INK = '#e8eaf2';

type Example = { from: number[]; to: number[]; ok: boolean; label: MessageKey };

/** Bottom-to-top nut kinds (indexes into NUT_TYPES). Top nut of `from` is the one being moved. */
const EXAMPLES: Example[] = [
  { from: [1, 0], to: [2, 0], ok: true, label: 'rulesDiagramSame' },
  { from: [1, 0], to: [], ok: true, label: 'rulesDiagramEmpty' },
  { from: [1, 0], to: [2, 1], ok: false, label: 'rulesDiagramOther' },
  { from: [2, 0], to: [0, 0, 0, 0], ok: false, label: 'rulesDiagramFull' },
];

function MiniBolt({ cx, y0, nuts, dental, defsId }: { cx: number; y0: number; nuts: number[]; dental: boolean; defsId: string }) {
  return (
    <g>
      <rect x={cx - 3} y={y0 + 6} width={6} height={BASE - 6} rx={2} fill="#3a3e50" />
      <rect x={cx - 26} y={y0 + BASE} width={52} height={6} rx={3} fill="#2a2d3a" stroke="#4a4e64" />
      {nuts.map((type, i) => (
        <Nut
          key={i}
          type={type}
          look="neon"
          dental={dental}
          cx={cx}
          y={y0 + BASE - (i + 1) * SLOT + (SLOT - NUT_H)}
          maxWidth={NUT_W}
          height={NUT_H}
          defsId={defsId}
          notchFill={SCREEN}
        />
      ))}
    </g>
  );
}

/** Rules diagram: moving the top nut is legal onto the same kind or an empty bolt (✓), illegal onto another kind or a full bolt (✗). */
export function MoveDiagram() {
  const m = useMessages(MESSAGES);
  const [dental] = useDental();
  const id = `md${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <svg
      viewBox={`0 0 320 ${EXAMPLES.length * ROW_H + 8}`}
      role="img"
      aria-label={m('rulesDiagramLabel')}
      style={{ width: '100%', maxWidth: 340, height: 'auto', display: 'block', margin: '8px auto' }}
    >
      <defs>
        <filter id={`${id}-glow`} x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation="1.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="320" height={EXAMPLES.length * ROW_H + 8} rx={10} fill={SCREEN} />
      {EXAMPLES.map((ex, r) => {
        const y0 = 6 + r * ROW_H;
        const mid = y0 + 36;
        return (
          <g key={r}>
            <MiniBolt cx={SRC_X} y0={y0} nuts={ex.from} dental={dental} defsId={id} />
            <path d={`M${SRC_X + 30} ${mid} H${DST_X - 32} m-6 -5 l6 5 -6 5`} fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            <MiniBolt cx={DST_X} y0={y0} nuts={ex.to} dental={dental} defsId={id} />
            <text x={186} y={mid + 8} textAnchor="middle" fontSize={24} fontWeight={700} fill={INK}>
              {ex.ok ? '✓' : '✗'}
            </text>
            <text x={206} y={mid + 4} fontSize={11} fill={INK}>
              {m(ex.label)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- the diagram and its hook belong together
export function useRulesSections(): RulesSection[] {
  const m = useMessages(MESSAGES);
  const k = useKitMessages();
  const [lang] = useLang();
  const touch = useIsTouch();
  const num = (n: number) => formatNumber(n, lang);
  const ios = typeof navigator !== 'undefined' && /iP(hone|od)/.test(navigator.userAgent);

  const types = LEVELS.map((l) => l.types);
  const pct = (restarts: number) => num(Math.round(restartCap(restarts) * 100));
  const mobile: ReactNode = (
    <ul>
      <li>{m('rulesMobileTap')}</li>
      <li>{m('rulesMobileButtons')}</li>
      <li>{m('rulesMobileFs', { fs: k('fullscreen') })}</li>
      {ios && <li>{k('iosHomeScreenTip')}</li>}
    </ul>
  );
  return [
    {
      id: 'goal',
      body: (
        <>
          <p>{m('rulesGoal', { count: num(LEVEL_COUNT) })}</p>
          <MoveDiagram />
        </>
      ),
    },
    { id: 'play', body: <p>{touch ? m('rulesPlayTouch') : m('rulesPlayKeys')}</p> },
    {
      id: 'rules',
      body: (
        <ul>
          <li>{m('rulesRulesCap', { cap: num(CAPACITY) })}</li>
          <li>{m('rulesRulesMove')}</li>
          <li>{m('rulesRulesShape')}</li>
          <li>{m('rulesRulesSolved', { cap: num(CAPACITY) })}</li>
        </ul>
      ),
    },
    {
      id: 'scoring',
      body: (
        <ul>
          <li>
            {m('rulesScoringLevel', {
              base: num(BASE_PER_TYPE),
              lo: num(BASE_PER_TYPE * Math.min(...types)),
              hi: num(BASE_PER_TYPE * Math.max(...types)),
            })}
          </li>
          <li>{m('rulesScoringRestart', { c1: pct(1), c2: pct(2), floor: num(Math.round(RESTART_FLOOR * 100)) })}</li>
          <li>{m('rulesScoringUndo', { cost: num(UNDO_COST) })}</li>
          <li>{m('rulesScoringRun', { max: num(RUN_MAX_SCORE) })}</li>
          <li>{m('rulesScoringFinish')}</li>
        </ul>
      ),
    },
    { id: 'dental', body: <p>{m('rulesDentalText')}</p> },
    { id: 'mobile', body: mobile },
  ];
}
