import { fireEvent, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useNutSortKeys } from './useNutSortKeys';

function setup(enabled = true, bolts = 10) {
  const h = { onSelect: vi.fn(), onUndo: vi.fn(), onRestart: vi.fn(), onCancel: vi.fn() };
  renderHook(() => useNutSortKeys({ enabled, bolts, ...h }));
  return h;
}

describe('useNutSortKeys', () => {
  it('maps 1–9 to bolts 0–8 and 0 to bolt 9', () => {
    const h = setup();
    fireEvent.keyDown(window, { key: '1' });
    fireEvent.keyDown(window, { key: '9' });
    fireEvent.keyDown(window, { key: '0' });
    expect(h.onSelect.mock.calls).toEqual([[0], [8], [9]]);
  });

  it('ignores digits beyond the bolt count', () => {
    const h = setup(true, 3);
    fireEvent.keyDown(window, { key: '4' });
    fireEvent.keyDown(window, { key: '0' });
    expect(h.onSelect).not.toHaveBeenCalled();
  });

  it('undoes on U and Ctrl/Cmd+Z, restarts on R, cancels on Esc', () => {
    const h = setup();
    fireEvent.keyDown(window, { key: 'u' });
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
    fireEvent.keyDown(window, { key: 'z', metaKey: true });
    fireEvent.keyDown(window, { key: 'R' });
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(h.onUndo).toHaveBeenCalledTimes(3);
    expect(h.onRestart).toHaveBeenCalledTimes(1);
    expect(h.onCancel).toHaveBeenCalledTimes(1);
  });

  it('ignores other modifier combos, typing and the disabled state', () => {
    const h = setup();
    fireEvent.keyDown(window, { key: '1', ctrlKey: true });
    fireEvent.keyDown(window, { key: 'r', metaKey: true });
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true, altKey: true });
    const input = document.createElement('input');
    document.body.appendChild(input);
    fireEvent.keyDown(input, { key: '2' });
    fireEvent.keyDown(input, { key: 'z', ctrlKey: true });
    input.remove();
    expect(h.onSelect).not.toHaveBeenCalled();
    expect(h.onRestart).not.toHaveBeenCalled();
    expect(h.onUndo).not.toHaveBeenCalled();

    const off = setup(false);
    fireEvent.keyDown(window, { key: '1' });
    fireEvent.keyDown(window, { key: 'u' });
    expect(off.onSelect).not.toHaveBeenCalled();
    expect(off.onUndo).not.toHaveBeenCalled();
  });
});
