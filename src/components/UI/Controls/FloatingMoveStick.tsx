import React, { useEffect, useRef } from 'react';
import { controlState, engageInput, releaseInput } from '../../../state/controlState';

/**
 * Movement, Mobile Legends style -- Tim's spec, replacing hold-to-steer.
 *
 * The left zone of the screen is the movement area: touch anywhere in it and
 * a joystick APPEARS UNDER THE FINGER; deflection drives camera-relative
 * movement through the same moveAxis the keyboard writes, so the character
 * code cannot tell a thumb from WASD. Release and it vanishes.
 *
 * The earlier objection ("a floating stick reads zero until you drag") is
 * answered by how ML actually feels: the base spawns where you land, so the
 * first millimetre of drag is already deflection. Kids know this control
 * from the games they play; that is worth more than my reasoning was.
 *
 * The input frame freezes for the duration of the hold (engageInput), so the
 * auto-following camera cannot bend a held direction -- same guarantee the
 * keyboard has.
 */
const RADIUS = 46;
const DEAD_ZONE = 0.1;

const FloatingMoveStick: React.FC = () => {
  const zoneRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const zone = zoneRef.current;
    const base = baseRef.current;
    const knob = knobRef.current;
    if (!zone || !base || !knob) return;

    let pointerId: number | null = null;
    let originX = 0;
    let originY = 0;

    const show = (x: number, y: number) => {
      base.style.display = 'block';
      base.style.left = `${x - 55}px`;
      base.style.top = `${y - 55}px`;
      knob.style.transform = 'translate(0px, 0px)';
    };
    const hide = () => {
      base.style.display = 'none';
      controlState.moveAxis.set(0, 0);
    };

    const onDown = (e: PointerEvent) => {
      if (pointerId !== null) return;
      pointerId = e.pointerId;
      originX = e.clientX;
      originY = e.clientY;
      zone.setPointerCapture(e.pointerId);
      show(originX, originY);
      engageInput();
      e.preventDefault();
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      let dx = e.clientX - originX;
      let dy = e.clientY - originY;
      const len = Math.hypot(dx, dy);
      if (len > RADIUS) {
        dx = (dx / len) * RADIUS;
        dy = (dy / len) * RADIUS;
      }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      let ax = dx / RADIUS;
      let ay = -dy / RADIUS;   // screen y is down; stick forward is up
      const mag = Math.hypot(ax, ay);
      if (mag < DEAD_ZONE) {
        controlState.moveAxis.set(0, 0);
      } else {
        const scaled = (mag - DEAD_ZONE) / (1 - DEAD_ZONE);
        controlState.moveAxis.set((ax / mag) * scaled, (ay / mag) * scaled);
      }
      e.preventDefault();
    };

    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      pointerId = null;
      hide();
      releaseInput();
    };

    zone.addEventListener('pointerdown', onDown);
    zone.addEventListener('pointermove', onMove);
    zone.addEventListener('pointerup', onUp);
    zone.addEventListener('pointercancel', onUp);
    return () => {
      if (pointerId !== null) releaseInput();
      hide();
      zone.removeEventListener('pointerdown', onDown);
      zone.removeEventListener('pointermove', onMove);
      zone.removeEventListener('pointerup', onUp);
      zone.removeEventListener('pointercancel', onUp);
    };
  }, []);

  return (
    <>
      {/* The movement zone: left 55% of the screen, under the HUD chrome. */}
      <div
        ref={zoneRef}
        className="fixed z-20"
        style={{
          left: 0, top: '15%', bottom: 0, width: '55%',
          touchAction: 'none'
        }}
      />
      <div
        ref={baseRef}
        className="fixed z-30 pointer-events-none"
        style={{
          display: 'none', width: '110px', height: '110px',
          borderRadius: '999px',
          background: 'rgba(26, 20, 16, 0.28)',
          border: '1.5px solid rgba(237, 230, 210, 0.55)'
        }}
      >
        <div
          ref={knobRef}
          style={{
            position: 'absolute', left: '31px', top: '31px',
            width: '48px', height: '48px', borderRadius: '999px',
            background: 'rgba(237, 230, 210, 0.92)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.35)'
          }}
        />
      </div>
    </>
  );
};

export default FloatingMoveStick;
