import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { meshVolume, quadCount, BLOCK } from '../../../world/voxel';
import { generateHub, HUB, Door } from '../../../world/hub';
import { setTerrain, clearTerrain } from '../../../world/terrain';
import { controlState } from '../../../state/controlState';
import { PLAYER_CONFIG } from '../../../utils/constants';
import { setNearestDoor } from '../../../state/hubState';
import { travelTo, useWorld } from '../../../state/worldState';
import { useLocale, pick } from '../../../state/locale';
import PostFX from '../PostFX';
import { BLOOM_LAYER } from '../PostFX';
import { dimensionBySlug } from '../../../world/dimensions/registry';

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
 * The hub's grade palette, in the same slot convention as the dimensions:
 * [1] is read for shadows (dark oak), [5] for highlights (his paper).
 */
const HUB_PALETTE = ['#6B4E31', '#4A3524', '#8A5A33', '#5C4229', '#C8B392', '#EDE6D2'];
/**
 * Close enough to be going through it rather than past it. Tighter than the
 * label reach on purpose -- you should be able to read a door's name from a
 * step away without being pulled into it.
 */
const DOOR_CROSSING = 2.6;

interface GlowProps {
  door: Door;
}

/**
 * The name over the door, in the world rather than in the browser.
 *
 * Handjet, because it is a multi-script pixel face whose Cyrillic was checked
 * glyph by glyph rather than taken from a subset listing. troika builds SDF
 * atlases from a real font file and cannot read woff2, so this points at the
 * whole .woff -- a different file from the one the DOM uses, for a real reason.
 *
 * No emoji: the fallback has no emoji glyphs and they come out as blank boxes.
 */
const DoorSign: React.FC<GlowProps> = ({ door }) => {
  const [locale] = useLocale();
  const outward = door.facing;

  return (
    <Text
      font="/fonts/Handjet.woff"
      position={[
        door.position.x - outward.x * BLOCK * 2.4,
        BLOCK * 4.4,
        door.position.z - outward.z * BLOCK * 2.4
      ]}
      rotation={[0, Math.atan2(-outward.x, -outward.z) + Math.PI, 0]}
      fontSize={1.15}
      maxWidth={11}
      textAlign="center"
      anchorX="center"
      anchorY="middle"
      color={door.colour}
      outlineWidth={0.045}
      outlineColor="#1A1410"
    >
      {pick(door.title, locale)}
    </Text>
  );
};

/**
 * The painting itself, hung over its door.
 *
 * The room is his study, and the honest answer to "what is behind this door"
 * is the painting the world was grown from. 384px webp thumbs, ~20KB each --
 * the whole gallery weighs 299KB. Subject doors hang nothing; their record
 * hangs on the label instead.
 */
const HungPainting: React.FC<GlowProps> = ({ door }) => {
  const entry = dimensionBySlug(door.slug);
  const texture = useTexture(`/art-thumbs/${entry?.painting}.webp`);
  texture.colorSpace = THREE.SRGBColorSpace;

  // Sized to sit clear of the arch below and the curved wall behind: the ring
  // wall bends, so anything wide enough pokes through it at the corners --
  // which is exactly what the first pass did.
  const w = 3.2;
  const image = texture.image as { width: number; height: number } | undefined;
  const h = Math.min(image ? (w * image.height) / image.width : w, 4.4);
  const inward = door.facing.clone().multiplyScalar(-1);

  return (
    <group
      position={[
        // door.position sits ~2 blocks deep in the alcove, so anything less
        // than that much inward hangs INSIDE the wall -- which is where the
        // whole gallery vanished to on the second pass.
        door.position.x + inward.x * BLOCK * 2.45,
        BLOCK * 7.1,
        door.position.z + inward.z * BLOCK * 2.45
      ]}
      rotation={[0, Math.atan2(inward.x, inward.z), 0]}
    >
      {/* frame, in the study's wood */}
      <mesh position={[0, 0, -0.06]}>
        <boxGeometry args={[w + 0.5, h + 0.5, 0.12]} />
        <meshLambertMaterial color={0x8A5A33} />
      </mesh>
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </group>
  );
};

/**
 * A slim emissive panel in the doorway on the bloom layer, so the door's
 * sampled colour carries as a glow once the post stack runs -- point lights
 * alone cannot bloom because bloom selects meshes.
 */
const DoorBloomPanel: React.FC<GlowProps> = ({ door }) => {
  const inward = door.facing.clone().multiplyScalar(-1);
  return (
    <mesh
      position={[
        door.position.x - inward.x * BLOCK * 1.2,
        BLOCK * 3.2,
        door.position.z - inward.z * BLOCK * 1.2
      ]}
      rotation={[0, Math.atan2(inward.x, inward.z), 0]}
      layers-mask={(1 << 0) | (1 << BLOOM_LAYER)}
    >
      <planeGeometry args={[3.6, 4.9]} />
      <meshBasicMaterial
        color={door.colour}
        transparent
        opacity={0.26}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
};

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
  const { scene } = useThree();

  // Same bug the study found in the dimensions: <color attach>/<fog attach>
  // inside a group never reach the scene. The hub has ALSO been running under
  // the app's sky-blue fog since it was built. Imperative, like everywhere now.
  useEffect(() => {
    const previousFog = scene.fog;
    const previousBackground = scene.background;
    scene.fog = new THREE.Fog(0x1A1410, 30, 130);
    scene.background = new THREE.Color(0x1A1410);
    return () => {
      scene.fog = previousFog;
      scene.background = previousBackground;
    };
  }, [scene]);
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
        <React.Fragment key={door.slug}>
          <DoorGlow door={door} />
          <DoorBloomPanel door={door} />
          <DoorSign door={door} />
          {door.kind === 'painting' && <HungPainting door={door} />}
        </React.Fragment>
      ))}

      {/* The same post stack the worlds run: bloom for the door glows, the
          grade pulled toward wood and paper instead of a painting. */}
      <PostFX palette={HUB_PALETTE} />

      {/* Enough ambient that the room is never black, and no more -- the doors
          are supposed to be doing the lighting. */}
      <ambientLight intensity={0.34} color="#C8B392" />
    </group>
  );
};

export default Hub;
