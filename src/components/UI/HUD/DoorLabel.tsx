import React from 'react';
import { useNearestDoor } from '../../../state/hubState';

/**
 * Names the door he is standing at.
 *
 * In the DOM rather than in the scene, and that is deliberate for now: 3D text
 * needs a font with real Cyrillic coverage picked and self-hosted, and the
 * fallback troika reaches for looks visibly wrong beside a chosen face. The
 * browser already has the fonts. This moves into the world once that choice is
 * made.
 *
 * PROVISIONAL STYLING.
 */
const DoorLabel: React.FC = () => {
  const door = useNearestDoor();
  if (!door) return null;

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-30 text-center pointer-events-none"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 76px)' }}
    >
      <div
        style={{
          display: 'inline-block',
          padding: '10px 20px',
          borderRadius: '10px',
          background: 'rgba(26, 20, 16, 0.82)',
          border: `1px solid #${door.colour.toString(16).padStart(6, '0')}`,
          color: '#EDE6D2'
        }}
      >
        <div style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '0.01em' }}>
          {door.title.en}
        </div>
        <div style={{ fontSize: '13px', opacity: 0.7, marginTop: '2px' }}>
          {door.title.ru}
        </div>
        <div
          style={{
            fontSize: '10px',
            marginTop: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            opacity: 0.75
          }}
        >
          {door.built ? 'Open — walk through' : 'Not built yet'}
        </div>
      </div>
    </div>
  );
};

export default DoorLabel;
