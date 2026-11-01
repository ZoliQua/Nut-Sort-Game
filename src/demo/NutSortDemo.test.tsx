import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LEVELS } from '../logic/levels';
import { DEMO_LEVELS, DEMO_MOVE_MS, DEMO_PAUSE_MS, NutSortDemo } from './NutSortDemo';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

/** Bolt sizes, read from the board's labels. */
const snapshot = (c: HTMLElement) =>
  [...c.querySelectorAll('[aria-label^="Bolt"]')].map((b) => b.getAttribute('aria-label')).join(' | ');
const boltCount = (c: HTMLElement) => c.querySelectorAll('[aria-label^="Bolt"]').length;
const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

describe('<NutSortDemo />', () => {
  it('replays the optimal solutions of levels 1–5 and loops', () => {
    const { container } = render(<NutSortDemo />);
    expect(container.querySelector('.arc-demo')?.getAttribute('aria-hidden')).toBe('true');
    expect(boltCount(container)).toBe(LEVELS[0].layout.length);
    const start = snapshot(container);
    tick(DEMO_MOVE_MS);
    expect(snapshot(container)).not.toBe(start);

    const seen = new Set<number>([boltCount(container)]);
    let total = 0;
    for (let level = 0; level < DEMO_LEVELS; level++) total += LEVELS[level].par * DEMO_MOVE_MS + DEMO_PAUSE_MS;
    for (let t = 0; t < total; t += DEMO_MOVE_MS) {
      tick(DEMO_MOVE_MS);
      seen.add(boltCount(container));
    }
    // Levels 1–5 span the 3-, 5- and 6-bolt bands.
    expect([...seen].sort()).toEqual([3, 5, 6]);
    expect(localStorage.length).toBe(0);
  });

  it('freezes when inactive', () => {
    const { container } = render(<NutSortDemo active={false} />);
    const start = snapshot(container);
    tick(10_000);
    expect(snapshot(container)).toBe(start);
    expect(localStorage.length).toBe(0);
  });
});
