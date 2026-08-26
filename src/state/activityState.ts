import { useEffect, useState } from 'react';

/**
 * What the visitor has done in each world, this session.
 *
 * The activities come from the lore briefs -- gathering seeds in the poppy
 * meadow, waking dark shrines in the pagoda valley -- and this is their
 * memory. Session-scoped on purpose for now: a returning visitor starts
 * fresh, which is honest until there is a real decision about persistence.
 *
 * Keys are world-position strings ("bx,bz"), which the seeded channels make
 * stable across visits and devices: the same shrine is the same shrine.
 */

interface WorldActivity {
  done: Set<string>;
  /** How many opportunities have streamed into view so far, for the HUD. */
  seen: number;
}

const worlds = new Map<string, WorldActivity>();
const listeners = new Set<() => void>();

function of(slug: string): WorldActivity {
  let w = worlds.get(slug);
  if (!w) {
    w = { done: new Set(), seen: 0 };
    worlds.set(slug, w);
  }
  return w;
}

export function markDone(slug: string, key: string): boolean {
  const w = of(slug);
  if (w.done.has(key)) return false;
  w.done.add(key);
  for (const l of listeners) l();
  return true;
}

export function isDone(slug: string, key: string): boolean {
  return of(slug).done.has(key);
}

export function doneCount(slug: string): number {
  return of(slug).done.size;
}

export function useActivity(slug: string | null): { count: number } {
  const [count, setCount] = useState(slug ? doneCount(slug) : 0);
  useEffect(() => {
    if (!slug) return;
    const update = () => setCount(doneCount(slug));
    listeners.add(update);
    update();
    return () => { listeners.delete(update); };
  }, [slug]);
  return { count };
}
