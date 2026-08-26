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
  /** Which way the character is facing, radians. */
  playerFacing: number;

  /** Camera orbit around the player. */
  cameraYaw: number;
  cameraPitch: number;
  cameraDistance: number;

  /**
   * Where the player tapped, or null. The character walks here and then stops.
   * Cleared by arriving, by a keyboard press, or by the joystick.
   */
  moveTarget: THREE.Vector3 | null;

  /**
   * Held direction from the keyboard or the on-screen stick, in camera space:
   * x is right, y is forward. Zero length means no held input.
   */
  moveAxis: THREE.Vector2;

  /** Set by a double tap or the space bar; cleared once the jump is applied. */
  jumpQueued: boolean;
}

export const controlState: ControlState = {
  playerPosition: new THREE.Vector3(0, PLAYER_CONFIG.HEIGHT, 3),
  playerFacing: 0,
  cameraYaw: 0,
  cameraPitch: CAMERA_CONFIG.INITIAL_PITCH,
  cameraDistance: CAMERA_CONFIG.DISTANCE,
  moveTarget: null,
  moveAxis: new THREE.Vector2(0, 0),
  jumpQueued: false
};

/** Reset to the spawn state. Used by tests, and by the loading screen. */
export function resetControlState(): void {
  controlState.playerPosition.set(0, PLAYER_CONFIG.HEIGHT, 3);
  controlState.playerFacing = 0;
  controlState.cameraYaw = 0;
  controlState.cameraPitch = CAMERA_CONFIG.INITIAL_PITCH;
  controlState.cameraDistance = CAMERA_CONFIG.DISTANCE;
  controlState.moveTarget = null;
  controlState.moveAxis.set(0, 0);
  controlState.jumpQueued = false;
}

/**
 * Back-compat alias. `useCurrentSection` and the section components read the
 * player position from here; they were importing it from CameraController,
 * which was a strange place for it to live.
 */
export const globalPlayerPosition = controlState.playerPosition;
