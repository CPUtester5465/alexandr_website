import { useEffect, useState } from 'react';

/**
 * Where you are, and the moment of going somewhere else.
 *
 * Generating and meshing a dimension is roughly a tenth of a second of blocked
 * main thread. That is short enough to hide and far too long to show, so the
 * travel fades out, does the work while nothing is on screen, and fades back.
 * The fade is the door's own colour -- the last thing you see leaving and the
 * first thing you see arriving is the palette of the painting you are walking
 * into.
 *
 * No spinner and no progress bar. Both are apologies for a wait, and the wait
 * here is shorter than the apology.
 */

export type WorldId = 'hub' | string;

export interface TransitionState {
  /** 'out' is leaving, 'in' is arriving. */
  phase: 'out' | 'in';
  colour: number;
}

interface WorldSnapshot {
  current: WorldId;
  /** The door we came through, so going back puts us where we left. */
  cameFrom: string | null;
  transition: TransitionState | null;
}

let snapshot: WorldSnapshot = { current: 'hub', cameFrom: null, transition: null };
const listeners = new Set<(s: WorldSnapshot) => void>();

function publish(next: Partial<WorldSnapshot>): void {
  snapshot = { ...snapshot, ...next };
  for (const listener of listeners) listener(snapshot);
}

export const FADE_OUT_MS = 320;
export const FADE_IN_MS = 420;

let travelling = false;

/** Go somewhere. Ignores re-entry while a travel is already under way. */
export function travelTo(target: WorldId, colour: number, cameFrom: string | null = null): void {
  if (travelling || target === snapshot.current) return;
  travelling = true;

  publish({ transition: { phase: 'out', colour } });
  window.setTimeout(() => {
    publish({ current: target, cameFrom, transition: { phase: 'in', colour } });
    window.setTimeout(() => {
      publish({ transition: null });
      travelling = false;
    }, FADE_IN_MS);
  }, FADE_OUT_MS);
}

/** Read the current state without a hook. Used by tests and by the frame loop. */
export function getWorld(): WorldSnapshot {
  return snapshot;
}

export function useWorld(): WorldSnapshot {
  const [state, setState] = useState(snapshot);
  useEffect(() => {
    listeners.add(setState);
    setState(snapshot);
    return () => { listeners.delete(setState); };
  }, []);
  return state;
}

/** Tests and the hash router need to place you without a fade. */
export function setWorldImmediately(target: WorldId): void {
  travelling = false;
  publish({ current: target, cameFrom: null, transition: null });
}
