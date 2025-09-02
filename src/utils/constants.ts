import * as THREE from 'three';

// World boundaries - enlarged for better exploration
export const WORLD_SIZE = 120; // Increased from 80 to 120 for more space
export const WORLD_BOUNDS = {
  MIN_X: -60,
  MAX_X: 60,
  MIN_Z: -60,
  MAX_Z: 60
};

// Section positions - closer to center for easy access
export const SECTIONS = {
  WELCOME: { x: 0, z: 0 },
  ACHIEVEMENTS: { x: 0, z: -20 },  // Moved closer: -25 -> -20
  ART_GALLERY: { x: 0, z: 20 },    // Moved closer: 25 -> 20
  ABOUT: { x: 20, z: 0 },          // Moved closer: 25 -> 20
  CONTACT: { x: -20, z: 0 }        // Moved closer: -25 -> -20
};

// Colors
export const COLORS = {
  PRIMARY: '#667eea',
  SECONDARY: '#764ba2',
  GROUND: '#7CFC00',
  SKY: '#87CEEB',
  CRYSTAL: '#E056FD'
};

// Player settings
export const PLAYER_CONFIG = {
  SPEED: 0.3,
  JUMP_SPEED: 0.5,
  GRAVITY: 0.015,
  HEIGHT: 2.2, // Increased from 1 to 2.2 to lift legs above ground
  SCALE: 1
};

// Camera settings
export const CAMERA_CONFIG = {
  FOV: 75,
  NEAR: 0.1,
  FAR: 1000,
  OFFSET: new THREE.Vector3(0, 8, 12),
  LOOK_AT_OFFSET: new THREE.Vector3(0, 2, 0),
  LERP_SPEED: 0.1
};

// Animation settings
export const ANIMATION_CONFIG = {
  CRYSTAL_ROTATION_SPEED: 0.01,
  FLOAT_AMPLITUDE: 0.3,
  FLOAT_SPEED: 0.001,
  GLOW_INTENSITY_MIN: 0.1,
  GLOW_INTENSITY_MAX: 0.5
};

// Proximity detection
export const PROXIMITY = {
  TRIGGER_DISTANCE: 15,
  INTERACTION_DISTANCE: 5,
  SECTION_RADIUS: 25
};
