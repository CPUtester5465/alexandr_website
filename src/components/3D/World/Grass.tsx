import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CHUNK, chunkKeyOf, keyString } from '../../../world/chunk';
import { BLOCK } from '../../../world/voxel';
import {
  SmoothField, grassForChunk, GRASS_PER_CHUNK, GRASS_STRIDE, LIGHT_COMP
} from '../../../world/smoothMesh';
import { DimensionSpec } from '../../../world/dimensions/specs';
import { controlState } from '../../../state/controlState';

/**
 * The meadow itself: one InstancedMesh of ~46k blades, ring-buffered by chunk.
 *
 * One draw call, however many blades. The buffer is divided into nine slots,
 * one per chunk of a 3x3 window around the player; when a chunk leaves the
 * window its slot is zero-scaled and handed to the chunk that replaced it, so
 * grass streams and despawns with the ground it grows on and no allocation
 * happens after mount.
 *
 * Wind is three layered sines in the vertex shader, phased by each blade's
 * world position, injected into MeshLambertMaterial with onBeforeCompile so
 * the blades still take the scene's light like everything else. All normals
 * point up: a blade lit as if it were the ground beneath it matches the
 * terrain instead of flickering dark edge-on.
 */

const GRASS_CHUNK_RADIUS = 1;               // 3x3 chunks
const SLOTS = (GRASS_CHUNK_RADIUS * 2 + 1) ** 2;
const CAPACITY = SLOTS * GRASS_PER_CHUNK;

const BLADE_HEIGHT = 1.7;

/** Tapered, slightly bowed blade: 7 vertices, 5 triangles. */
function buildBladeGeometry(): THREE.BufferGeometry {
  const levels = [
    { y: 0.0, hw: 0.15, bend: 0.00, shade: 0.62 },
    { y: 0.6, hw: 0.11, bend: 0.05, shade: 0.80 },
    { y: 1.2, hw: 0.06, bend: 0.16, shade: 0.96 }
  ];
  const tip = { y: BLADE_HEIGHT, bend: 0.34, shade: 1.05 };

  const positions: number[] = [];
  const colors: number[] = [];
  const normals: number[] = [];
  for (const l of levels) {
    positions.push(-l.hw + l.bend, l.y, 0, l.hw + l.bend, l.y, 0);
    colors.push(l.shade, l.shade, l.shade, l.shade, l.shade, l.shade);
    normals.push(0, 1, 0, 0, 1, 0);
  }
  positions.push(tip.bend, tip.y, 0);
  colors.push(tip.shade, tip.shade, tip.shade);
  normals.push(0, 1, 0);

  const indices = [
    0, 1, 2, 1, 3, 2,
    2, 3, 4, 3, 5, 4,
    4, 5, 6
  ];

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  return geometry;
}

const ZERO_MATRIX = new THREE.Matrix4().makeScale(0, 0, 0);

const Grass: React.FC<{ spec: DimensionSpec; field: SmoothField }> = ({ spec, field }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const slotOf = useRef(new Map<string, number>());
  const freeSlots = useRef<number[]>([]);
  const timeUniform = useRef({ value: 0 });
  const reducedMotion = useMemo(
    () => typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const geometry = useMemo(buildBladeGeometry, []);
  const material = useMemo(() => {
    const mat = new THREE.MeshLambertMaterial({
      vertexColors: true,
      side: THREE.DoubleSide
    });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = timeUniform.current;
      shader.vertexShader = 'uniform float uTime;\n' + shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vec2 gwAnchor = vec2(instanceMatrix[3][0], instanceMatrix[3][2]);
          float gwTip = clamp(position.y / ${BLADE_HEIGHT.toFixed(2)}, 0.0, 1.0);
          gwTip *= gwTip;
          float gwSway =
              sin(uTime * 1.6 + gwAnchor.x * 0.31 + gwAnchor.y * 0.23)
            + 0.55 * sin(uTime * 2.9 + gwAnchor.x * 0.73 - gwAnchor.y * 0.49)
            + 0.28 * sin(uTime * 5.1 + gwAnchor.y * 1.21 + gwAnchor.x * 0.17);
          transformed.x += gwSway * 0.20 * gwTip;
          transformed.z += gwSway * 0.12 * gwTip;
        #endif`
      );
    };
    mat.customProgramCacheKey = () => 'smooth-grass-wind';
    return mat;
  }, []);

  // Palette blade colours, pre-blended once. Slight per-instance variation is
  // an interpolation between the three sampled greens, never a new hue.
  const bladeColour = useMemo(() => {
    const surface = spec.colours[spec.blocks.surface] ?? new THREE.Color(0xff00ff);
    const pale = spec.colours[spec.blocks.pale] ?? surface;
    const deep = spec.colours[spec.blocks.deep] ?? surface;
    return (mix: number, out: THREE.Color) => {
      out.copy(surface);
      if (mix < 0.25) out.lerp(deep, (0.25 - mix) * 1.1);
      else out.lerp(pale, (mix - 0.25) * 0.9);
      out.multiplyScalar(LIGHT_COMP * 1.18);
      return out;
    };
  }, [spec]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(CAPACITY * 3), 3
    );
    for (let i = 0; i < CAPACITY; i++) mesh.setMatrixAt(i, ZERO_MATRIX);
    mesh.instanceMatrix.needsUpdate = true;
    mesh.count = CAPACITY;
    mesh.frustumCulled = false;
    slotOf.current.clear();
    freeSlots.current = Array.from({ length: SLOTS }, (_, i) => i);
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [spec, geometry, material]);

  const scratch = useMemo(() => ({
    matrix: new THREE.Matrix4(),
    quat: new THREE.Quaternion(),
    pos: new THREE.Vector3(),
    scale: new THREE.Vector3(),
    up: new THREE.Vector3(0, 1, 0),
    colour: new THREE.Color()
  }), []);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh || !mesh.instanceColor) return;
    if (!reducedMotion) timeUniform.current.value += delta;

    const here = chunkKeyOf(controlState.playerPosition.x, controlState.playerPosition.z);
    const wanted = new Set<string>();
    const toFill: { cx: number; cz: number; key: string }[] = [];

    for (let dz = -GRASS_CHUNK_RADIUS; dz <= GRASS_CHUNK_RADIUS; dz++) {
      for (let dx = -GRASS_CHUNK_RADIUS; dx <= GRASS_CHUNK_RADIUS; dx++) {
        const cx = here.cx + dx;
        const cz = here.cz + dz;
        const key = keyString({ cx, cz });
        wanted.add(key);
        if (!slotOf.current.has(key)) toFill.push({ cx, cz, key });
      }
    }

    let dirty = false;

    for (const [key, slot] of slotOf.current) {
      if (wanted.has(key)) continue;
      const base = slot * GRASS_PER_CHUNK;
      for (let i = 0; i < GRASS_PER_CHUNK; i++) mesh.setMatrixAt(base + i, ZERO_MATRIX);
      slotOf.current.delete(key);
      freeSlots.current.push(slot);
      dirty = true;
    }

    // One chunk of grass per frame, same discipline as the terrain streamer.
    const next = toFill.shift();
    if (next && freeSlots.current.length > 0) {
      const slot = freeSlots.current.pop()!;
      slotOf.current.set(next.key, slot);
      const { data, count } = grassForChunk(spec, { cx: next.cx, cz: next.cz }, field);
      const base = slot * GRASS_PER_CHUNK;
      const colours = mesh.instanceColor.array as Float32Array;
      for (let i = 0; i < GRASS_PER_CHUNK; i++) {
        if (i < count) {
          const o = i * GRASS_STRIDE;
          scratch.pos.set(data[o], data[o + 1], data[o + 2]);
          scratch.quat.setFromAxisAngle(scratch.up, data[o + 4]);
          scratch.scale.set(1, data[o + 3], 1);
          scratch.matrix.compose(scratch.pos, scratch.quat, scratch.scale);
          mesh.setMatrixAt(base + i, scratch.matrix);
          bladeColour(data[o + 5], scratch.colour);
          colours[(base + i) * 3] = scratch.colour.r;
          colours[(base + i) * 3 + 1] = scratch.colour.g;
          colours[(base + i) * 3 + 2] = scratch.colour.b;
        } else {
          mesh.setMatrixAt(base + i, ZERO_MATRIX);
        }
      }
      mesh.instanceColor.needsUpdate = true;
      dirty = true;
    }

    if (dirty) mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, CAPACITY]}
    />
  );
};

export default Grass;
