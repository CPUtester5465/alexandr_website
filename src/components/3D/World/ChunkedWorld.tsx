import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  CHUNK, buildChunk, meshChunk, chunkKeyOf, keyString, makeTerrainField
} from '../../../world/chunk';
import { BLOCK } from '../../../world/voxel';
import { DimensionSpec } from '../../../world/dimensions/specs';
import { controlState } from '../../../state/controlState';

/**
 * Streams a dimension's terrain around the player.
 *
 * The world has no edge. It is generated where he is standing and forgotten
 * where he is not, so walking in one direction never runs out -- which is what
 * separates a world from a diorama, and the previous dimension was a diorama:
 * six seconds across, corner to corner.
 *
 * Budget: one chunk built per frame, maximum. Building is a few tens of
 * milliseconds and blocks the main thread, so building three at once to catch
 * up drops a visible number of frames. One per frame at 60Hz is sixty chunks a
 * second, far more than walking can consume.
 *
 * Chunks are meshed with a one-block skirt that is generated for occlusion and
 * never drawn. Without it every chunk emits faces along all four of its own
 * edges, because from the inside its neighbour looks like air.
 */

const RADIUS = 3;          // chunks in each direction: a 7x7 window
const MAX_BUILDS_PER_FRAME = 1;

interface LoadedChunk {
  key: string;
  cx: number;
  cz: number;
  geometry: THREE.BufferGeometry;
}

const ChunkedWorld: React.FC<{ spec: DimensionSpec }> = ({ spec }) => {
  const field = useMemo(() => makeTerrainField(spec), [spec]);
  const loaded = useRef(new Map<string, LoadedChunk>());
  const [, forceRender] = useState(0);
  const material = useMemo(
    () => new THREE.MeshBasicMaterial({ vertexColors: true }),
    []
  );

  // Everything the streamer built belongs to this dimension; leaving disposes it.
  useEffect(() => {
    const held = loaded.current;
    return () => {
      for (const chunk of held.values()) chunk.geometry.dispose();
      held.clear();
    };
  }, [spec]);

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

    // Nearest first, so the ground under his feet exists before the horizon.
    missing.sort((a, b) => a.distance - b.distance);
    for (const { cx, cz } of missing.slice(0, MAX_BUILDS_PER_FRAME)) {
      const volume = buildChunk(spec, { cx, cz }, field);
      const geometry = meshChunk(spec, volume);
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

export default ChunkedWorld;
