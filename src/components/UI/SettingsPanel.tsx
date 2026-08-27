import React, { useState } from 'react';
import { useLocale } from '../../state/locale';
import { isMuted, setMuted, onMuteChange } from '../../state/audio';
import { useUi, setHudVisible } from '../../state/uiState';
import { pick } from '../../state/locale';

/**
 * Settings: language, sound, HUD. Tim's list, in one gear.
 * PROVISIONAL STYLING -- the grammar matters (a game has settings), the
 * chrome will follow the design pass.
 */
const SettingsPanel: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [locale, setLocale] = useLocale();
  const { hudVisible } = useUi();
  const [muted, setM] = useState(isMuted());
  React.useEffect(() => onMuteChange(setM), []);

  const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  gap: '18px', padding: '9px 0' }}>
      <span style={{ fontSize: '13px', opacity: 0.85 }}>{label}</span>
      <div style={{ display: 'flex', gap: '6px' }}>{children}</div>
    </div>
  );

  const Chip: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> =
    ({ active, onClick, children }) => (
      <button type="button" onClick={onClick}
        style={{
          padding: '6px 13px', minHeight: '34px', borderRadius: '999px',
          fontSize: '12px', fontWeight: 600,
          background: active ? '#EDE6D2' : 'rgba(237,230,210,0.12)',
          color: active ? '#1A1410' : '#EDE6D2',
          border: '1px solid rgba(237,230,210,0.3)'
        }}>
        {children}
      </button>
    );

  return (
    <>
      <button
        type="button"
        aria-label="Settings"
        onClick={() => setOpen((o) => !o)}
        className="fixed z-40"
        style={{
          left: 'calc(env(safe-area-inset-left, 0px) + 16px)',
          top: 'calc(env(safe-area-inset-top, 0px) + 16px)',
          width: '40px', height: '40px', borderRadius: '999px',
          background: 'rgba(26,20,16,0.72)', color: '#EDE6D2',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        {/* an actual cog: eight teeth on a ring, hole in the middle */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M10.9 2h2.2l.5 2.4c.6.15 1.17.39 1.7.7l2.06-1.33 1.56 1.55L17.6 7.4c.3.53.55 1.1.7 1.7l2.4.5v2.2l-2.4.5c-.15.6-.4 1.17-.7 1.7l1.32 2.06-1.56 1.56-2.05-1.33c-.53.3-1.1.55-1.7.7l-.5 2.41h-2.2l-.5-2.4a7 7 0 0 1-1.7-.7L6.4 17.6l-1.56-1.55 1.33-2.06a7 7 0 0 1-.7-1.7L3 11.9V9.7l2.46-.5c.15-.6.4-1.17.7-1.7L4.85 5.44 6.4 3.88l2.06 1.33c.53-.31 1.1-.55 1.7-.7L10.9 2zm1.1 6.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8z" />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          className="fixed z-40"
          style={{
            left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
            width: 'min(340px, calc(100vw - 32px))',
            padding: '18px 22px', borderRadius: '16px',
            background: 'rgba(26, 20, 16, 0.95)',
            border: '1px solid rgba(237, 230, 210, 0.28)',
            color: '#EDE6D2'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <strong style={{ fontSize: '14px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {pick({ en: 'Settings', ru: 'Настройки' }, locale)}
            </strong>
            <button type="button" onClick={() => setOpen(false)}
                    style={{ color: 'rgba(237,230,210,0.7)', fontSize: '14px' }}>✕</button>
          </div>

          <Row label={pick({ en: 'Language', ru: 'Язык' }, locale)}>
            <Chip active={locale === 'en'} onClick={() => setLocale('en')}>EN</Chip>
            <Chip active={locale === 'ru'} onClick={() => setLocale('ru')}>RU</Chip>
          </Row>
          <Row label={pick({ en: 'Sound', ru: 'Звук' }, locale)}>
            <Chip active={!muted} onClick={() => setMuted(false)}>
              {pick({ en: 'on', ru: 'вкл' }, locale)}
            </Chip>
            <Chip active={muted} onClick={() => setMuted(true)}>
              {pick({ en: 'off', ru: 'выкл' }, locale)}
            </Chip>
          </Row>
          <Row label={pick({ en: 'Interface', ru: 'Интерфейс' }, locale)}>
            <Chip active={hudVisible} onClick={() => setHudVisible(true)}>
              {pick({ en: 'shown', ru: 'показан' }, locale)}
            </Chip>
            <Chip active={!hudVisible} onClick={() => setHudVisible(false)}>
              {pick({ en: 'hidden', ru: 'скрыт' }, locale)}
            </Chip>
          </Row>
        </div>
      )}
    </>
  );
};

export default SettingsPanel;
