import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadSession, readStats, saveSession } from './arcade';
import { MOVE_MS } from './components/boardGeometry';
import { LEVEL_COUNT } from './logic/constants';
import { advanceGame, createInitialState, type GameAction, type GameState } from './logic/game';
import { LEVELS } from './logic/levels';
import type { SavedGame } from './logic/persist';
import type { Move } from './logic/types';
import { NutSortGame, RESULT_DELAY_MS } from './NutSortGame';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

const key = (k: string, init: KeyboardEventInit = {}) => act(() => void fireEvent.keyDown(window, { key: k, ...init }));
const bolts = () => screen.getAllByRole('button', { name: /^Bolt \d+:/ });
const bolt = (i: number) => screen.getByRole('button', { name: new RegExp(`^Bolt ${i + 1}:`) });
const click = (i: number) => act(() => void fireEvent.click(bolt(i)));
const wait = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const stat = (label: string) => screen.getByText(label).parentElement?.textContent?.replace(label, '');

/** Plays the moves through the UI, letting each nut finish its travel. */
function playMoves(moves: readonly Move[]) {
  for (const [from, to] of moves) {
    click(from);
    click(to);
    wait(MOVE_MS + 10);
  }
}

const apply = (s: GameState, moves: readonly Move[]) =>
  moves.reduce(
    (acc, [from, to]) =>
      [{ type: 'select', bolt: from }, { type: 'select', bolt: to }].reduce(
        (a, action) => advanceGame(a, action as GameAction),
        acc,
      ),
    s,
  );

function start() {
  const view = render(<NutSortGame />);
  key(' ');
  return view;
}

describe('<NutSortGame />', () => {
  it('starts on level 1 with 3 bolts', () => {
    render(<NutSortGame />);
    expect(screen.getByRole('dialog', { name: 'Nut Sort' })).toBeTruthy();
    key(' ');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(bolts()).toHaveLength(3);
    expect(stat('Level')).toBe('1/20');
    expect(stat('Moves')).toBe(`0 / ${LEVELS[0].par}`);
  });

  it('solving level 1 at par shows the level card with 200 points, then level 2', () => {
    start();
    playMoves(LEVELS[0].solution);
    wait(RESULT_DELAY_MS);
    expect(screen.getByRole('dialog', { name: 'Level 1 solved' }).textContent).toMatch(/\+200 of 200 points/);
    expect(stat('Score')).toBe('200');
    key('Enter');
    expect(stat('Level')).toBe('2/20');
    expect(bolts()).toHaveLength(LEVELS[1].layout.length);
    expect(stat('Moves')).toBe(`0 / ${LEVELS[1].par}`);
  });

  it('ignores clicks while a nut is travelling', () => {
    start();
    const [from, to] = LEVELS[0].solution[0];
    click(from);
    click(to);
    // Two quick clicks on other bolts during the animation: neither lifts nor moves.
    const others = [0, 1, 2].filter((b) => b !== to);
    click(others[0]);
    click(others[1]);
    wait(MOVE_MS + 10);
    expect(stat('Moves')).toBe(`1 / ${LEVELS[0].par}`);
    expect(screen.getByRole('status').textContent).toBe('Pick a bolt');
    const expected = apply(createInitialState(), [[from, to]]);
    expected.layout.forEach((b, i) => expect(bolt(i).getAttribute('aria-label')).toMatch(new RegExp(`^Bolt ${i + 1}: ${b.length === 0 ? 'empty' : `${b.length} nut`}`)));
  });

  it('undo raises the move counter; undo at the start does nothing', () => {
    start();
    key('u');
    expect(stat('Moves')).toBe(`0 / ${LEVELS[0].par}`);
    playMoves([LEVELS[0].solution[0]]);
    key('u');
    wait(MOVE_MS + 10);
    expect(stat('Moves')).toBe(`2 / ${LEVELS[0].par}`);
    act(() => void fireEvent.click(screen.getByRole('button', { name: /^Undo/ })));
    expect(stat('Moves')).toBe(`2 / ${LEVELS[0].par}`);
  });

  it('restart asks first, then resets moves and lowers the level value', () => {
    start();
    playMoves(LEVELS[0].solution.slice(0, 2));
    key('r');
    expect(screen.getByRole('dialog', { name: 'Restart this level?' })).toBeTruthy();
    key('Escape');
    expect(stat('Moves')).toBe(`2 / ${LEVELS[0].par}`);
    key('r');
    key('Enter');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(stat('Moves')).toBe(`0 / ${LEVELS[0].par}`);
    expect(screen.getByText(/worth up to 160 \(1 restart\)/)).toBeTruthy();
  });

  it('autosaves mid-level and restores the layout and moves paused', () => {
    const { unmount } = start();
    playMoves(LEVELS[0].solution.slice(0, 3));
    wait(1100);
    unmount();
    const env = loadSession<SavedGame>('nutsort', 1);
    expect(env?.data).toMatchObject({ levelIndex: 0, moves: 3, phase: 'playing' });

    render(<NutSortGame embedded />);
    expect(screen.getByRole('dialog', { name: 'Welcome back' })).toBeTruthy();
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
    expect(stat('Moves')).toBe(`3 / ${LEVELS[0].par}`);
    const expected = apply(createInitialState(), LEVELS[0].solution.slice(0, 3));
    expected.layout.forEach((b, i) => expect(bolt(i).getAttribute('aria-label')).toMatch(new RegExp(`^Bolt ${i + 1}: ${b.length === 0 ? 'empty' : `${b.length} nut`}`)));
    key('p');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('does not restore a finished run nor report it again', () => {
    let s = createInitialState();
    for (let i = 0; i < LEVEL_COUNT; i++) {
      s = apply(s, LEVELS[i].solution);
      if (i < LEVEL_COUNT - 1) s = advanceGame(s, { type: 'next' });
    }
    expect(s.phase).toBe('finished');
    saveSession('nutsort', { schema: 1, data: s, seconds: 100, score: 10800 });
    const onGameOver = vi.fn();
    render(<NutSortGame onGameOver={onGameOver} />);
    wait(2000);
    expect(screen.getByRole('dialog', { name: 'Nut Sort' })).toBeTruthy();
    expect(stat('Level')).toBe('1/20');
    expect(onGameOver).not.toHaveBeenCalled();
    expect(loadSession('nutsort', 1)).toBeNull();
  });

  it('playing all 20 levels reports 10 800 exactly once', () => {
    const onGameOver = vi.fn();
    render(<NutSortGame onGameOver={onGameOver} />);
    key(' ');
    for (let i = 0; i < LEVEL_COUNT; i++) {
      playMoves(LEVELS[i].solution);
      if (i < LEVEL_COUNT - 1) key('Enter');
    }
    wait(RESULT_DELAY_MS);
    expect(screen.getByRole('dialog', { name: 'All 20 levels solved!' }).textContent).toMatch(/Final score 10,800 of 10,800/);
    wait(5000);
    expect(onGameOver).toHaveBeenCalledTimes(1);
    expect(onGameOver).toHaveBeenCalledWith(10800);
    expect(readStats('nutsort').plays).toBe(1);
    expect(loadSession('nutsort', 1)).toBeNull();
    key('Enter'); // play again
    expect(stat('Level')).toBe('1/20');
    expect(onGameOver).toHaveBeenCalledTimes(1);
  }, 30_000);

  it('an abandoned run is not recorded', () => {
    const onRunEnd = vi.fn();
    render(<NutSortGame onRunEnd={onRunEnd} />);
    key(' ');
    playMoves(LEVELS[0].solution);
    key('Enter');
    act(() => void fireEvent.click(screen.getByRole('button', { name: 'New game' })));
    expect(screen.getByRole('dialog', { name: 'Start a new game?' })).toBeTruthy();
    key('Enter');
    expect(stat('Level')).toBe('1/20');
    expect(stat('Score')).toBe('0');
    expect(onRunEnd).not.toHaveBeenCalled();
  });

  it('switches the look and keeps it', () => {
    start();
    act(() => void fireEvent.click(screen.getByRole('button', { name: 'Glass' })));
    expect(localStorage.getItem('nutsort.look')).toBe('glass');
    expect(screen.getByRole('button', { name: 'Glass' }).getAttribute('aria-pressed')).toBe('true');
  });
});
