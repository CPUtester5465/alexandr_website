import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DimensionSpec } from '../../../world/dimensions/specs';
import { SmoothField, cellHash01 } from '../../../world/smoothMesh';
import { streamSeed } from '../../../world/rng';
import { BLOCK } from '../../../world/voxel';
import { PAD_RADIUS } from '../../../world/chunk';
import { BLOOM_LAYER } from '../PostFX';
import { useChunkWindow } from '../../../hooks/useChunkWindow';
import { CHUNK } from '../../../world/chunk';
import { controlState } from '../../../state/controlState';
import { markDone, isDone } from '../../../state/activityState';

/**
 * The valley between the towers, which Tim found empty -- because it was.
 *
 * The lore brief prescribed exactly this and it was never planted: Red Boughs
 * («красная ветвь», where red weather is made) and Wayside Shrines («придорожное
 * святилище», lit or dark by seed). Both go in here as their own placement
 * channels -- independent jittered grids with their own hash salts, denser than
 * the towers, silent about the map (landmarks stay towers-only).
 *
 * Everything is instanced: trunks, bough-canopies, shrine bodies, shrine
 * lights. A whole valley of dressing costs five draw calls.
 */

const VIEW_BLOCKS = 96;

export interface Site { x: number; y: number; z: number; s1: number; s2: number; s3: number }

/**
 * A jittered-grid channel, same discipline as structuresIn, different salt.
 * Pure over world position, so the map and the activity layer can call it for
 * ANY window and agree with the scene exactly.
 */
export function channel(
  spec: DimensionSpec, field: SmoothField,
  name: string, spacing: number, density: number,
  centerBx = 0, centerBz = 0
): Site[] {
  const seed = streamSeed(spec.seed, name);
  const out: Site[] = [];
  const g0x = Math.floor((centerBx - VIEW_BLOCKS) / spacing);
  const g1x = Math.floor((centerBx + VIEW_BLOCKS) / spacing);
  const g0z = Math.floor((centerBz - VIEW_BLOCKS) / spacing);
  const g1z = Math.floor((centerBz + VIEW_BLOCKS) / spacing);
  for (let gz = g0z; gz <= g1z; gz++) {
    for (let gx = g0x; gx <= g1x; gx++) {
      if (cellHash01(seed, gx, gz, 1) > density) continue;
      const bx = gx * spacing + Math.floor(cellHash01(seed, gx, gz, 2) * (spacing - 2)) + 1;
      const bz = gz * spacing + Math.floor(cellHash01(seed, gx, gz, 3) * (spacing - 2)) + 1;
      // The arrival clearing stays clear, like everywhere else.
      if (Math.hypot(bx, bz) < PAD_RADIUS + 2) continue;
      out.push({
        x: bx * BLOCK, y: field.heightBlocks(bx, bz) * BLOCK, z: bz * BLOCK,
        s1: cellHash01(seed, bx, bz, 4),
        s2: cellHash01(seed, bx, bz, 5),
        s3: cellHash01(seed, bx, bz, 6)
      });
    }
  }
  return out;
}

/** The shrine sites for any window -- shared with the map and the HUD. */
export function shrineSites(
  spec: DimensionSpec, field: SmoothField, centerBx: number, centerBz: number
): Site[] {
  return channel(spec, field, 'flora:shrines', 21, 0.5, centerBx, centerBz);
}

/** A shrine's stable identity: its world block position. */
export const shrineKey = (s: Site) => `${Math.round(s.x)},${Math.round(s.z)}`;

/** Dark by seed -- these are the ones that can be woken. */
export const shrineIsDark = (s: Site) => s.s2 >= 0.6;

const PagodaFlora: React.FC<{ spec: DimensionSpec; field: SmoothField }> = ({ spec, field }) => {
  const window = useChunkWindow();
  const centerBx = window.cx * CHUNK;
  const centerBz = window.cz * CHUNK;
  // Session-lit shrines force a rebuild of the light instances.
  const litVersion = useRef(0);
  const [, bump] = React.useReducer((n: number) => n + 1, 0);

  // THE ACTIVITY, from the lore brief: waking dark shrines. Stand at one and
  // its window lights, permanently for the session, and the map remembers.
  useFrame(() => {
    const near = shrineSites(spec, field, centerBx, centerBz);
    for (const s of near) {
      if (!shrineIsDark(s)) continue;
      const key = shrineKey(s);
      if (isDone(spec.slug, key)) continue;
      const d = Math.hypot(
        s.x - controlState.playerPosition.x,
        s.z - controlState.playerPosition.z
      );
      if (d < 3.2) {
        if (markDone(spec.slug, key)) {
          litVersion.current++;
          bump();
        }
      }
    }
  });

  const objects = useMemo(() => {
    // Loosened from 9/0.62 after the far-field shot: at that density the
    // valley reads as a wall, and the brief's word is valley, not forest.
    const boughs = channel(spec, field, 'flora:boughs', 12, 0.48, centerBx, centerBz);
    const shrines = shrineSites(spec, field, centerBx, centerBz);

    const inkTrunk = new THREE.MeshLambertMaterial({
      color: (spec.colours[spec.blocks.stem] ?? new THREE.Color('#201F20'))
        .clone().multiplyScalar(1.5)
    });
    // The crimson of the painting's foliage -- pulled DOWN toward wine, not up
    // toward candy. First pass rendered bright uniform discs, which is the
    // lantern-festival cosiness the lore brief names as trap #3. Two shades so
    // adjacent canopies never match.
    const accent = spec.colours[spec.blocks.accent] ?? new THREE.Color('#99464C');
    const ink0 = spec.colours[spec.blocks.stem] ?? new THREE.Color('#201F20');
    const crimson = new THREE.MeshLambertMaterial({
      color: accent.clone().multiplyScalar(0.72)
    });
    const crimsonDeep = new THREE.MeshLambertMaterial({
      color: accent.clone().lerp(ink0, 0.45)
    });
    const warm = new THREE.MeshBasicMaterial({
      color: spec.colours[spec.blocks.accentLit] ?? new THREE.Color('#C87467')
    });

    const trunkGeometry = new THREE.CylinderGeometry(0.34, 0.7, 1, 5);
    // A squashed, slightly irregular blob reads as a smeared wash from afar.
    const blobGeometry = new THREE.IcosahedronGeometry(1, 1);
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);

    const trunks = new THREE.InstancedMesh(trunkGeometry, inkTrunk, boughs.length);
    const canopies = new THREE.InstancedMesh(blobGeometry, crimson, boughs.length * 2);
    const canopiesDeep = new THREE.InstancedMesh(blobGeometry, crimsonDeep, boughs.length * 2);
    const shrineBodies = new THREE.InstancedMesh(boxGeometry, inkTrunk, shrines.length);
    const shrineRoofs = new THREE.InstancedMesh(boxGeometry, inkTrunk, shrines.length);
    const shrineLights = new THREE.InstancedMesh(boxGeometry, warm, shrines.length);

    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const lean = new THREE.Euler();

    boughs.forEach((b, i) => {
      const height = 5 + b.s1 * 8;
      // Bent hard by the red weather -- the painting's bough sweeps one way,
      // and the whole valley's trees agree with it, each to its own degree.
      const sway = 0.18 + b.s2 * 0.3;
      lean.set(sway, 0.6 + b.s1 * 0.9, 0);
      q.setFromEuler(lean);
      m.compose(new THREE.Vector3(b.x, b.y + height / 2, b.z), q, new THREE.Vector3(1, height, 1));
      trunks.setMatrixAt(i, m);

      // The canopy drifts DOWNWIND of the lean, smeared sideways like a wash --
      // never a ball on a stick. Two bright, two deep, all uneven.
      const driftX = Math.sin(lean.y) * height * sway * 1.2;
      const driftZ = Math.cos(lean.y) * height * sway * 1.2;
      for (let c = 0; c < 2; c++) {
        const along = 0.5 + c * 0.45;
        // Capped: an s2 near 1 was making canopies read as crimson floors.
        const size = Math.min(2.0 + b.s2 * 2.4, 3.4) * (1 - c * 0.28);
        m.compose(
          new THREE.Vector3(
            b.x + driftX * along + (b.s3 - 0.5) * 2.2,
            b.y + height * (0.7 + c * 0.16),
            b.z + driftZ * along + (b.s1 - 0.5) * 2.2
          ),
          q,
          new THREE.Vector3(size * 1.7, size * 0.5, size * 1.1)
        );
        canopies.setMatrixAt(i * 2 + c, m);
        m.compose(
          new THREE.Vector3(
            b.x + driftX * (along + 0.3) + (b.s1 - 0.5) * 2.6,
            b.y + height * (0.62 + c * 0.2),
            b.z + driftZ * (along + 0.3) + (b.s2 - 0.5) * 2.6
          ),
          q,
          new THREE.Vector3(size * 1.2, size * 0.42, size * 1.5)
        );
        canopiesDeep.setMatrixAt(i * 2 + c, m);
      }
    });

    shrines.forEach((s, i) => {
      q.setFromAxisAngle(up, s.s1 * Math.PI * 2);
      m.compose(new THREE.Vector3(s.x, s.y + 1.1, s.z), q, new THREE.Vector3(1.7, 2.2, 1.7));
      shrineBodies.setMatrixAt(i, m);
      m.compose(new THREE.Vector3(s.x, s.y + 2.5, s.z), q, new THREE.Vector3(2.5, 0.4, 2.5));
      shrineRoofs.setMatrixAt(i, m);
      // Lit by seed, or woken by the visitor -- the brief's own rule plus its
      // own activity. A woken shrine stays lit for the session.
      const lit = s.s2 < 0.6 || isDone(spec.slug, shrineKey(s));
      m.compose(
        new THREE.Vector3(s.x, s.y + 1.2, s.z), q,
        lit ? new THREE.Vector3(0.9, 0.7, 0.9) : new THREE.Vector3(0, 0, 0)
      );
      shrineLights.setMatrixAt(i, m);
    });

    // Mist stones: the third kind of thing in the valley, low grey masses the
    // fog can pool against.
    const stones = channel(spec, field, 'flora:stones', 13, 0.55, centerBx, centerBz);
    const stoneMaterial = new THREE.MeshLambertMaterial({
      color: (spec.colours[spec.blocks.surface] ?? new THREE.Color('#737479'))
        .clone().multiplyScalar(0.92)
    });
    const stoneMeshes = new THREE.InstancedMesh(blobGeometry, stoneMaterial, stones.length);
    stones.forEach((st, i) => {
      q.setFromAxisAngle(up, st.s1 * Math.PI * 2);
      const size = 1.2 + st.s2 * 2.2;
      m.compose(
        new THREE.Vector3(st.x, st.y + size * 0.25, st.z), q,
        new THREE.Vector3(size * 1.5, size * 0.55, size)
      );
      stoneMeshes.setMatrixAt(i, m);
    });

    for (const mesh of [trunks, canopies, canopiesDeep, shrineBodies, shrineRoofs, shrineLights, stoneMeshes]) {
      mesh.instanceMatrix.needsUpdate = true;
    }
    shrineLights.layers.enable(BLOOM_LAYER);
    return { trunks, canopies, canopiesDeep, shrineBodies, shrineRoofs, shrineLights, stones: stoneMeshes };
  }, [spec, field, centerBx, centerBz, litVersion.current]);

  return (
    <group>
      <primitive object={objects.trunks} />
      <primitive object={objects.canopies} />
      <primitive object={objects.canopiesDeep} />
      <primitive object={objects.stones} />
      <primitive object={objects.shrineBodies} />
      <primitive object={objects.shrineRoofs} />
      <primitive object={objects.shrineLights} />
    </group>
  );
};

export default PagodaFlora;
