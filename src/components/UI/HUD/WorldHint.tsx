import React, { useEffect, useState } from 'react';
import { useActiveDimension } from '../../../state/dimensionState';
import { useActivity } from '../../../state/activityState';
import { useLocale, pick } from '../../../state/locale';

/**
 * One sentence, once, on arrival: what this world wants from you.
 *
 * Tim: "it's not obvious for the user to just use, explore, and check how it
 * works." He is right -- a world with an invisible game is a screensaver. The
 * hint appears a beat after arrival, goes away on its own or the moment the
 * first activity fires (the discovery supersedes the instruction), and never
 * returns for that world this session.
 */
const HINTS: Record<string, { en: string; ru: string }> = {
  poppy: {
    en: 'Amber seeds drift over the meadow — walk through them to gather. Five seeds plant a poppy of your own.',
    ru: 'Над лугом плывут янтарные семена — пройдите сквозь них, чтобы собрать. Пять семян — и вырастет ваш собственный мак.'
  },
  pagoda: {
    en: 'Some shrines in the mist are dark. Stand close to wake them — the valley remembers.',
    ru: 'Некоторые святилища в тумане темны. Подойдите ближе, чтобы разбудить их — долина запомнит.'
  }
};

const seen = new Set<string>();

const WorldHint: React.FC = () => {
  const spec = useActiveDimension();
  const [locale] = useLocale();
  const { count } = useActivity(spec?.slug ?? null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!spec || seen.has(spec.slug) || !HINTS[spec.slug]) return;
    const appear = window.setTimeout(() => setVisible(true), 1600);
    const vanish = window.setTimeout(() => {
      setVisible(false);
      seen.add(spec.slug);
    }, 12000);
    return () => {
      window.clearTimeout(appear);
      window.clearTimeout(vanish);
      setVisible(false);
    };
  }, [spec]);

  // The first pickup teaches better than any sentence: get out of the way.
  useEffect(() => {
    if (count > 0 && spec) {
      seen.add(spec.slug);
      setVisible(false);
    }
  }, [count, spec]);

  if (!spec || !visible) return null;

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-30 pointer-events-none"
      style={{
        top: 'calc(env(safe-area-inset-top, 0px) + 72px)',
        maxWidth: 'min(460px, calc(100vw - 32px))',
        padding: '12px 18px',
        borderRadius: '12px',
        background: 'rgba(26, 20, 16, 0.85)',
        border: '1px solid rgba(237, 230, 210, 0.25)',
        color: '#EDE6D2',
        fontSize: '13.5px',
        lineHeight: 1.45,
        textAlign: 'center',
        animation: 'fadeIn 600ms ease'
      }}
    >
      {pick(HINTS[spec.slug], locale)}
    </div>
  );
};

export default WorldHint;
