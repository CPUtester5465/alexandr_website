import React, { useEffect, useRef } from 'react';
import { controlState } from '../../../state/controlState';
import { CAMERA_CONFIG, GESTURE } from '../../../utils/constants';

/**
 * A place to put your other thumb, to look around.
 *
 * One finger on the world steers, so the camera had nowhere to go on a phone
 * except a two-finger drag -- which works, and which nobody discovers. This is
 * the second thumb, in the corner where it already rests.
 *
 * It writes straight into `controlState`, the same object the gesture handler
 * and the camera share, so there is exactly one camera and one way it moves.
 *
 * PROVISIONAL STYLING. The HUD is being redrawn once the design direction is
 * settled. The behaviour is not provisional.
 */
const LookPad: React.FC = () => {
  const padRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pad = padRef.current;
    const knob = knobRef.current;
    if (!pad) return;

    let pointerId: number | null = null;
    let lastX = 0;
    let lastY = 0;

    const setKnob = (x: number, y: number) => {
      if (knob) knob.style.transform = `translate(${x}px, ${y}px)`;
    };

    const onDown = (e: PointerEvent) => {
      if (pointerId !== null) return;
      pointerId = e.pointerId;
      lastX = e.clientX;
      lastY = e.clientY;
      pad.setPointerCapture(e.pointerId);
      e.preventDefault();
      e.stopPropagation();
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;

      controlState.cameraYaw -= dx * GESTURE.DRAG_SENSITIVITY * 1.6;
      controlState.cameraPitch = Math.min(
        CAMERA_CONFIG.MAX_PITCH,
        Math.max(CAMERA_CONFIG.MIN_PITCH, controlState.cameraPitch + dy * GESTURE.DRAG_SENSITIVITY * 1.6)
      );

      const rect = pad.getBoundingClientRect();
      const offsetX = Math.max(-26, Math.min(26, e.clientX - (rect.left + rect.width / 2)));
      const offsetY = Math.max(-26, Math.min(26, e.clientY - (rect.top + rect.height / 2)));
      setKnob(offsetX, offsetY);
      e.preventDefault();
    };

    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      pointerId = null;
      setKnob(0, 0);
    };

    pad.addEventListener('pointerdown', onDown);
    pad.addEventListener('pointermove', onMove);
    pad.addEventListener('pointerup', onUp);
    pad.addEventListener('pointercancel', onUp);
    return () => {
      pad.removeEventListener('pointerdown', onDown);
      pad.removeEventListener('pointermove', onMove);
      pad.removeEventListener('pointerup', onUp);
      pad.removeEventListener('pointercancel', onUp);
    };
  }, []);

  return (
    <div
      ref={padRef}
      aria-label="Look around"
      className="fixed z-30 rounded-full flex items-center justify-center select-none"
      style={{
        right: 'calc(env(safe-area-inset-right, 0px) + 18px)',
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 84px)',
        // 96px: comfortably above the 44px minimum a thumb reliably hits.
        width: '96px',
        height: '96px',
        touchAction: 'none',
        background: 'rgba(255,255,255,0.16)',
        border: '1px solid rgba(255,255,255,0.5)',
        cursor: 'grab'
      }}
    >
      <div
        ref={knobRef}
        style={{
          width: '34px',
          height: '34px',
          borderRadius: '999px',
          background: 'rgba(255,255,255,0.85)',
          transition: 'transform 90ms ease-out',
          pointerEvents: 'none'
        }}
      />
      <span
        style={{
          position: 'absolute',
          bottom: '-19px',
          fontSize: '10px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.9)',
          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          pointerEvents: 'none'
        }}
      >
        Look
      </span>
    </div>
  );
};

export default LookPad;
