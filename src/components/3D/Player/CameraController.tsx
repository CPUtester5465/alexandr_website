import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { controlState, shortestAngleTo } from '../../../state/controlState';
import { CAMERA_CONFIG, MAX_FRAME_DELTA } from '../../../utils/constants';
import { groundHeightAt } from '../../../world/terrain';

/**
 * The camera, which nobody should have to operate.
 *
 * Five jobs, in the order they matter:
 *
 *   1. NEVER ROTATE WHILE THE PLAYER IS STEERING. This is the big one and it is
 *      why the controls felt wrong. Camera-relative movement is standard and
 *      correct, but if the camera turns while a direction is being held, the
 *      frame that direction means turns with it -- the world swings under him,
 *      and letting go and pressing again sends him somewhere else. Every game
 *      that does this well recentres when you STOP, not while you go. Mario 64
 *      and Zelda both put recentring on a button for exactly this reason.
 *   2. Never end up inside anything. A spring arm casts from the player out to
 *      where the camera wants to be and pulls it in if the way is blocked.
 *   3. Track the ground he is over, not his head. Jumping should not move the
 *      camera; terrain should, but slowly.
 *   4. Look where he is going, not where he is.
 *   5. Get out of the way when someone takes hold of it, and quietly come back.
 *
 * Auto-follow is only safe because of the two-yaw split in controlState: the
 * heading is read in `inputYaw`, which is frozen while an input is held, so
 * nothing this file does can feed back into where the character is trying to go.
 * Without that the two chase each other and he spins on the spot forever.
 */

export { globalPlayerPosition } from '../../../state/controlState';

/**
 * Approach per second, so the follow feels the same at 60 Hz and 120 Hz.
 *
 * Horizontal is tight and vertical is loose, deliberately. Smoothing sideways
 * makes the camera lag behind fast movement, which feels like drag; smoothing
 * vertically absorbs every bump in the terrain, which is the whole point.
 */
const HORIZONTAL_SMOOTH = 0.0006;
const VERTICAL_SMOOTH = 0.06;
const AIM_SMOOTH = 0.0001;

/**
 * Does this object, or anything it hangs from, opt out of blocking the camera?
 *
 * Walking the parent chain matters: the character is a group of seven meshes
 * and the flag lives on the group. Testing only the hit object let the spring
 * arm hit his own back, pull the camera to the minimum, miss on the next frame
 * and release -- which reads as the camera pulsing in and out as he moves.
 */
function isCameraTransparent(object: THREE.Object3D | null): boolean {
  for (let node = object; node; node = node.parent) {
    if (node.userData?.cameraTransparent === true) return true;
  }
  return false;
}

const desired = new THREE.Vector3();
const aim = new THREE.Vector3();
const origin = new THREE.Vector3();
const smoothedAim = new THREE.Vector3();
const toCamera = new THREE.Vector3();
const track = new THREE.Vector3();

/** Top speed, for normalising look-ahead. Kept local to avoid a config import cycle. */
const PLAYER_SPEED_REF = 18;

const CameraController: React.FC = () => {
  const { scene } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const idleFor = useRef(0);
  const trackedY = useRef(0);

  useFrame(({ camera }, rawDelta) => {
    const delta = Math.min(rawDelta, MAX_FRAME_DELTA);
    const { playerPosition, heading } = controlState;

    // --- 5. manual authority ------------------------------------------------
    if (controlState.manualCameraFor > 0) {
      controlState.manualCameraFor = Math.max(0, controlState.manualCameraFor - delta);
    }

    // --- 1. recentre only when he is NOT steering ---------------------------
    const steering = controlState.activeInputs > 0;
    idleFor.current = steering ? 0 : idleFor.current + delta;

    const mayRecentre =
      !steering &&
      controlState.manualCameraFor === 0 &&
      idleFor.current > CAMERA_CONFIG.RECENTRE_DELAY_S;

    if (mayRecentre) {
      const offBy = shortestAngleTo(controlState.cameraYaw, heading + Math.PI);
      const slack = CAMERA_CONFIG.FOLLOW_DEAD_ZONE;
      if (Math.abs(offBy) > slack) {
        const past = offBy - Math.sign(offBy) * slack;
        controlState.cameraYaw += past * Math.min(1, CAMERA_CONFIG.FOLLOW_RATE * delta);
      }
    }

    // --- 3. track the ground, not the man -----------------------------------
    // Following his actual y would send the camera up with every jump. Follow
    // the ground under him instead, and follow it slowly.
    const ground = groundHeightAt(playerPosition.x, playerPosition.z);
    trackedY.current += (ground - trackedY.current) * (1 - Math.pow(VERTICAL_SMOOTH, delta));
    track.set(playerPosition.x, trackedY.current, playerPosition.z);

    // --- 4. aim ahead of him ------------------------------------------------
    const lead = (controlState.speed / PLAYER_SPEED_REF) * CAMERA_CONFIG.LOOK_AHEAD;
    aim.copy(track).add(CAMERA_CONFIG.LOOK_AT_OFFSET);
    aim.x += Math.sin(heading) * lead;
    aim.z += Math.cos(heading) * lead;
    smoothedAim.lerp(aim, 1 - Math.pow(AIM_SMOOTH, delta));

    // --- where it would like to be ------------------------------------------
    const { cameraYaw, cameraPitch, cameraDistance } = controlState;
    const horizontal = Math.cos(cameraPitch) * cameraDistance;
    desired.set(
      track.x + Math.sin(cameraYaw) * horizontal,
      track.y + Math.sin(cameraPitch) * cameraDistance,
      track.z + Math.cos(cameraYaw) * horizontal
    );

    // --- 2. spring arm ------------------------------------------------------
    // Cast from his head, not his hip. The hip sits level with the ground he is
    // standing on, so a low camera angle grazes the terrain under his feet.
    origin.copy(track).add(CAMERA_CONFIG.LOOK_AT_OFFSET);
    toCamera.copy(desired).sub(origin);
    const reach = toCamera.length();
    if (reach > 0.001) {
      toCamera.divideScalar(reach);
      raycaster.set(origin, toCamera);
      raycaster.far = reach;
      const blockers = raycaster.intersectObjects(scene.children, true)
        .filter((hit) => !isCameraTransparent(hit.object) && hit.distance > 0.05);
      if (blockers.length > 0) {
        const clear = Math.max(1.8, blockers[0].distance - CAMERA_CONFIG.COLLISION_MARGIN);
        desired.copy(origin).addScaledVector(toCamera, clear);
      }
    }
    desired.y = Math.max(desired.y, ground + 1.6);

    // Horizontal tight, vertical loose.
    const h = 1 - Math.pow(HORIZONTAL_SMOOTH, delta);
    const vertical = 1 - Math.pow(VERTICAL_SMOOTH, delta);
    camera.position.x += (desired.x - camera.position.x) * h;
    camera.position.z += (desired.z - camera.position.z) * h;
    camera.position.y += (desired.y - camera.position.y) * vertical;

    camera.lookAt(smoothedAim);
  });

  return null;
};

export default CameraController;
