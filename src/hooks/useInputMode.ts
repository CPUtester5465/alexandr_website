import { useEffect, useState } from 'react';
import { getInputMode, prefersReducedMotion, InputMode } from '../utils/device-detection';

/**
 * Tracks how the visitor is driving the site, and reacts when that changes.
 *
 * It genuinely changes mid-session: plugging a mouse into a tablet, or picking
 * up a 2-in-1 laptop and folding the keyboard away. Listening to the media
 * query is barely more code than reading it once, so the hints stay honest.
 */
export function useInputMode(): { mode: InputMode; isTouch: boolean; reducedMotion: boolean } {
  const [mode, setMode] = useState<InputMode>(getInputMode);
  const [reducedMotion, setReducedMotion] = useState<boolean>(prefersReducedMotion);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const coarse = window.matchMedia('(pointer: coarse)');
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const onPointer = () => setMode(getInputMode());
    const onMotion = () => setReducedMotion(prefersReducedMotion());

    coarse.addEventListener('change', onPointer);
    motion.addEventListener('change', onMotion);
    return () => {
      coarse.removeEventListener('change', onPointer);
      motion.removeEventListener('change', onMotion);
    };
  }, []);

  return { mode, isTouch: mode === 'touch', reducedMotion };
}
