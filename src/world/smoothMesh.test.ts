import { describe, it, expect } from 'vitest';
import {
  makeSmoothField, meshSmoothChunk, grassForChunk, poppiesForArea,
  GRASS_PER_CHUNK, GRASS_STRIDE
} from './smoothMesh';
import { makeTerrainField, structuresIn, CHUNK, PAD_RADIUS } from './chunk';
import { BLOCK } from './voxel';
import { specBySlug } from './dimensions/specs';

/**
 * The smooth mesher has the same one way to be wrong that matters as the voxel
 * one, and it is the same way: the seams. A vertex on a chunk edge and its
 * twin in the neighbouring chunk must be computed to the identical float --
 * position, normal and colour -- or every chunk boundary is a visible crease.
 */

const poppy = specBySlug('poppy')!;
const field = makeSmoothField(poppy);

/** Vertices per grid side. */
const N = CHUNK + 1;

function attr(geometry: ReturnType<typeof meshSmoothChunk>, name: string): Float32Array {
  return geometry.getAttribute(name).array as Float32Array;
}

describe('smooth chunk seams', () => {
  it('agrees with its neighbour along the whole shared edge', () => {
    const left = meshSmoothChunk(poppy, { cx: 0, cz: 0 }, field);
    const right = meshSmoothChunk(poppy, { cx: 1, cz: 0 }, field);

    const lp = attr(left, 'position'); const rp = attr(right, 'position');
    const ln = attr(left, 'normal'); const rn = attr(right, 'normal');
    const lc = attr(left, 'color'); const rc = attr(right, 'color');

    let compared = 0;
    for (let z = 0; z < N; z++) {
      const li = (z * N + (N - 1)) * 3;   // left chunk's east edge
      const ri = (z * N) * 3;             // right chunk's west edge
      // Height, normal and colour must be bit-identical, not merely close:
      // both sides evaluate the same pure function at the same world coords.
      expect(lp[li + 1]).toBe(rp[ri + 1]);
      for (let k = 0; k < 3; k++) {
        expect(ln[li + k]).toBe(rn[ri + k]);
        expect(lc[li + k]).toBe(rc[ri + k]);
      }
      compared++;
    }
    expect(compared).toBe(N);
  });

  it('agrees on the other axis too', () => {
    const near = meshSmoothChunk(poppy, { cx: 0, cz: 0 }, field);
    const far = meshSmoothChunk(poppy, { cx: 0, cz: 1 }, field);
    const np = attr(near, 'position'); const fp = attr(far, 'position');
    const nn = attr(near, 'normal'); const fn = attr(far, 'normal');
    const nc = attr(near, 'color'); const fc = attr(far, 'color');

    for (let x = 0; x < N; x++) {
      const ni = ((N - 1) * N + x) * 3;   // near chunk's south edge
      const fi = x * 3;                   // far chunk's north edge
      expect(np[ni + 1]).toBe(fp[fi + 1]);
      for (let k = 0; k < 3; k++) {
        expect(nn[ni + k]).toBe(fn[fi + k]);
        expect(nc[ni + k]).toBe(fc[fi + k]);
      }
    }
  });

  it('builds the same chunk the same way every time', () => {
    const a = meshSmoothChunk(poppy, { cx: 3, cz: -2 }, field);
    const b = meshSmoothChunk(poppy, { cx: 3, cz: -2 }, field);
    expect(Array.from(attr(a, 'position'))).toEqual(Array.from(attr(b, 'position')));
    expect(Array.from(attr(a, 'color'))).toEqual(Array.from(attr(b, 'color')));
  });

  it('emits finite unit normals that point up out of the ground', () => {
    const geometry = meshSmoothChunk(poppy, { cx: -1, cz: 2 }, field);
    const normals = attr(geometry, 'normal');
    for (let i = 0; i < normals.length; i += 3) {
      const len = Math.hypot(normals[i], normals[i + 1], normals[i + 2]);
      expect(Number.isFinite(len)).toBe(true);
      expect(len).toBeGreaterThan(0.99);
      expect(len).toBeLessThan(1.01);
      expect(normals[i + 1]).toBeGreaterThan(0);
    }
  });

  it('stays inside the per-chunk triangle budget', () => {
    const geometry = meshSmoothChunk(poppy, { cx: 0, cz: 0 }, field);
    const triangles = geometry.getIndex()!.count / 3;
    // 32x32 quads plus the skirt: far below what one draw call minds.
    expect(triangles).toBeLessThanOrEqual((CHUNK * CHUNK + CHUNK * 4) * 2);
  });
});

describe('the smooth field against the voxel field', () => {
  it('is the same landscape the voxels were quantising', () => {
    // The map and the seventeen voxel worlds read the rounded field; the
    // smooth path must stand on the same hills or fast travel and the map lie.
    const voxel = makeTerrainField(poppy);
    let worst = 0;
    for (let bz = -48; bz <= 48; bz += 3) {
      for (let bx = -48; bx <= 48; bx += 3) {
        const d = Math.abs(field.heightBlocks(bx, bz) - voxel.columnHeight(bx, bz));
        worst = Math.max(worst, d);
      }
    }
    // Rounding plus the max(1,...) clamp can differ by at most about a block.
    expect(worst).toBeLessThanOrEqual(1.01);
  });

  it('keeps the arrival clearing level', () => {
    let min = Infinity;
    let max = -Infinity;
    for (let bz = -6; bz <= 6; bz++) {
      for (let bx = -6; bx <= 6; bx++) {
        const h = field.heightBlocks(bx, bz);
        min = Math.min(min, h);
        max = Math.max(max, h);
      }
    }
    expect(max - min).toBeLessThanOrEqual(1);
  });

  it('is a pure function of world position', () => {
    expect(field.heightAt(137.2, -41.7)).toBe(field.heightAt(137.2, -41.7));
    expect(field.heightBlocks(5.5, 9.25)).toBe(field.heightBlocks(5.5, 9.25));
  });
});

describe('grass', () => {
  it('grows the same grass in the same chunk every time', () => {
    const a = grassForChunk(poppy, { cx: 2, cz: 1 }, field);
    const b = grassForChunk(poppy, { cx: 2, cz: 1 }, field);
    expect(a.count).toBe(b.count);
    expect(Array.from(a.data)).toEqual(Array.from(b.data));
  });

  it('fills a meadow chunk densely but never past capacity', () => {
    const { count } = grassForChunk(poppy, { cx: 1, cz: 1 }, field);
    expect(count).toBeGreaterThan(GRASS_PER_CHUNK * 0.5);
    expect(count).toBeLessThanOrEqual(GRASS_PER_CHUNK);
  });

  it('keeps every blade inside its own chunk, rooted at ground level', () => {
    const key = { cx: -2, cz: 3 };
    const { data, count } = grassForChunk(poppy, key, field);
    for (let i = 0; i < count; i++) {
      const o = i * GRASS_STRIDE;
      const x = data[o]; const y = data[o + 1]; const z = data[o + 2];
      expect(x).toBeGreaterThanOrEqual(key.cx * CHUNK * BLOCK);
      expect(x).toBeLessThanOrEqual((key.cx + 1) * CHUNK * BLOCK);
      expect(z).toBeGreaterThanOrEqual(key.cz * CHUNK * BLOCK);
      expect(z).toBeLessThanOrEqual((key.cz + 1) * CHUNK * BLOCK);
      expect(y).toBeCloseTo(field.heightAt(x, z), 0);
    }
  });
});

describe('poppies', () => {
  it('stands a poppy at every structure site and nowhere else', () => {
    const sites = structuresIn(poppy, -80, -80, 80, 80);
    const flowers = poppiesForArea(poppy, -80, -80, 80, 80, field);
    expect(flowers).toHaveLength(sites.length);
    expect(flowers.length).toBeGreaterThan(20);
    const at = new Set(sites.map((s) => `${s.bx * BLOCK},${s.bz * BLOCK}`));
    for (const f of flowers) expect(at.has(`${f.x},${f.z}`)).toBe(true);
  });

  it('keeps the clearing clear', () => {
    const reach = PAD_RADIUS * 2;
    const inside = poppiesForArea(poppy, -reach, -reach, reach, reach, field)
      .filter((f) => Math.hypot(f.x, f.z) < PAD_RADIUS * BLOCK);
    expect(inside).toHaveLength(0);
  });

  it('dresses the same flower the same way every time', () => {
    const a = poppiesForArea(poppy, -60, -60, 60, 60, field);
    const b = poppiesForArea(poppy, -60, -60, 60, 60, field);
    expect(a).toEqual(b);
  });
});
