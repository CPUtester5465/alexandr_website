import * as THREE from 'three';
import { createVolume, setBlock, Volume, BLOCK } from './voxel';
import { DIMENSIONS, doorColour, frameColour } from './dimensions/registry';

/**
 * THE HUB — the room with fourteen doors.
 *
 * A round chamber. Round because a third-person camera looking slightly down
 * can see the whole ring at once, so every door is visible from the middle and
 * nobody has to hunt for one on a phone. Fourteen doors around the wall, his
 * desk in the centre.
 *
 * Each door is lit in the palette of the painting behind it -- sampled from the
 * file, not chosen. That is Law 2 doing real work rather than being a rule: the
 * hub ends up a board of his own colours, and no two doors look alike because
 * no two paintings do.
 *
 * The room is warm wood and plaster, and it is deliberately the only muted
 * place in the site, so every door reads as brighter than the room it is in.
 */

export const HUB = {
  /** Inner radius of the floor, in blocks. */
  radius: 20,
  wallHeight: 9,
  doorWidth: 3,
  doorHeight: 5
};

/** Block ids. Doors take a pair each, so they start after the fixed set. */
export const H = {
  AIR: 0,
  FLOOR: 1,
  FLOOR_ALT: 2,
  WALL: 3,
  WALL_TRIM: 4,
  CEILING: 5,
  DESK: 6,
  DESK_TOP: 7,
  /** First id used by door lights; each door takes two (light, frame). */
  DOOR_BASE: 8
} as const;

/** Study tokens, from the design system. */
const ROOM = {
  floor: 0x6B4E31,
  floorAlt: 0x5C4229,
  wall: 0xC8B392,
  trim: 0x8A5A33,
  ceiling: 0x4A3524,
  desk: 0x8A5A33,
  deskTop: 0xEDE6D2
};

export interface Door {
  slug: string;
  title: { en: string; ru: string };
  built: boolean;
  /** Centre of the doorway, in world units. */
  position: THREE.Vector3;
  /** Outward direction, so the player steps through rather than along. */
  facing: THREE.Vector3;
  /** Angle around the room, radians. */
  angle: number;
  colour: number;
}

export interface GeneratedHub {
  volume: Volume;
  colours: THREE.Color[];
  doors: Door[];
  heightAt(x: number, z: number): number;
  spawn: THREE.Vector3;
  extent: { minX: number; maxX: number; minZ: number; maxZ: number };
}

export function generateHub(): GeneratedHub {
  const R = HUB.radius;
  const size = R * 2 + 6;          // room plus wall thickness plus a margin
  const height = HUB.wallHeight + 2;
  const volume = createVolume(size, height, size);
  const centre = Math.floor(size / 2);

  const colours: THREE.Color[] = [];
  colours[H.FLOOR] = new THREE.Color(ROOM.floor);
  colours[H.FLOOR_ALT] = new THREE.Color(ROOM.floorAlt);
  colours[H.WALL] = new THREE.Color(ROOM.wall);
  colours[H.WALL_TRIM] = new THREE.Color(ROOM.trim);
  colours[H.CEILING] = new THREE.Color(ROOM.ceiling);
  colours[H.DESK] = new THREE.Color(ROOM.desk);
  colours[H.DESK_TOP] = new THREE.Color(ROOM.deskTop);

  // --- the floor, on a slow checker so the eye has something to measure by ---
  for (let z = 0; z < size; z++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - centre, z - centre);
      if (d > R + 2) continue;
      const inside = d <= R;
      const checker = (Math.floor(x / 3) + Math.floor(z / 3)) % 2 === 0;
      setBlock(volume, x, 0, z, inside && checker ? H.FLOOR_ALT : H.FLOOR);
      if (!inside) {
        // The wall ring.
        for (let y = 1; y <= HUB.wallHeight; y++) {
          setBlock(volume, x, y, z, y === HUB.wallHeight ? H.WALL_TRIM : H.WALL);
        }
      }
      if (inside && d > R - 0.5) {
        for (let y = 1; y <= HUB.wallHeight; y++) setBlock(volume, x, y, z, H.WALL);
      }
      setBlock(volume, x, height - 1, z, H.CEILING);
    }
  }

  // --- his desk, in the middle -----------------------------------------------
  for (let dz = -3; dz <= 3; dz++) {
    for (let dx = -4; dx <= 4; dx++) {
      setBlock(volume, centre + dx, 1, centre + dz, H.DESK);
      setBlock(volume, centre + dx, 2, centre + dz, H.DESK_TOP);
    }
  }

  // --- the doors -------------------------------------------------------------
  const doors: Door[] = [];
  let nextId: number = H.DOOR_BASE;

  DIMENSIONS.forEach((entry, i) => {
    const angle = (i / DIMENSIONS.length) * Math.PI * 2;
    const lightId = nextId++;
    const frameId = nextId++;
    colours[lightId] = new THREE.Color(doorColour(entry));
    colours[frameId] = new THREE.Color(frameColour(entry));

    const dirX = Math.sin(angle);
    const dirZ = Math.cos(angle);
    // Tangent, so the opening is cut across the wall rather than along it.
    const tanX = dirZ;
    const tanZ = -dirX;

    const half = Math.floor(HUB.doorWidth / 2);
    for (let t = -half - 1; t <= half + 1; t++) {
      for (let y = 1; y <= HUB.doorHeight + 1; y++) {
        // Two blocks of wall thickness, cut through.
        for (let depth = 0; depth <= 3; depth++) {
          const x = Math.round(centre + dirX * (R + depth - 0.5) + tanX * t);
          const z = Math.round(centre + dirZ * (R + depth - 0.5) + tanZ * t);
          const isOpening = Math.abs(t) <= half && y <= HUB.doorHeight;
          const isFrame = !isOpening && (Math.abs(t) <= half + 1 && y <= HUB.doorHeight + 1);
          if (isOpening) {
            // The lit panel sits at the back of the alcove; the way through is
            // clear until the world behind it exists.
            setBlock(volume, x, y, z, depth >= 3 ? lightId : H.AIR);
          } else if (isFrame) {
            setBlock(volume, x, y, z, frameId);
          }
        }
      }
    }

    const worldX = (centre + dirX * (R + 1) - size / 2) * BLOCK;
    const worldZ = (centre + dirZ * (R + 1) - size / 2) * BLOCK;
    doors.push({
      slug: entry.slug,
      title: entry.title,
      built: entry.built,
      position: new THREE.Vector3(worldX, BLOCK, worldZ),
      facing: new THREE.Vector3(dirX, 0, dirZ),
      angle,
      colour: doorColour(entry)
    });
  });

  // The floor is one block thick and the room is flat, so the ground is simply
  // the top of it -- until a hub needs stairs, which it does not.
  const floorTop = BLOCK;
  const extent = {
    minX: -(R - 1) * BLOCK,
    maxX: (R - 1) * BLOCK,
    minZ: -(R - 1) * BLOCK,
    maxZ: (R - 1) * BLOCK
  };

  return {
    volume,
    colours,
    doors,
    heightAt: () => floorTop,
    spawn: new THREE.Vector3(0, floorTop, (R - 6) * BLOCK),
    extent
  };
}
