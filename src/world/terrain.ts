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

const FLAT: HeightSampler = () => 0;

let sampler: HeightSampler = FLAT;
let bounds: Bounds = {
  minX: WORLD_BOUNDS.MIN_X,
  maxX: WORLD_BOUNDS.MAX_X,
  minZ: WORLD_BOUNDS.MIN_Z,
  maxZ: WORLD_BOUNDS.MAX_Z
};

/** A dimension installs its ground when it mounts. */
export function setTerrain(next: HeightSampler, nextBounds: Bounds): void {
  sampler = next;
  bounds = nextBounds;
}

/** Back to a flat plane, when a dimension unmounts. */
export function clearTerrain(): void {
  sampler = FLAT;
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
