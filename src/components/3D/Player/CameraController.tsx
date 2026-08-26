import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { controlState } from '../../../state/controlState';
import { CAMERA_CONFIG, MAX_FRAME_DELTA } from '../../../utils/constants';

/**
 * Third-person camera that orbits the player.
 *
 * It used to be nailed to a constant offset of (0, 8, 12) and could not turn at
 * all, on any device -- you saw the world from exactly one angle for the whole
 * visit. Yaw, pitch and distance now come from `controlState`, which
 * PointerControls writes on drag, pinch and wheel.
 *
 * The follow is frame-rate independent. `lerp(x, 0.05)` per frame reaches a
 * different place on a 60 Hz laptop than on a 120 Hz phone; the exponential
 * form below reaches the same place per second on both.
 */

// Re-exported because the sections and useCurrentSection have always imported
// the player position from this file. The value itself now lives in state.
export { globalPlayerPosition } from '../../../state/controlState';

const SMOOTH_PER_SECOND = 0.05;

const desired = new THREE.Vector3();
const lookAt = new THREE.Vector3();

const CameraController: React.FC = () => {
  useFrame(({ camera }, rawDelta) => {
    const delta = Math.min(rawDelta, MAX_FRAME_DELTA);
    const { playerPosition, cameraYaw, cameraPitch, cameraDistance } = controlState;

    // Spherical orbit around the player. Pitch is already clamped away from the
    // horizon and the ground by PointerControls.
    const horizontal = Math.cos(cameraPitch) * cameraDistance;
    desired.set(
      playerPosition.x + Math.sin(cameraYaw) * horizontal,
      playerPosition.y + Math.sin(cameraPitch) * cameraDistance,
      playerPosition.z + Math.cos(cameraYaw) * horizontal
    );

    // Never let the camera end up underground, however extreme the pitch.
    desired.y = Math.max(desired.y, 1.5);

    const t = 1 - Math.pow(SMOOTH_PER_SECOND, delta);
    camera.position.lerp(desired, t);

    lookAt.copy(playerPosition).add(CAMERA_CONFIG.LOOK_AT_OFFSET);
    camera.lookAt(lookAt);
  });

  return null;
};

export default CameraController;
