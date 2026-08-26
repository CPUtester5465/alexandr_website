import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DimensionSpec } from '../../../world/dimensions/specs';
import { SmoothField } from '../../../world/smoothMesh';
import { channel, Site } from './PagodaFlora';
import { useChunkWindow } from '../../../hooks/useChunkWindow';
import { CHUNK } from '../../../world/chunk';
import { controlState } from '../../../state/controlState';
import { markDone, isDone } from '../../../state/activityState';
import { BLOOM_LAYER } from '../PostFX';

/**
 * THE MEADOW'S ACTIVITY, from the lore brief: the seed census.
 *
 * Hash-placed seeds drift at knee height across the whole endless meadow --
 * the same channel discipline as everything else, so the same seed is the
 * same seed on every device. Walk through one and it is gathered, for the
 * session, and the counter on the HUD ticks.
 *
 * They sit on the bloom layer: small warm points that read as pollen light in
 * the drizzle, which is the painting's own amber doing the signalling.
 */

const COLLECT_DISTANCE = 2.4;

export const seedSites = (spec: DimensionSpec, field: SmoothField, bx: number, bz: number): Site[] =>
  channel(spec, field, 'activity:seeds', 7, 0.42, bx, bz);

export const seedKey = (s: Site) => `${Math.round(s.x)},${Math.round(s.z)}`;

const Seeds: React.FC<{ spec: DimensionSpec; field: SmoothField }> = ({ spec, field }) => {
  const window = useChunkWindow();
  const centerBx = window.cx * CHUNK;
  const centerBz = window.cz * CHUNK;
  const [, bump] = React.useReducer((n: number) => n + 1, 0);
  const bob = useRef(0);

  const sites = useMemo(
    () => seedSites(spec, field, centerBx, centerBz),
    [spec, field, centerBx, centerBz]
  );

  const mesh = useMemo(() => {
    const warm = spec.colours[spec.blocks.core] ?? new THREE.Color('#AC7036');
    const material = new THREE.MeshBasicMaterial({ color: warm });
    const geometry = new THREE.IcosahedronGeometry(0.32, 0);
    const instanced = new THREE.InstancedMesh(geometry, material, sites.length);
    const m = new THREE.Matrix4();
    sites.forEach((s, i) => {
      const gathered = isDone(spec.slug, seedKey(s));
      m.makeTranslation(s.x, gathered ? -100 : s.y + 1.4, s.z);
      instanced.setMatrixAt(i, m);
    });
    instanced.instanceMatrix.needsUpdate = true;
    instanced.layers.enable(BLOOM_LAYER);
    return instanced;
  }, [spec, sites]);

  useFrame((_, delta) => {
    bob.current += delta;
    let changed = false;
    const m = new THREE.Matrix4();
    sites.forEach((s, i) => {
      const key = seedKey(s);
      if (isDone(spec.slug, key)) return;
      const d = Math.hypot(
        s.x - controlState.playerPosition.x,
        s.z - controlState.playerPosition.z
      );
      if (d < COLLECT_DISTANCE) {
        if (markDone(spec.slug, key)) {
          m.makeTranslation(s.x, -100, s.z);
          mesh.setMatrixAt(i, m);
          changed = true;
        }
      } else if (d < 60) {
        // A slow bob, only near the player -- the far field can hold still.
        m.makeTranslation(s.x, s.y + 1.4 + Math.sin(bob.current * 1.8 + s.s1 * 6.28) * 0.25, s.z);
        mesh.setMatrixAt(i, m);
        changed = true;
      }
    });
    if (changed) {
      mesh.instanceMatrix.needsUpdate = true;
      bump();
    }
  });

  return <primitive object={mesh} />;
};

export default Seeds;
