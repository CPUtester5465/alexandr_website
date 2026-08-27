import React from 'react';
import { controlState } from '../../../state/controlState';

/** The jump button, above the look stick -- where a thumb already lives. */
const JumpButton: React.FC = () => (
  <button
    type="button"
    aria-label="Jump"
    className="fixed z-30 rounded-full select-none"
    style={{
      right: 'calc(env(safe-area-inset-right, 0px) + 30px)',
      bottom: 'calc(env(safe-area-inset-bottom, 0px) + 196px)',
      width: '64px', height: '64px',
      background: 'rgba(26, 20, 16, 0.4)',
      border: '1.5px solid rgba(237, 230, 210, 0.6)',
      color: '#EDE6D2', fontSize: '11px',
      letterSpacing: '0.08em', textTransform: 'uppercase',
      touchAction: 'none'
    }}
    onPointerDown={(e) => {
      controlState.jumpQueued = true;
      e.preventDefault();
    }}
  >
    Jump
  </button>
);

export default JumpButton;
