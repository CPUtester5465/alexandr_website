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

/**
 * Player settings.
 *
 * These are **per second**, not per frame. They used to be per frame, which
 * meant a 120 Hz phone ran the character at double the speed of a 60 Hz laptop
 * and a background tab teleported him. The values below are the old per-frame
 * numbers multiplied by 60 so the feel on a 60 Hz display is unchanged.
 */
export const PLAYER_CONFIG = {
  SPEED: 18,          // was 0.3/frame
  JUMP_SPEED: 30,     // was 0.5/frame
  GRAVITY: 54,        // was 0.015/frame
  /** Fraction of horizontal speed retained per second when there is no input. */
  DAMPING_PER_SECOND: 0.85 ** 60,
  HEIGHT: 2.2,        // lifts the legs above the ground
  SCALE: 1,
  /** How close to a tapped point counts as having arrived. */
  ARRIVE_DISTANCE: 0.6
};

/**
 * Longest frame we will integrate in one step. Without this, returning to a
 * backgrounded tab delivers one enormous delta and the character is flung
 * across the world (or straight through the floor).
 */
export const MAX_FRAME_DELTA = 1 / 30;

// Camera settings
export const CAMERA_CONFIG = {
  FOV: 75,
  NEAR: 0.1,
  FAR: 1000,
  OFFSET: new THREE.Vector3(0, 8, 12),
  LOOK_AT_OFFSET: new THREE.Vector3(0, 2, 0),
  LERP_SPEED: 0.1,
  /** Orbit distance from the player, and the range a pinch may set. */
  DISTANCE: 14.4,
  MIN_DISTANCE: 6,
  MAX_DISTANCE: 30,
  /** Pitch is clamped so the camera never dives below the ground plane. */
  MIN_PITCH: 0.12,
  MAX_PITCH: 1.15,
  INITIAL_PITCH: 0.58
};

// Proximity detection
export const PROXIMITY = {
  TRIGGER_DISTANCE: 15,
  INTERACTION_DISTANCE: 5,
  SECTION_RADIUS: 25
};

/** Pointer gesture thresholds, in CSS pixels and milliseconds. */
export const GESTURE = {
  /** Beyond this much movement a press is a drag, not a tap. */
  TAP_SLOP_PX: 10,
  /** Longer than this and it is a press-and-hold, not a tap. */
  TAP_MAX_MS: 400,
  /** Two taps closer together than this, and near each other, mean jump. */
  DOUBLE_TAP_MS: 320,
  DOUBLE_TAP_SLOP_PX: 40,
  /** Radians of camera yaw per pixel dragged. */
  DRAG_SENSITIVITY: 0.006
};
