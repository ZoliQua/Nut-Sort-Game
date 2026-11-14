import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyLang, LANGS, saveSession } from './arcade';
import { NutBoard } from './components/NutBoard';
import { MOVE_MS } from './components/boardGeometry';
import { MESSAGES } from './i18n';
import { advanceGame, createInitialState, runScore, type GameAction, type GameState } from './logic/game';
import { LEVELS } from './logic/levels';
import { NutSortGame } from './NutSortGame';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => {
  act(() => applyLang('en'));
  vi.useRealTimers();
});

const key = (k: string) => act(() => void fireEvent.keyDown(window, { key: k }));
const stat = (label: string) => screen.getByText(label).parentElement?.textContent?.replace(label, '');

describe('Nut Sort i18n', () => {
  it('has every key in en, hu and de with a non-empty value', () => {
    const keys = Object.keys(MESSAGES.en).sort();
    expect(keys.length).toBeGreaterThan(0);
    for (const lang of LANGS) {
      expect(Object.keys(MESSAGES[lang]).sort()).toEqual(keys);
      for (const k of keys) expect((MESSAGES[lang] as Record<string, string>)[k].trim()).not.toBe('');
    }
  });

  it('renders the German start overlay after applyLang("de")', () => {
    applyLang('de');
    render(<NutSortGame />);
    const dialog = screen.getByRole('dialog', { name: 'Nut Sort' });
    expect(dialog.textContent).toMatch(/Sortiere die Muttern/);
    expect(screen.getAllByRole('button', { name: /^Start/ }).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Glas' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'Einstellungen' })).toBeTruthy();
  });

  it('switching to Hungarian mid-level keeps the level, moves and score', () => {
    render(<NutSortGame />);
    key(' ');
    const [from, to] = LEVELS[0].solution[0];
    act(() => void fireEvent.click(screen.getByRole('button', { name: new RegExp(`^Bolt ${from + 1}:`) })));
    act(() => void fireEvent.click(screen.getByRole('button', { name: new RegExp(`^Bolt ${to + 1}:`) })));
    act(() => void vi.advanceTimersByTime(MOVE_MS + 10));
    expect(stat('Moves')).toBe(`1 / ${LEVELS[0].par}`);

    act(() => applyLang('hu'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(stat('Szint')).toBe('1/20');
    expect(stat('Lépések')).toBe(`1 / ${LEVELS[0].par}`);
    expect(stat('Pont')).toBe('0');
    expect(screen.getAllByRole('button', { name: /^\d+\. csavar:/ })).toHaveLength(3);
    expect(screen.getByRole('status').textContent).toBe('Válassz egy csavart');
  });

  it('formats scores with the language grouping', () => {
    let s: GameState = createInitialState();
    for (let i = 0; runScore(s) < 1000; i += 1) {
      for (const [from, to] of LEVELS[i].solution)
        for (const bolt of [from, to]) s = advanceGame(s, { type: 'select', bolt } as GameAction);
      s = advanceGame(s, { type: 'next' });
    }
    const score = runScore(s);
    saveSession('nutsort', { schema: 1, data: s, seconds: 10, score });
    applyLang('de');
    render(<NutSortGame />);
    const de = new Intl.NumberFormat('de-DE').format(score);
    expect(de).toContain('.');
    expect(screen.getByRole('dialog', { name: 'Willkommen zurück' }).textContent).toContain(`bisher ${de} Punkte`);
    expect(stat('Punkte')).toBe(de);
  });

  it('uses the singular for a one-notch nut', () => {
    render(<NutBoard layout={[[0], []]} lifted={null} shake={null} look="neon" onSelectBolt={() => {}} />);
    expect(screen.getAllByRole('button')[0].getAttribute('aria-label')).toBe('Bolt 1: 1 nut, top type 1 (orange, 1 notch)');
  });
});
