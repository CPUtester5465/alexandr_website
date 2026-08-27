import { useEffect, useState } from 'react';

/**
 * HUD visibility and the intro's phase -- the small switchboard the settings
 * panel and the opening sequence both talk through.
 */

type IntroPhase = 'paper' | 'dive' | 'splat' | 'ascent' | 'done';

interface UiSnapshot {
  hudVisible: boolean;
  introPhase: IntroPhase;
}

let snapshot: UiSnapshot = {
  hudVisible: (() => {
    try { return window.localStorage?.getItem('ag.hud') !== '0'; } catch { return true; }
  })(),
  introPhase: 'paper'
};

const listeners = new Set<(s: UiSnapshot) => void>();

function publish(next: Partial<UiSnapshot>): void {
  snapshot = { ...snapshot, ...next };
  for (const l of listeners) l(snapshot);
}

export function setHudVisible(v: boolean): void {
  try { window.localStorage?.setItem('ag.hud', v ? '1' : '0'); } catch { /* ok */ }
  publish({ hudVisible: v });
}

export function setIntroPhase(p: IntroPhase): void {
  publish({ introPhase: p });
}

export function getUi(): UiSnapshot { return snapshot; }

export function useUi(): UiSnapshot {
  const [s, set] = useState(snapshot);
  useEffect(() => {
    listeners.add(set);
    set(snapshot);
    return () => { listeners.delete(set); };
  }, []);
  return s;
}
