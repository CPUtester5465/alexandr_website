import * as THREE from 'three';

/**
 * Voxel volumes, and turning them into something a phone can draw.
 *
 * Two techniques carry this file.
 *
 * GREEDY MESHING merges coplanar faces of the same block into one large quad
 * before anything reaches the GPU. A 56x24x56 island is 75,000 voxels and would
 * be hundreds of thousands of triangles drawn naively; greedy meshing takes it
 * to a few thousand. This is the difference between running and not running.
 *
 * PER-VERTEX AMBIENT OCCLUSION is what Minecraft calls smooth lighting, and it
 * is the single thing that separates a voxel world reading as a toy from
 * reading as a place. Each face corner looks at three neighbours -- two sides
 * and the diagonal -- and darkens where they are solid. It costs nothing at
 * runtime because it is baked into vertex colours here, once.
 *
 * Two details that are easy to get wrong and invisible until they are not:
 *
 *   Faces may only merge when all four of their AO corners match. Merge on
 *   block type alone and the occlusion smears across the join.
 *
 *   A quad's two triangles can be split along either diagonal, and with
 *   unequal corner AO the two choices do not look the same -- you get a visible
 *   seam on every inside corner. The split is chosen per quad from the corner
 *   values.
 *
 * There is no lighting. Everything is baked: AO, plus a fixed per-face-direction
 * shade the way block games have always done it. That means MeshBasicMaterial,
 * which is flat, correct for the style, and the cheapest thing that exists.
 */

/** One block, in world units. The character is 3.68 tall, so 1.84 blocks. */
export const BLOCK = 2.0;

export interface Volume {
  sx: number;
  sy: number;
  sz: number;
  /** Block id per cell, 0 = air. Index = x + sx * (y + sy * z). */
  data: Uint8Array;
}

export function createVolume(sx: number, sy: number, sz: number): Volume {
  return { sx, sy, sz, data: new Uint8Array(sx * sy * sz) };
}

export function idx(v: Volume, x: number, y: number, z: number): number {
  return x + v.sx * (y + v.sy * z);
}

export function blockAt(v: Volume, x: number, y: number, z: number): number {
  if (x < 0 || y < 0 || z < 0 || x >= v.sx || y >= v.sy || z >= v.sz) return 0;
  return v.data[idx(v, x, y, z)];
}

export function setBlock(v: Volume, x: number, y: number, z: number, id: number): void {
  if (x < 0 || y < 0 || z < 0 || x >= v.sx || y >= v.sy || z >= v.sz) return;
  v.data[idx(v, x, y, z)] = id;
}

/** Brightness per AO level. 0 is a tight inside corner, 3 is open sky. */
const AO_SHADE = [0.45, 0.66, 0.84, 1.0];

/** Fixed shade per face direction: +Y, -Y, then the four sides. */
const FACE_SHADE = { top: 1.0, bottom: 0.5, northSouth: 0.86, eastWest: 0.72 };

/**
 * The classic three-neighbour AO rule. Two solid sides fully occlude the corner
 * regardless of the diagonal, which is why the early return exists.
 */
function cornerAo(side1: number, side2: number, corner: number): number {
  if (side1 && side2) return 0;
  return 3 - (side1 + side2 + corner);
}

/**
 * Build a mesh for the whole volume.
 *
 * `colours` is indexed by block id; index 0 is unused because 0 means air.
 */
export interface MeshOptions {
  /**
   * Ignore this many cells of skirt on every horizontal side.
   *
   * A chunk meshed in isolation emits faces along all four of its own edges,
   * because from inside the chunk its neighbour looks like air -- a wall of
   * hidden geometry at every seam, and light leaking through the cracks. So
   * each chunk is generated one block wider on each side and that skirt is used
   * for occlusion only. Faces BETWEEN the skirt and the interior are kept:
   * those are real cliffs. Only faces lying wholly in the skirt are dropped.
   */
  trim?: number;
}

export function meshVolume(
  volume: Volume,
  colours: THREE.Color[],
  options: MeshOptions = {}
): THREE.BufferGeometry {
  const trim = options.trim ?? 0;
  const dims = [volume.sx, volume.sy, volume.sz];
  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];

  const solid = (p: number[]) => (blockAt(volume, p[0], p[1], p[2]) !== 0 ? 1 : 0);

  for (let d = 0; d < 3; d++) {
    const u = (d + 1) % 3;
    const v = (d + 2) % 3;
    const x = [0, 0, 0];
    const q = [0, 0, 0];
    q[d] = 1;

    const mask = new Int32Array(dims[u] * dims[v]);
    const maskAo = new Uint8Array(dims[u] * dims[v] * 4);

    for (x[d] = -1; x[d] < dims[d]; ) {
      // --- build the slice mask -----------------------------------------
      let n = 0;
      for (x[v] = 0; x[v] < dims[v]; x[v]++) {
        for (x[u] = 0; x[u] < dims[u]; x[u]++, n++) {
          const a = x[d] >= 0 ? blockAt(volume, x[0], x[1], x[2]) : 0;
          const b = x[d] < dims[d] - 1
            ? blockAt(volume, x[0] + q[0], x[1] + q[1], x[2] + q[2])
            : 0;

          // A face exists only where solid meets air.
          if ((a !== 0) === (b !== 0)) {
            mask[n] = 0;
            continue;
          }

          // Clip the skirt here, before the merge, rather than clipping quads
          // after it -- a merged run must never straddle the boundary.
          if (trim > 0) {
            const planeOut = d !== 1 && (x[d] + 1 < trim || x[d] + 1 > dims[d] - trim);
            const uOut = u !== 1 && (x[u] < trim || x[u] > dims[u] - trim - 1);
            const vOut = v !== 1 && (x[v] < trim || x[v] > dims[v] - trim - 1);
            if (planeOut || uOut || vOut) {
              mask[n] = 0;
              continue;
            }
          }
          const facingPositive = a !== 0;
          mask[n] = facingPositive ? a : -b;

          // AO is measured on the AIR side of the face.
          const air = [x[0], x[1], x[2]];
          if (facingPositive) {
            air[0] += q[0]; air[1] += q[1]; air[2] += q[2];
          }
          for (let c = 0; c < 4; c++) {
            const du = c === 1 || c === 2 ? 1 : -1;
            const dv = c === 2 || c === 3 ? 1 : -1;
            const s1 = [...air]; s1[u] += du;
            const s2 = [...air]; s2[v] += dv;
            const co = [...air]; co[u] += du; co[v] += dv;
            maskAo[n * 4 + c] = cornerAo(solid(s1), solid(s2), solid(co));
          }
        }
      }

      x[d]++;

      // --- greedily merge it --------------------------------------------
      n = 0;
      for (let j = 0; j < dims[v]; j++) {
        for (let i = 0; i < dims[u]; ) {
          if (mask[n] === 0) { i++; n++; continue; }

          const sameAs = (m: number) => {
            if (mask[m] !== mask[n]) return false;
            for (let c = 0; c < 4; c++) {
              if (maskAo[m * 4 + c] !== maskAo[n * 4 + c]) return false;
            }
            return true;
          };

          let w = 1;
          while (i + w < dims[u] && sameAs(n + w)) w++;

          let h = 1;
          outer: while (j + h < dims[v]) {
            for (let k = 0; k < w; k++) {
              if (!sameAs(n + k + h * dims[u])) break outer;
            }
            h++;
          }

          emitQuad(i, j, w, h);

          for (let l = 0; l < h; l++) {
            for (let k = 0; k < w; k++) mask[n + k + l * dims[u]] = 0;
          }
          i += w;
          n += w;
        }
      }

      // ------------------------------------------------------------------
      function emitQuad(i: number, j: number, w: number, h: number): void {
        const value = mask[n];
        const id = Math.abs(value);
        const facingPositive = value > 0;

        x[u] = i;
        x[v] = j;
        const du = [0, 0, 0]; du[u] = w;
        const dv = [0, 0, 0]; dv[v] = h;

        const corners = [
          [x[0], x[1], x[2]],
          [x[0] + du[0], x[1] + du[1], x[2] + du[2]],
          [x[0] + du[0] + dv[0], x[1] + du[1] + dv[1], x[2] + du[2] + dv[2]],
          [x[0] + dv[0], x[1] + dv[1], x[2] + dv[2]]
        ];

        const normal = [0, 0, 0];
        normal[d] = facingPositive ? 1 : -1;

        const base = colours[id] ?? new THREE.Color(0xff00ff);
        const directional = d === 1
          ? (facingPositive ? FACE_SHADE.top : FACE_SHADE.bottom)
          : (d === 0 ? FACE_SHADE.eastWest : FACE_SHADE.northSouth);

        const ao = [0, 1, 2, 3].map((c) => AO_SHADE[maskAo[n * 4 + c]]);

        // Choose the split so the darker pair shares the diagonal. The other
        // choice leaves a visible crease on every inside corner.
        const flip = ao[0] + ao[2] > ao[1] + ao[3];
        const order = flip
          ? [1, 2, 3, 1, 3, 0]
          : [0, 1, 2, 0, 2, 3];
        const winding = facingPositive ? order : [order[2], order[1], order[0], order[5], order[4], order[3]];

        for (const c of winding) {
          const p = corners[c];
          // Shift so a chunk's own origin is the origin of its mesh.
          positions.push((p[0] - trim) * BLOCK, p[1] * BLOCK, (p[2] - trim) * BLOCK);
          normals.push(normal[0], normal[1], normal[2]);
          const shade = directional * ao[c];
          colors.push(base.r * shade, base.g * shade, base.b * shade);
        }
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

/** Quads emitted, for the budget check. Three vertices per triangle, two per quad. */
export function quadCount(geometry: THREE.BufferGeometry): number {
  return geometry.getAttribute('position').count / 6;
}
