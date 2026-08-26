import * as THREE from 'three';
import { createVolume, setBlock, meshVolume, Volume, BLOCK } from './voxel';
import { makeFbm, makeWarp, smoothstep } from './noise';
import { streamSeed } from './rng';
import { DimensionSpec } from './dimensions/specs';

/**
 * Chunked, unbounded terrain.
 *
 * The first dimension was one 56x56 volume meshed in a single pass, which is
 * six seconds to walk across. That is a diorama, not a world. Chunks are what
 * the research note said would be needed the moment a dimension outgrew one
 * draw call, and it has.
 *
 * Three things make chunked generation correct rather than merely chunked, and
 * all three are easy to get subtly wrong:
 *
 * HEIGHT IS A PURE FUNCTION of world position. Not a precomputed array, not
 * anything that knows which chunk it is in. If a column's height depended on
 * its chunk, the seam between two chunks would be a cliff.
 *
 * STRUCTURES ARE PLACED BY WORLD POSITION, from a hash of their own cell
 * coordinates, and every chunk considers structures originating in its
 * neighbours. A poppy whose stem is in one chunk and whose head is in the next
 * has to be generated identically from both sides, or it grows half a flower.
 *
 * MESHING NEEDS A SKIRT. A chunk meshed in isolation emits faces along all four
 * of its own edges, because from inside the chunk the neighbour looks like air.
 * Every chunk is built one block wider on each side and the skirt is used for
 * occlusion only, never drawn.
 */

/** Blocks per chunk edge. 32 keeps each mesh small enough to build in a frame. */
export const CHUNK = 32;

/**
 * A level clearing at the origin of every world, where he arrives.
 *
 * Terrain generated with no regard for the arrival put the doorway four units
 * below the spawn on a twelve-unit slope, with poppies growing through it. The
 * pad is folded into the height function rather than stamped on afterwards, so
 * it is still a pure function of world position -- which means the map draws it
 * without being told, and the chunk seams across it agree for free.
 */
export const PAD_RADIUS = 16;

export interface ChunkKey { cx: number; cz: number }

export function chunkKeyOf(worldX: number, worldZ: number): ChunkKey {
  return {
    cx: Math.floor(worldX / BLOCK / CHUNK),
    cz: Math.floor(worldZ / BLOCK / CHUNK)
  };
}

export function keyString(key: ChunkKey): string {
  return `${key.cx},${key.cz}`;
}

/** Everything a dimension's terrain needs, built once per world. */
export interface TerrainField {
  /** Surface height in BLOCKS at a world block coordinate. */
  columnHeight(bx: number, bz: number): number;
  /** Surface height in world UNITS, for the character to stand on. */
  heightAt(x: number, z: number): number;
}

export function makeTerrainField(spec: DimensionSpec): TerrainField {
  const { seed, terrain } = spec;
  const warp = makeWarp(seed, 'terrain:warp', terrain.warpFrequency, terrain.warpStrength);
  const relief = makeFbm(seed, 'terrain:relief', {
    octaves: terrain.octaves,
    frequency: terrain.frequency,
    ridged: terrain.ridged
  });
  // Deliberately far coarser than the relief. Height and character from the
  // same noise makes every hill the same hill.
  const character = makeFbm(seed, 'terrain:character', {
    octaves: 2,
    frequency: terrain.frequency * 0.3
  });

  const columnHeight = (bx: number, bz: number): number => {
    const [wx, wz] = warp(bx, bz);
    const kind = character(wx, wz);
    const amplitude = terrain.amplitude * (0.55 + Math.max(0, kind) * 1.1);
    const raw = terrain.base + relief(wx, wz) * amplitude;

    // Flatten toward the arrival clearing, easing out so it reads as a level
    // place in the landscape rather than a disc cut out of it.
    const flatten = smoothstep(PAD_RADIUS, PAD_RADIUS * 0.55, Math.hypot(bx, bz));
    const h = raw + (terrain.base - raw) * flatten;
    return Math.max(1, Math.round(h));
  };

  return {
    columnHeight,
    heightAt: (x, z) => columnHeight(Math.floor(x / BLOCK), Math.floor(z / BLOCK)) * BLOCK
  };
}

/** Deterministic 0..1 from a pair of world cell coordinates. */
function cellHash(seed: number, bx: number, bz: number, salt: number): number {
  let h = seed ^ Math.imul(bx | 0, 0x27d4eb2d) ^ Math.imul(bz | 0, 0x165667b1) ^ Math.imul(salt, 0x9e3779b9);
  h = Math.imul(h ^ (h >>> 15), h | 1);
  h ^= h + Math.imul(h ^ (h >>> 7), h | 61);
  return ((h ^ (h >>> 14)) >>> 0) / 4294967296;
}

export interface Structure {
  bx: number;
  bz: number;
  height: number;
  radius: number;
}

/**
 * Every structure whose origin lies in the given block range.
 *
 * Placed on a jittered grid rather than at random: pure random clumps in some
 * places and leaves bald patches in others, and a meadow reads wrong both ways.
 */
export function structuresIn(
  spec: DimensionSpec,
  minBx: number, minBz: number, maxBx: number, maxBz: number
): Structure[] {
  const { structure } = spec;
  if (structure.kind === 'none') return [];

  const seed = streamSeed(spec.seed, 'structures');
  const cell = structure.spacing;
  const out: Structure[] = [];

  for (let gz = Math.floor(minBz / cell); gz <= Math.floor(maxBz / cell); gz++) {
    for (let gx = Math.floor(minBx / cell); gx <= Math.floor(maxBx / cell); gx++) {
      if (cellHash(seed, gx, gz, 1) > structure.density) continue;
      const bx = gx * cell + Math.floor(cellHash(seed, gx, gz, 2) * (cell - 2)) + 1;
      const bz = gz * cell + Math.floor(cellHash(seed, gx, gz, 3) * (cell - 2)) + 1;
      if (bx < minBx || bx > maxBx || bz < minBz || bz > maxBz) continue;
      // Nothing grows in the clearing. Four poppies were coming up through the
      // doorway.
      if (Math.hypot(bx, bz) < PAD_RADIUS + structure.maxRadius + 1) continue;
      out.push({
        bx,
        bz,
        height: structure.minHeight +
          Math.floor(cellHash(seed, gx, gz, 4) * (structure.maxHeight - structure.minHeight + 1)),
        radius: structure.minRadius +
          Math.floor(cellHash(seed, gx, gz, 5) * (structure.maxRadius - structure.minRadius + 1))
      });
    }
  }
  return out;
}

export const CHUNK_HEIGHT = 32;

/**
 * Build one chunk's volume. The skirt is one block on every side: generated for
 * occlusion, never rendered, and the reason chunk seams have no faces in them.
 */
export function buildChunk(spec: DimensionSpec, key: ChunkKey, field: TerrainField): Volume {
  const pad = 1;
  const span = CHUNK + pad * 2;
  const volume = createVolume(span, CHUNK_HEIGHT, span);
  const originX = key.cx * CHUNK - pad;
  const originZ = key.cz * CHUNK - pad;
  const B = spec.blocks;

  for (let z = 0; z < span; z++) {
    for (let x = 0; x < span; x++) {
      const top = Math.min(field.columnHeight(originX + x, originZ + z), CHUNK_HEIGHT - 1);
      for (let y = 0; y < top; y++) {
        let id = B.deep;
        if (y === top - 1) {
          // Speckle the surface. The paintings are not flat colour and neither
          // is a meadow.
          const r = cellHash(spec.seed, originX + x, originZ + z, 7);
          id = r < 0.14 ? B.pale : r < 0.36 ? B.deep : B.surface;
        } else if (y > top - 4) {
          id = B.deep;
        }
        setBlock(volume, x, y, z, id);
      }
    }
  }

  // Structures may originate outside this chunk and reach into it.
  const reach = spec.structure.maxRadius + 1;
  for (const s of structuresIn(
    spec,
    originX - reach, originZ - reach,
    originX + span + reach, originZ + span + reach
  )) {
    plantStructure(spec, volume, s, originX, originZ, field);
  }

  return volume;
}

function plantStructure(
  spec: DimensionSpec, volume: Volume, s: Structure,
  originX: number, originZ: number, field: TerrainField
): void {
  const B = spec.blocks;
  const ground = field.columnHeight(s.bx, s.bz);
  if (ground < 2) return;
  const headY = ground + s.height;
  if (headY + 3 >= CHUNK_HEIGHT) return;

  const lx = s.bx - originX;
  const lz = s.bz - originZ;

  for (let y = ground; y < headY; y++) setBlock(volume, lx, y, lz, B.stem);

  if (spec.structure.kind === 'pillar') {
    for (let y = headY; y < headY + 2; y++) setBlock(volume, lx, y, lz, B.accent);
    return;
  }

  for (let dz = -s.radius; dz <= s.radius; dz++) {
    for (let dx = -s.radius; dx <= s.radius; dx++) {
      const dist = Math.hypot(dx, dz);
      if (dist > s.radius + 0.35) continue;
      const lip = dist > s.radius - 1 ? 1 : 0;
      const bright = cellHash(spec.seed, s.bx + dx, s.bz + dz, 8) < 0.4;
      setBlock(volume, lx + dx, headY + lip, lz + dz, bright ? B.accentLit : B.accent);
      if (dist < s.radius - 1.2 && cellHash(spec.seed, s.bx + dx, s.bz + dz, 9) < 0.6) {
        setBlock(volume, lx + dx, headY + 1 + lip, lz + dz, B.accentLit);
      }
    }
  }
  for (let dz = -1; dz <= 1; dz++) {
    for (let dx = -1; dx <= 1; dx++) {
      setBlock(volume, lx + dx, headY + 2, lz + dz, B.core);
    }
  }
}

/** Mesh a chunk, discarding the skirt so seams carry no faces. */
export function meshChunk(spec: DimensionSpec, volume: Volume): THREE.BufferGeometry {
  const geometry = meshVolume(volume, spec.colours, { trim: 1 });
  return geometry;
}
