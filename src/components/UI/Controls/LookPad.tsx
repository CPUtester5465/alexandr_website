import React, { useEffect, useRef } from 'react';
import { controlState } from '../../../state/controlState';

/**
 * The look joystick -- a real one this time.
 *
 * Deflection is a RATE: hold the knob left and the camera keeps turning left
 * until you let go. The camera consumes controlState.lookAxis every frame at
 * up to 2.6 rad/s. The previous version rotated only while the finger MOVED
 * (a trackpad in a joystick's clothing), so holding it deflected did nothing;
 * Tim caught it on a phone within a session.
 *
 * A small dead zone keeps a resting thumb from drifting the camera.
 *
 * PROVISIONAL STYLING.
 */
const RADIUS = 34;       // knob travel in px
const DEAD_ZONE = 0.14;  // fraction of deflection ignored

const LookPad: React.FC = () => {
  const padRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pad = padRef.current;
    const knob = knobRef.current;
    if (!pad) return;

    let pointerId: number | null = null;

    const setKnob = (x: number, y: number) => {
      if (knob) knob.style.transform = `translate(${x}px, ${y}px)`;
    };

    const deflect = (clientX: number, clientY: number) => {
      const rect = pad.getBoundingClientRect();
      let dx = clientX - (rect.left + rect.width / 2);
      let dy = clientY - (rect.top + rect.height / 2);
      const length = Math.hypot(dx, dy);
      if (length > RADIUS) {
        dx = (dx / length) * RADIUS;
        dy = (dy / length) * RADIUS;
      }
      setKnob(dx, dy);
      let ax = dx / RADIUS;
      let ay = dy / RADIUS;
      const mag = Math.hypot(ax, ay);
      if (mag < DEAD_ZONE) {
        ax = 0; ay = 0;
      } else {
        // Rescale so the usable range starts at zero past the dead zone.
        const scaled = (mag - DEAD_ZONE) / (1 - DEAD_ZONE);
        ax = (ax / mag) * scaled;
        ay = (ay / mag) * scaled;
      }
      controlState.lookAxis.set(ax, ay);
    };

    const release = () => {
      pointerId = null;
      controlState.lookAxis.set(0, 0);
      setKnob(0, 0);
    };

    const onDown = (e: PointerEvent) => {
      if (pointerId !== null) return;
      pointerId = e.pointerId;
      pad.setPointerCapture(e.pointerId);
      deflect(e.clientX, e.clientY);
      e.preventDefault();
      e.stopPropagation();
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      deflect(e.clientX, e.clientY);
      e.preventDefault();
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      release();
    };

    pad.addEventListener('pointerdown', onDown);
    pad.addEventListener('pointermove', onMove);
    pad.addEventListener('pointerup', onUp);
    pad.addEventListener('pointercancel', onUp);
    return () => {
      release();
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
        width: '96px',
        height: '96px',
        touchAction: 'none',
        background: 'rgba(26, 20, 16, 0.35)',
        border: '1px solid rgba(237, 230, 210, 0.5)',
        cursor: 'grab'
      }}
    >
      <div
        ref={knobRef}
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '999px',
          background: 'rgba(237, 230, 210, 0.9)',
          pointerEvents: 'none'
        }}
      />
      <span
        style={{
          position: 'absolute', bottom: '-19px', fontSize: '10px',
          letterSpacing: '0.08em', textTransform: 'uppercase',
          color: 'rgba(237, 230, 210, 0.9)', textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          pointerEvents: 'none'
        }}
      >
        Look
      </span>
    </div>
  );
};

export default LookPad;
