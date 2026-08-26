import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { meshVolume, quadCount, BLOCK } from '../../../world/voxel';
import { setTerrain, clearTerrain } from '../../../world/terrain';
import { controlState } from '../../../state/controlState';
import { PLAYER_CONFIG } from '../../../utils/constants';
import { generate, COLOURS, SIZE, EXTENT, PALETTE } from '../../../world/dimensions/poppy';
import { travelTo } from '../../../state/worldState';

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

/**
 * The way back.
 *
 * A doorway standing where you arrived, in the hub's own wood, so it reads as
 * out-of-place here on purpose -- the one thing in the meadow that is not made
 * of the painting. Walk into it and you are back in the room.
 */
const ReturnDoor: React.FC<{ at: THREE.Vector3; slug: string; facing: number }> = ({ at, slug, facing }) => {
  const armed = useRef(false);

  useFrame(() => {
    const d = Math.hypot(
      at.x - controlState.playerPosition.x,
      at.z - controlState.playerPosition.z
    );
    // Arm only once he has walked properly away. He starts eleven units from it
    // with his back turned, so this cannot fire on arrival.
    if (d > 16) armed.current = true;
    if (armed.current && d < 3.4) travelTo('hub', 0x6B4E31, slug);
  });

  return (
    <group position={[at.x, at.y, at.z]} rotation={[0, facing, 0]}>
      <mesh position={[0, 3.2, 0]}>
        <boxGeometry args={[5.2, 6.4, 0.9]} />
        <meshBasicMaterial color={0x8A5A33} />
      </mesh>
      {/* The opening reads as the hub's own darkness, not as a hole. There is
          no light here on purpose: this dimension is unlit and everything in it
          is baked, so a lamp would illuminate nothing and only look like it
          might. */}
      <mesh position={[0, 3.0, 0.1]}>
        <boxGeometry args={[3.6, 5.2, 1.0]} />
        <meshBasicMaterial color={0x1A1410} />
      </mesh>
    </group>
  );
};

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
    // Face him into the world with the way home behind him, and set the camera
    // over his shoulder so the doorway stays visible without being in the way.
    controlState.heading = world.arrivalHeading;
    controlState.cameraYaw = world.arrivalHeading + Math.PI;
    controlState.inputYaw = controlState.cameraYaw;
    controlState.speed = 0;
    controlState.manualCameraFor = 0;

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

      <ReturnDoor at={world.returnDoor} slug="poppy" facing={world.arrivalHeading} />

      {/* Green weather. The fog colour is the painting's pale green, so the
          horizon dissolves into the same paint the ground is made of. */}
      <color attach="background" args={[PALETTE.PALE.hex]} />
      <fog attach="fog" args={[PALETTE.PALE.hex, 40, 190]} />
    </group>
  );
};

export default Dimension;
