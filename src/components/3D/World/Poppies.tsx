import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CHUNK, chunkKeyOf } from '../../../world/chunk';
import { SmoothField, poppiesForArea, LIGHT_COMP } from '../../../world/smoothMesh';
import { DimensionSpec } from '../../../world/dimensions/specs';
import { controlState } from '../../../state/controlState';
import { BLOOM_LAYER } from '../PostFX';

/**
 * The poppies of the smooth path: a bent stem, a petal cup and a dark core,
 * three InstancedMeshes however many flowers are standing.
 *
 * They grow at the SAME structuresIn() sites the voxel path plants its block
 * flowers at, so the world map, the clearing exclusion and every determinism
 * test keep holding without knowing which mesher is running. The window of
 * standing flowers follows the terrain streamer's 5x5 chunk ring and is
 * rebuilt only when the player crosses into a new chunk.
 */

const WINDOW_RADIUS = 2;            // chunks, matching SmoothChunkedWorld
const CAPACITY = 512;

/** Where the unit stem's tip sits in its local space; the head goes there. */
const STEM_TIP = new THREE.Vector3(0.18, 1, 0);
const STEM_GIRTH = 3.4;             // xz scale: bend and radius in world units

function buildStemGeometry(): THREE.BufferGeometry {
  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.03, 0.6, 0),
    STEM_TIP
  );
  return new THREE.TubeGeometry(curve, 5, 0.085, 5, false);
}

function buildPetalGeometry(): THREE.BufferGeometry {
  // A deep cup, opening upward -- the painting's poppy is a bowl of red, and
  // the silhouette is the whole message at meadow distance.
  const points = [
    new THREE.Vector2(0.08, 0.00),
    new THREE.Vector2(0.55, 0.16),
    new THREE.Vector2(0.88, 0.44),
    new THREE.Vector2(1.00, 0.78),
    new THREE.Vector2(0.94, 0.92)
  ];
  return new THREE.LatheGeometry(points, 9);
}

function buildCoreGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.SphereGeometry(0.30, 7, 5);
  geometry.scale(1, 0.55, 1);
  return geometry;
}

const Poppies: React.FC<{ spec: DimensionSpec; field: SmoothField }> = ({ spec, field }) => {
  const stemRef = useRef<THREE.InstancedMesh>(null);
  const petalRef = useRef<THREE.InstancedMesh>(null);
  const coreRef = useRef<THREE.InstancedMesh>(null);
  const builtFor = useRef<string | null>(null);

  const geometries = useMemo(() => ({
    stem: buildStemGeometry(),
    petal: buildPetalGeometry(),
    core: buildCoreGeometry()
  }), []);

  const materials = useMemo(() => {
    const stemColour = (spec.colours[spec.blocks.stem] ?? new THREE.Color(0x00ff00))
      .clone().multiplyScalar(LIGHT_COMP * 0.9);
    const coreColour = (spec.colours[spec.blocks.accent] ?? new THREE.Color(0x000000))
      .clone().multiplyScalar(LIGHT_COMP * 0.6);
    // The petals carry a little of their own light -- the painting's red is
    // the brightest thing in the field, and it is also what the bloom sees.
    const petalGlow = (spec.colours[spec.blocks.accentLit] ?? new THREE.Color(0xff0000))
      .clone().multiplyScalar(0.38);
    return {
      stem: new THREE.MeshLambertMaterial({ color: stemColour }),
      petal: new THREE.MeshLambertMaterial({ side: THREE.DoubleSide, emissive: petalGlow }),
      core: new THREE.MeshLambertMaterial({ color: coreColour })
    };
  }, [spec]);

  useEffect(() => {
    const petal = petalRef.current;
    if (petal) {
      petal.layers.enable(BLOOM_LAYER);
      petal.instanceColor = new THREE.InstancedBufferAttribute(
        new Float32Array(CAPACITY * 3), 3
      );
    }
    for (const mesh of [stemRef.current, petalRef.current, coreRef.current]) {
      if (mesh) mesh.frustumCulled = false;
    }
    builtFor.current = null;
    return () => {
      geometries.stem.dispose(); geometries.petal.dispose(); geometries.core.dispose();
      materials.stem.dispose(); materials.petal.dispose(); materials.core.dispose();
    };
  }, [spec, geometries, materials]);

  const scratch = useMemo(() => ({
    matrix: new THREE.Matrix4(),
    quat: new THREE.Quaternion(),
    yawQ: new THREE.Quaternion(),
    tiltQ: new THREE.Quaternion(),
    pos: new THREE.Vector3(),
    tip: new THREE.Vector3(),
    scale: new THREE.Vector3(),
    yAxis: new THREE.Vector3(0, 1, 0),
    zAxis: new THREE.Vector3(0, 0, 1),
    colour: new THREE.Color(),
    zero: new THREE.Matrix4().makeScale(0, 0, 0)
  }), []);

  useFrame(() => {
    const stems = stemRef.current;
    const petals = petalRef.current;
    const cores = coreRef.current;
    if (!stems || !petals || !cores || !petals.instanceColor) return;

    const here = chunkKeyOf(controlState.playerPosition.x, controlState.playerPosition.z);
    const stamp = `${here.cx},${here.cz}`;
    if (builtFor.current === stamp) return;
    builtFor.current = stamp;

    const minBx = (here.cx - WINDOW_RADIUS) * CHUNK;
    const minBz = (here.cz - WINDOW_RADIUS) * CHUNK;
    const maxBx = (here.cx + WINDOW_RADIUS + 1) * CHUNK;
    const maxBz = (here.cz + WINDOW_RADIUS + 1) * CHUNK;
    const flowers = poppiesForArea(spec, minBx, minBz, maxBx, maxBz, field);

    const accentLit = spec.colours[spec.blocks.accentLit] ?? new THREE.Color(0xff0000);
    const accent = spec.colours[spec.blocks.accent] ?? accentLit;
    const warm = spec.colours[spec.blocks.core] ?? accentLit;
    const petalColours = petals.instanceColor.array as Float32Array;

    const n = Math.min(flowers.length, CAPACITY);
    for (let i = 0; i < n; i++) {
      const f = flowers[i];
      scratch.yawQ.setFromAxisAngle(scratch.yAxis, f.yaw);
      scratch.tiltQ.setFromAxisAngle(scratch.zAxis, f.tilt);
      scratch.quat.copy(scratch.yawQ).multiply(scratch.tiltQ);

      // Stem: rooted in the ground, bent, leaning.
      scratch.pos.set(f.x, f.y - 0.4, f.z);
      scratch.scale.set(STEM_GIRTH, f.stem, STEM_GIRTH);
      scratch.matrix.compose(scratch.pos, scratch.quat, scratch.scale);
      stems.setMatrixAt(i, scratch.matrix);

      // Head: exactly at the stem's transformed tip.
      scratch.tip.copy(STEM_TIP).multiply(scratch.scale).applyQuaternion(scratch.quat)
        .add(scratch.pos);
      scratch.scale.setScalar(f.head);
      scratch.matrix.compose(scratch.tip, scratch.quat, scratch.scale);
      petals.setMatrixAt(i, scratch.matrix);

      scratch.colour.copy(accentLit);
      if (f.petalMix > 0.5) scratch.colour.lerp(warm, (f.petalMix - 0.5) * 0.7);
      else scratch.colour.lerp(accent, (0.5 - f.petalMix) * 0.35);
      petalColours[i * 3] = scratch.colour.r;
      petalColours[i * 3 + 1] = scratch.colour.g;
      petalColours[i * 3 + 2] = scratch.colour.b;

      // Core: a dark button just above the cup's floor.
      scratch.tip.y += f.head * 0.16;
      scratch.scale.setScalar(f.head * 0.55);
      scratch.matrix.compose(scratch.tip, scratch.quat, scratch.scale);
      cores.setMatrixAt(i, scratch.matrix);
    }
    for (let i = n; i < CAPACITY; i++) {
      stems.setMatrixAt(i, scratch.zero);
      petals.setMatrixAt(i, scratch.zero);
      cores.setMatrixAt(i, scratch.zero);
    }

    stems.instanceMatrix.needsUpdate = true;
    petals.instanceMatrix.needsUpdate = true;
    cores.instanceMatrix.needsUpdate = true;
    petals.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={stemRef} args={[geometries.stem, materials.stem, CAPACITY]} />
      <instancedMesh ref={petalRef} args={[geometries.petal, materials.petal, CAPACITY]} />
      <instancedMesh ref={coreRef} args={[geometries.core, materials.core, CAPACITY]} />
    </group>
  );
};

export default Poppies;
