import React from 'react';
import { useLocale } from '../../../state/locale';

/**
 * EN / RU.
 *
 * Sited bottom-left rather than in a menu: it is the first thing a Russian
 * reader needs and the last thing they should have to hunt for.
 *
 * PROVISIONAL STYLING.
 */
const LocaleToggle: React.FC = () => {
  const [locale, setLocale] = useLocale();

  return (
    <div
      className="fixed z-30 flex"
      style={{
        left: 'calc(env(safe-area-inset-left, 0px) + 16px)',
        top: 'calc(env(safe-area-inset-top, 0px) + 16px)',
        borderRadius: '999px',
        overflow: 'hidden',
        background: 'rgba(26, 20, 16, 0.72)'
      }}
    >
      {(['en', 'ru'] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setLocale(option)}
          aria-pressed={locale === option}
          style={{
            padding: '8px 14px',
            minHeight: '40px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: locale === option ? '#1A1410' : 'rgba(237, 230, 210, 0.75)',
            background: locale === option ? '#EDE6D2' : 'transparent'
          }}
        >
          {option}
        </button>
      ))}
    </div>
  );
};

export default LocaleToggle;
