import { WORLD_BOUNDS } from '../utils/constants';

/**
 * What the character stands on.
 *
 * Until now the floor was the number 0 and the world was 120 units square, both
 * hard-coded. A dimension brings its own ground and its own edges, so both have
 * to be things the world sets rather than constants the player assumes -- or he
 * spawns waist-deep in the first hill.
 *
 * A height field, not a voxel query: terrain here is generated as a heightmap,
 * so there is nothing to stand under. When a dimension needs overhangs this
 * grows a real voxel sweep; it does not need one yet, and pretending otherwise
 * would be paying for a feature nothing uses.
 */

export interface Bounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

type HeightSampler = (x: number, z: number) => number;

/**
 * Where the world will let him stand.
 *
 * A rectangle is not enough. The hub is a round room whose only ways out are
 * fourteen doorways cut through the wall, so its walkable area is a disc with
 * fourteen notches -- and clamping that to a box put every door four units
 * beyond the furthest he could reach. He could see them and never touch one.
 */
export type PositionClamp = (x: number, z: number) => { x: number; z: number };

const FLAT: HeightSampler = () => 0;

let sampler: HeightSampler = FLAT;
let clamp: PositionClamp | null = null;
let bounds: Bounds = {
  minX: WORLD_BOUNDS.MIN_X,
  maxX: WORLD_BOUNDS.MAX_X,
  minZ: WORLD_BOUNDS.MIN_Z,
  maxZ: WORLD_BOUNDS.MAX_Z
};

/** A dimension installs its ground when it mounts. */
export function setTerrain(
  next: HeightSampler,
  nextBounds: Bounds,
  nextClamp: PositionClamp | null = null
): void {
  sampler = next;
  bounds = nextBounds;
  clamp = nextClamp;
}

/** Back to a flat plane, when a dimension unmounts. */
export function clearTerrain(): void {
  sampler = FLAT;
  clamp = null;
  bounds = {
    minX: WORLD_BOUNDS.MIN_X,
    maxX: WORLD_BOUNDS.MAX_X,
    minZ: WORLD_BOUNDS.MIN_Z,
    maxZ: WORLD_BOUNDS.MAX_Z
  };
}

/** Surface height in world units at a point. */
export function groundHeightAt(x: number, z: number): number {
  return sampler(x, z);
}

export function getBounds(): Bounds {
  return bounds;
}

/** Keep him inside the world, whatever shape it is. */
export function clampPosition(x: number, z: number): { x: number; z: number } {
  if (clamp) return clamp(x, z);
  return {
    x: Math.max(bounds.minX, Math.min(bounds.maxX, x)),
    z: Math.max(bounds.minZ, Math.min(bounds.maxZ, z))
  };
}
