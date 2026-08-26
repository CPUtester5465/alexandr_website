import React from 'react';
import { useWorld, FADE_OUT_MS, FADE_IN_MS } from '../../../state/worldState';

/**
 * The moment of going through a door.
 *
 * Covers the frame in the colour of the painting you are walking into while the
 * world behind it is built, then lifts. Leaving is quicker than arriving on
 * purpose: you should be shut out fast and let in gently.
 */
const TravelFade: React.FC = () => {
  const { transition } = useWorld();
  const leaving = transition?.phase === 'out';

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-40 pointer-events-none"
      style={{
        background: transition
          ? `#${transition.colour.toString(16).padStart(6, '0')}`
          : 'transparent',
        opacity: leaving ? 1 : 0,
        transition: `opacity ${leaving ? FADE_OUT_MS : FADE_IN_MS}ms ease-${leaving ? 'in' : 'out'}`
      }}
    />
  );
};

export default TravelFade;
