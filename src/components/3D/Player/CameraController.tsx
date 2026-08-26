import { useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { controlState, shortestAngleTo } from '../../../state/controlState';
import { CAMERA_CONFIG, MAX_FRAME_DELTA, PLAYER_CONFIG } from '../../../utils/constants';

/**
 * The camera, which nobody should have to operate.
 *
 * Four jobs, in the order they matter:
 *
 *   1. Never end up inside anything. A spring arm casts from the player out to
 *      where the camera wants to be and pulls it in if the way is blocked.
 *      Without this, any world with a wall in it puts you inside the wall.
 *   2. Swing behind the direction of travel, damped, with a dead zone so small
 *      course corrections do not slew the frame.
 *   3. Look where he is going, not where he is -- the aim point leads him along
 *      his heading in proportion to speed.
 *   4. Get out of the way when someone takes hold of it, and quietly come back.
 *
 * Auto-follow is only safe because of the two-yaw split in controlState: the
 * heading is read in `inputYaw`, which is frozen while an input is held, so
 * nothing this file does can feed back into where the character is trying to go.
 * Without that the two chase each other and he spins on the spot forever.
 */

export { globalPlayerPosition } from '../../../state/controlState';

/** Approach per second, so the follow feels the same at 60 Hz and 120 Hz. */
const POSITION_SMOOTH = 0.0009;
const AIM_SMOOTH = 0.0001;

const desired = new THREE.Vector3();
const aim = new THREE.Vector3();
const smoothedAim = new THREE.Vector3();
const toCamera = new THREE.Vector3();

const CameraController: React.FC = () => {
  const { scene } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);

  useFrame(({ camera }, rawDelta) => {
    const delta = Math.min(rawDelta, MAX_FRAME_DELTA);
    const { playerPosition, heading, speed } = controlState;

    // --- 4. manual authority ------------------------------------------------
    if (controlState.manualCameraFor > 0) {
      controlState.manualCameraFor = Math.max(0, controlState.manualCameraFor - delta);
    }

    // --- 2. swing behind him ------------------------------------------------
    // The camera sits at (sin yaw, cos yaw) from the player, so to be *behind*
    // someone walking along `heading` it wants to be half a turn round from it.
    if (controlState.manualCameraFor === 0 && speed > PLAYER_CONFIG.SPEED * 0.08) {
      const offBy = shortestAngleTo(controlState.cameraYaw, heading + Math.PI);
      const slack = CAMERA_CONFIG.FOLLOW_DEAD_ZONE;
      if (Math.abs(offBy) > slack) {
        const past = offBy - Math.sign(offBy) * slack;
        controlState.cameraYaw += past * Math.min(1, CAMERA_CONFIG.FOLLOW_RATE * delta);
      }
    }

    // --- 3. aim ahead of him ------------------------------------------------
    const lead = (speed / PLAYER_CONFIG.SPEED) * CAMERA_CONFIG.LOOK_AHEAD;
    aim.copy(playerPosition).add(CAMERA_CONFIG.LOOK_AT_OFFSET);
    aim.x += Math.sin(heading) * lead;
    aim.z += Math.cos(heading) * lead;
    // Damped separately from the position, and more slowly, so a sharp turn
    // does not whip the horizon across the screen.
    smoothedAim.lerp(aim, 1 - Math.pow(AIM_SMOOTH, delta));

    // --- where it would like to be ------------------------------------------
    const { cameraYaw, cameraPitch, cameraDistance } = controlState;
    const horizontal = Math.cos(cameraPitch) * cameraDistance;
    desired.set(
      playerPosition.x + Math.sin(cameraYaw) * horizontal,
      playerPosition.y + Math.sin(cameraPitch) * cameraDistance,
      playerPosition.z + Math.cos(cameraYaw) * horizontal
    );

    // --- 1. spring arm ------------------------------------------------------
    // Cast from the player outward. Anything in the way pulls the camera in to
    // just short of it rather than letting it pass through.
    toCamera.copy(desired).sub(playerPosition);
    const reach = toCamera.length();
    if (reach > 0.001) {
      toCamera.divideScalar(reach);
      raycaster.set(playerPosition, toCamera);
      raycaster.far = reach;
      const blockers = raycaster.intersectObjects(scene.children, true)
        .filter((hit) => hit.object.userData?.cameraTransparent !== true && hit.distance > 0.05);
      if (blockers.length > 0) {
        const clear = Math.max(1.2, blockers[0].distance - CAMERA_CONFIG.COLLISION_MARGIN);
        desired.copy(playerPosition).addScaledVector(toCamera, clear);
      }
    }

    // Never underground, however hard the pitch is pushed.
    desired.y = Math.max(desired.y, 1.2);

    camera.position.lerp(desired, 1 - Math.pow(POSITION_SMOOTH, delta));
    camera.lookAt(smoothedAim);
  });

  return null;
};

export default CameraController;
