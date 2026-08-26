import { describe, it, expect } from 'vitest';
import { generateHub, HUB, H } from './hub';
import { meshVolume, quadCount, blockAt, BLOCK } from './voxel';
import { DIMENSIONS } from './dimensions/registry';

describe('the hub', () => {
  const hub = generateHub();

  it('cuts one door per painting and one per subject', () => {
    expect(hub.doors).toHaveLength(DIMENSIONS.length);
    expect(hub.doors).toHaveLength(18);
    expect(hub.doors.filter((d) => d.kind === 'painting')).toHaveLength(14);
    expect(hub.doors.filter((d) => d.kind === 'subject')).toHaveLength(4);
  });

  it('gives every door its own colour', () => {
    const colours = new Set(hub.doors.map((d) => d.colour));
    // Fourteen paintings and four subjects. If two match, either the sampling
    // collapsed or a subject is being lit in its paper rather than its one
    // rationed colour -- which would give four identical doors and lose the
    // entire point of rationing.
    expect(colours.size).toBe(18);
  });

  it('spaces the doors evenly round the wall', () => {
    const angles = hub.doors.map((d) => d.angle).sort((a, b) => a - b);
    const gaps = angles.slice(1).map((a, i) => a - angles[i]);
    const expected = (Math.PI * 2) / 18;
    for (const gap of gaps) expect(gap).toBeCloseTo(expected, 5);
  });

  it('puts every door on the wall, not adrift in the room', () => {
    for (const door of hub.doors) {
      const radius = Math.hypot(door.position.x, door.position.z) / BLOCK;
      expect(radius).toBeGreaterThan(HUB.radius - 1);
      expect(radius).toBeLessThan(HUB.radius + 3);
    }
  });

  it('faces each door outward, so you step through rather than along', () => {
    for (const door of hub.doors) {
      const outward = Math.hypot(door.position.x, door.position.z);
      const dot = (door.position.x * door.facing.x + door.position.z * door.facing.z) / outward;
      expect(dot).toBeGreaterThan(0.9);
    }
  });

  it('lays a floor under the whole room', () => {
    const size = HUB.radius * 2 + 6;
    const centre = Math.floor(size / 2);
    expect(blockAt(hub.volume, centre, 0, centre)).not.toBe(H.AIR);
    expect(blockAt(hub.volume, centre + HUB.radius - 2, 0, centre)).not.toBe(H.AIR);
  });

  it('leaves him standing on the floor, inside the room', () => {
    expect(hub.spawn.y).toBe(BLOCK);
    expect(Math.hypot(hub.spawn.x, hub.spawn.z)).toBeLessThan(HUB.radius * BLOCK);
  });

  it('meshes to one draw call inside the mobile budget', () => {
    const geometry = meshVolume(hub.volume, hub.colours);
    expect(quadCount(geometry)).toBeGreaterThan(100);
    expect(quadCount(geometry)).toBeLessThan(30000);
  });

  it('leaves wall between every pair of doors', () => {
    // Eighteen openings on a ring that was sized for fourteen would grow their
    // frames into one another and the room would become a colonnade.
    const size = (HUB.radius + HUB.wallThickness + 3) * 2;
    const centre = Math.floor(size / 2);
    for (let i = 0; i < hub.doors.length; i++) {
      const a = hub.doors[i].angle;
      const b = hub.doors[(i + 1) % hub.doors.length].angle;
      let mid = (a + b) / 2;
      if (Math.abs(b - a) > Math.PI) mid += Math.PI;
      const r = HUB.radius + 1;
      const x = Math.round(centre + Math.sin(mid) * r);
      const z = Math.round(centre + Math.cos(mid) * r);
      expect(blockAt(hub.volume, x, 3, z), `no wall between doors ${i} and ${i + 1}`)
        .not.toBe(H.AIR);
    }
  });

  it('lets him actually reach every door', () => {
    // The bug this exists for: the walkable area was clamped to a box of +/-38
    // while the doors sat at radius 42, so he could see all fourteen and touch
    // none of them. Tests asserted the doors were positioned correctly and said
    // nothing about whether he could get to one.
    const DOOR_CROSSING = 2.6;
    for (const door of hub.doors) {
      // Walk straight at it from the middle of the room and stop where the
      // world stops you.
      const far = door.facing.clone().multiplyScalar(1000);
      const stopped = hub.clampToRoom(far.x, far.z);
      const gap = Math.hypot(stopped.x - door.position.x, stopped.z - door.position.z);
      expect(gap).toBeLessThan(DOOR_CROSSING);
    }
  });

  it('keeps him inside the room everywhere else', () => {
    // Between two doors he must not be able to walk out through the wall.
    const between = (hub.doors[0].angle + hub.doors[1].angle) / 2;
    const far = { x: Math.sin(between) * 1000, z: Math.cos(between) * 1000 };
    const stopped = hub.clampToRoom(far.x, far.z);
    expect(Math.hypot(stopped.x, stopped.z) / BLOCK).toBeLessThan(HUB.radius);
  });

  it('cuts each doorway clear through, and lights the far end', () => {
    // The other half of the bug: the alcove back panel was written out of
    // bounds and silently dropped, so every doorway opened onto nothing.
    const size = (HUB.radius + HUB.wallThickness + 3) * 2;
    const centre = Math.floor(size / 2);
    for (const door of hub.doors) {
      const at = (radius: number) => {
        const x = Math.round(centre + door.facing.x * radius);
        const z = Math.round(centre + door.facing.z * radius);
        return blockAt(hub.volume, x, 2, z);
      };
      // Clear through the middle of the wall...
      expect(at(HUB.radius + 1)).toBe(H.AIR);
      // ...and lit somewhere across the back of the alcove. Which exact cell
      // the panel lands in depends on the angle's rounding, so scan the band
      // rather than betting on one radius.
      const band = [0, 0.5, 1].map((o) => at(HUB.radius + HUB.wallThickness - 1.2 + o));
      expect(band.some((b) => b !== H.AIR), `door ${door.slug} opens onto nothing`).toBe(true);
    }
  });

  it('has a world behind every door', () => {
    // Status is a fact, not a grade. All fourteen are generated now, because a
    // dimension is a recipe over one generator rather than a build. When he
    // paints a fifteenth it gets a door before it gets a world, and this is
    // where that shows up.
    expect(hub.doors.filter((d) => d.built)).toHaveLength(18);
  });
});
