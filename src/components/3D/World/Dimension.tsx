import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import ChunkedWorld from './ChunkedWorld';
import SkyDome from './SkyDome';
import SceneAtmosphere from './SceneAtmosphere';
import { makeTerrainField } from '../../../world/chunk';
import { setTerrain, clearTerrain } from '../../../world/terrain';
import { controlState } from '../../../state/controlState';
import { PLAYER_CONFIG } from '../../../utils/constants';
import { specBySlug } from '../../../world/dimensions/specs';
import { travelTo } from '../../../state/worldState';
import { setWayHome } from '../../../state/hubState';
import { setActiveDimension } from '../../../state/dimensionState';

/**
 * A dimension: one of his paintings, from the inside, going on as far as you
 * care to walk.
 *
 * Nothing here is specific to a painting. The world is a DimensionSpec -- a
 * palette sampled from the file plus a dozen numbers -- so all fourteen run
 * through this same component and adding the fifteenth is a recipe, not a build.
 */

const ARRIVAL_HEADING = Math.PI;   // into the world, never at the way back
const DOOR_BEHIND = 11;            // units back over his shoulder
const DOOR_OPENS_AT = 3.6;

/**
 * How long the doorway stays inert after arriving.
 *
 * It used to arm by distance -- you had to get eighteen units away before it
 * would work -- and he arrives eleven units from it. Walk out and back and it
 * was fine; use the map's fast travel to land nearby and it was permanently
 * dead, with nothing on screen to say why. The only thing arming has to
 * prevent is firing during the arrival itself, and a moment of time does that
 * without depending on where anybody chooses to walk.
 */
const DOOR_INERT_FOR = 1.4;

export const ReturnDoor: React.FC<{ at: THREE.Vector3; slug: string }> = ({ at, slug }) => {
  const age = useRef(0);

  useFrame((_, delta) => {
    age.current += delta;
    if (age.current < DOOR_INERT_FOR) return;
    const d = Math.hypot(
      at.x - controlState.playerPosition.x,
      at.z - controlState.playerPosition.z
    );
    if (d < DOOR_OPENS_AT) travelTo('hub', 0x6B4E31, slug);
  });

  return (
    // cameraTransparent, or the spring arm catches on it and snaps the camera
    // in every time he walks past.
    <group
      position={[at.x, at.y, at.z]}
      rotation={[0, ARRIVAL_HEADING, 0]}
      userData={{ cameraTransparent: true }}
    >
      <mesh position={[0, 3.4, 0]}>
        <boxGeometry args={[5.4, 6.8, 1.0]} />
        <meshBasicMaterial color={0x8A5A33} />
      </mesh>
      {/* The opening reads as the hub's own darkness. No light source: this
          world is unlit and everything in it is baked, so a lamp would
          illuminate nothing and only look as though it might. */}
      <mesh position={[0, 3.2, 0.12]}>
        <boxGeometry args={[3.6, 5.4, 1.1]} />
        <meshBasicMaterial color={0x1A1410} />
      </mesh>

      {/* A mark you can steer by. In a world with no edges the doorway
          disappears behind the first hill, and the compass tells you the
          bearing but not what to look for. */}
      <mesh position={[0, 15, 0]}>
        <boxGeometry args={[1.1, 18, 1.1]} />
        <meshBasicMaterial color={0xEDE6D2} transparent opacity={0.5} />
      </mesh>
    </group>
  );
};

const Dimension: React.FC<{ slug: string }> = ({ slug }) => {
  const spec = useMemo(() => specBySlug(slug), [slug]);
  const field = useMemo(() => (spec ? makeTerrainField(spec) : null), [spec]);

  const arrival = useMemo(() => {
    if (!field) return null;
    const spawn = new THREE.Vector3(0, field.heightAt(0, 0), 0);
    const back = new THREE.Vector3(
      -Math.sin(ARRIVAL_HEADING) * DOOR_BEHIND,
      0,
      -Math.cos(ARRIVAL_HEADING) * DOOR_BEHIND
    );
    back.y = field.heightAt(back.x, back.z);
    return { spawn, door: back };
  }, [field]);

  useEffect(() => {
    if (!spec || !field || !arrival) return;

    // No edges. The world is generated where he stands, so the bounds only
    // exist to stop a runaway; they are far past anything anyone will walk.
    const far = 40000;
    setTerrain(field.heightAt, { minX: -far, maxX: far, minZ: -far, maxZ: far });

    controlState.playerPosition.set(
      arrival.spawn.x,
      arrival.spawn.y + PLAYER_CONFIG.HEIGHT,
      arrival.spawn.z
    );
    controlState.heading = ARRIVAL_HEADING;
    controlState.cameraYaw = ARRIVAL_HEADING + Math.PI;
    controlState.inputYaw = controlState.cameraYaw;
    controlState.speed = 0;
    controlState.manualCameraFor = 0;
    setWayHome(arrival.door);
    setActiveDimension(spec);

    return () => {
      clearTerrain();
      setWayHome(null);
      setActiveDimension(null);
    };
  }, [spec, field, arrival]);

  if (!spec || !arrival) return null;

  return (
    <group>
      <ChunkedWorld spec={spec} />
      <ReturnDoor at={arrival.door} slug={slug} />
      <SkyDome spec={spec} />
      <SceneAtmosphere spec={spec} />
    </group>
  );
};

export default Dimension;
