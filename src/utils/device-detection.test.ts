import { describe, it, expect, afterEach, vi } from 'vitest';
import { isMobileDevice, isTabletDevice, isDesktopDevice, getDeviceType } from './device-detection';

/**
 * These functions decide whether a visitor is allowed to see the site at all
 * (App.tsx swaps the whole app for a "Desktop Experience Required" card when
 * isMobileDevice() is true). Phase 1 removes that gate, and these tests exist
 * so the removal is visible rather than silent.
 */

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15';
const IPAD = 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15';
const MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0';

// jsdom does not define navigator.maxTouchPoints at all, so vi.spyOn has
// nothing to wrap — these have to be defined outright.
//
// jsdom *does* define window.ontouchstart, which matters: the detection treats
// `'ontouchstart' in window` as proof of a touchscreen, and that is simply not
// true. It is present in jsdom, and present in desktop Chromium regardless of
// hardware. The helper therefore controls it explicitly, and one test below
// pins the consequence.
function fakeDevice(userAgent: string, width: number, touchPoints: number) {
  Object.defineProperty(navigator, 'userAgent', { value: userAgent, configurable: true });
  Object.defineProperty(navigator, 'maxTouchPoints', { value: touchPoints, configurable: true });
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true });
  if (touchPoints > 0) {
    Object.defineProperty(window, 'ontouchstart', { value: null, configurable: true });
  } else {
    delete (window as unknown as Record<string, unknown>).ontouchstart;
  }
}

afterEach(() => vi.restoreAllMocks());

describe('isMobileDevice', () => {
  it('detects a phone by user agent', () => {
    fakeDevice(IPHONE, 390, 5);
    expect(isMobileDevice()).toBe(true);
  });

  it('detects a narrow touch screen even with an unknown user agent', () => {
    fakeDevice('Some/Unknown Browser', 400, 5);
    expect(isMobileDevice()).toBe(true);
  });

  it('does not flag a narrow desktop window without touch', () => {
    fakeDevice(MAC, 400, 0);
    expect(isMobileDevice()).toBe(false);
  });

  it('flags an iPad, because the regex includes iPad', () => {
    // Documents current behaviour rather than endorsing it: an iPad is matched
    // by the *mobile* regex, so today it is blocked from the site as well.
    fakeDevice(IPAD, 1024, 5);
    expect(isMobileDevice()).toBe(true);
  });

  it('calls a narrow desktop window "mobile" as soon as ontouchstart exists', () => {
    // The bug this pins: a laptop with a touchscreen, or any Chromium window
    // narrower than 768px, is blocked from the site. maxTouchPoints is 0 here —
    // the only thing making it "mobile" is a property that proves nothing.
    fakeDevice(MAC, 400, 0);
    Object.defineProperty(window, 'ontouchstart', { value: null, configurable: true });
    expect(isMobileDevice()).toBe(true);
  });
});

describe('isTabletDevice', () => {
  it('detects an iPad', () => {
    fakeDevice(IPAD, 1024, 5);
    expect(isTabletDevice()).toBe(true);
  });

  it('does not flag a phone', () => {
    fakeDevice(IPHONE, 390, 5);
    expect(isTabletDevice()).toBe(false);
  });
});

describe('isDesktopDevice / getDeviceType', () => {
  it('recognises a laptop', () => {
    fakeDevice(MAC, 1512, 0);
    expect(isDesktopDevice()).toBe(true);
    expect(getDeviceType()).toBe('desktop');
  });

  it('classifies a phone as mobile', () => {
    fakeDevice(IPHONE, 390, 5);
    expect(getDeviceType()).toBe('mobile');
  });
});
