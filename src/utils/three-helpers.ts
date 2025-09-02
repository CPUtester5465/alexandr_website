import * as THREE from 'three';
import { WORLD_BOUNDS } from './constants';

/**
 * Clamp position within world boundaries
 */
export const clampToWorldBounds = (position: THREE.Vector3): THREE.Vector3 => {
  return new THREE.Vector3(
    Math.max(WORLD_BOUNDS.MIN_X, Math.min(WORLD_BOUNDS.MAX_X, position.x)),
    position.y,
    Math.max(WORLD_BOUNDS.MIN_Z, Math.min(WORLD_BOUNDS.MAX_Z, position.z))
  );
};

/**
 * Calculate distance between two 3D positions
 */
export const distance3D = (pos1: THREE.Vector3, pos2: THREE.Vector3): number => {
  return pos1.distanceTo(pos2);
};

/**
 * Calculate 2D distance (ignoring Y axis)
 */
export const distance2D = (pos1: THREE.Vector3, pos2: THREE.Vector3): number => {
  const dx = pos1.x - pos2.x;
  const dz = pos1.z - pos2.z;
  return Math.sqrt(dx * dx + dz * dz);
};

/**
 * Create a glowing material with emissive properties
 */
export const createGlowMaterial = (
  color: string | number,
  intensity: number = 0.3
): THREE.MeshPhongMaterial => {
  const colorObj = new THREE.Color(color);
  return new THREE.MeshPhongMaterial({
    color: colorObj,
    emissive: colorObj,
    emissiveIntensity: intensity
  });
};

/**
 * Create Lego-style material with subtle shine
 */
export const createLegoMaterial = (color: string | number): THREE.MeshPhongMaterial => {
  return new THREE.MeshPhongMaterial({
    color,
    shininess: 30,
    specular: 0x111111
  });
};

/**
 * Animate floating effect
 */
export const animateFloat = (
  object: THREE.Object3D,
  baseY: number,
  amplitude: number = 0.3,
  speed: number = 0.001
): void => {
  object.position.y = baseY + Math.sin(Date.now() * speed) * amplitude;
};

/**
 * Animate glow intensity based on distance
 */
export const calculateGlowIntensity = (
  distance: number,
  maxDistance: number,
  minIntensity: number = 0.1,
  maxIntensity: number = 0.5
): number => {
  const normalizedDistance = Math.min(distance / maxDistance, 1);
  return maxIntensity - (normalizedDistance * (maxIntensity - minIntensity));
};

/**
 * Create circular arrangement of objects - more compact for better navigation
 */
export const createCircularPositions = (
  count: number,
  radius: number,
  centerX: number = 0,
  centerZ: number = 0
): THREE.Vector3[] => {
  const positions: THREE.Vector3[] = [];
  // Reduce radius if it's too large for the smaller world
  const adjustedRadius = Math.min(radius, 6);
  
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const x = centerX + Math.cos(angle) * adjustedRadius;
    const z = centerZ + Math.sin(angle) * adjustedRadius;
    positions.push(new THREE.Vector3(x, 0, z));
  }
  return positions;
};

/**
 * Create valley formation positions for art gallery - more compact layout
 */
export const createValleyPositions = (
  totalCount: number,
  centerX: number,
  centerZ: number
): THREE.Vector3[] => {
  const positions: THREE.Vector3[] = [];
  const rows = [4, 5, 4]; // 4-5-4 pattern
  let currentIndex = 0;
  
  rows.forEach((itemsInRow, rowIndex) => {
    const rowZ = centerZ + (rowIndex - 1) * 5; // Reduced from 8 to 5 units apart
    const startX = centerX - ((itemsInRow - 1) * 4) / 2; // Reduced from 6 to 4 units spacing
    
    for (let i = 0; i < itemsInRow && currentIndex < totalCount; i++) {
      const x = startX + i * 4;
      const y = Math.random() * 1.5; // Slightly reduced height variation
      positions.push(new THREE.Vector3(x, y, rowZ));
      currentIndex++;
    }
  });
  
  return positions;
};
