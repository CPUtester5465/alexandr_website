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
             style={{ paddingBottom: '10vh', background: 'radial-gradient(ellipse at center, transparent 40%, rgba(11,9,8,0.55) 100%)' }}>
          <style>{`
            @keyframes petalFall {
              0%   { transform: translate(0, -8vh) rotate(0deg); opacity: 0; }
              12%  { opacity: 0.85; }
              100% { transform: translate(var(--sway), 108vh) rotate(var(--spin)); opacity: 0; }
            }
          `}</style>
          {/* Petals shed from the painting, drifting down the whole card. */}
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} aria-hidden style={{
              position: 'absolute',
              left: `${7 + (i * 137) % 86}%`,
              top: 0,
              width: `${9 + (i * 53) % 8}px`,
              height: `${12 + (i * 31) % 9}px`,
              borderRadius: '60% 40% 55% 45%',
              background: i % 3 === 0 ? '#B33F3A' : i % 3 === 1 ? '#8A2E32' : '#C4784D',
              ['--sway' as string]: `${((i * 89) % 90) - 45}px`,
              ['--spin' as string]: `${((i * 71) % 300) - 150}deg`,
              animation: `petalFall ${11 + (i * 47) % 9}s linear ${-(i * 1.7)}s infinite`,
              pointerEvents: 'none'
            }} />
          ))}
          <h1 style={{
            fontFamily: "'Handjet', monospace", fontWeight: 600,
            fontSize: 'clamp(34px, 7vw, 76px)', letterSpacing: '0.04em',
            color: '#F4EFE4', textShadow: '0 2px 18px rgba(0,0,0,0.55)', margin: 0
          }}>
            {pick({ en: 'Alexandr Goriainov', ru: 'Александр Горяйнов' }, locale)}
          </h1>
          <div aria-hidden style={{
            width: '54px', height: '2px', background: 'rgba(244,239,228,0.5)', margin: '14px 0'
          }} />
          <p style={{
            color: 'rgba(244,239,228,0.85)', fontSize: '14px',
            letterSpacing: '0.14em', textTransform: 'uppercase', margin: 0
          }}>
            {pick({ en: 'worlds made of paintings', ru: 'миры, сделанные из картин' }, locale)}
          </p>
          <p style={{
            color: 'rgba(244,239,228,0.55)', fontSize: '12px',
            letterSpacing: '0.1em', margin: '6px 0 26px'
          }}>
            {pick({ en: '18 doors · painted by a boy from Kursk', ru: '18 дверей · нарисовано мальчиком из Курска' }, locale)}
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

      {introPhase === 'ascent' && (
        <p
          className="fixed z-50 pointer-events-none"
          style={{
            left: 'calc(env(safe-area-inset-left, 0px) + 18px)',
            bottom: 'calc(env(safe-area-inset-bottom, 0px) + 18px)',
            color: 'rgba(26,20,16,0.62)', fontSize: '12px',
            letterSpacing: '0.08em', margin: 0
          }}
        >
          {pick({
            en: `this sky exists only today · ${new Date().toLocaleDateString('en-GB')}`,
            ru: `это небо существует только сегодня · ${new Date().toLocaleDateString('ru-RU')}`
          }, locale)}
        </p>
      )}

      {(introPhase === 'dive' || introPhase === 'splat' || introPhase === 'ascent') && (
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
