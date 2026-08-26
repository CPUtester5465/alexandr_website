import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  travelTo, getWorld, setWorldImmediately, FADE_OUT_MS, FADE_IN_MS
} from './worldState';

/**
 * Travel is the one place a repeated trigger really hurts: the door proximity
 * check runs on the frame loop, so a player standing in a doorway calls this
 * sixty times a second.
 */

beforeEach(() => {
  vi.useFakeTimers();
  setWorldImmediately('hub');
});
afterEach(() => vi.useRealTimers());

const settle = () => vi.advanceTimersByTime(FADE_OUT_MS + FADE_IN_MS + 20);

describe('travelTo', () => {
  it('covers the screen before the world changes, not after', () => {
    travelTo('poppy', 0x557D46, 'poppy');
    expect(getWorld().transition).toEqual({ phase: 'out', colour: 0x557D46 });
    expect(getWorld().current).toBe('hub'); // still here while the cover comes down
  });

  it('swaps the world under the cover, then lifts it', () => {
    travelTo('poppy', 0x557D46, 'poppy');
    vi.advanceTimersByTime(FADE_OUT_MS);
    expect(getWorld().current).toBe('poppy');
    expect(getWorld().transition?.phase).toBe('in');

    vi.advanceTimersByTime(FADE_IN_MS);
    expect(getWorld().transition).toBeNull();
  });

  it('remembers the door, so coming back lands where you left', () => {
    travelTo('poppy', 0x557D46, 'poppy');
    settle();
    expect(getWorld().cameFrom).toBe('poppy');
  });

  it('ignores a second call mid-journey', () => {
    travelTo('poppy', 0x557D46, 'poppy');
    vi.advanceTimersByTime(Math.floor(FADE_OUT_MS / 2));
    travelTo('gravity', 0x111111, 'gravity');   // the frame loop firing again
    settle();
    expect(getWorld().current).toBe('poppy');
  });

  it('ignores a request to go where we already are', () => {
    travelTo('hub', 0x000000);
    expect(getWorld().transition).toBeNull();
    expect(getWorld().current).toBe('hub');
  });

  it('releases the lock, so the journey back works', () => {
    travelTo('poppy', 0x557D46, 'poppy');
    settle();
    travelTo('hub', 0x6B4E31);
    settle();
    expect(getWorld().current).toBe('hub');
  });

  it('moves through out, in, and done, in that order', () => {
    const seen: string[] = [];
    travelTo('poppy', 0x557D46, 'poppy');
    seen.push(getWorld().transition!.phase);
    vi.advanceTimersByTime(FADE_OUT_MS);
    seen.push(getWorld().transition!.phase);
    vi.advanceTimersByTime(FADE_IN_MS);
    seen.push(String(getWorld().transition));
    expect(seen).toEqual(['out', 'in', 'null']);
  });
});
