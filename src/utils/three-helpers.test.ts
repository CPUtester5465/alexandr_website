import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { clampToWorldBounds, distance2D, calculateGlowIntensity } from './three-helpers';
import { WORLD_BOUNDS } from './constants';

describe('clampToWorldBounds', () => {
  it('leaves a position inside the world alone', () => {
    const p = clampToWorldBounds(new THREE.Vector3(10, 2.2, -30));
    expect([p.x, p.y, p.z]).toEqual([10, 2.2, -30]);
  });

  it('clamps x and z to the world edges', () => {
    const p = clampToWorldBounds(new THREE.Vector3(999, 2.2, -999));
    expect(p.x).toBe(WORLD_BOUNDS.MAX_X);
    expect(p.z).toBe(WORLD_BOUNDS.MIN_Z);
  });

  it('never clamps height, so jumping is unbounded', () => {
    const p = clampToWorldBounds(new THREE.Vector3(0, 5000, 0));
    expect(p.y).toBe(5000);
  });
});

describe('distance2D', () => {
  it('ignores the y axis', () => {
    const a = new THREE.Vector3(0, 0, 0);
    const b = new THREE.Vector3(3, 900, 4);
    expect(distance2D(a, b)).toBe(5);
  });
});

describe('calculateGlowIntensity', () => {
  it('is brightest at zero distance', () => {
    expect(calculateGlowIntensity(0, 10, 0.1, 0.5)).toBeCloseTo(0.5);
  });

  it('falls to the minimum at the far edge', () => {
    expect(calculateGlowIntensity(10, 10, 0.1, 0.5)).toBeCloseTo(0.1);
  });

  it('does not go below the minimum beyond the far edge', () => {
    expect(calculateGlowIntensity(1000, 10, 0.1, 0.5)).toBeCloseTo(0.1);
  });
});
