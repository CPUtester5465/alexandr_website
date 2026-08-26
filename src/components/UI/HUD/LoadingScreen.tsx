import React, { useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';

/**
 * The loading screen, which until now never appeared.
 *
 * It used to sit inside a <Suspense> in the UI overlay -- but that boundary
 * wraps plain DOM that never suspends, so the fallback was unreachable, while
 * the Canvas's own fallback was `null`. Visitors watched an empty blue screen
 * for the whole seventeen megabytes of artwork.
 *
 * `useProgress` reports real numbers from three's loading manager, so this
 * shows actual progress rather than an indeterminate spinner that lies.
 */
const LoadingScreen: React.FC = () => {
  const { progress, loaded, total } = useProgress();
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (progress < 100) return;
    // Hold briefly at 100% so the bar is seen to fill rather than vanishing
    // mid-stride, and so the first frame is rendered behind the cover.
    const timer = setTimeout(() => setFinished(true), 400);
    return () => clearTimeout(timer);
  }, [progress]);

  if (finished) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        background: 'linear-gradient(160deg, #87CEEB 0%, #667eea 100%)',
        transition: 'opacity 400ms ease',
        opacity: progress >= 100 ? 0 : 1
      }}
      role="status"
      aria-live="polite"
    >
      <p style={{ color: 'white', fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>
        Loading the world…
      </p>

      <div
        style={{
          width: 'min(280px, 70vw)',
          height: '6px',
          marginTop: '18px',
          borderRadius: '999px',
          background: 'rgba(255,255,255,0.3)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background: 'white',
            transition: 'width 200ms ease'
          }}
        />
      </div>

      <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.8rem', marginTop: '10px' }}>
        {total > 0 ? `${loaded} of ${total} · ${Math.round(progress)}%` : 'starting…'}
      </p>
    </div>
  );
};

export default LoadingScreen;
