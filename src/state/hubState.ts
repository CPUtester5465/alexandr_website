import { useEffect, useState } from 'react';
import type { Door } from '../world/hub';
import type * as THREE from 'three';

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

/**
 * Where the way home is, in a world that has no edges.
 *
 * Once a dimension streams forever, a doorway eleven units from where you
 * landed is findable for about thirty seconds. After that you are lost in a
 * meadow, which is charming exactly once. The HUD needs to be able to point.
 */
let home: THREE.Vector3 | null = null;
const homeListeners = new Set<(p: THREE.Vector3 | null) => void>();

export function setWayHome(position: THREE.Vector3 | null): void {
  home = position;
  for (const listener of homeListeners) listener(home);
}

export function useWayHome(): THREE.Vector3 | null {
  const [where, setWhere] = useState<THREE.Vector3 | null>(home);
  useEffect(() => {
    homeListeners.add(setWhere);
    setWhere(home);
    return () => { homeListeners.delete(setWhere); };
  }, []);
  return where;
}
