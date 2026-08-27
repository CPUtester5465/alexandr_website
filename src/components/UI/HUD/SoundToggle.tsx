import React, { useEffect, useState } from 'react';
import { isMuted, setMuted, onMuteChange } from '../../../state/audio';

/** Speaker on/off, beside the language switch. PROVISIONAL STYLING. */
const SoundToggle: React.FC = () => {
  const [muted, set] = useState(isMuted());
  useEffect(() => onMuteChange(set), []);

  return (
    <button
      type="button"
      onClick={() => setMuted(!muted)}
      aria-pressed={muted}
      aria-label={muted ? 'Unmute' : 'Mute'}
      className="fixed z-30"
      style={{
        left: 'calc(env(safe-area-inset-left, 0px) + 118px)',
        top: 'calc(env(safe-area-inset-top, 0px) + 16px)',
        width: '40px', height: '40px', borderRadius: '999px',
        background: 'rgba(26, 20, 16, 0.72)', color: '#EDE6D2',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M4 9v6h4l5 4V5L8 9H4z" />
        {muted
          ? <path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" strokeWidth="2" fill="none" />
          : <path d="M16.5 8.5a5 5 0 010 7M18.8 6a8.5 8.5 0 010 12" stroke="currentColor" strokeWidth="1.7" fill="none" />}
      </svg>
    </button>
  );
};

export default SoundToggle;
