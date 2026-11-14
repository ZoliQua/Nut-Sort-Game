import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyDental, applyLang, loadSession, saveSession } from './arcade';
import { createInitialState } from './logic/game';
import { NutSortGame } from './NutSortGame';

beforeEach(() => {
  localStorage.clear();
  applyDental(false, { silent: true });
  applyLang('hu', { silent: true });
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  applyLang('en', { silent: true });
});

const key = (k: string) => act(() => void fireEvent.keyDown(window, { key: k }));
const finishBtn = () => screen.queryByRole('button', { name: 'Befejezés' });
const stat = (label: string) => screen.getByText(label).parentElement!.textContent!.replace(label, '');

/** A saved run on level 2 with level 1 solved at par (200 points), resumed from the paused card. */
function resumeWithScore() {
  const data = { ...createInitialState(1), levelScores: [200] };
  saveSession('nutsort', { schema: 1, data, seconds: 10, score: 200 });
}

describe('Nut Sort finish early', () => {
  it('is hidden before the run starts and visible once it has', () => {
    render(<NutSortGame />);
    expect(finishBtn()).toBeNull();
    key(' ');
    expect(finishBtn()).toBeTruthy();
  });

  it('confirms with the Score value, ranks it once and shows the finished card', () => {
    resumeWithScore();
    const onGameOver = vi.fn();
    render(<NutSortGame onGameOver={onGameOver} />);
    fireEvent.click(screen.getByRole('button', { name: 'Folytatás' }));
    expect(stat('Pont')).toBe('200');
    fireEvent.click(finishBtn()!);
    expect(screen.getByRole('alertdialog').textContent).toContain('200 pont kerül a ranglistára');
    fireEvent.click(screen.getByRole('button', { name: 'Befejezem' }));
    expect(onGameOver).toHaveBeenCalledTimes(1);
    expect(onGameOver).toHaveBeenCalledWith(200, { finished: true });
    expect(screen.getByRole('dialog', { name: 'Idő előtt befejezve' })).toBeTruthy();
    expect(loadSession('nutsort', 1)).toBeNull();
    expect(finishBtn()).toBeNull();
    act(() => void vi.advanceTimersByTime(3000));
    expect(onGameOver).toHaveBeenCalledTimes(1);
    expect(loadSession('nutsort', 1)).toBeNull();
  });

  it('finishing at score 0 still ranks it', () => {
    const onGameOver = vi.fn();
    render(<NutSortGame onGameOver={onGameOver} />);
    key(' ');
    fireEvent.click(finishBtn()!);
    expect(screen.getByRole('alertdialog').textContent).toContain('0 pont kerül a ranglistára');
    fireEvent.click(screen.getByRole('button', { name: 'Befejezem' }));
    expect(onGameOver).toHaveBeenCalledTimes(1);
    expect(onGameOver).toHaveBeenCalledWith(0, { finished: true });
    expect(screen.getByRole('dialog', { name: 'Idő előtt befejezve' })).toBeTruthy();
  });

  it('Cancel changes nothing', () => {
    resumeWithScore();
    const onGameOver = vi.fn();
    render(<NutSortGame onGameOver={onGameOver} />);
    fireEvent.click(screen.getByRole('button', { name: 'Folytatás' }));
    const before = [stat('Pont'), stat('Szint'), stat('Lépések')];
    fireEvent.click(finishBtn()!);
    fireEvent.click(screen.getByRole('button', { name: 'Mégse' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(onGameOver).not.toHaveBeenCalled();
    expect([stat('Pont'), stat('Szint'), stat('Lépések')]).toEqual(before);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(finishBtn()).toBeTruthy();
  });

  it('stops the clock while the confirm is open', () => {
    render(<NutSortGame />);
    key(' ');
    act(() => void vi.advanceTimersByTime(3000));
    const t = stat('Idő');
    fireEvent.click(finishBtn()!);
    act(() => void vi.advanceTimersByTime(5000));
    expect(stat('Idő')).toBe(t);
    fireEvent.click(screen.getByRole('button', { name: 'Mégse' }));
    act(() => void vi.advanceTimersByTime(3000));
    expect(stat('Idő')).not.toBe(t);
  });
});
