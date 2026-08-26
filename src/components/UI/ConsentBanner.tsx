import React, { useEffect, useState } from 'react';
import { useLocale, pick } from '../../state/locale';

/**
 * Consent, in the site's own hand.
 *
 * Reject is exactly as easy as accept -- same size, same row, no dark
 * patterns. The choice is stored locally and honoured by the Consent Mode
 * defaults in index.html before the tag ever loads; this banner only ever
 * UPGRADES consent, never assumes it. Reopenable from the corner once
 * answered, because minds change.
 *
 * The copy is short enough for a twelve-year-old, because one made the site.
 */

type Choice = 'granted' | 'denied' | null;

const KEY = 'ag.consent';

declare global {
  interface Window { gtag?: (...args: unknown[]) => void }
}

function stored(): Choice {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch { return null; }
}

const ConsentBanner: React.FC = () => {
  const [choice, setChoice] = useState<Choice>(stored);
  const [open, setOpen] = useState(choice === null);
  const [locale] = useLocale();

  useEffect(() => {
    if (choice === 'granted') {
      window.gtag?.('consent', 'update', { analytics_storage: 'granted' });
    }
  }, [choice]);

  const decide = (next: Exclude<Choice, null>) => {
    try { localStorage.setItem(KEY, next); } catch { /* private browsing */ }
    setChoice(next);
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed z-40"
        style={{
          right: 'calc(env(safe-area-inset-right, 0px) + 16px)',
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
          padding: '6px 10px', borderRadius: '999px',
          background: 'rgba(26,20,16,0.6)', color: 'rgba(237,230,210,0.75)',
          fontSize: '10px', letterSpacing: '0.06em'
        }}
      >
        {pick({ en: 'cookies', ru: 'куки' }, locale)}
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      className="fixed z-40"
      style={{
        left: '50%', transform: 'translateX(-50%)',
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 14px)',
        maxWidth: 'min(440px, calc(100vw - 24px))',
        padding: '14px 16px', borderRadius: '14px',
        background: 'rgba(26, 20, 16, 0.94)',
        border: '1px solid rgba(237, 230, 210, 0.25)',
        color: '#EDE6D2'
      }}
    >
      <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.45 }}>
        {pick({
          en: 'This site can count visits with Google Analytics. Nothing is counted unless you say yes.',
          ru: 'Сайт может считать посещения через Google Analytics. Без вашего согласия ничего не считается.'
        }, locale)}
      </p>
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button
          type="button"
          onClick={() => decide('granted')}
          style={{
            flex: 1, padding: '10px 0', minHeight: '42px', borderRadius: '9px',
            background: '#EDE6D2', color: '#1A1410', fontSize: '13px', fontWeight: 600
          }}
        >
          {pick({ en: 'Yes, count me', ru: 'Да, считайте' }, locale)}
        </button>
        <button
          type="button"
          onClick={() => decide('denied')}
          style={{
            flex: 1, padding: '10px 0', minHeight: '42px', borderRadius: '9px',
            background: 'rgba(237,230,210,0.12)', color: '#EDE6D2',
            border: '1px solid rgba(237,230,210,0.3)', fontSize: '13px', fontWeight: 600
          }}
        >
          {pick({ en: 'No thanks', ru: 'Нет, спасибо' }, locale)}
        </button>
      </div>
    </div>
  );
};

export default ConsentBanner;
