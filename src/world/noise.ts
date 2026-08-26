import { streamSeed } from './rng';

/**
 * Terrain noise.
 *
 * Value noise rather than simplex: a tenth of the code, no patent folklore, and
 * once it is under fbm and a domain warp the difference is not visible in a
 * blocky world quantised to 2-unit cubes.
 *
 * The shaping is where the quality is, not the noise. Plain fbm gives the
 * endless bland hills that make generated worlds look generated. What fixes it:
 *
 *   domain warp   offset the lookup by another noise field, so the result reads
 *                 as eroded rather than as smooth blobs. Cheapest possible win.
 *   ridged        1 - |n|, which makes crests instead of lumps
 *   a control field sampled much lower than the height, deciding what KIND of
 *                 place this is -- height and character must not come from the
 *                 same noise or every hill is the same hill
 */

function hash2(seed: number, x: number, y: number): number {
  let h = seed ^ Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(y | 0, 0x165667b1);
  h = Math.imul(h ^ (h >>> 15), h | 1);
  h ^= h + Math.imul(h ^ (h >>> 7), h | 61);
  return ((h ^ (h >>> 14)) >>> 0) / 4294967296;
}

/** Quintic smoothstep -- the cubic one leaves visible grid creases. */
function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function makeNoise2(seed: number, stream: string) {
  const s = streamSeed(seed, stream);
  return function noise2(x: number, y: number): number {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = fade(x - xi);
    const yf = fade(y - yi);
    const a = hash2(s, xi, yi);
    const b = hash2(s, xi + 1, yi);
    const c = hash2(s, xi, yi + 1);
    const d = hash2(s, xi + 1, yi + 1);
    const top = a + (b - a) * xf;
    const bottom = c + (d - c) * xf;
    return (top + (bottom - top) * yf) * 2 - 1; // -1..1
  };
}

export interface FbmOptions {
  octaves: number;
  frequency: number;
  /** Amplitude multiplier per octave. */
  gain?: number;
  /** Frequency multiplier per octave. */
  lacunarity?: number;
  /** 1 - |n| per octave, which turns lumps into crests. */
  ridged?: boolean;
}

export function makeFbm(seed: number, stream: string, options: FbmOptions) {
  const noise = makeNoise2(seed, stream);
  const { octaves, frequency, gain = 0.5, lacunarity = 2.0, ridged = false } = options;

  return function fbm(x: number, y: number): number {
    let amplitude = 1;
    let f = frequency;
    let sum = 0;
    let norm = 0;
    for (let o = 0; o < octaves; o++) {
      let n = noise(x * f, y * f);
      if (ridged) n = 1 - Math.abs(n) * 2;
      sum += n * amplitude;
      norm += amplitude;
      amplitude *= gain;
      f *= lacunarity;
    }
    return sum / norm; // -1..1
  };
}

/**
 * Domain warp. Offsets the lookup by a second, coarser noise field.
 *
 * This is the single cheapest thing that stops terrain looking procedural, and
 * it is one extra sample per axis.
 */
export function makeWarp(seed: number, stream: string, frequency: number, strength: number) {
  const nx = makeNoise2(seed, stream + ':x');
  const ny = makeNoise2(seed, stream + ':y');
  return function warp(x: number, y: number): [number, number] {
    return [
      x + nx(x * frequency, y * frequency) * strength,
      y + ny(x * frequency, y * frequency) * strength
    ];
  };
}

/** 0 at edge0, 1 at edge1, smooth between. */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
