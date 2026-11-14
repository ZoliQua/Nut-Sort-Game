import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyDental } from './arcade';
import { crownPath } from './components/geometry';
import { MAX_NUT_W, MOVE_MS } from './components/boardGeometry';
import { NutBoard } from './components/NutBoard';
import { NUT_TYPES } from './logic/constants';
import { LEVELS } from './logic/levels';
import type { Layout } from './logic/types';
import { NutSortGame, RESULT_DELAY_MS } from './NutSortGame';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => {
  applyDental(false, { silent: true });
  vi.useRealTimers();
});

const LAYOUT: Layout = [[0, 1, 2], [3, 4], [5, 6, 7], []];
const key = (k: string) => act(() => void fireEvent.keyDown(window, { key: k }));
const bolt = (i: number) => screen.getByRole('button', { name: new RegExp(`^Bolt ${i + 1}:`) });
const click = (i: number) => act(() => void fireEvent.click(bolt(i)));
const wait = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const stat = (label: string) => screen.getByText(label).parentElement?.textContent?.replace(label, '');
const board = () => screen.getByRole('group', { name: /bolts/i });

/** Every notch as "x,y,w,h" per nut, in DOM order: the colour-free type code. */
const notchCode = (root: ParentNode) =>
  [...root.querySelectorAll('[data-nut]')].map((nut) =>
    [...nut.querySelectorAll('[data-notch]')]
      .map((n) => ['x', 'y', 'width', 'height'].map((a) => n.getAttribute(a)).join(','))
      .join(' '),
  );

/** x extent of an absolute M/L/Q/C path (coordinates come in x,y pairs). */
const xExtent = (d: string) => {
  const nums = (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
  const xs = nums.filter((_, i) => i % 2 === 0);
  return Math.max(...xs) - Math.min(...xs);
};

describe('dental mode', () => {
  it('draws bolts as implant posts and nuts as crowns with the same notches, in both looks', () => {
    for (const look of ['neon', 'glass'] as const) {
      applyDental(false);
      const classic = render(<NutBoard layout={LAYOUT} lifted={null} shake={null} look={look} onSelectBolt={() => {}} />);
      const classicNotches = notchCode(classic.container);
      classic.unmount();

      applyDental(true);
      const { container, unmount } = render(
        <NutBoard layout={LAYOUT} lifted={null} shake={null} look={look} onSelectBolt={() => {}} />,
      );
      expect(container.querySelector('svg')?.getAttribute('data-dental')).toBe('true');
      expect(screen.getAllByTestId('nut-implant')).toHaveLength(LAYOUT.length);
      expect(screen.getAllByTestId('nut-crown')).toHaveLength(8);
      expect(notchCode(container)).toEqual(classicNotches);
      unmount();
    }
  });

  it('a crown is exactly as wide as the nut it replaces', () => {
    for (const spec of NUT_TYPES) {
      const w = spec.width * MAX_NUT_W;
      expect(xExtent(crownPath(0, 0, w, 34))).toBeCloseTo(w, 6);
    }
  });

  it('toggling dental mode mid-run keeps score, level, moves and the bolts', () => {
    render(<NutSortGame />);
    key(' ');
    for (const [from, to] of LEVELS[0].solution) {
      click(from);
      click(to);
      wait(MOVE_MS + 10);
    }
    wait(RESULT_DELAY_MS);
    key('Enter'); // level 2
    const [from, to] = LEVELS[1].solution[0];
    click(from);
    click(to);
    wait(MOVE_MS + 10);
    const labels = () => screen.getAllByRole('button', { name: /^Bolt \d+:/ }).map((b) => b.getAttribute('aria-label'));
    const before = labels();
    expect(stat('Score')).toBe('200');
    expect(stat('Level')).toBe('2/20');
    expect(stat('Moves')).toBe(`1 / ${LEVELS[1].par}`);

    act(() => void fireEvent.click(screen.getByRole('checkbox', { name: /Dental mode/ })));
    expect(board().getAttribute('data-dental')).toBe('true');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(stat('Score')).toBe('200');
    expect(stat('Level')).toBe('2/20');
    expect(stat('Moves')).toBe(`1 / ${LEVELS[1].par}`);
    expect(labels()).toEqual(before);
    expect(localStorage.getItem('arcade.dental')).toBe('1');
  });

  it('with dental mode off the classic bolts and nuts are drawn', () => {
    const { container } = render(
      <NutBoard layout={LAYOUT} lifted={null} shake={null} look="neon" onSelectBolt={() => {}} />,
    );
    expect(container.querySelector('svg')?.getAttribute('data-dental')).toBe('false');
    expect(screen.queryByTestId('nut-crown')).toBeNull();
    expect(screen.queryByTestId('nut-implant')).toBeNull();
    expect(container.querySelectorAll('[data-nut] rect:not([data-notch])').length).toBeGreaterThan(0);
  });
});
