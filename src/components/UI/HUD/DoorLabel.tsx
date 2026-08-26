import React from 'react';
import { useNearestDoor } from '../../../state/hubState';
import { subjectBySlug } from '../../../world/dimensions/subjects';
import { useLocale, pick } from '../../../state/locale';

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
  const [locale] = useLocale();
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
        {/* The name in the world is already the chosen language, so this shows
            the other one -- a Russian reader sees the English title he might
            meet elsewhere, and the reverse. */}
        <div style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '0.01em' }}>
          {pick(door.title, locale)}
        </div>
        <div style={{ fontSize: '13px', opacity: 0.62, marginTop: '2px' }}>
          {pick(door.title, locale === 'en' ? 'ru' : 'en')}
        </div>
        {/* A subject door carries what he actually won. This is the record --
            verified, never softened, never inflated -- and it belongs on the
            door rather than in a case in the middle of the room. */}
        {subject && (
          <div style={{ marginTop: '8px', textAlign: 'left' }}>
            {subject.records.map((record) => (
              <div key={record.competition.en} style={{ marginTop: '6px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600 }}>
                  {pick(record.result, locale)} · {record.year}
                </div>
                <div style={{ fontSize: '11px', opacity: 0.72, lineHeight: 1.35 }}>
                  {pick(record.competition, locale)}
                </div>
                {record.note && (
                  <div style={{ fontSize: '11px', opacity: 0.6, fontStyle: 'italic' }}>
                    {pick(record.note, locale)}
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
          {door.built
            ? pick({ en: 'Walk through', ru: 'Войти' }, locale)
            : pick({ en: 'Not built yet', ru: 'Ещё не построено' }, locale)}
        </div>
      </div>
    </div>
  );
};

export default DoorLabel;
