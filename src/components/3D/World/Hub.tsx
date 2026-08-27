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
import PortalSurface from './PortalSurface';
import HubRoom from './HubRoom';
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

const RoomDressing: React.FC = () => {
  const motes = useMemo(() => {
    const count = 220;
    const positions = new Float32Array(count * 3);
    let h = 12345;
    const rand = () => {
      h = Math.imul(h ^ (h >>> 15), h | 1) >>> 0;
      return (h % 10000) / 10000;
    };
    for (let i = 0; i < count; i++) {
      const angle = rand() * Math.PI * 2;
      const radius = rand() * (HUB.radius - 3) * BLOCK;
      positions[i * 3] = Math.sin(angle) * radius;
      positions[i * 3 + 1] = 2 + rand() * 13;
      positions[i * 3 + 2] = Math.cos(angle) * radius;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, []);
  const motesRef = useRef<THREE.Points>(null);

  useFrame(({ clock }) => {
    if (motesRef.current) motesRef.current.rotation.y = clock.getElapsedTime() * 0.008;
  });

  const beams = useMemo(() => {
    const wood = new THREE.MeshLambertMaterial({ color: 0x4A3524 });
    const unit = new THREE.BoxGeometry(1, 1, 1);
    const mesh = new THREE.InstancedMesh(unit, wood, 9);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < 9; i++) {
      const angle = (i / 9) * Math.PI * 2;
      q.setFromAxisAngle(up, angle);
      m.compose(new THREE.Vector3(0, 19.2, 0), q,
        new THREE.Vector3(HUB.radius * 2 * BLOCK - 6, 0.8, 1.1));
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }, []);

  const lamps = useMemo(() => {
    const warm = new THREE.MeshBasicMaterial({ color: 0xF3D9A4 });
    const sphere = new THREE.SphereGeometry(0.45, 10, 8);
    const mesh = new THREE.InstancedMesh(sphere, warm, 6);
    const m = new THREE.Matrix4();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + 0.26;
      const radius = HUB.radius * BLOCK * 0.55;
      m.makeTranslation(Math.sin(angle) * radius, 16.5, Math.cos(angle) * radius);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.layers.enable(BLOOM_LAYER);
    return mesh;
  }, []);

  return (
    <group>
      <primitive object={beams} />
      <primitive object={lamps} />
      {/* Rug ring around the centre, on his paper colour. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, BLOCK + 0.06, 0]}>
        <ringGeometry args={[7, 12.5, 48]} />
        <meshLambertMaterial color={0x8A5A33} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, BLOCK + 0.07, 0]}>
        <ringGeometry args={[7.6, 11.9, 48]} />
        <meshLambertMaterial color={0xC8B392} />
      </mesh>
      <points ref={motesRef} geometry={motes}>
        <pointsMaterial color={0xEDE6D2} size={0.14} transparent opacity={0.35} sizeAttenuation />
      </points>
    </group>
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
      {/* The voxel volume still exists in generateHub for door math and the
          walkable clamp, but the ROOM the visitor sees is architecture now --
          the block shell was, in Tim's words, a placeholder. */}
      <HubRoom doors={hub.doors} />

      {hub.doors.map((door) => (
        <React.Fragment key={door.slug}>
          <DoorGlow door={door} />
          <PortalSurface door={door} />
          <DoorSign door={door} />
          {door.kind === 'painting' && <HungPainting door={door} />}
        </React.Fragment>
      ))}

      {/* The same post stack the worlds run: bloom for the door glows, the
          grade pulled toward wood and paper instead of a painting. */}
      <PostFX palette={HUB_PALETTE} />

      {/* The room's own furniture: ceiling beams radiating like a wheel,
          warm hanging lamps that bloom, a rug ring at the centre, and slow
          dust motes -- a study, not a corridor. All palette woods. */}
      <RoomDressing />

      {/* Enough ambient that the room is never black, and no more -- the doors
          are supposed to be doing the lighting. */}
      <ambientLight intensity={0.34} color="#C8B392" />
    </group>
  );
};

export default Hub;
