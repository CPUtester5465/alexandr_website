/**
 * Seeded randomness.
 *
 * Law 4: no Math.random anywhere in generation. A world is an integer, the same
 * integer is the same world on every device and every visit, and a world worth
 * keeping can be kept by writing down one number.
 *
 * Streams matter as much as the seed. Each subsystem draws from its own, keyed
 * by name, so adding a flower does not reshuffle the hills -- which is what
 * happens the moment two systems share a sequence.
 */

/** mulberry32: small, fast, and good enough for terrain. */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Mix a string into a seed, so streams are named rather than numbered. */
export function streamSeed(seed: number, stream: string): number {
  let h = seed >>> 0;
  for (let i = 0; i < stream.length; i++) {
    h = Math.imul(h ^ stream.charCodeAt(i), 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function makeStream(seed: number, stream: string): () => number {
  return makeRng(streamSeed(seed, stream));
}

/** Integer in [min, max]. */
export function randInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Pick one. */
export function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}
