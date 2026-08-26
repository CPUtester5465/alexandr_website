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
 * Deliberately NOT a vehicle model. An earlier version gave him a turning
 * circle and cut the throttle when he was pointed the wrong way, which is
 * correct for a car and wrong for a boy -- it made him feel heavy and reluctant
 * on a phone. He turns quickly and goes where he is pointed. The small
 * acceleration and braking figures are there for weight, not for physics: they
 * are what stops a tap from twitching him and what lets him settle out of a
 * run instead of freezing mid-stride.
 *
 * All values are per second. They used to be per frame, which meant a 120 Hz
 * phone ran the character at double the speed of a 60 Hz laptop.
 */
export const PLAYER_CONFIG = {
  /** Top speed, units per second. */
  SPEED: 18,
  /** Reaches top speed in about a fifth of a second. */
  ACCELERATION: 90,
  /** Settles from a run in about a sixth of a second. */
  BRAKING: 110,
  /** Radians per second the facing may turn. A half turn takes ~0.2 s. */
  TURN_RATE: 16,
  JUMP_SPEED: 30,
  GRAVITY: 54,
  /** Hip height. The rig's origin is the hip, and its feet are 12px below. */
  HEIGHT: 1.38,
  SCALE: 1
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
  LOOK_AT_OFFSET: new THREE.Vector3(0, 1.4, 0),
  LERP_SPEED: 0.1,
  /**
   * Orbit distance, and the range a pinch may set.
   *
   * Pulled back from 14.4. The further out the camera sits, the smaller the
   * angular swing for a given amount of movement -- most of what read as
   * "wiggle" was parallax from being close, not the camera actually moving.
   */
  DISTANCE: 22,
  MIN_DISTANCE: 9,
  MAX_DISTANCE: 40,
  /** Pitch is clamped so the camera never dives below the ground plane. */
  MIN_PITCH: 0.12,
  MAX_PITCH: 1.15,
  INITIAL_PITCH: 0.64,

  /**
   * Auto-follow. The camera swings behind the direction of travel on its own;
   * touching it by hand suspends that for MANUAL_AUTHORITY_S.
   */
  FOLLOW_DEAD_ZONE: 0.30,      // radians of slack before it recentres at all
  FOLLOW_RATE: 1.6,            // how hard it pulls, per second, once it does
  MANUAL_AUTHORITY_S: 2.5,
  /**
   * Wait this long after the controls are released before recentring, so a
   * momentary lift between strides does not start the camera swinging.
   */
  RECENTRE_DELAY_S: 0.45,
  /** Look-ahead: how far in front of him the camera aims, at full speed. */
  LOOK_AHEAD: 3.2,
  /** Keep this much clear between the camera and whatever it hit. */
  COLLISION_MARGIN: 0.55
};

// Proximity detection
export const PROXIMITY = {
  TRIGGER_DISTANCE: 15,
  INTERACTION_DISTANCE: 5,
  SECTION_RADIUS: 25
};

/**
 * Pointer gesture thresholds, in CSS pixels and milliseconds.
 *
 * Steering is measured from the player's own position on screen, not from where
 * the finger first landed. Because the camera follows him he sits at roughly a
 * fixed point on the display, so a thumb held still gives a constant bearing and
 * he keeps going that way -- which is the behaviour being asked for. A floating
 * stick anchored at the touch point cannot do this: it reads zero until you drag.
 */
export const GESTURE = {
  /**
   * No steering closer to the player than this. Without it the bearing is
   * (finger - player) divided by nearly zero, and he spins.
   */
  STEER_DEAD_ZONE_PX: 34,
  /** Distance from the player at which the throttle is fully open. */
  STEER_FULL_THROTTLE_PX: 190,
  /** Beyond this much movement a press is a drag, not a tap. */
  TAP_SLOP_PX: 12,
  /** Longer than this and it is a hold, not a tap. */
  TAP_MAX_MS: 260,
  /** Two taps closer together than this, and near each other, mean jump. */
  DOUBLE_TAP_MS: 320,
  DOUBLE_TAP_SLOP_PX: 44,
  /** Radians of camera yaw per pixel dragged. */
  DRAG_SENSITIVITY: 0.006
};
