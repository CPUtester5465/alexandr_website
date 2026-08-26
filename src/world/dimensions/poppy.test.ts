import { describe, it, expect } from 'vitest';
import { generate, SIZE, B, COLOURS, SEED } from './poppy';
import { meshVolume, quadCount, blockAt, BLOCK } from '../voxel';

/**
 * Generation has to be checkable without a browser, because "it looked fine on
 * my machine" is not a budget.
 */

describe('dimension 01 — generation', () => {
  it('is deterministic: the same seed is the same world', () => {
    const a = generate(SEED);
    const b = generate(SEED);
    expect(Array.from(a.volume.data)).toEqual(Array.from(b.volume.data));
  });

  it('a different seed is a different world', () => {
    const a = generate(SEED);
    const b = generate(SEED + 1);
    expect(Array.from(a.volume.data)).not.toEqual(Array.from(b.volume.data));
  });

  it('grows ground, not an empty box', () => {
    const { volume } = generate(SEED);
    const solid = volume.data.reduce((n, cell) => n + (cell ? 1 : 0), 0);
    const cells = SIZE.x * SIZE.y * SIZE.z;
    expect(solid).toBeGreaterThan(cells * 0.05);
    expect(solid).toBeLessThan(cells * 0.6);
  });

  it('falls away to nothing at the edges, so the meadow has a horizon', () => {
    const { heightAt } = generate(SEED);
    const edge = (SIZE.x / 2) * BLOCK - BLOCK;
    expect(heightAt(edge, edge)).toBeLessThan(heightAt(0, 0));
  });

  it('plants poppies with crimson heads above the ground', () => {
    const { volume } = generate(SEED);
    let petals = 0;
    let pollen = 0;
    for (const cell of volume.data) {
      if (cell === B.PETAL || cell === B.PETAL_LIT) petals++;
      if (cell === B.POLLEN) pollen++;
    }
    expect(petals).toBeGreaterThan(200);
    expect(pollen).toBeGreaterThan(20);
  });

  it('puts the way home behind him, not in front', () => {
    // The loop this exists for: he used to arrive facing the return doorway, so
    // walking forward -- the first thing anyone does -- sent him straight back
    // to the hub. A world you cannot walk into is not a world.
    const { spawn, arrivalHeading, returnDoor } = generate(SEED);
    const forwardX = Math.sin(arrivalHeading);
    const forwardZ = Math.cos(arrivalHeading);
    const toDoorX = returnDoor.x - spawn.x;
    const toDoorZ = returnDoor.z - spawn.z;
    const alignment =
      (forwardX * toDoorX + forwardZ * toDoorZ) / Math.hypot(toDoorX, toDoorZ);
    expect(alignment).toBeLessThan(-0.9);   // squarely behind him
  });

  it('starts him closer to the doorway than its arming distance', () => {
    // The return door only opens once he has walked 16 units clear of it. If he
    // started further away than that it would be live on arrival and the loop
    // would come straight back.
    const { spawn, returnDoor } = generate(SEED);
    const ARMING_DISTANCE = 16;
    const gap = Math.hypot(returnDoor.x - spawn.x, returnDoor.z - spawn.z);
    expect(gap).toBeLessThan(ARMING_DISTANCE);
    expect(gap).toBeGreaterThan(6);          // and not on top of him either
  });

  it('spawns him well inside the meadow, not out on the thin edge', () => {
    const { spawn, heightAt } = generate(SEED);
    expect(heightAt(spawn.x, spawn.z)).toBeGreaterThan(0);
    expect(Math.abs(spawn.z)).toBeLessThan((SIZE.z / 2) * BLOCK * 0.75);
  });

  it('spawns him standing on the surface, not inside it', () => {
    const { spawn, heightAt } = generate(SEED);
    expect(spawn.y).toBeCloseTo(heightAt(spawn.x, spawn.z));
    expect(spawn.y).toBeGreaterThan(0);
  });
});

describe('dimension 01 — meshing', () => {
  it('collapses the volume to a mesh a phone can draw', () => {
    const { volume } = generate(SEED);
    const geometry = meshVolume(volume, COLOURS);
    const quads = quadCount(geometry);
    const cells = SIZE.x * SIZE.y * SIZE.z;

    // Greedy meshing has to be doing real work. A naive mesher would emit
    // hundreds of thousands of quads for this volume.
    expect(quads).toBeGreaterThan(0);
    expect(quads).toBeLessThan(cells * 0.25);
  });

  it('carries a colour and a normal for every vertex', () => {
    const { volume } = generate(SEED);
    const geometry = meshVolume(volume, COLOURS);
    const count = geometry.getAttribute('position').count;
    expect(geometry.getAttribute('color').count).toBe(count);
    expect(geometry.getAttribute('normal').count).toBe(count);
    expect(count % 3).toBe(0);
  });

  it('varies vertex brightness, which means ambient occlusion is doing something', () => {
    const { volume } = generate(SEED);
    const colour = meshVolume(volume, COLOURS).getAttribute('color');
    const seen = new Set<string>();
    for (let i = 0; i < colour.count; i += 7) {
      seen.add(colour.getX(i).toFixed(3));
    }
    // Flat-shaded with no AO this would be one value per block type per face
    // direction. Many more than that means corners are actually darkening.
    expect(seen.size).toBeGreaterThan(20);
  });

  it('never emits a face between two solid blocks', () => {
    // Interior faces are invisible and pure cost; if any survive, the mask
    // logic is wrong.
    const { volume } = generate(SEED);
    let interior = 0;
    for (let z = 0; z < SIZE.z; z++) {
      for (let y = 0; y < SIZE.y - 1; y++) {
        for (let x = 0; x < SIZE.x; x++) {
          if (blockAt(volume, x, y, z) && blockAt(volume, x, y + 1, z)) interior++;
        }
      }
    }
    const geometry = meshVolume(volume, COLOURS);
    expect(quadCount(geometry)).toBeLessThan(interior);
  });
});
