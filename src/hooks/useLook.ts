import { useCallback, useState } from 'react';
import { readString, writeString } from '../arcade';

export type Look = 'neon' | 'glass';

export const LOOK_KEY = 'nutsort.look';

const read = (): Look => (readString(LOOK_KEY) === 'glass' ? 'glass' : 'neon');

/** The board look, persisted per browser (`nutsort.look`, default neon). */
export function useLook(): { look: Look; setLook: (l: Look) => void } {
  const [look, setState] = useState<Look>(read);
  const setLook = useCallback((next: Look) => {
    setState(next);
    writeString(LOOK_KEY, next);
  }, []);
  return { look, setLook };
}
