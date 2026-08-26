import React, { useEffect, useState } from 'react';
import { useWayHome } from '../../../state/hubState';
import { controlState } from '../../../state/controlState';

/**
 * Points back to the doorway.
 *
 * Necessary the moment a dimension stopped having edges. A door eleven units
 * from where you landed is findable for about thirty seconds; after that you
 * are lost in a meadow, which is charming exactly once.
 *
 * The arrow is relative to the camera, not to north, because the player has no
 * idea where north is and every idea of where the screen is pointing.
 *
 * PROVISIONAL STYLING.
 */
const WayHome: React.FC = () => {
  const home = useWayHome();
  const [reading, setReading] = useState({ angle: 0, distance: 0 });

  useEffect(() => {
    if (!home) return;
    // Ten times a second is plenty for a compass, and it keeps React out of
    // the frame loop.
    const id = window.setInterval(() => {
      const dx = home.x - controlState.playerPosition.x;
      const dz = home.z - controlState.playerPosition.z;
      const bearing = Math.atan2(dx, dz);
      // cameraYaw is where the camera sits relative to the player, so the
      // direction it looks is half a turn from that.
      const relative = bearing - (controlState.cameraYaw + Math.PI);
      setReading({ angle: relative, distance: Math.hypot(dx, dz) });
    }, 100);
    return () => window.clearInterval(id);
  }, [home]);

  if (!home) return null;

  return (
    <div
      className="fixed z-30 pointer-events-none flex items-center gap-2"
      style={{
        left: 'calc(env(safe-area-inset-left, 0px) + 16px)',
        top: 'calc(env(safe-area-inset-top, 0px) + 16px)',
        padding: '8px 12px',
        borderRadius: '999px',
        background: 'rgba(26, 20, 16, 0.7)',
        color: '#EDE6D2'
      }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden
           style={{ transform: `rotate(${reading.angle}rad)` }}>
        <path d="M8 1 L13 14 L8 11 L3 14 Z" fill="#EDE6D2" />
      </svg>
      <span style={{ fontSize: '12px', letterSpacing: '0.04em' }}>
        the way back · {Math.round(reading.distance)}m
      </span>
    </div>
  );
};

export default WayHome;
