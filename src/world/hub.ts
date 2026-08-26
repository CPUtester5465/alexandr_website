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
  /** How thick the wall is, and therefore how deep each doorway is. */
  wallThickness: 4,
  wallHeight: 9,
  /** Half-width of an opening, in blocks, measured at the inner face. */
  doorHalfWidth: 2,
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
  /** The walkable shape: a disc, notched at every doorway. */
  clampToRoom(x: number, z: number): { x: number; z: number };
}

export function generateHub(): GeneratedHub {
  const R = HUB.radius;
  const size = (R + HUB.wallThickness + 3) * 2;   // room, wall, and room to breathe
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
      if (d > R + HUB.wallThickness) continue;
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
  // Carved by testing every cell of the wall ring against every door's angle,
  // rather than by stepping outward from the centre. Stepping rounds each step
  // to an integer cell, which leaves gaps at some angles and runs off the end
  // of the array at others -- the back panel of every alcove was being written
  // out of bounds and silently dropped.
  const doors: Door[] = [];
  let nextId: number = H.DOOR_BASE;
  const doorIds = DIMENSIONS.map(() => ({ light: nextId++, frame: nextId++ }));

  DIMENSIONS.forEach((entry, i) => {
    colours[doorIds[i].light] = new THREE.Color(doorColour(entry));
    colours[doorIds[i].frame] = new THREE.Color(frameColour(entry));
  });

  const doorAngles = DIMENSIONS.map((_, i) => (i / DIMENSIONS.length) * Math.PI * 2);

  for (let z = 0; z < size; z++) {
    for (let x = 0; x < size; x++) {
      const dx = x - centre;
      const dz = z - centre;
      const d = Math.hypot(dx, dz);
      if (d < R - 1 || d > R + HUB.wallThickness) continue;

      const angle = Math.atan2(dx, dz);
      for (let i = 0; i < doorAngles.length; i++) {
        let off = angle - doorAngles[i];
        while (off > Math.PI) off -= Math.PI * 2;
        while (off < -Math.PI) off += Math.PI * 2;

        // Angular half-width shrinks with radius, so the opening stays the same
        // number of blocks wide all the way through the wall.
        const arc = HUB.doorHalfWidth / Math.max(d, 1);
        const frameArc = (HUB.doorHalfWidth + 1) / Math.max(d, 1);
        if (Math.abs(off) > frameArc) continue;

        const opening = Math.abs(off) <= arc;
        for (let y = 1; y <= HUB.doorHeight + 1; y++) {
          if (opening && y <= HUB.doorHeight) {
            // Clear the way through, and light the far end of the alcove.
            const backPanel = d >= R + HUB.wallThickness - 1;
            setBlock(volume, x, y, z, backPanel ? doorIds[i].light : H.AIR);
          } else {
            setBlock(volume, x, y, z, doorIds[i].frame);
          }
        }
        break;
      }
    }
  }

  DIMENSIONS.forEach((entry, i) => {
    const angle = doorAngles[i];
    const dirX = Math.sin(angle);
    const dirZ = Math.cos(angle);
    // Sit the trigger inside the alcove, so walking in is what fires it.
    const radius = (R + HUB.wallThickness - 2) * BLOCK;
    doors.push({
      slug: entry.slug,
      title: entry.title,
      built: entry.built,
      position: new THREE.Vector3(dirX * radius, BLOCK, dirZ * radius),
      facing: new THREE.Vector3(dirX, 0, dirZ),
      angle,
      colour: doorColour(entry)
    });
  });

  // The floor is one block thick and the room is flat, so the ground is simply
  // the top of it -- until a hub needs stairs, which it does not.
  const floorTop = BLOCK;
  const reach = (R + HUB.wallThickness - 1) * BLOCK;
  const extent = { minX: -reach, maxX: reach, minZ: -reach, maxZ: reach };

  // A disc, notched at each doorway. The notch is a little narrower than the
  // opening so he cannot scrape along the inside of the frame.
  const innerLimit = (R - 0.8) * BLOCK;
  const alcoveLimit = reach;
  const clampToRoom = (x: number, z: number) => {
    const r = Math.hypot(x, z);
    if (r <= innerLimit) return { x, z };

    const angle = Math.atan2(x, z);
    let limit = innerLimit;
    for (const a of doorAngles) {
      let off = angle - a;
      while (off > Math.PI) off -= Math.PI * 2;
      while (off < -Math.PI) off += Math.PI * 2;
      if (Math.abs(off) <= (HUB.doorHalfWidth - 0.7) / R) {
        limit = alcoveLimit;
        break;
      }
    }
    if (r <= limit) return { x, z };
    const scale = limit / r;
    return { x: x * scale, z: z * scale };
  };

  return {
    volume,
    colours,
    doors,
    heightAt: () => floorTop,
    spawn: new THREE.Vector3(0, floorTop, (R - 6) * BLOCK),
    extent,
    clampToRoom
  };
}
