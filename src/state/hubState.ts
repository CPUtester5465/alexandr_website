import { useEffect, useState } from 'react';
import type { Door } from '../world/hub';

/**
 * Which door he is standing at, published from the frame loop to React.
 *
 * A tiny subscription rather than putting it in controlState: this changes a
 * handful of times a minute, not sixty times a second, so React should hear
 * about it. controlState is for the things that would re-render the scene.
 */

let current: Door | null = null;
const listeners = new Set<(door: Door | null) => void>();

export function setNearestDoor(door: Door | null): void {
  current = door;
  for (const listener of listeners) listener(door);
}

export function useNearestDoor(): Door | null {
  const [door, setDoor] = useState<Door | null>(current);
  useEffect(() => {
    listeners.add(setDoor);
    return () => { listeners.delete(setDoor); };
  }, []);
  return door;
}
