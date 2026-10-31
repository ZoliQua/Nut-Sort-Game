import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { LOOK_KEY, useLook } from './useLook';

afterEach(() => localStorage.clear());

describe('useLook', () => {
  it('defaults to neon', () => {
    expect(renderHook(() => useLook()).result.current.look).toBe('neon');
  });

  it('persists glass and survives a remount', () => {
    const first = renderHook(() => useLook());
    act(() => first.result.current.setLook('glass'));
    expect(first.result.current.look).toBe('glass');
    expect(localStorage.getItem(LOOK_KEY)).toBe('glass');
    first.unmount();
    expect(renderHook(() => useLook()).result.current.look).toBe('glass');
  });

  it('falls back to neon on a garbage value', () => {
    localStorage.setItem(LOOK_KEY, 'chrome');
    expect(renderHook(() => useLook()).result.current.look).toBe('neon');
  });
});
