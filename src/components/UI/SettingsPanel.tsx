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
          left: 'calc(env(safe-area-inset-left, 0px) + 166px)',
          top: 'calc(env(safe-area-inset-top, 0px) + 16px)',
          width: '40px', height: '40px', borderRadius: '999px',
          background: 'rgba(26,20,16,0.72)', color: '#EDE6D2',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="1.8" aria-hidden>
          <circle cx="12" cy="12" r="3.2" />
          <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" />
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
