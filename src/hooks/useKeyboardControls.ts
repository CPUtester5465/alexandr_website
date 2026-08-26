import { useEffect } from 'react';
import { controlState, engageInput, releaseInput } from '../state/controlState';

/**
 * Keyboard movement. WASD and the arrow keys, space to jump.
 *
 * Writes a camera-space axis rather than a world heading, because the camera can
 * be orbited with the right mouse button while W is still held -- "forward" has
 * to keep meaning "away from the camera" as it turns. The character resolves the
 * axis against the current camera every frame.
 */

const FORWARD = ['w', 'arrowup'];
const BACK = ['s', 'arrowdown'];
const LEFT = ['a', 'arrowleft'];
const RIGHT = ['d', 'arrowright'];
const JUMP = [' ', 'spacebar'];

const MOVEMENT_KEYS = [...FORWARD, ...BACK, ...LEFT, ...RIGHT];

export function useKeyboardControls(): void {
  useEffect(() => {
    const held = new Set<string>();
    let engaged = false;

    const recomputeAxis = () => {
      let x = 0;
      let y = 0;
      if (FORWARD.some((k) => held.has(k))) y += 1;
      if (BACK.some((k) => held.has(k))) y -= 1;
      if (RIGHT.some((k) => held.has(k))) x += 1;
      if (LEFT.some((k) => held.has(k))) x -= 1;

      controlState.moveAxis.set(x, y);
      // Diagonals would otherwise be 41% faster than the cardinals.
      if (controlState.moveAxis.lengthSq() > 1) controlState.moveAxis.normalize();

      // Freeze the input frame for as long as a key is down, for the same
      // reason the thumb does -- otherwise holding W while the camera swings
      // behind you turns W into a slow circle.
      const moving = x !== 0 || y !== 0;
      if (moving && !engaged) {
        engageInput();
        engaged = true;
      } else if (!moving && engaged) {
        releaseInput();
        engaged = false;
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      // Let the browser have its shortcuts, and let people type in a field.
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) {
        return;
      }

      const key = event.key.toLowerCase();

      if (JUMP.includes(key)) {
        event.preventDefault(); // space scrolls the page otherwise
        controlState.jumpQueued = true;
        return;
      }

      if (!MOVEMENT_KEYS.includes(key)) return;
      event.preventDefault(); // arrows scroll the page otherwise
      if (event.repeat) return;
      held.add(key);
      recomputeAxis();
    };

    const onKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (!MOVEMENT_KEYS.includes(key)) return;
      held.delete(key);
      recomputeAxis();
    };

    // Losing focus mid-stride used to leave the key stuck down and the
    // character walking into the horizon.
    const onBlur = () => {
      held.clear();
      recomputeAxis();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      held.clear();
      controlState.moveAxis.set(0, 0);
      if (engaged) releaseInput();
    };
  }, []);
}
