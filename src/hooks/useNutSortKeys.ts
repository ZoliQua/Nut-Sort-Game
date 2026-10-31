import { useEffect, useRef } from 'react';
import { shouldIgnoreKey } from '../arcade';

export type NutSortKeyOptions = {
  /** False while idle, paused or behind an overlay: bolt and edit keys are off. */
  enabled: boolean;
  bolts: number;
  /** `1`–`9`, `0` (bolt 10). */
  onSelect(b: number): void;
  /** `U`, Ctrl/Cmd+Z. */
  onUndo(): void;
  /** `R`. */
  onRestart(): void;
  /** `Esc`. */
  onCancel(): void;
};

/** Ctrl/Cmd+Z is the one modifier combo the game answers to; Shift and Alt variants stay with the browser. */
const isUndoChord = (e: KeyboardEvent): boolean =>
  (e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && (e.key === 'z' || e.key === 'Z');

/** The same event with the modifiers cleared, so `shouldIgnoreKey` only judges the target. */
const withoutModifiers = (e: KeyboardEvent): KeyboardEvent =>
  ({ target: e.target, metaKey: false, ctrlKey: false, altKey: false }) as unknown as KeyboardEvent;

/**
 * One window `keydown` listener for the component's lifetime; options are read
 * from a ref, so they are never stale and never re-attached. `T` (theme) and
 * `P` (pause) are left to the shell and the game.
 */
export function useNutSortKeys(opts: NutSortKeyOptions): void {
  const ref = useRef(opts);
  ref.current = opts;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (shouldIgnoreKey(event)) {
        if (!isUndoChord(event) || shouldIgnoreKey(withoutModifiers(event))) return;
        if (!ref.current.enabled) return;
        event.preventDefault();
        ref.current.onUndo();
        return;
      }
      const o = ref.current;
      if (!o.enabled) return;
      const key = event.key;
      if (key.length === 1 && key >= '0' && key <= '9') {
        const bolt = key === '0' ? 9 : Number(key) - 1;
        if (bolt >= o.bolts) return;
        event.preventDefault();
        o.onSelect(bolt);
        return;
      }
      if (key === 'u' || key === 'U') {
        event.preventDefault();
        o.onUndo();
        return;
      }
      if (key === 'r' || key === 'R') {
        event.preventDefault();
        o.onRestart();
        return;
      }
      if (key === 'Escape') {
        event.preventDefault();
        o.onCancel();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
