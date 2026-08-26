import { describe, it, expect } from 'vitest';
import { generateHub, HUB, H } from './hub';
import { meshVolume, quadCount, blockAt, BLOCK } from './voxel';
import { DIMENSIONS } from './dimensions/registry';

describe('the hub', () => {
  const hub = generateHub();

  it('cuts one door per painting', () => {
    expect(hub.doors).toHaveLength(DIMENSIONS.length);
    expect(hub.doors).toHaveLength(14);
  });

  it('gives every door its own sampled colour', () => {
    const colours = new Set(hub.doors.map((d) => d.colour));
    // Fourteen paintings, fourteen palettes. If two doors match, the sampling
    // collapsed and the room stops being a chart of his work.
    expect(colours.size).toBe(14);
  });

  it('spaces the doors evenly round the wall', () => {
    const angles = hub.doors.map((d) => d.angle).sort((a, b) => a - b);
    const gaps = angles.slice(1).map((a, i) => a - angles[i]);
    const expected = (Math.PI * 2) / 14;
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
    expect(quadCount(geometry)).toBeLessThan(20000);
  });

  it('marks exactly one door as built, and says so honestly', () => {
    // Status is a fact, not a grade. When the second world lands this number
    // changes, and the test should be updated rather than loosened.
    expect(hub.doors.filter((d) => d.built).map((d) => d.slug)).toEqual(['poppy']);
  });
});
