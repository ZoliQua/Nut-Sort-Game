import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyDental, applyLang, formatNumber } from './arcade';
import { CAPACITY, LEVEL_COUNT } from './logic/constants';
import { LEVELS } from './logic/levels';
import { BASE_PER_TYPE, RESTART_FLOOR, RESTART_STEP, UNDO_COST } from './logic/scoring';
import { NutSortGame } from './NutSortGame';
import { setCoarsePointer } from './test/touchEnv';

beforeEach(() => {
  localStorage.clear();
  applyDental(false, { silent: true });
  applyLang('hu', { silent: true });
  vi.useFakeTimers();
  setCoarsePointer(false);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  applyLang('en', { silent: true });
});

const key = (k: string) => fireEvent.keyDown(window, { key: k });
const openRules = () => fireEvent.click(screen.getByRole('button', { name: /Szabályok/ }));
const dialog = () => screen.getByRole('dialog', { name: /szabályok/ });
const headings = () => within(dialog()).getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
const hu = (n: number) => formatNumber(n, 'hu');
const pct = (f: number) => hu(Math.round(f * 100));

describe('Nut Sort rules dialog', () => {
  it('shows a Rules button; opening mid-run pauses and closing leaves it paused', () => {
    render(<NutSortGame />);
    expect(screen.getByRole('button', { name: /Szabályok/ })).toBeTruthy();
    act(() => key(' '));
    expect(screen.queryByRole('dialog')).toBeNull();
    openRules();
    expect(screen.getByRole('dialog', { name: 'Nut Sort — szabályok' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Bezárás' }));
    expect(screen.getByRole('dialog', { name: 'Szünet' })).toBeTruthy();
  });

  it('does not bind R to the rules: R restarts, it never opens the dialog', () => {
    render(<NutSortGame />);
    act(() => key(' '));
    act(() => key('r'));
    expect(screen.queryByRole('dialog', { name: /szabályok/ })).toBeNull();
  });

  it('lists goal, play, rules, scoring, dental in order; mobile only on touch', () => {
    const { unmount } = render(<NutSortGame />);
    openRules();
    expect(headings()).toEqual(['Cél', 'Így játssz', 'Szabályok', 'Pontozás', 'Fogas mód']);
    expect(dialog().textContent).toContain('Kattints egy csavarra');
    unmount();
    setCoarsePointer(true);
    render(<NutSortGame />);
    openRules();
    expect(headings()).toEqual(['Cél', 'Így játssz', 'Szabályok', 'Pontozás', 'Fogas mód', 'Mobilon']);
    expect(dialog().textContent).toContain('Koppints arra a csavarra');
    expect(dialog().textContent).toContain('Koppints a forráscsavarra, majd a célcsavarra');
    expect(dialog().textContent).toContain('Teljes képernyő');
  });

  it('prints the goal and rules with the real constants', () => {
    render(<NutSortGame />);
    openRules();
    const text = dialog().textContent ?? '';
    expect(text).toContain(`A cél: mind a ${hu(LEVEL_COUNT)} szint megoldása.`);
    expect(text).toContain(`Egy csavar legfeljebb ${hu(CAPACITY)} anyát bír el, és minden fajtából pontosan ${hu(CAPACITY)} van.`);
  });

  it('prints every scoring number inside its full sentence, all reachable', () => {
    render(<NutSortGame />);
    openRules();
    const text = dialog().textContent ?? '';
    const types = LEVELS.map((l) => l.types);
    const lo = BASE_PER_TYPE * Math.min(...types);
    const hi = BASE_PER_TYPE * Math.max(...types);
    const runMax = BASE_PER_TYPE * types.reduce((a, b) => a + b, 0);
    expect(lo).toBe(200);
    expect(hi).toBe(800);
    expect(runMax).toBe(10800);
    const first = Math.round((1 - RESTART_STEP) * 100);
    const second = Math.round((1 - 2 * RESTART_STEP) * 100);
    const floor = Math.round(RESTART_FLOOR * 100);
    expect(text).toContain(
      `Egy szint csavaranya-fajtánként ${hu(BASE_PER_TYPE)} pontot ér, szinttől függően ${hu(lo)} és ${hu(hi)} pont között, ha a par lépésszámmal vagy kevesebbel oldod meg. Minden par fölötti lépés arányosan csökkenti: pont × par ÷ lépés.`,
    );
    expect(text).toContain(
      `Ha újrakezded a szintet, az utána legfeljebb a pontja ${pct(first / 100)}%-át éri, másodszorra ${pct(second / 100)}%-át, és a szorzó soha nem megy ${hu(floor)}% alá.`,
    );
    expect(text).toContain(`A visszavonás visszaveszi az utolsó lépést, de a lépésszámláló így is ${hu(UNDO_COST)} lépéssel nő.`);
    expect(text).toContain(`A menet pontszáma a megoldott szintek pontjainak összege, legfeljebb ${hu(runMax)}.`);
    expect(text).toContain('Ha idő előtt befejezed, a már megoldott szintek pontjai kerülnek a ranglistára.');
    expect(text).toContain('80%-át éri, másodszorra 60%-át');
  });

  it('has a described move diagram with legal and illegal examples', () => {
    render(<NutSortGame />);
    openRules();
    const img = within(dialog()).getByRole('img', { name: /Ábra/ });
    expect(img.getAttribute('aria-label')).toContain('✓');
    expect(img.getAttribute('aria-label')).toContain('✗');
    const marks = Array.from(img.querySelectorAll('text')).map((t) => t.textContent);
    expect(marks.filter((m) => m === '✓')).toHaveLength(2);
    expect(marks.filter((m) => m === '✗')).toHaveLength(2);
  });

  it('keeps the run when the language changes inside the rules', () => {
    render(<NutSortGame />);
    act(() => key(' '));
    openRules();
    act(() => applyLang('de'));
    expect(screen.getByRole('heading', { level: 2, name: 'Nut Sort — Regeln' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: 'Ziel' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Schließen' }));
    expect(screen.getByRole('dialog', { name: 'Pausiert' })).toBeTruthy();
    expect(screen.getByText('Level').parentElement!.textContent).toContain('1/20');
    expect(screen.getByText('Punkte').parentElement!.textContent).toContain('0');
  });
});
