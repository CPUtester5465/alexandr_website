import * as THREE from 'three';
import { createVolume, setBlock, blockAt, Volume, BLOCK } from '../voxel';
import { makeFbm, makeWarp, smoothstep } from '../noise';
import { makeStream, randInt } from '../rng';

/**
 * DIMENSION 01 — Poppy in Green Weather.
 *
 * The painting is a single crimson poppy filling the frame against a speckled
 * green field, in heavy impasto. So the world is that painting from the inside:
 * you are insect-sized, the meadow is a landscape, and the poppies are
 * architecture you walk under.
 *
 * Every colour is sampled from art-originals/Poppy-in-Green-Weather.png by
 * tools/sample-palette.py -- k-means, then the nearest ACTUAL pixel to each
 * centroid, because a centroid is an average that may appear nowhere in the
 * work. Source coordinates are recorded so the claim is checkable.
 */

export const PALETTE = {
  GRASS:   { hex: 0x557D46, from: [20, 157] as const,  share: 0.346 },
  DEEP:    { hex: 0x476737, from: [862, 761] as const, share: 0.254 },
  PETAL:   { hex: 0x842E32, from: [327, 387] as const, share: 0.132 },
  PETAL_LIT: { hex: 0xB33F3A, from: [464, 380] as const, share: 0.112 },
  PALE:    { hex: 0x6E9767, from: [875, 472] as const, share: 0.078 },
  SOIL:    { hex: 0x583A37, from: [464, 584] as const, share: 0.063 },
  POLLEN:  { hex: 0xAC7036, from: [340, 406] as const, share: 0.016 }
};

/** Block ids. 0 is air. */
export const B = {
  GRASS: 1, DEEP: 2, PALE: 3, SOIL: 4, STEM: 5, PETAL: 6, PETAL_LIT: 7, POLLEN: 8
} as const;

export const COLOURS: THREE.Color[] = [];
COLOURS[B.GRASS] = new THREE.Color(PALETTE.GRASS.hex);
COLOURS[B.DEEP] = new THREE.Color(PALETTE.DEEP.hex);
COLOURS[B.PALE] = new THREE.Color(PALETTE.PALE.hex);
COLOURS[B.SOIL] = new THREE.Color(PALETTE.SOIL.hex);
COLOURS[B.STEM] = new THREE.Color(PALETTE.DEEP.hex);
COLOURS[B.PETAL] = new THREE.Color(PALETTE.PETAL.hex);
COLOURS[B.PETAL_LIT] = new THREE.Color(PALETTE.PETAL_LIT.hex);
COLOURS[B.POLLEN] = new THREE.Color(PALETTE.POLLEN.hex);

export const SIZE = { x: 56, y: 30, z: 56 };
export const SEED = 20140902; // his birthday, and a seed is allowed to mean something

/** World-space extent, in units, centred on the origin. */
export const EXTENT = {
  minX: -(SIZE.x / 2) * BLOCK,
  maxX: (SIZE.x / 2) * BLOCK,
  minZ: -(SIZE.z / 2) * BLOCK,
  maxZ: (SIZE.z / 2) * BLOCK
};

export interface GeneratedDimension {
  volume: Volume;
  /** Surface height in world units, for the character to stand on. */
  heightAt(x: number, z: number): number;
  /** Where to put him, in world units. */
  spawn: THREE.Vector3;
}

/**
 * Terrain shaping. Plain fbm gives bland hills; three things fix it.
 *
 *   a domain warp, so the ground reads as eroded rather than as smooth blobs
 *   a coarse control field deciding what KIND of ground this is -- height and
 *     character must not come from the same noise or every hill is the same
 *   an edge falloff, so the meadow is a place with a horizon, not a plane that
 *     simply stops
 */
export function generate(seed: number = SEED): GeneratedDimension {
  const volume = createVolume(SIZE.x, SIZE.y, SIZE.z);

  const warp = makeWarp(seed, 'terrain:warp', 0.055, 5.5);
  const relief = makeFbm(seed, 'terrain:relief', { octaves: 4, frequency: 0.055 });
  const character = makeFbm(seed, 'terrain:character', { octaves: 2, frequency: 0.018 });
  const speckle = makeStream(seed, 'speckle');

  const BASE = 6;
  const heights = new Int16Array(SIZE.x * SIZE.z);

  for (let z = 0; z < SIZE.z; z++) {
    for (let x = 0; x < SIZE.x; x++) {
      const [wx, wz] = warp(x, z);

      // How far out, 0 at the middle and 1 at the corner.
      const nx = (x / (SIZE.x - 1)) * 2 - 1;
      const nz = (z / (SIZE.z - 1)) * 2 - 1;
      const edge = 1 - smoothstep(0.72, 1.0, Math.hypot(nx, nz));

      // Coarse: is this a rise or a hollow?
      const kind = character(wx, wz);
      const amplitude = 3 + Math.max(0, kind) * 5;

      const h = BASE + relief(wx, wz) * amplitude;
      heights[x + z * SIZE.x] = Math.max(1, Math.round(h * edge));
    }
  }

  for (let z = 0; z < SIZE.z; z++) {
    for (let x = 0; x < SIZE.x; x++) {
      const top = heights[x + z * SIZE.x];
      for (let y = 0; y < top; y++) {
        let id: number = B.SOIL;
        if (y === top - 1) {
          // The painting is speckled -- drips and spatter over the green. Three
          // greens at the surface, weighted, rather than one flat lawn.
          const r = speckle();
          id = r < 0.12 ? B.PALE : r < 0.34 ? B.DEEP : B.GRASS;
        } else if (y > top - 4) {
          id = B.DEEP;
        }
        setBlock(volume, x, y, z, id);
      }
    }
  }

  plantPoppies(volume, heights, seed);

  const heightAt = (worldX: number, worldZ: number): number => {
    const x = Math.floor(worldX / BLOCK + SIZE.x / 2);
    const z = Math.floor(worldZ / BLOCK + SIZE.z / 2);
    if (x < 0 || z < 0 || x >= SIZE.x || z >= SIZE.z) return 0;
    return heights[x + z * SIZE.x] * BLOCK;
  };

  const spawnHeight = heights[Math.floor(SIZE.x / 2) + Math.floor(SIZE.z / 2) * SIZE.x];
  return {
    volume,
    heightAt,
    spawn: new THREE.Vector3(0, spawnHeight * BLOCK, 0)
  };
}

/**
 * The poppies, which are the architecture.
 *
 * Scattered on a jittered grid rather than at random: pure random clumps and
 * leaves bald patches, and a meadow reads wrong both ways. Each gets a stem and
 * a head of petals with a pollen core, and they are tall enough to walk under.
 */
function plantPoppies(volume: Volume, heights: Int16Array, seed: number): void {
  const rng = makeStream(seed, 'poppies');
  const CELL = 9;

  for (let gz = 1; gz < Math.floor(SIZE.z / CELL) - 1; gz++) {
    for (let gx = 1; gx < Math.floor(SIZE.x / CELL) - 1; gx++) {
      if (rng() < 0.22) continue; // a few gaps, so it is not a grid

      const x = gx * CELL + randInt(rng, 1, CELL - 2);
      const z = gz * CELL + randInt(rng, 1, CELL - 2);
      const ground = heights[x + z * SIZE.x];
      if (ground < 2) continue; // not out on the thin edge

      const stem = randInt(rng, 7, 12);
      const headY = ground + stem;
      if (headY + 3 >= SIZE.y) continue;

      for (let y = ground; y < headY; y++) setBlock(volume, x, y, z, B.STEM);

      // A rough disc, thicker at the middle, with the brighter crimson catching
      // the top the way the impasto does in the painting.
      const radius = randInt(rng, 3, 4);
      for (let dz = -radius; dz <= radius; dz++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const dist = Math.hypot(dx, dz);
          if (dist > radius + 0.35) continue;
          const lip = dist > radius - 1 ? 1 : 0;
          const petal = rng() < 0.4 ? B.PETAL_LIT : B.PETAL;
          setBlock(volume, x + dx, headY + lip, z + dz, petal);
          if (dist < radius - 1.2 && rng() < 0.6) {
            setBlock(volume, x + dx, headY + 1 + lip, z + dz, B.PETAL_LIT);
          }
        }
      }
      // The dark seed head.
      for (let dz = -1; dz <= 1; dz++) {
        for (let dx = -1; dx <= 1; dx++) {
          setBlock(volume, x + dx, headY + 2, z + dz, B.POLLEN);
        }
      }
      if (blockAt(volume, x, headY + 2, z) !== 0) {
        setBlock(volume, x, headY + 3, z, B.POLLEN);
      }
    }
  }
}
