import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyDental, applyLang, formatNumber } from './arcade';
import { CAPACITY, LEVEL_COUNT } from './logic/constants';
import { LEVELS } from './logic/levels';
import { UNDO_COST } from './logic/scoring';
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

const hu = (n: number) => formatNumber(n, 'hu');
const maxBolts = Math.max(...LEVELS.map((l) => l.layout.length));

describe('constant-driven hints', () => {
  it('idle card states the capacity and the level count from the constants', () => {
    render(<NutSortGame />);
    expect(screen.getByRole('dialog').textContent).toContain(
      `Rendezd úgy a csavaranyákat, hogy minden csavaron ${hu(CAPACITY)} egyforma legyen. Minden fajtának saját szélessége és bevágásszáma van. Kevesebb lépés több pontot ér; ${hu(LEVEL_COUNT)} szint.`,
    );
  });

  it('key help names the real bolt range and undo cost; the level note repeats the cost', () => {
    render(<NutSortGame />);
    expect(maxBolts).toBe(10);
    expect(screen.getByText(`${hu(1)}–${hu(maxBolts)}. csavar kiválasztása (felemelés / lerakás)`)).toBeTruthy();
    expect(screen.getByText(`Visszavonás (+${hu(UNDO_COST)} lépés)`)).toBeTruthy();
    expect(document.body.textContent).toContain(`. A visszavonás ${hu(UNDO_COST)} lépéssel növeli a lépésszámlálót.`);
  });

  it('follows the language', () => {
    render(<NutSortGame />);
    act(() => applyLang('de'));
    expect(screen.getByText(`Schraube 1–${maxBolts} wählen (anheben / ablegen)`)).toBeTruthy();
    expect(screen.getByText(`Rückgängig (+${UNDO_COST} Zug)`)).toBeTruthy();
    expect(document.body.textContent).toContain(`Rückgängig erhöht den Zugzähler um ${UNDO_COST}.`);
  });
});
