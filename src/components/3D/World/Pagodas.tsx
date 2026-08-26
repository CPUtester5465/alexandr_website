import React, { useMemo } from 'react';
import * as THREE from 'three';
import { DimensionSpec } from '../../../world/dimensions/specs';
import { SmoothField, poppiesForArea, cellHash01 } from '../../../world/smoothMesh';
import { streamSeed } from '../../../world/rng';
import { BLOCK } from '../../../world/voxel';
import { BLOOM_LAYER } from '../PostFX';
import { useChunkWindow } from '../../../hooks/useChunkWindow';
import { CHUNK } from '../../../world/chunk';

/**
 * The pagodas, standing at the SAME structure sites the voxel path used for
 * its bare pillars -- determinism and the map survive the restyle untouched.
 *
 * Each tower is tiers of shrinking dark boxes, every tier capped by a wider
 * thin eave slab, a spire on top, and one banded strip of warm emissive
 * windows partway up -- the painting's tier-two pane band, promoted to law by
 * the lore brief. The windows sit on the bloom layer, so in mist they glow.
 *
 * Three InstancedMeshes total (bodies, eaves, spires) plus one for windows:
 * a hundred towers cost four draw calls.
 */

const TIERS = 5;
const VIEW_BLOCKS = 96;

interface Tower {
  x: number; y: number; z: number;
  height: number; base: number; yaw: number;
  litBand: number;   // which tier carries the banded windows
}

function towersAround(spec: DimensionSpec, field: SmoothField, cx: number, cz: number): Tower[] {
  const dress = streamSeed(spec.seed, 'pagoda:dress');
  return poppiesForArea(
    spec,
    Math.round(cx / BLOCK) - VIEW_BLOCKS, Math.round(cz / BLOCK) - VIEW_BLOCKS,
    Math.round(cx / BLOCK) + VIEW_BLOCKS, Math.round(cz / BLOCK) + VIEW_BLOCKS,
    field
  ).map((site) => ({
    x: site.x,
    y: site.y,
    z: site.z,
    height: site.stem * 1.9 + 8,
    base: 4.2 + site.head * 0.9,
    yaw: site.yaw,
    litBand: 1 + Math.floor(cellHash01(dress, Math.round(site.x), Math.round(site.z), 4) * (TIERS - 2))
  }));
}

/**
 * Static around the arrival clearing and the first ring of wander: pagodas
 * are landmarks, not scenery to stream, and 96 blocks reaches past the fog.
 * The field arrives as a prop from SmoothDimension, same as Grass and Poppies.
 */
const Pagodas: React.FC<{ spec: DimensionSpec; field: SmoothField }> = ({ spec, field }) => {
  // Rebuilds when he crosses a chunk boundary -- a few times a minute at
  // walking pace -- so towers exist wherever he is, not in a bubble at spawn.
  const window = useChunkWindow();
  const towers = useMemo(
    () => towersAround(spec, field, window.cx * CHUNK * BLOCK, window.cz * CHUNK * BLOCK),
    [spec, field, window.cx, window.cz]
  );

  const { bodies, eaves, spires, windows } = useMemo(() => {
    // Lifted off pure ink: at arm's length a tower must still show its form
    // under the ambient, or it reads as an unlit box. The painting's blacks
    // have grey in them too.
    const ink = (spec.colours[spec.blocks.stem] ?? new THREE.Color('#201F20'))
      .clone().multiplyScalar(1.6);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: ink });
    const eaveMaterial = new THREE.MeshLambertMaterial({
      color: ink.clone().multiplyScalar(0.8)
    });
    const windowMaterial = new THREE.MeshBasicMaterial({
      color: spec.colours[spec.blocks.accentLit] ?? new THREE.Color('#C87467')
    });

    const unit = new THREE.BoxGeometry(1, 1, 1);
    const spireGeometry = new THREE.ConeGeometry(0.5, 1, 6);

    const bodies = new THREE.InstancedMesh(unit, bodyMaterial, towers.length * TIERS);
    const eaves = new THREE.InstancedMesh(unit, eaveMaterial, towers.length * TIERS);
    const spires = new THREE.InstancedMesh(spireGeometry, bodyMaterial, towers.length);
    const windows = new THREE.InstancedMesh(unit, windowMaterial, towers.length);

    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);

    towers.forEach((t, i) => {
      q.setFromAxisAngle(up, t.yaw);
      let y = t.y;
      for (let tier = 0; tier < TIERS; tier++) {
        const shrink = 1 - tier / (TIERS + 1);
        const w = t.base * shrink;
        const h = (t.height / TIERS) * (tier === 0 ? 1.25 : 0.95);

        m.compose(new THREE.Vector3(t.x, y + h / 2, t.z), q, new THREE.Vector3(w, h, w));
        bodies.setMatrixAt(i * TIERS + tier, m);

        // The eave: wider, thin, sitting on the tier's shoulders.
        m.compose(
          new THREE.Vector3(t.x, y + h, t.z), q,
          new THREE.Vector3(w * 1.6, 0.5, w * 1.6)
        );
        eaves.setMatrixAt(i * TIERS + tier, m);

        if (tier === t.litBand) {
          // One banded strip of windows, slightly proud of the wall so it
          // cannot z-fight, on the bloom layer so it carries in the mist.
          m.compose(
            new THREE.Vector3(t.x, y + h * 0.55, t.z), q,
            new THREE.Vector3(w * 1.02, h * 0.2, w * 1.02)
          );
          windows.setMatrixAt(i, m);
        }
        y += h;
      }
      m.compose(
        new THREE.Vector3(t.x, y + t.height * 0.16, t.z), q,
        new THREE.Vector3(t.base * 0.5, t.height * 0.32, t.base * 0.5)
      );
      spires.setMatrixAt(i, m);
    });

    bodies.instanceMatrix.needsUpdate = true;
    eaves.instanceMatrix.needsUpdate = true;
    spires.instanceMatrix.needsUpdate = true;
    windows.instanceMatrix.needsUpdate = true;
    windows.layers.enable(BLOOM_LAYER);
    return { bodies, eaves, spires, windows };
  }, [spec, towers]);

  return (
    <group>
      <primitive object={bodies} />
      <primitive object={eaves} />
      <primitive object={spires} />
      <primitive object={windows} />
    </group>
  );
};

export default Pagodas;
