import React, { useEffect, useState } from 'react';
import { useUi, setIntroPhase } from '../../state/uiState';
import { useLocale, pick } from '../../state/locale';
import { prefersReducedMotion } from '../../utils/device-detection';
import { setWorldImmediately } from '../../state/worldState';
import { wipe } from './IntroSequence';

/**
 * The title card over the paper phase, and the white wipe layer for the
 * whole shot. His name in Handjet, both languages, "touch to begin" -- which
 * is also the audio unlock, made hospitality instead of compliance. Skip is
 * visible from the first second, because a cinematic you cannot leave is a
 * hostage situation.
 */
const TitleCard: React.FC = () => {
  const { introPhase } = useUi();
  const [locale] = useLocale();
  const [white, setWhite] = useState(0);

  // Mirror the wipe value into the DOM at animation-frame rate.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setWhite((w) => (Math.abs(w - wipe.value) > 0.01 ? wipe.value : w));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (introPhase === 'done') return null;

  const begin = () => {
    if (prefersReducedMotion()) {
      setIntroPhase('done');
      setWorldImmediately('hub');
    } else {
      setIntroPhase('dive');
    }
  };

  return (
    <>
      {/* the white of the paper, used as the cut between stages */}
      <div
        aria-hidden
        className="fixed inset-0 z-40 pointer-events-none"
        style={{ background: '#F4EFE4', opacity: white }}
      />

      {introPhase === 'paper' && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-end"
             style={{ paddingBottom: '11vh', background: 'radial-gradient(ellipse at center, transparent 40%, rgba(11,9,8,0.55) 100%)' }}>
          <h1 style={{
            fontFamily: "'Handjet', monospace", fontWeight: 600,
            fontSize: 'clamp(34px, 7vw, 76px)', letterSpacing: '0.04em',
            color: '#F4EFE4', textShadow: '0 2px 18px rgba(0,0,0,0.55)', margin: 0
          }}>
            {pick({ en: 'Alexandr Goriainov', ru: 'Александр Горяйнов' }, locale)}
          </h1>
          <p style={{
            color: 'rgba(244,239,228,0.85)', fontSize: '14px',
            letterSpacing: '0.14em', textTransform: 'uppercase', margin: '10px 0 26px'
          }}>
            {pick({ en: 'worlds made of paintings', ru: 'миры, сделанные из картин' }, locale)}
          </p>
          <button
            type="button"
            onClick={begin}
            style={{
              padding: '14px 34px', minHeight: '48px', borderRadius: '999px',
              background: '#F4EFE4', color: '#1A1410',
              fontSize: '15px', fontWeight: 600, letterSpacing: '0.06em'
            }}
          >
            {pick({ en: 'touch to begin', ru: 'коснитесь, чтобы начать' }, locale)}
          </button>
        </div>
      )}

      {(introPhase === 'dive' || introPhase === 'splat') && (
        <button
          type="button"
          onClick={() => setIntroPhase('done')}
          className="fixed z-50"
          style={{
            right: 'calc(env(safe-area-inset-right, 0px) + 16px)',
            bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
            padding: '8px 16px', borderRadius: '999px',
            background: 'rgba(26,20,16,0.55)', color: 'rgba(244,239,228,0.85)',
            fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase'
          }}
        >
          {pick({ en: 'skip', ru: 'пропустить' }, locale)}
        </button>
      )}
    </>
  );
};

export default TitleCard;
