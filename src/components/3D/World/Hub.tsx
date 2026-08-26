import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { meshVolume, quadCount, BLOCK } from '../../../world/voxel';
import { generateHub, HUB, Door } from '../../../world/hub';
import { setTerrain, clearTerrain } from '../../../world/terrain';
import { controlState } from '../../../state/controlState';
import { PLAYER_CONFIG } from '../../../utils/constants';
import { setNearestDoor } from '../../../state/hubState';

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
  const geometry = useMemo(() => meshVolume(hub.volume, hub.colours), [hub]);
  const material = useMemo(
    // Unlike a dimension, the hub takes light: the doors are the light sources
    // and the room has to receive them or the whole idea does not read.
    () => new THREE.MeshLambertMaterial({ vertexColors: true }),
    []
  );

  useEffect(() => {
    setTerrain(hub.heightAt, hub.extent);
    controlState.playerPosition.set(
      hub.spawn.x,
      hub.spawn.y + PLAYER_CONFIG.HEIGHT,
      hub.spawn.z
    );
    controlState.speed = 0;
    if (import.meta.env.DEV) {
      console.info(`[hub] ${quadCount(geometry).toLocaleString()} quads, ${hub.doors.length} doors`);
    }
    return () => {
      clearTerrain();
      setNearestDoor(null);
    };
  }, [hub, geometry]);

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
  });

  const size = HUB.radius * 2 + 6;

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
