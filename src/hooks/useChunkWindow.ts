import { useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { chunkKeyOf } from '../world/chunk';
import { controlState } from '../state/controlState';

/**
 * The player's chunk coordinate, as React state that only changes when he
 * actually crosses a chunk boundary.
 *
 * This is what turns "a set piece around spawn" into "the whole world": any
 * dressing keyed on this window rebuilds a few times a minute at walking pace
 * and covers wherever he is, forever. Tim's exact complaint was content that
 * existed only near the spawn -- the pagoda valley was generated once around
 * the origin and went bare 200 units out.
 */
export function useChunkWindow(): { cx: number; cz: number } {
  const [window, setWindow] = useState(() =>
    chunkKeyOf(controlState.playerPosition.x, controlState.playerPosition.z));

  useFrame(() => {
    const here = chunkKeyOf(controlState.playerPosition.x, controlState.playerPosition.z);
    if (here.cx !== window.cx || here.cz !== window.cz) setWindow(here);
  });

  return window;
}
