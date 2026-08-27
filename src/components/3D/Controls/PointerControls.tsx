import { useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  clearSteering,
  controlState,
  engageInput,
  headingFromCameraSpace,
  releaseInput
} from '../../../state/controlState';
import { CAMERA_CONFIG, GESTURE } from '../../../utils/constants';

/**
 * Every pointer gesture in the world.
 *
 *   press and hold   steer -- he drives that way and keeps going
 *   double tap       jump
 *   two fingers      look around, and pinch to zoom
 *   right-drag       look around, with a mouse
 *   wheel            zoom
 *
 * Steering is a *bearing*, not a destination. Hold your thumb somewhere and he
 * heads that way until you move it or let go; he does not stop on arrival,
 * because there is no arrival. The bearing is measured from the player's own
 * position on screen -- and since the camera follows him, he sits at roughly a
 * fixed point, so a thumb held still yields a constant direction. That is what
 * makes it feel like driving rather than clicking a waypoint.
 *
 * Two things this deliberately does NOT do.
 *
 * A floating stick anchored where the finger lands reads zero until you drag,
 * so putting your thumb down does nothing -- the opposite of the behaviour
 * wanted here.
 *
 * One finger never rotates the camera. If it did, the camera yaw would feed
 * back into the bearing (which is computed from the camera basis), the bearing
 * would rotate the camera further, and the player would spin on the spot
 * forever. Looking around is two fingers, or the right mouse button.
 */

interface ActivePointer {
  id: number;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  startedAt: number;
  moved: boolean;
  isRightButton: boolean;
  /** True once this pointer has been part of a two-finger gesture. */
  usedForCamera: boolean;
}

const playerScreen = new THREE.Vector3();

const PointerControls: React.FC = () => {
  const { gl, camera, size } = useThree();

  // Steering is resolved every frame rather than on pointermove: the player
  // keeps moving under a motionless thumb, so the bearing has to be recomputed
  // even when no event fires.
  useFrame(() => {
    const steer = steerPointer;
    if (!steer) return;

    playerScreen.copy(controlState.playerPosition);
    playerScreen.y += 0.9; // aim at his chest, not his hip
    playerScreen.project(camera);

    const px = ((playerScreen.x + 1) / 2) * size.width;
    const py = ((1 - playerScreen.y) / 2) * size.height;

    const dx = steer.lastX - px;
    const dy = steer.lastY - py;
    const distance = Math.hypot(dx, dy);

    if (distance < GESTURE.STEER_DEAD_ZONE_PX) {
      controlState.throttle = 0;
      return;
    }

    controlState.throttle = THREE.MathUtils.clamp(
      (distance - GESTURE.STEER_DEAD_ZONE_PX) /
        (GESTURE.STEER_FULL_THROTTLE_PX - GESTURE.STEER_DEAD_ZONE_PX),
      0,
      1
    );
    // Screen y grows downward; forward on the stick is negative y.
    // inputYaw, not cameraYaw: the frame is frozen for the duration of the
    // hold so the auto-following camera cannot feed back into the bearing.
    controlState.desiredHeading = headingFromCameraSpace(dx, -dy, controlState.inputYaw);
  });

  useEffect(() => {
    const el = gl.domElement;
    const pointers = new Map<number, ActivePointer>();
    let lastTapAt = 0;
    let lastTapX = 0;
    let lastTapY = 0;
    let pinchStartDistance = 0;
    let pinchStartCameraDistance = 0;

    const distanceBetween = (a: ActivePointer, b: ActivePointer) =>
      Math.hypot(a.lastX - b.lastX, a.lastY - b.lastY);

    /** The one pointer currently steering, if any. */
    const findSteerPointer = (): ActivePointer | null => {
      if (pointers.size !== 1) return null;
      const only = pointers.values().next().value as ActivePointer;
      // A finger left over from a pinch must not become a steering input the
      // moment its partner lifts -- that sent him bolting across the world at
      // the end of every zoom. It needs a fresh press.
      if (only.isRightButton || only.usedForCamera) return null;
      return only;
    };

    let steerEngaged = false;
    const refreshSteer = () => {
      steerPointer = findSteerPointer();
      if (steerPointer && !steerEngaged) {
        engageInput();
        steerEngaged = true;
      } else if (!steerPointer && steerEngaged) {
        releaseInput();
        steerEngaged = false;
      }
      if (!steerPointer) clearSteering();
    };

    const orbit = (dx: number, dy: number) => {
      if (dx !== 0 || dy !== 0) controlState.manualCameraFor = CAMERA_CONFIG.MANUAL_AUTHORITY_S;
      controlState.cameraYaw -= dx * GESTURE.DRAG_SENSITIVITY;
      controlState.cameraPitch = THREE.MathUtils.clamp(
        controlState.cameraPitch + dy * GESTURE.DRAG_SENSITIVITY,
        CAMERA_CONFIG.MIN_PITCH,
        CAMERA_CONFIG.MAX_PITCH
      );
    };

    const zoomTo = (value: number) => {
      controlState.cameraDistance = THREE.MathUtils.clamp(
        value,
        CAMERA_CONFIG.MIN_DISTANCE,
        CAMERA_CONFIG.MAX_DISTANCE
      );
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 2) return;
      // On touch, movement belongs to the floating stick (Mobile Legends
      // grammar, Tim's spec) and jump to its button; the canvas keeps only
      // two-finger look/zoom. Single-finger steering stays for the mouse.
      if (e.pointerType === 'touch') {
        el.setPointerCapture?.(e.pointerId);
        pointers.set(e.pointerId, {
          id: e.pointerId, startX: e.clientX, startY: e.clientY,
          lastX: e.clientX, lastY: e.clientY, startedAt: performance.now(),
          moved: false, isRightButton: false, usedForCamera: true
        });
        if (pointers.size === 2) {
          const [a, b] = Array.from(pointers.values());
          pinchStartDistance = distanceBetween(a, b);
          pinchStartCameraDistance = controlState.cameraDistance;
        }
        return;
      }

      el.setPointerCapture?.(e.pointerId);
      pointers.set(e.pointerId, {
        id: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        startedAt: performance.now(),
        moved: false,
        isRightButton: e.pointerType === 'mouse' && e.button === 2,
        usedForCamera: false
      });

      if (pointers.size === 2) {
        const [a, b] = Array.from(pointers.values());
        pinchStartDistance = distanceBetween(a, b);
        pinchStartCameraDistance = controlState.cameraDistance;
        a.usedForCamera = true;
        b.usedForCamera = true;
      }
      refreshSteer();
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
        // Two fingers look and zoom; steering is suspended while they are down.
        const [a, b] = Array.from(pointers.values());
        const current = distanceBetween(a, b);
        if (pinchStartDistance > 0 && current > 0) {
          zoomTo(pinchStartCameraDistance * (pinchStartDistance / current));
        }
        // Orbit on the midpoint's travel, so a two-finger drag also looks.
        orbit(dx / 2, dy / 2);
        return;
      }

      if (p.isRightButton) orbit(dx, dy);
      // A single left/touch pointer steers, and steering is resolved in
      // useFrame -- nothing to do here beyond recording the position above.
    };

    const endPointer = (e: PointerEvent) => {
      const p = pointers.get(e.pointerId);
      if (!p) return;
      pointers.delete(e.pointerId);
      el.releasePointerCapture?.(e.pointerId);
      if (pointers.size < 2) pinchStartDistance = 0;
      refreshSteer();

      if (p.isRightButton) return;

      const heldFor = performance.now() - p.startedAt;
      if (p.moved || heldFor >= GESTURE.TAP_MAX_MS) return;

      const now = performance.now();
      const isDoubleTap =
        now - lastTapAt < GESTURE.DOUBLE_TAP_MS &&
        Math.hypot(e.clientX - lastTapX, e.clientY - lastTapY) < GESTURE.DOUBLE_TAP_SLOP_PX;

      if (isDoubleTap) {
        controlState.jumpQueued = true;
        lastTapAt = 0; // consume, so a third tap starts a fresh pair
        return;
      }

      lastTapAt = now;
      lastTapX = e.clientX;
      lastTapY = e.clientY;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomTo(controlState.cameraDistance + e.deltaY * 0.02);
    };

    // Right-drag is a camera control here, so the menu must not interrupt it.
    const onContextMenu = (e: Event) => e.preventDefault();

    // Without this the browser claims the gesture as a scroll or a page zoom
    // before the second pointermove ever arrives.
    const previousTouchAction = el.style.touchAction;
    el.style.touchAction = 'none';

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', endPointer);
    el.addEventListener('pointercancel', endPointer);
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('blur', clearSteering);

    return () => {
      el.style.touchAction = previousTouchAction;
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', endPointer);
      el.removeEventListener('pointercancel', endPointer);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('blur', clearSteering);
      pointers.clear();
      steerPointer = null;
      if (steerEngaged) releaseInput();
      clearSteering();
    };
  }, [gl, camera]);

  return null;
};

/**
 * Module-scoped so the frame loop and the event handlers share it without a
 * re-render. There is only ever one PointerControls in the tree.
 */
let steerPointer: ActivePointer | null = null;

export default PointerControls;
