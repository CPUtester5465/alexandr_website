import * as THREE from 'three';
import { CHUNK, PAD_RADIUS, ChunkKey, structuresIn } from './chunk';
import { BLOCK } from './voxel';
import { makeFbm, makeWarp, smoothstep } from './noise';
import { streamSeed } from './rng';
import { DimensionSpec } from './dimensions/specs';

/**
 * The smooth path: the same world, without the cubes.
 *
 * This is the painterly study. Everything here reads the SAME noise streams as
 * the voxel field in chunk.ts -- same seed, same warp, same relief, same
 * character -- so the hills are the same hills and the map stays true. The only
 * difference is that nothing is rounded: the surface is the continuous function
 * the voxels were quantising all along.
 *
 * Three contracts carried over from the voxel mesher, because they are what
 * makes chunked generation correct rather than merely chunked:
 *
 * HEIGHT IS A PURE FUNCTION of world position. A vertex on a chunk edge is
 * computed from world coordinates, so the neighbouring chunk computes the
 * identical float and the seam has no crack in it.
 *
 * NORMALS COME FROM THE FIELD, not from computeVertexNormals. Averaging face
 * normals inside one chunk gives edge vertices half their neighbourhood and
 * paints a visible crease down every seam. Central differences on the height
 * field see both sides regardless of which chunk asks.
 *
 * EVERYTHING DECORATIVE IS SEEDED by world cell hash, the same discipline as
 * structures: no Math.random, one stream per subsystem.
 */

/** Pre-darkening so scene lights (ambient 0.6 + directional 0.8 + hemisphere)
 *  land vertex colours near their true palette value instead of clamping. */
export const LIGHT_COMP = 0.74;

/** How far the skirt hangs below a chunk edge, in world units. It hides the
 *  open cross-section of the world while a neighbour is still streaming in. */
const SKIRT_DROP = 14;

export interface SmoothField {
  /** Continuous surface height in BLOCKS at a (fractional) block coordinate. */
  heightBlocks(bx: number, bz: number): number;
  /** Continuous surface height in world UNITS, for the character to stand on. */
  heightAt(x: number, z: number): number;
}

/**
 * The continuous twin of makeTerrainField. Identical pipeline, identical
 * stream names, no Math.round and no Math.max snap-to-integer -- and a soft
 * terrace instead of a hard one, so terraced worlds keep their steps without
 * keeping their right angles.
 */
export function makeSmoothField(spec: DimensionSpec): SmoothField {
  const { seed, terrain } = spec;
  const warp = makeWarp(seed, 'terrain:warp', terrain.warpFrequency, terrain.warpStrength);
  const relief = makeFbm(seed, 'terrain:relief', {
    octaves: terrain.octaves,
    frequency: terrain.frequency,
    ridged: terrain.ridged
  });
  const character = makeFbm(seed, 'terrain:character', {
    octaves: 2,
    frequency: terrain.frequency * 0.3
  });

  const heightBlocks = (bx: number, bz: number): number => {
    const [wx, wz] = warp(bx, bz);
    const kind = character(wx, wz);
    const amplitude = terrain.amplitude * (0.55 + Math.max(0, kind) * 1.1);
    const raw = terrain.base + relief(wx, wz) * amplitude;
    const flatten = smoothstep(PAD_RADIUS, PAD_RADIUS * 0.55, Math.hypot(bx, bz));
    let h = raw + (terrain.base - raw) * flatten;
    if (terrain.terrace > 0) {
      const steps = h / terrain.terrace;
      const i = Math.floor(steps);
      h = (i + smoothstep(0.3, 0.7, steps - i)) * terrain.terrace;
    }
    return Math.max(1, h);
  };

  return {
    heightBlocks,
    heightAt: (x, z) => heightBlocks(x / BLOCK, z / BLOCK) * BLOCK
  };
}

/** Deterministic 0..1 from world cell coordinates. Same recipe as chunk.ts. */
export function cellHash01(seed: number, bx: number, bz: number, salt: number): number {
  let h = seed ^ Math.imul(bx | 0, 0x27d4eb2d) ^ Math.imul(bz | 0, 0x165667b1) ^ Math.imul(salt, 0x9e3779b9);
  h = Math.imul(h ^ (h >>> 15), h | 1);
  h ^= h + Math.imul(h ^ (h >>> 7), h | 61);
  return ((h ^ (h >>> 14)) >>> 0) / 4294967296;
}

function roleColour(spec: DimensionSpec, role: keyof DimensionSpec['blocks']): THREE.Color {
  return spec.colours[spec.blocks[role]] ?? new THREE.Color(0xff00ff);
}

/**
 * Mesh one chunk of the smooth field: a (CHUNK+1)^2 vertex grid displaced by
 * the height function, coloured from the palette by height and slope, with a
 * soft baked AO term from the field's own curvature.
 *
 * Grass greens on the flats, the deep green on slopes, the pale green at
 * crests and in wandering meadow patches -- all of it interpolation between
 * sampled palette entries, never a new hue.
 */
export function meshSmoothChunk(
  spec: DimensionSpec,
  key: ChunkKey,
  field: SmoothField
): THREE.BufferGeometry {
  const n = CHUNK + 1;              // vertices per side
  const m = n + 2;                  // plus a one-sample margin for derivatives
  const originX = key.cx * CHUNK;
  const originZ = key.cz * CHUNK;

  // Sample once into a grid; derivatives read the grid so an edge vertex and
  // its twin in the next chunk see the exact same neighbourhood.
  const H = new Float64Array(m * m);
  for (let z = 0; z < m; z++) {
    for (let x = 0; x < m; x++) {
      H[x + m * z] = field.heightBlocks(originX + x - 1, originZ + z - 1);
    }
  }

  const surface = roleColour(spec, 'surface');
  const deep = roleColour(spec, 'deep');
  const pale = roleColour(spec, 'pale');

  // Wandering patches of the lighter green, far coarser than the relief, so
  // the meadow reads painted rather than filled.
  const patches = makeFbm(spec.seed, 'smooth:patches', { octaves: 2, frequency: 0.03 });
  const speckSeed = streamSeed(spec.seed, 'smooth:speckle');

  const crest0 = spec.terrain.base + 2.0;
  const crest1 = spec.terrain.base + spec.terrain.amplitude * 1.35 + 2.0;

  const positions = new Float32Array(n * n * 3);
  const normals = new Float32Array(n * n * 3);
  const colors = new Float32Array(n * n * 3);
  const c = new THREE.Color();

  for (let z = 0; z < n; z++) {
    for (let x = 0; x < n; x++) {
      const gi = (x + 1) + m * (z + 1);
      const h = H[gi];
      const gx = (H[gi + 1] - H[gi - 1]) * 0.5;
      const gz = (H[gi + m] - H[gi - m]) * 0.5;
      const lap = H[gi + 1] + H[gi - 1] + H[gi + m] + H[gi - m] - 4 * h;

      const vi = (x + n * z) * 3;
      positions[vi] = x * BLOCK;
      positions[vi + 1] = h * BLOCK;
      positions[vi + 2] = z * BLOCK;

      // World x and y are both scaled by BLOCK, so the block-space gradient IS
      // the world-space gradient and the normal needs no further scaling.
      const inv = 1 / Math.hypot(gx, 1, gz);
      normals[vi] = -gx * inv;
      normals[vi + 1] = inv;
      normals[vi + 2] = -gz * inv;

      const bx = originX + x;
      const bz = originZ + z;
      const slope = Math.hypot(gx, gz);
      const tSlope = smoothstep(0.35, 1.05, slope);
      const tCrest = smoothstep(crest0, crest1, h);
      const patch = 0.5 + 0.5 * patches(bx, bz);
      const speck = cellHash01(speckSeed, bx, bz, 1) - 0.5;

      c.copy(surface).lerp(deep, tSlope * 0.85);
      c.lerp(pale, tCrest * 0.55 + patch * 0.40 * (1 - tSlope));
      if (speck > 0) c.lerp(pale, speck * 0.22);
      else c.lerp(deep, -speck * 0.26);

      // Baked shading: hollows darken (positive Laplacian means the ground
      // around this vertex is higher), slopes darken slightly.
      let shade = 1 - 0.22 * Math.min(1, Math.max(0, lap * 0.9));
      shade *= 1 - 0.12 * tSlope;
      shade *= LIGHT_COMP;

      colors[vi] = c.r * shade;
      colors[vi + 1] = c.g * shade;
      colors[vi + 2] = c.b * shade;
    }
  }

  const quadCountTerrain = CHUNK * CHUNK;
  const skirtQuadCount = CHUNK * 4;
  const indices = new Uint32Array((quadCountTerrain + skirtQuadCount) * 6);
  let ii = 0;
  for (let z = 0; z < CHUNK; z++) {
    for (let x = 0; x < CHUNK; x++) {
      const a = x + n * z;
      const b = a + 1;
      const d = a + n;
      const e = d + 1;
      // Alternate the split by world parity: a uniform diagonal direction
      // reads as combed corduroy under low light.
      if (((originX + x) + (originZ + z)) % 2 === 0) {
        indices[ii++] = a; indices[ii++] = e; indices[ii++] = b;
        indices[ii++] = a; indices[ii++] = d; indices[ii++] = e;
      } else {
        indices[ii++] = a; indices[ii++] = d; indices[ii++] = b;
        indices[ii++] = b; indices[ii++] = d; indices[ii++] = e;
      }
    }
  }

  // The skirt: every edge vertex gets a twin dropped straight down, and the
  // edge is closed with quads. Invisible once the neighbour chunk loads (the
  // shared edge is watertight), and while it streams in you see dark ground
  // instead of through the world.
  const edge: number[] = [];
  for (let x = 0; x < n; x++) edge.push(x);                        // north, z=0
  for (let z = 0; z < n; z++) edge.push(z * n + (n - 1));          // east
  for (let x = n - 1; x >= 0; x--) edge.push((n - 1) * n + x);     // south
  for (let z = n - 1; z >= 0; z--) edge.push(z * n);               // west

  const skirtStart = n * n;
  const skirtCount = edge.length;
  const P2 = new Float32Array(positions.length + skirtCount * 3);
  const N2 = new Float32Array(normals.length + skirtCount * 3);
  const C2 = new Float32Array(colors.length + skirtCount * 3);
  P2.set(positions); N2.set(normals); C2.set(colors);

  for (let k = 0; k < skirtCount; k++) {
    const src = edge[k] * 3;
    const dst = (skirtStart + k) * 3;
    P2[dst] = positions[src];
    P2[dst + 1] = positions[src + 1] - SKIRT_DROP;
    P2[dst + 2] = positions[src + 2];
    N2[dst] = 0; N2[dst + 1] = 1; N2[dst + 2] = 0;
    // The deep colour, darkened: soil in shadow.
    C2[dst] = deep.r * 0.35 * LIGHT_COMP;
    C2[dst + 1] = deep.g * 0.35 * LIGHT_COMP;
    C2[dst + 2] = deep.b * 0.35 * LIGHT_COMP;
  }

  // One quad per edge segment, skipping the corner joins between sides.
  for (let side = 0; side < 4; side++) {
    for (let k = 0; k < CHUNK; k++) {
      const e0 = side * n + k;
      const e1 = e0 + 1;
      const top0 = edge[e0];
      const top1 = edge[e1];
      const bot0 = skirtStart + e0;
      const bot1 = skirtStart + e1;
      indices[ii++] = top0; indices[ii++] = bot0; indices[ii++] = top1;
      indices[ii++] = top1; indices[ii++] = bot0; indices[ii++] = bot1;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(P2, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(N2, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(C2, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeBoundingSphere();
  return geometry;
}

// ---------------------------------------------------------------------------
// Grass
// ---------------------------------------------------------------------------

/** Blades per block cell. A chunk is 32x32 cells, so this times 1024 per chunk. */
export const GRASS_PER_CELL = 5;
export const GRASS_PER_CHUNK = GRASS_PER_CELL * CHUNK * CHUNK;

/** Floats per blade in the packed layout: x, y, z, height, yaw, colourMix. */
export const GRASS_STRIDE = 6;

/**
 * Every grass blade in a chunk, deterministically, as a packed array.
 *
 * Same discipline as structuresIn: position comes from a hash of the world
 * cell, so the same chunk grows the same grass on every visit and every
 * device. Steep ground and the height cap thin the count, so the array is
 * returned with `count` blades filled and the caller zeroes the rest.
 */
export function grassForChunk(
  spec: DimensionSpec,
  key: ChunkKey,
  field: SmoothField
): { data: Float32Array; count: number } {
  const seed = streamSeed(spec.seed, 'grass');
  const originX = key.cx * CHUNK;
  const originZ = key.cz * CHUNK;
  const data = new Float32Array(GRASS_PER_CHUNK * GRASS_STRIDE);
  let count = 0;

  for (let z = 0; z < CHUNK; z++) {
    for (let x = 0; x < CHUNK; x++) {
      const bx = originX + x;
      const bz = originZ + z;

      // One slope probe per cell, not per blade.
      const e = 0.6;
      const hc = field.heightBlocks(bx + 0.5, bz + 0.5);
      const sx = (field.heightBlocks(bx + 0.5 + e, bz + 0.5) - hc) / e;
      const sz = (field.heightBlocks(bx + 0.5, bz + 0.5 + e) - hc) / e;
      if (Math.hypot(sx, sz) > 1.15) continue;   // too steep for grass

      for (let i = 0; i < GRASS_PER_CELL; i++) {
        const ox = cellHash01(seed, bx, bz, i * 4 + 1);
        const oz = cellHash01(seed, bx, bz, i * 4 + 2);
        const fx = bx + ox;
        const fz = bz + oz;
        const o = count * GRASS_STRIDE;
        data[o] = fx * BLOCK;
        data[o + 1] = field.heightBlocks(fx, fz) * BLOCK;
        data[o + 2] = fz * BLOCK;
        data[o + 3] = 0.75 + cellHash01(seed, bx, bz, i * 4 + 3) * 0.65;  // height scale
        data[o + 4] = cellHash01(seed, bx, bz, i * 4 + 4) * Math.PI * 2;  // yaw
        data[o + 5] = cellHash01(seed, bx, bz, i * 4 + 5);                // colour mix
        count++;
      }
    }
  }
  return { data, count };
}

// ---------------------------------------------------------------------------
// Poppies
// ---------------------------------------------------------------------------

export interface PoppyInstance {
  /** World units. y is the ground under the stem base. */
  x: number; y: number; z: number;
  /** Stem length in world units. */
  stem: number;
  /** Petal cup radius in world units. */
  head: number;
  /** Which way the stem leans, radians. */
  yaw: number;
  /** How far it leans off vertical, radians. */
  tilt: number;
  /** 0..1, interpolates the petal colour between the two sampled reds. */
  petalMix: number;
}

/**
 * The poppies, from the SAME structuresIn() sites the voxel path plants its
 * flowers at -- so the map, the clearing exclusion and the determinism tests
 * all keep holding without knowing which mesher is running.
 */
export function poppiesForArea(
  spec: DimensionSpec,
  minBx: number, minBz: number, maxBx: number, maxBz: number,
  field: SmoothField
): PoppyInstance[] {
  const dress = streamSeed(spec.seed, 'poppy:dress');
  return structuresIn(spec, minBx, minBz, maxBx, maxBz).map((s) => ({
    x: s.bx * BLOCK,
    y: field.heightBlocks(s.bx, s.bz) * BLOCK,
    z: s.bz * BLOCK,
    stem: s.height * BLOCK,
    head: s.radius * BLOCK * 0.62,
    yaw: cellHash01(dress, s.bx, s.bz, 1) * Math.PI * 2,
    tilt: 0.08 + cellHash01(dress, s.bx, s.bz, 2) * 0.22,
    petalMix: cellHash01(dress, s.bx, s.bz, 3)
  }));
}
