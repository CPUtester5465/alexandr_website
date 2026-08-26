import { describe, it, expect } from 'vitest';
import { buildChunk, meshChunk, makeTerrainField, structuresIn, CHUNK, CHUNK_HEIGHT, PAD_RADIUS } from './chunk';
import { blockAt, quadCount, meshVolume } from './voxel';
import { SPECS, specBySlug } from './dimensions/specs';

/**
 * Chunked generation has exactly one way to be wrong that matters, and it is
 * invisible in a screenshot of a single chunk: the seams.
 */

const poppy = specBySlug('poppy')!;
const field = makeTerrainField(poppy);

describe('chunk seams', () => {
  it('agrees with its neighbour along the whole shared edge', () => {
    // The skirt of one chunk must be identical to the interior edge of the
    // next. If it is not, the mesher sees air where there is ground and cuts a
    // wall of faces into the join.
    const left = buildChunk(poppy, { cx: 0, cz: 0 }, field);
    const right = buildChunk(poppy, { cx: 1, cz: 0 }, field);

    let compared = 0;
    for (let z = 1; z <= CHUNK; z++) {
      for (let y = 0; y < CHUNK_HEIGHT; y++) {
        // Left's right-hand skirt cell === right's first interior cell.
        const inSkirt = blockAt(left, CHUNK + 1, y, z);
        const inInterior = blockAt(right, 1, y, z);
        expect(inSkirt).toBe(inInterior);
        compared++;
      }
    }
    expect(compared).toBeGreaterThan(1000);
  });

  it('agrees on the other axis too', () => {
    const near = buildChunk(poppy, { cx: 0, cz: 0 }, field);
    const far = buildChunk(poppy, { cx: 0, cz: 1 }, field);
    for (let x = 1; x <= CHUNK; x++) {
      for (let y = 0; y < CHUNK_HEIGHT; y++) {
        expect(blockAt(near, x, y, CHUNK + 1)).toBe(blockAt(far, x, y, 1));
      }
    }
  });

  it('builds the same chunk the same way every time', () => {
    const a = buildChunk(poppy, { cx: 3, cz: -2 }, field);
    const b = buildChunk(poppy, { cx: 3, cz: -2 }, field);
    expect(Array.from(a.data)).toEqual(Array.from(b.data));
  });
});

describe('structures across chunks', () => {
  it('places a structure from the same world position whichever chunk asks', () => {
    // A poppy whose stem is in one chunk and whose head is in the next has to
    // come out identical from both sides, or it grows half a flower.
    const wide = structuresIn(poppy, -40, -40, 40, 40);
    const left = structuresIn(poppy, -40, -40, 0, 40);
    const right = structuresIn(poppy, 0, -40, 40, 40);
    const key = (s: { bx: number; bz: number; height: number; radius: number }) =>
      `${s.bx},${s.bz},${s.height},${s.radius}`;
    const union = new Set([...left.map(key), ...right.map(key)]);
    for (const s of wide) expect(union.has(key(s))).toBe(true);
  });

  it('grows structures at all', () => {
    expect(structuresIn(poppy, -60, -60, 60, 60).length).toBeGreaterThan(20);
  });
});

describe('chunk meshing', () => {
  it('emits no faces along its own edges', () => {
    // Without the skirt trim, a chunk walls itself in and roughly doubles its
    // own quad count for geometry nobody can ever see.
    const volume = buildChunk(poppy, { cx: 0, cz: 0 }, field);
    const trimmed = quadCount(meshChunk(poppy, volume));
    // Same volume, skirt included: the difference is the hidden wall.
    const untrimmed = quadCount(meshVolume(volume, poppy.colours));
    expect(trimmed).toBeLessThan(untrimmed);
  });

  it('stays inside the per-chunk budget', () => {
    const volume = buildChunk(poppy, { cx: 0, cz: 0 }, field);
    expect(quadCount(meshChunk(poppy, volume))).toBeLessThan(6000);
  });
});

describe('the arrival clearing', () => {
  it('is level, in every world', () => {
    // He arrives at the origin with the doorway eleven units behind him. With
    // raw terrain that put the door four units below him on a twelve-unit
    // slope, half buried. A doorway you cannot reach is a world you cannot
    // leave.
    for (const spec of SPECS) {
      const f = makeTerrainField(spec);
      let min = Infinity;
      let max = -Infinity;
      for (let bz = -6; bz <= 6; bz++) {
        for (let bx = -6; bx <= 6; bx++) {
          const h = f.columnHeight(bx, bz);
          min = Math.min(min, h);
          max = Math.max(max, h);
        }
      }
      expect(max - min, `${spec.slug} arrival is not level`).toBeLessThanOrEqual(1);
    }
  });

  it('eases out rather than cutting a disc', () => {
    // Well outside the pad the terrain must be its own shape again, or every
    // world has a crater at the origin.
    const f = makeTerrainField(specBySlug('poppy')!);
    let varied = 0;
    for (let bx = PAD_RADIUS + 6; bx < PAD_RADIUS + 40; bx++) {
      if (f.columnHeight(bx, 0) !== f.columnHeight(0, 0)) varied++;
    }
    expect(varied).toBeGreaterThan(10);
  });

  it('grows nothing in it, in any world', () => {
    // The clearing is a circle, so query a square and filter -- a structure in
    // the corner of the bounding box is legitimately outside it.
    for (const spec of SPECS) {
      const reach = PAD_RADIUS * 2;
      const inside = structuresIn(spec, -reach, -reach, reach, reach)
        .filter((s) => Math.hypot(s.bx, s.bz) < PAD_RADIUS);
      expect(inside, `${spec.slug} has something in the clearing`).toHaveLength(0);
    }
  });
});

describe('all fourteen worlds', () => {
  it('every door has a spec behind it', () => {
    expect(SPECS).toHaveLength(14);
  });

  it('each one generates ground you can stand on', () => {
    for (const spec of SPECS) {
      const f = makeTerrainField(spec);
      const h = f.heightAt(0, 0);
      expect(h).toBeGreaterThan(0);
      expect(Number.isFinite(h)).toBe(true);
    }
  });

  it('gives each world a palette of its own', () => {
    const skies = new Set(SPECS.map((s) => s.sky));
    expect(skies.size).toBeGreaterThan(10);
  });

  it('seeds every world differently', () => {
    expect(new Set(SPECS.map((s) => s.seed)).size).toBe(14);
  });
});
