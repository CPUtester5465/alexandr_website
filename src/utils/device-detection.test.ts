import { describe, it, expect, afterEach } from 'vitest';
import {
  isTouchPrimary,
  canHover,
  prefersReducedMotion,
  getInputMode,
  getMaxPixelRatio
} from './device-detection';

/**
 * jsdom implements no media queries at all, so every test here installs its own
 * matchMedia. That is also the point of the last block: matchMedia genuinely is
 * absent in some environments, and these functions must not throw when it is.
 */

type Matches = Record<string, boolean>;

function withMedia(matches: Matches) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: matches[query] ?? false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {}
    })
  });
}

afterEach(() => {
  delete (window as unknown as Record<string, unknown>).matchMedia;
});

describe('isTouchPrimary', () => {
  it('is true on a phone, where the primary pointer is coarse', () => {
    withMedia({ '(pointer: coarse)': true });
    expect(isTouchPrimary()).toBe(true);
  });

  it('is false on a touchscreen laptop, whose primary pointer is the trackpad', () => {
    // The regression this guards: the old detection called any touch-capable
    // machine a phone and refused to show it the site.
    withMedia({ '(pointer: coarse)': false, '(hover: hover)': true });
    expect(isTouchPrimary()).toBe(false);
    expect(canHover()).toBe(true);
  });
});

describe('prefersReducedMotion', () => {
  it('follows the OS setting', () => {
    withMedia({ '(prefers-reduced-motion: reduce)': true });
    expect(prefersReducedMotion()).toBe(true);
  });

  it('defaults to full motion', () => {
    withMedia({});
    expect(prefersReducedMotion()).toBe(false);
  });
});

describe('getInputMode / getMaxPixelRatio', () => {
  it('caps the pixel ratio harder on touch', () => {
    withMedia({ '(pointer: coarse)': true });
    expect(getInputMode()).toBe('touch');
    expect(getMaxPixelRatio()).toBe(1.5);
  });

  it('allows 2x with a real cursor', () => {
    withMedia({ '(pointer: coarse)': false });
    expect(getInputMode()).toBe('pointer');
    expect(getMaxPixelRatio()).toBe(2);
  });
});

describe('when matchMedia does not exist', () => {
  it('answers false rather than throwing', () => {
    expect(isTouchPrimary()).toBe(false);
    expect(canHover()).toBe(false);
    expect(prefersReducedMotion()).toBe(false);
    expect(getInputMode()).toBe('pointer');
  });
});
