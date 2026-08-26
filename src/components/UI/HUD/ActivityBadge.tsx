import React from 'react';
import { useActiveDimension } from '../../../state/dimensionState';
import { useActivity } from '../../../state/activityState';
import { useLocale, pick } from '../../../state/locale';

/**
 * The activity counter, named in the world's own terms.
 *
 * Only appears once something has been done -- a zero badge is a nag, and the
 * discovery that seeds can be gathered belongs to the visitor.
 *
 * PROVISIONAL STYLING.
 */
const NAMES: Record<string, { en: [string, string]; ru: [string, string] }> = {
  poppy: { en: ['seed', 'seeds'], ru: ['семя', 'семян'] },
  pagoda: { en: ['shrine woken', 'shrines woken'], ru: ['святилище', 'святилищ'] }
};

const ActivityBadge: React.FC = () => {
  const spec = useActiveDimension();
  const [locale] = useLocale();
  const { count } = useActivity(spec?.slug ?? null);

  if (!spec || count === 0) return null;
  const names = NAMES[spec.slug];
  if (!names) return null;
  const label = pick(names, locale)[count === 1 ? 0 : 1];

  return (
    <div
      className="fixed z-30 pointer-events-none"
      style={{
        left: 'calc(env(safe-area-inset-left, 0px) + 16px)',
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 196px)',
        padding: '8px 14px',
        borderRadius: '999px',
        background: 'rgba(26, 20, 16, 0.72)',
        color: '#EDE6D2',
        fontSize: '12px',
        letterSpacing: '0.04em'
      }}
    >
      {count} {label}
    </div>
  );
};

export default ActivityBadge;
