import { useEffect, useState } from 'react';
import type { DimensionSpec } from '../world/dimensions/specs';
import { controlState } from './controlState';
import { groundHeightAt } from '../world/terrain';
import { PLAYER_CONFIG } from '../utils/constants';

/**
 * Which world is under the player's feet, published so the HUD can draw a map
 * of it. The map needs the palette and the terrain function; both belong to the
 * dimension, and neither should be threaded through six components to reach a
 * button in the corner.
 */

let active: DimensionSpec | null = null;
const listeners = new Set<(spec: DimensionSpec | null) => void>();

export function setActiveDimension(spec: DimensionSpec | null): void {
  active = spec;
  for (const listener of listeners) listener(spec);
}

export function useActiveDimension(): DimensionSpec | null {
  const [spec, setSpec] = useState(active);
  useEffect(() => {
    listeners.add(setSpec);
    setSpec(active);
    return () => { listeners.delete(setSpec); };
  }, []);
  return spec;
}

/**
 * Put him somewhere else in the same world.
 *
 * Height comes from the terrain rather than from the map, so he lands standing
 * on the ground rather than at whatever altitude he left. Speed is zeroed --
 * arriving at a run in a place you did not walk to feels like a glitch.
 */
export function fastTravelTo(x: number, z: number): void {
  controlState.playerPosition.set(x, groundHeightAt(x, z) + PLAYER_CONFIG.HEIGHT, z);
  controlState.speed = 0;
  controlState.moveAxis.set(0, 0);
  controlState.desiredHeading = null;
  controlState.throttle = 0;
}
