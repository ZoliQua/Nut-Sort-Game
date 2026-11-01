import { useEffect, useMemo, useState } from 'react';
import type { ArcadeDemoProps } from '../arcade';
import { NutBoard } from '../components/NutBoard';
import { LEVELS } from '../logic/levels';
import { applyMove } from '../logic/rules';

export const DEMO_MOVE_MS = 700;
export const DEMO_PAUSE_MS = 1500;
/** The demo cycles levels 1–5. */
export const DEMO_LEVELS = 5;

type DemoState = { level: number; step: number };

/**
 * Attract mode for the portal landing page: replays the stored optimal
 * solution of levels 1–5 on the real rules, one move every 700 ms, pausing
 * 1.5 s on each solved layout. No keyboard, no stats, no saves; frozen while
 * `active` is false.
 */
export function NutSortDemo({ active = true }: ArcadeDemoProps) {
  const [demo, setDemo] = useState<DemoState>({ level: 0, step: 0 });
  const level = LEVELS[demo.level];
  const solved = demo.step >= level.solution.length;

  useEffect(() => {
    if (!active) return;
    const id = window.setTimeout(
      () =>
        setDemo((d) =>
          d.step >= LEVELS[d.level].solution.length
            ? { level: (d.level + 1) % DEMO_LEVELS, step: 0 }
            : { level: d.level, step: d.step + 1 },
        ),
      solved ? DEMO_PAUSE_MS : DEMO_MOVE_MS,
    );
    return () => window.clearTimeout(id);
  }, [active, solved, demo]);

  const layout = useMemo(
    () => level.solution.slice(0, demo.step).reduce(applyMove, level.layout),
    [level, demo.step],
  );

  return (
    <div className="arc-demo" aria-hidden="true">
      <NutBoard layout={layout} lifted={null} shake={null} look="neon" disabled onSelectBolt={() => {}} />
    </div>
  );
}

export default NutSortDemo;
