import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CHUNK, chunkKeyOf, keyString } from '../../../world/chunk';
import { BLOCK } from '../../../world/voxel';
import { SmoothField, meshSmoothChunk } from '../../../world/smoothMesh';
import { DimensionSpec } from '../../../world/dimensions/specs';
import { controlState } from '../../../state/controlState';

/**
 * The smooth twin of ChunkedWorld: same streaming discipline (one chunk a
 * frame, urgent ring built at once, forgotten when out of range), different
 * mesher and a lit material.
 *
 * RADIUS is 2 rather than 3 because the painterly path pays for grass, sky and
 * post on top of the terrain, and the draw-call budget is a law. A 5x5 window
 * is 25 chunk draws; fog is tuned so its far edge sits inside the loaded ring.
 */
const RADIUS = 2;
const MAX_BUILDS_PER_FRAME = 1;
const URGENT_DISTANCE_SQ = 2;
const MAX_URGENT_PER_FRAME = 4;

interface LoadedChunk {
  key: string;
  cx: number;
  cz: number;
  geometry: THREE.BufferGeometry;
}

const SmoothChunkedWorld: React.FC<{ spec: DimensionSpec; field: SmoothField }> = ({ spec, field }) => {
  const loaded = useRef(new Map<string, LoadedChunk>());
  const [, forceRender] = useState(0);
  const material = useMemo(
    () => new THREE.MeshLambertMaterial({ vertexColors: true }),
    []
  );

  useEffect(() => {
    const held = loaded.current;
    return () => {
      for (const chunk of held.values()) chunk.geometry.dispose();
      held.clear();
      material.dispose();
    };
  }, [spec, material]);

  useFrame(() => {
    const here = chunkKeyOf(controlState.playerPosition.x, controlState.playerPosition.z);
    const wanted = new Set<string>();
    const missing: { cx: number; cz: number; distance: number }[] = [];

    for (let dz = -RADIUS; dz <= RADIUS; dz++) {
      for (let dx = -RADIUS; dx <= RADIUS; dx++) {
        const cx = here.cx + dx;
        const cz = here.cz + dz;
        const key = keyString({ cx, cz });
        wanted.add(key);
        if (!loaded.current.has(key)) {
          missing.push({ cx, cz, distance: dx * dx + dz * dz });
        }
      }
    }

    let changed = false;
    missing.sort((a, b) => a.distance - b.distance);
    const urgent = missing.filter((m) => m.distance <= URGENT_DISTANCE_SQ);
    const budget = urgent.length > 0
      ? Math.min(urgent.length, MAX_URGENT_PER_FRAME)
      : MAX_BUILDS_PER_FRAME;

    for (const { cx, cz } of missing.slice(0, budget)) {
      const geometry = meshSmoothChunk(spec, { cx, cz }, field);
      loaded.current.set(keyString({ cx, cz }), {
        key: keyString({ cx, cz }), cx, cz, geometry
      });
      changed = true;
    }

    for (const [key, chunk] of loaded.current) {
      if (wanted.has(key)) continue;
      chunk.geometry.dispose();
      loaded.current.delete(key);
      changed = true;
    }

    if (changed) forceRender((n) => n + 1);
  });

  return (
    <group>
      {Array.from(loaded.current.values()).map((chunk) => (
        <mesh
          key={chunk.key}
          geometry={chunk.geometry}
          material={material}
          position={[chunk.cx * CHUNK * BLOCK, 0, chunk.cz * CHUNK * BLOCK]}
        />
      ))}
    </group>
  );
};

export default SmoothChunkedWorld;
