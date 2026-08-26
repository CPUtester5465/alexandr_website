import React from 'react';
import { useNearestDoor } from '../../../state/hubState';
import { subjectBySlug } from '../../../world/dimensions/subjects';

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
  const subject = door.kind === 'subject' ? subjectBySlug(door.slug) : undefined;

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-30 text-center pointer-events-none"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 76px)', maxWidth: 'min(420px, 90vw)' }}
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
        {/* A subject door carries what he actually won. This is the record --
            verified, never softened, never inflated -- and it belongs on the
            door rather than in a case in the middle of the room. */}
        {subject && (
          <div style={{ marginTop: '8px', textAlign: 'left' }}>
            {subject.records.map((record) => (
              <div key={record.competition.en} style={{ marginTop: '6px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600 }}>
                  {record.result.en} · {record.year}
                </div>
                <div style={{ fontSize: '11px', opacity: 0.72, lineHeight: 1.35 }}>
                  {record.competition.en}
                </div>
                {record.note && (
                  <div style={{ fontSize: '11px', opacity: 0.6, fontStyle: 'italic' }}>
                    {record.note.en}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            fontSize: '10px',
            marginTop: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            opacity: 0.75
          }}
        >
          {door.built ? 'Walk through' : 'Not built yet'}
        </div>
      </div>
    </div>
  );
};

export default DoorLabel;
