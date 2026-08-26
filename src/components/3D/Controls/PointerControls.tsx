import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { controlState } from '../../../state/controlState';
import { CAMERA_CONFIG, GESTURE, WORLD_BOUNDS } from '../../../utils/constants';

/**
 * Every pointer gesture in the world, handled at the DOM level.
 *
 *   tap          walk to that spot
 *   double tap   jump
 *   drag         look around
 *   pinch        move the camera in and out
 *   wheel        the same, for a mouse
 *
 * This deliberately does not use react-three-fiber's own pointer events. Tap
 * and drag start with the identical `pointerdown`, and the difference only
 * becomes clear on `pointerup` -- so the two gestures have to be resolved by
 * one piece of code that sees the whole sequence. Splitting them across r3f's
 * synthetic events and DOM listeners means racing on which fires first.
 *
 * The ground is intersected mathematically against the y=0 plane rather than by
 * raycasting the scene, which is both exact and free: no traversal, and no
 * dependence on the ground mesh existing or being big enough.
 */

const GROUND_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

interface ActivePointer {
  id: number;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  startedAt: number;
  moved: boolean;
}

const PointerControls: React.FC = () => {
  const { gl, camera } = useThree();

  useEffect(() => {
    const el = gl.domElement;
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const hit = new THREE.Vector3();

    const pointers = new Map<number, ActivePointer>();
    let lastTapAt = 0;
    let lastTapX = 0;
    let lastTapY = 0;
    let pinchStartDistance = 0;
    let pinchStartCameraDistance = 0;

    /** Where does a screen point land on the ground? Null if it never does. */
    const groundPointAt = (clientX: number, clientY: number): THREE.Vector3 | null => {
      const rect = el.getBoundingClientRect();
      ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      // Null when the ray points at or above the horizon, which is what a tap
      // on the sky does. Walking to "infinitely far away" is not a thing.
      if (!raycaster.ray.intersectPlane(GROUND_PLANE, hit)) return null;
      return hit.clone();
    };

    const distanceBetween = (a: ActivePointer, b: ActivePointer) =>
      Math.hypot(a.lastX - b.lastX, a.lastY - b.lastY);

    const onPointerDown = (e: PointerEvent) => {
      // Ignore right/middle mouse buttons; they belong to the browser.
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      el.setPointerCapture?.(e.pointerId);
      pointers.set(e.pointerId, {
        id: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        startedAt: performance.now(),
        moved: false
      });

      if (pointers.size === 2) {
        const [a, b] = Array.from(pointers.values());
        pinchStartDistance = distanceBetween(a, b);
        pinchStartCameraDistance = controlState.cameraDistance;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const p = pointers.get(e.pointerId);
      if (!p) return;

      const dx = e.clientX - p.lastX;
      const dy = e.clientY - p.lastY;
      p.lastX = e.clientX;
      p.lastY = e.clientY;

      if (Math.hypot(e.clientX - p.startX, e.clientY - p.startY) > GESTURE.TAP_SLOP_PX) {
        p.moved = true;
      }

      if (pointers.size >= 2) {
        // Two fingers: pinch to zoom, and no looking around. Trying to do both
        // at once with two fingers feels like a fight.
        const [a, b] = Array.from(pointers.values());
        const current = distanceBetween(a, b);
        if (pinchStartDistance > 0 && current > 0) {
          controlState.cameraDistance = THREE.MathUtils.clamp(
            pinchStartCameraDistance * (pinchStartDistance / current),
            CAMERA_CONFIG.MIN_DISTANCE,
            CAMERA_CONFIG.MAX_DISTANCE
          );
        }
        return;
      }

      if (!p.moved) return;

      controlState.cameraYaw -= dx * GESTURE.DRAG_SENSITIVITY;
      controlState.cameraPitch = THREE.MathUtils.clamp(
        controlState.cameraPitch + dy * GESTURE.DRAG_SENSITIVITY,
        CAMERA_CONFIG.MIN_PITCH,
        CAMERA_CONFIG.MAX_PITCH
      );
    };

    const endPointer = (e: PointerEvent) => {
      const p = pointers.get(e.pointerId);
      if (!p) return;
      pointers.delete(e.pointerId);
      el.releasePointerCapture?.(e.pointerId);
      if (pointers.size < 2) pinchStartDistance = 0;

      const heldFor = performance.now() - p.startedAt;
      const isTap = !p.moved && heldFor < GESTURE.TAP_MAX_MS;
      if (!isTap) return;

      const now = performance.now();
      const isDoubleTap =
        now - lastTapAt < GESTURE.DOUBLE_TAP_MS &&
        Math.hypot(e.clientX - lastTapX, e.clientY - lastTapY) < GESTURE.DOUBLE_TAP_SLOP_PX;

      if (isDoubleTap) {
        controlState.jumpQueued = true;
        // Consume it, so a third tap starts a fresh pair rather than firing again.
        lastTapAt = 0;
        return;
      }

      lastTapAt = now;
      lastTapX = e.clientX;
      lastTapY = e.clientY;

      const target = groundPointAt(e.clientX, e.clientY);
      if (!target) return;
      target.x = THREE.MathUtils.clamp(target.x, WORLD_BOUNDS.MIN_X, WORLD_BOUNDS.MAX_X);
      target.z = THREE.MathUtils.clamp(target.z, WORLD_BOUNDS.MIN_Z, WORLD_BOUNDS.MAX_Z);
      target.y = 0;
      controlState.moveTarget = target;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      controlState.cameraDistance = THREE.MathUtils.clamp(
        controlState.cameraDistance + e.deltaY * 0.02,
        CAMERA_CONFIG.MIN_DISTANCE,
        CAMERA_CONFIG.MAX_DISTANCE
      );
    };

    // touch-action:none stops the browser from claiming the gesture as a scroll
    // or a page zoom before we ever see the second pointermove.
    const previousTouchAction = el.style.touchAction;
    el.style.touchAction = 'none';

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', endPointer);
    el.addEventListener('pointercancel', endPointer);
    el.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      el.style.touchAction = previousTouchAction;
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', endPointer);
      el.removeEventListener('pointercancel', endPointer);
      el.removeEventListener('wheel', onWheel);
    };
  }, [gl, camera]);

  return null;
};

export default PointerControls;
