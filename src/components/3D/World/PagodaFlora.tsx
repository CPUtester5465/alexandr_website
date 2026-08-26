import React, { useMemo } from 'react';
import * as THREE from 'three';
import { DimensionSpec } from '../../../world/dimensions/specs';
import { SmoothField, cellHash01 } from '../../../world/smoothMesh';
import { streamSeed } from '../../../world/rng';
import { BLOCK } from '../../../world/voxel';
import { PAD_RADIUS } from '../../../world/chunk';
import { BLOOM_LAYER } from '../PostFX';

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

interface Site { x: number; y: number; z: number; s1: number; s2: number; s3: number }

/** A jittered-grid channel, same discipline as structuresIn, different salt. */
function channel(
  spec: DimensionSpec, field: SmoothField,
  name: string, spacing: number, density: number
): Site[] {
  const seed = streamSeed(spec.seed, name);
  const out: Site[] = [];
  for (let gz = -Math.floor(VIEW_BLOCKS / spacing); gz <= Math.floor(VIEW_BLOCKS / spacing); gz++) {
    for (let gx = -Math.floor(VIEW_BLOCKS / spacing); gx <= Math.floor(VIEW_BLOCKS / spacing); gx++) {
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

const PagodaFlora: React.FC<{ spec: DimensionSpec; field: SmoothField }> = ({ spec, field }) => {
  const objects = useMemo(() => {
    const boughs = channel(spec, field, 'flora:boughs', 9, 0.62);
    const shrines = channel(spec, field, 'flora:shrines', 21, 0.5);

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
        const size = (2.0 + b.s2 * 2.4) * (1 - c * 0.28);
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
      // Lit or dark by seed -- the brief's own rule. Dark ones scale to nothing.
      const lit = s.s2 < 0.6;
      m.compose(
        new THREE.Vector3(s.x, s.y + 1.2, s.z), q,
        lit ? new THREE.Vector3(0.9, 0.7, 0.9) : new THREE.Vector3(0, 0, 0)
      );
      shrineLights.setMatrixAt(i, m);
    });

    // Mist stones: the third kind of thing in the valley, low grey masses the
    // fog can pool against.
    const stones = channel(spec, field, 'flora:stones', 13, 0.55);
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
  }, [spec, field]);

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
