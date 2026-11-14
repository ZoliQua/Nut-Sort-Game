import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyDental, applyLang } from './arcade';
import { hitWidthPx, MOVE_MS } from './components/boardGeometry';
import { LEVELS } from './logic/levels';
import { NutSortGame } from './NutSortGame';
import { setCoarsePointer } from './test/touchEnv';

beforeEach(() => {
  localStorage.clear();
  applyDental(false, { silent: true });
  applyLang('en', { silent: true });
  vi.useFakeTimers();
  setCoarsePointer(true);
  window.scrollTo = vi.fn();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const key = (k: string) => act(() => void fireEvent.keyDown(window, { key: k }));
const bolt = (i: number) => screen.getByRole('button', { name: new RegExp(`^Bolt ${i + 1}:`) });
const nutsOn = (b: number) => document.querySelectorAll(`[data-nut][data-bolt="${b}"]`).length;

/** What a finger does: pointer down/up, then the click the browser synthesises. */
function tap(el: Element) {
  fireEvent.pointerDown(el, { pointerId: 1, pointerType: 'touch', button: 0 });
  fireEvent.pointerUp(el, { pointerId: 1, pointerType: 'touch', button: 0 });
  act(() => void fireEvent.click(el));
}

describe('Nut Sort touch controls', () => {
  it('marks the board as a tap-only board', () => {
    render(<NutSortGame />);
    expect(document.querySelector('.arc-board-tap')).toBeTruthy();
    expect(document.querySelector('.arc-board-touch')).toBeNull();
  });

  it('tap the source bolt lifts its top nut, tap the target bolt drops it there', () => {
    render(<NutSortGame />);
    key(' ');
    const [from, to] = LEVELS[0].solution[0];
    const before = [nutsOn(from), nutsOn(to)];
    tap(bolt(from));
    expect(bolt(from).getAttribute('aria-pressed')).toBe('true');
    tap(bolt(to));
    act(() => void vi.advanceTimersByTime(MOVE_MS + 10));
    expect([nutsOn(from), nutsOn(to)]).toEqual([before[0] - 1, before[1] + 1]);
    expect(bolt(from).getAttribute('aria-pressed')).toBe('false');
  });

  it('tapping the lifted bolt again puts the nut back', () => {
    render(<NutSortGame />);
    key(' ');
    const [from] = LEVELS[0].solution[0];
    tap(bolt(from));
    tap(bolt(from));
    expect(bolt(from).getAttribute('aria-pressed')).toBe('false');
  });

  it('every bolt hit area is at least 44 px wide on a 360 px phone, in every level', () => {
    const board = 360 - 2 * 16;
    for (const level of LEVELS) expect(hitWidthPx(level.layout.length, board)).toBeGreaterThanOrEqual(44);
  });

  it('shows touch help instead of the key list', () => {
    render(<NutSortGame />);
    expect(screen.getByText('Tap a bolt')).toBeTruthy();
    expect(screen.getByText('Tap another bolt')).toBeTruthy();
    expect(screen.getByText('Tap the lifted bolt')).toBeTruthy();
  });

  it('the full-screen button toggles the immersive mode', () => {
    render(<NutSortGame />);
    fireEvent.click(screen.getByRole('button', { name: /Full screen/ }));
    expect(document.documentElement.dataset.arcadeImmersive).toBe('1');
    fireEvent.click(screen.getByRole('button', { name: /Exit full screen/ }));
    expect(document.documentElement.dataset.arcadeImmersive).toBeUndefined();
  });
});
