/**
 * What kind of device is this, and what does the visitor want from it.
 *
 * The previous version of this file existed to answer one question -- "should
 * we refuse to show this person the site?" -- and it answered it badly. It
 * treated `'ontouchstart' in window` as proof of a touchscreen, which is true
 * in desktop Chromium regardless of hardware and true in jsdom, so any Chromium
 * window narrower than 768px was classed as a phone and turned away.
 *
 * Nothing refuses anybody now. These functions only choose *defaults*: which
 * control hints to show, and how hard to push the GPU.
 */

/** `matchMedia` is missing in some test and server environments. */
function media(query: string): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(query).matches;
}

/**
 * True when the main pointer is a finger.
 *
 * `(pointer: coarse)` asks the browser about the *primary* input device, which
 * is the actual question. A laptop with a touchscreen reports `fine`, because
 * its primary pointer is still the trackpad -- and that is the right answer.
 */
export const isTouchPrimary = (): boolean => media('(pointer: coarse)');

/** True when the device can hover, i.e. there is a real cursor. */
export const canHover = (): boolean => media('(hover: hover)');

/** Honour the OS-level "reduce motion" setting. */
export const prefersReducedMotion = (): boolean =>
  media('(prefers-reduced-motion: reduce)');

/** Phone-sized viewport. Used for layout only, never for access. */
export const isSmallViewport = (): boolean =>
  typeof window !== 'undefined' && window.innerWidth < 768;

export type InputMode = 'touch' | 'pointer';

export const getInputMode = (): InputMode =>
  isTouchPrimary() ? 'touch' : 'pointer';

/**
 * Renderer quality ceiling.
 *
 * Device pixel ratio is the single biggest lever on a phone: an iPhone reports
 * 3, so rendering at native resolution costs nine times the pixels of 1x for a
 * difference almost nobody can see on a moving 3D scene.
 */
export const getMaxPixelRatio = (): number => (isTouchPrimary() ? 1.5 : 2);

export const getScreenSize = () => ({
  width: window.innerWidth,
  height: window.innerHeight,
  aspectRatio: window.innerWidth / window.innerHeight
});
