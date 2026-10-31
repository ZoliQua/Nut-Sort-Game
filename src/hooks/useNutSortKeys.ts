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
  /** Enter / Space (left to a focused button): start, resume, next level, play again. */
  onPrimary?(): void;
  /** `P`, and `Esc` while the bolt keys are off. */
  onTogglePause?(): void;
  /** A confirm dialog is open: only Enter (confirm) and Esc (dismiss) are live. */
  dialog?: { onConfirm(): void; onDismiss(): void } | null;
};

const isButtonTarget = (target: EventTarget | null): boolean =>
  target instanceof Element && (target.tagName === 'BUTTON' || target.getAttribute('role') === 'button');

/** Ctrl/Cmd+Z is the one modifier combo the game answers to; Shift and Alt variants stay with the browser. */
const isUndoChord = (e: KeyboardEvent): boolean =>
  (e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && (e.key === 'z' || e.key === 'Z');

/** The same event with the modifiers cleared, so `shouldIgnoreKey` only judges the target. */
const withoutModifiers = (e: KeyboardEvent): KeyboardEvent =>
  ({ target: e.target, metaKey: false, ctrlKey: false, altKey: false }) as unknown as KeyboardEvent;

/**
 * One window `keydown` listener for the component's lifetime; options are read
 * from a ref, so they are never stale and never re-attached. `T` is left to
 * the shell (theme toggle).
 */
export function useNutSortKeys(opts: NutSortKeyOptions): void {
  const ref = useRef(opts);
  ref.current = opts;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (shouldIgnoreKey(event)) {
        if (!isUndoChord(event) || shouldIgnoreKey(withoutModifiers(event))) return;
        if (!ref.current.enabled || ref.current.dialog) return;
        event.preventDefault();
        ref.current.onUndo();
        return;
      }
      const o = ref.current;
      const key = event.key;
      if (o.dialog) {
        if (key === 'Enter') {
          event.preventDefault();
          o.dialog.onConfirm();
        } else if (key === 'Escape') {
          event.preventDefault();
          o.dialog.onDismiss();
        }
        return;
      }
      if (key === 'Enter' || key === ' ') {
        // A focused button (a bolt, Undo, an overlay action) activates itself natively.
        if (!o.onPrimary || isButtonTarget(event.target)) return;
        event.preventDefault();
        o.onPrimary();
        return;
      }
      if (key === 'p' || key === 'P' || (key === 'Escape' && !o.enabled)) {
        if (!o.onTogglePause) return;
        event.preventDefault();
        o.onTogglePause();
        return;
      }
      if (!o.enabled) return;
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
