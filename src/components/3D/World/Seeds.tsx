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
import { seedChime, seedCelebration, plantSound } from '../../../state/audio';
import { doneCount } from '../../../state/activityState';

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

/** A poppy the visitor grew: where, and how far along. */
interface PlantedPoppy { x: number; z: number; bornAt: number }

const SEEDS_TO_PLANT = 5;

const Seeds: React.FC<{ spec: DimensionSpec; field: SmoothField }> = ({ spec, field }) => {
  const window = useChunkWindow();
  /** Seeds gathered since the last planting -- the spendable balance. */
  const bank = useRef(0);
  const planted = useRef<PlantedPoppy[]>([]);
  const growingRef = useRef<THREE.Group>(null);
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

    // THE PLANTING. Five banked seeds sprout a poppy where he stands: the
    // collect loop gets a visible, personal payoff, and the meadow carries a
    // mark he made. Grown with an ease-out over four seconds.
    if (bank.current >= SEEDS_TO_PLANT) {
      bank.current -= SEEDS_TO_PLANT;
      planted.current.push({
        x: controlState.playerPosition.x + 2.5,
        z: controlState.playerPosition.z,
        bornAt: performance.now()
      });
      plantSound();
      bump();
    }
    if (growingRef.current) {
      growingRef.current.children.forEach((child, i) => {
        const p = planted.current[i];
        if (!p) return;
        const age = (performance.now() - p.bornAt) / 4000;
        const grown = 1 - Math.pow(1 - Math.min(age, 1), 3);
        child.scale.setScalar(Math.max(grown, 0.001));
      });
    }
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
          const n = doneCount(spec.slug);
          // Milestones feel different from steps -- that is the whole point
          // of a milestone.
          if (n % 10 === 0) seedCelebration(); else seedChime(n);
          bank.current += 1;
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

  const petal = spec.colours[spec.blocks.accentLit] ?? new THREE.Color('#B33F3A');
  const stemCol = spec.colours[spec.blocks.deep] ?? new THREE.Color('#476737');
  const coreCol = spec.colours[spec.blocks.core] ?? new THREE.Color('#583A37');

  return (
    <group>
      <primitive object={mesh} />
      {/* His planted poppies: simple, bright, unmistakably placed on purpose. */}
      <group ref={growingRef}>
        {planted.current.map((p) => (
          <group key={p.bornAt} position={[p.x, field.heightAt(p.x, p.z), p.z]}>
            <mesh position={[0, 4.5, 0]}>
              <cylinderGeometry args={[0.16, 0.26, 9]} />
              <meshLambertMaterial color={stemCol} />
            </mesh>
            <mesh position={[0, 9.4, 0]} rotation={[0.35, 0, 0]}>
              <coneGeometry args={[2.6, 1.7, 7, 1, true]} />
              <meshLambertMaterial color={petal} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, 9.1, 0.5]}>
              <sphereGeometry args={[0.55, 8, 8]} />
              <meshLambertMaterial color={coreCol} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
};

export default Seeds;
