import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { meshVolume, quadCount, BLOCK } from '../../../world/voxel';
import { generateHub, HUB, Door } from '../../../world/hub';
import { setTerrain, clearTerrain } from '../../../world/terrain';
import { controlState } from '../../../state/controlState';
import { PLAYER_CONFIG } from '../../../utils/constants';
import { setNearestDoor } from '../../../state/hubState';
import { travelTo, useWorld } from '../../../state/worldState';

/**
 * The room with fourteen doors.
 *
 * The doors glow. Not as decoration -- the light is the painting's own most-used
 * colour, sampled from the file, so standing in the middle of the room is
 * standing inside a chart of everything he has painted. Fourteen different
 * lights, none of them chosen by us.
 *
 * A door you can walk through is lit steadily. A door to a world that does not
 * exist yet is dimmed and pulses slowly, which is the honest signal: status is
 * a fact, not a grade, and a door that pretends is a lie in a room built to
 * tell the truth about him.
 */

const DOOR_REACH = 7;
/**
 * Close enough to be going through it rather than past it. Tighter than the
 * label reach on purpose -- you should be able to read a door's name from a
 * step away without being pulled into it.
 */
const DOOR_CROSSING = 2.6;

interface GlowProps {
  door: Door;
}

const DoorGlow: React.FC<GlowProps> = ({ door }) => {
  const light = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (!light.current) return;
    const t = clock.getElapsedTime();
    // Built doors hold steady with the faintest breath in them; unbuilt ones
    // are dim and clearly waiting.
    light.current.intensity = door.built
      ? 9 + Math.sin(t * 1.4 + door.angle) * 1.2
      : 2.2 + Math.sin(t * 0.7 + door.angle) * 1.4;
  });

  return (
    <pointLight
      ref={light}
      color={door.colour}
      distance={26}
      decay={1.6}
      position={[
        door.position.x - door.facing.x * BLOCK,
        door.position.y + BLOCK * 1.6,
        door.position.z - door.facing.z * BLOCK
      ]}
    />
  );
};

const Hub: React.FC = () => {
  const hub = useMemo(() => generateHub(), []);
  const { cameFrom } = useWorld();
  const geometry = useMemo(() => meshVolume(hub.volume, hub.colours), [hub]);
  const material = useMemo(
    // Unlike a dimension, the hub takes light: the doors are the light sources
    // and the room has to receive them or the whole idea does not read.
    () => new THREE.MeshLambertMaterial({ vertexColors: true }),
    []
  );

  useEffect(() => {
    setTerrain(hub.heightAt, hub.extent, hub.clampToRoom);

    // Come back through the door you left by, standing a few paces inside it --
    // close enough to know where you are, far enough not to be swallowed again.
    const origin = cameFrom ? hub.doors.find((d) => d.slug === cameFrom) : undefined;
    if (origin) {
      controlState.playerPosition.set(
        origin.position.x - origin.facing.x * BLOCK * 5,
        hub.heightAt(0, 0) + PLAYER_CONFIG.HEIGHT,
        origin.position.z - origin.facing.z * BLOCK * 5
      );
      controlState.heading = Math.atan2(-origin.facing.x, -origin.facing.z);
      controlState.cameraYaw = controlState.heading + Math.PI;
      controlState.inputYaw = controlState.cameraYaw;
    } else {
      controlState.playerPosition.set(
        hub.spawn.x,
        hub.spawn.y + PLAYER_CONFIG.HEIGHT,
        hub.spawn.z
      );
    }
    controlState.speed = 0;
    if (import.meta.env.DEV) {
      console.info(`[hub] ${quadCount(geometry).toLocaleString()} quads, ${hub.doors.length} doors`);
    }
    return () => {
      clearTerrain();
      setNearestDoor(null);
    };
  }, [hub, geometry, cameFrom]);

  // Which door is he standing at? Read on the frame loop, published at a rate
  // React can live with.
  const lastPublished = useRef<string | null>(null);
  useFrame(() => {
    let nearest: Door | null = null;
    let best = DOOR_REACH;
    for (const door of hub.doors) {
      const d = Math.hypot(
        door.position.x - controlState.playerPosition.x,
        door.position.z - controlState.playerPosition.z
      );
      if (d < best) {
        best = d;
        nearest = door;
      }
    }
    const slug = nearest?.slug ?? null;
    if (slug !== lastPublished.current) {
      lastPublished.current = slug;
      setNearestDoor(nearest);
    }

    // Step into a built door and you go through it. An unbuilt one is solid --
    // it says so on the label, and walking into it should confirm that rather
    // than silently doing nothing somewhere else.
    if (nearest && nearest.built && best < DOOR_CROSSING) {
      travelTo(nearest.slug, nearest.colour, nearest.slug);
    }
  });

  const size = (HUB.radius + HUB.wallThickness + 3) * 2;

  return (
    <group>
      <mesh
        geometry={geometry}
        material={material}
        position={[-(size / 2) * BLOCK, 0, -(size / 2) * BLOCK]}
      />

      {hub.doors.map((door) => (
        <DoorGlow key={door.slug} door={door} />
      ))}

      {/* Enough ambient that the room is never black, and no more -- the doors
          are supposed to be doing the lighting. */}
      <ambientLight intensity={0.34} color="#C8B392" />
      <color attach="background" args={[0x1A1410]} />
      <fog attach="fog" args={[0x1A1410, 30, 130]} />
    </group>
  );
};

export default Hub;
