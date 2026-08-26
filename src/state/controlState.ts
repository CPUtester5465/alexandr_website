import * as THREE from 'three';
import { CAMERA_CONFIG, PLAYER_CONFIG } from '../utils/constants';

/**
 * Shared, mutable control state.
 *
 * Three things need to agree every frame -- the pointer handler, the camera and
 * the character -- and they are in different parts of the tree. React state
 * would re-render the scene sixty times a second to say "the player moved a
 * little", so this is a plain object read and written inside useFrame instead.
 *
 * It is deliberately the only piece of global mutable state in the app. Anything
 * that does not need to be read at frame rate belongs in React.
 */
export interface ControlState {
  /** Where the character is, in world space. */
  playerPosition: THREE.Vector3;
  /** Which way he is actually facing, radians. Turns toward desiredHeading. */
  heading: number;
  /** Current ground speed, units per second. */
  speed: number;

  /**
   * Where the controls are asking him to go, radians in world space, or null
   * for "no steering input". Set by the thumb, the mouse or the keyboard --
   * they all speak this one language, so the feel is identical across them.
   */
  desiredHeading: number | null;
  /** How hard, 0 to 1. A thumb near the player is a walk; far out is a run. */
  throttle: number;

  /**
   * Held camera-space input from the keyboard or an on-screen stick: x right,
   * y forward. Kept separate from `desiredHeading` because it must be
   * re-resolved against the camera every frame -- you can orbit the camera
   * with the right mouse button while W is still held down.
   */
  moveAxis: THREE.Vector2;

  /** Camera orbit around the player. */
  cameraYaw: number;
  cameraPitch: number;
  cameraDistance: number;

  /** Set by a double tap or the space bar; cleared once the jump is applied. */
  jumpQueued: boolean;
}

export const controlState: ControlState = {
  playerPosition: new THREE.Vector3(0, PLAYER_CONFIG.HEIGHT, 3),
  heading: 0,
  speed: 0,
  desiredHeading: null,
  throttle: 0,
  moveAxis: new THREE.Vector2(0, 0),
  cameraYaw: 0,
  cameraPitch: CAMERA_CONFIG.INITIAL_PITCH,
  cameraDistance: CAMERA_CONFIG.DISTANCE,
  jumpQueued: false
};

/** Stop steering. Called on pointer release, key release and focus loss. */
export function clearSteering(): void {
  controlState.desiredHeading = null;
  controlState.throttle = 0;
}

/** Reset to the spawn state. Used by tests. */
export function resetControlState(): void {
  controlState.playerPosition.set(0, PLAYER_CONFIG.HEIGHT, 3);
  controlState.heading = 0;
  controlState.speed = 0;
  controlState.desiredHeading = null;
  controlState.throttle = 0;
  controlState.moveAxis.set(0, 0);
  controlState.cameraYaw = 0;
  controlState.cameraPitch = CAMERA_CONFIG.INITIAL_PITCH;
  controlState.cameraDistance = CAMERA_CONFIG.DISTANCE;
  controlState.jumpQueued = false;
}

/**
 * Turn a camera-relative stick vector into a world heading.
 *
 * x is right, y is forward, both in camera space. Shared by every input so the
 * keyboard and the thumb cannot drift apart.
 */
export function headingFromCameraSpace(x: number, y: number, cameraYaw: number): number {
  // The camera orbits to (sin yaw, cos yaw) from the player, so walking away
  // from it is the negative of that; right is the cross product with up.
  const forwardX = -Math.sin(cameraYaw);
  const forwardZ = -Math.cos(cameraYaw);
  const rightX = Math.cos(cameraYaw);
  const rightZ = -Math.sin(cameraYaw);
  return Math.atan2(forwardX * y + rightX * x, forwardZ * y + rightZ * x);
}

/** Shortest signed angle from `from` to `to`, in radians. */
export function shortestAngleTo(from: number, to: number): number {
  let difference = (to - from) % (Math.PI * 2);
  if (difference > Math.PI) difference -= Math.PI * 2;
  if (difference < -Math.PI) difference += Math.PI * 2;
  return difference;
}

/**
 * Back-compat alias. `useCurrentSection` and the section components read the
 * player position from here.
 */
export const globalPlayerPosition = controlState.playerPosition;
