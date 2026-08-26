import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { meshVolume, quadCount, BLOCK } from '../../../world/voxel';
import { setTerrain, clearTerrain } from '../../../world/terrain';
import { controlState } from '../../../state/controlState';
import { PLAYER_CONFIG } from '../../../utils/constants';
import { generate, COLOURS, SIZE, EXTENT, PALETTE } from '../../../world/dimensions/poppy';

/**
 * Dimension 01 — Poppy in Green Weather.
 *
 * The whole world is one mesh. Greedy meshing collapses 56x30x56 cells into a
 * few thousand quads, which is well inside the budget on its own, so chunking
 * would be machinery in place of a problem. When a dimension needs to be bigger
 * than one draw call, this is where chunks arrive.
 *
 * MeshBasicMaterial with vertex colours, and no lights at all. Every bit of
 * shading is baked in the mesher: ambient occlusion per vertex plus a fixed
 * shade per face direction. That is how block games have always done it, it is
 * flat the way the design system requires, and it is the cheapest material
 * three.js has.
 */

const Dimension: React.FC = () => {
  const world = useMemo(() => generate(), []);
  const geometry = useMemo(() => meshVolume(world.volume, COLOURS), [world]);

  useEffect(() => {
    setTerrain(world.heightAt, EXTENT);
    // Stand him on the ground rather than dropping him through it.
    controlState.playerPosition.set(
      world.spawn.x,
      world.spawn.y + PLAYER_CONFIG.HEIGHT,
      world.spawn.z
    );
    controlState.speed = 0;

    if (import.meta.env.DEV) {
      const quads = quadCount(geometry);
      const cells = SIZE.x * SIZE.y * SIZE.z;
      console.info(
        `[dimension:poppy] ${cells.toLocaleString()} cells -> ${quads.toLocaleString()} quads, 1 draw call`
      );
    }
    return () => clearTerrain();
  }, [world, geometry]);

  const material = useMemo(
    () => new THREE.MeshBasicMaterial({ vertexColors: true }),
    []
  );

  return (
    <group>
      {/* The mesh is built from voxel index 0; shift it so the world is centred. */}
      <mesh
        geometry={geometry}
        material={material}
        position={[-(SIZE.x / 2) * BLOCK, 0, -(SIZE.z / 2) * BLOCK]}
      />

      {/* Green weather. The fog colour is the painting's pale green, so the
          horizon dissolves into the same paint the ground is made of. */}
      <color attach="background" args={[PALETTE.PALE.hex]} />
      <fog attach="fog" args={[PALETTE.PALE.hex, 40, 190]} />
    </group>
  );
};

export default Dimension;
