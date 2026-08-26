import { describe, it, expect, beforeEach } from 'vitest';
import { headingFromCameraSpace, shortestAngleTo, controlState, clearSteering, resetControlState } from './controlState';

/**
 * The steering maths. Everything the character does is built on these two
 * functions, and both have a sign convention that is easy to get backwards.
 */

const deg = (radians: number) => Math.round((radians * 180) / Math.PI);

beforeEach(() => resetControlState());

describe('headingFromCameraSpace', () => {
  it('sends "forward" away from a camera sitting at yaw 0', () => {
    // The camera orbits to (sin 0, cos 0) = +z, so away from it is -z, and
    // atan2(0, -1) is a half turn.
    expect(deg(headingFromCameraSpace(0, 1, 0))).toBe(180);
  });

  it('sends "back" toward the camera', () => {
    expect(deg(headingFromCameraSpace(0, -1, 0))).toBe(0);
  });

  it('puts "right" 90 degrees off forward', () => {
    expect(deg(headingFromCameraSpace(1, 0, 0))).toBe(90);
  });

  it('rotates with the camera, so forward keeps meaning away from you', () => {
    // Orbit the camera a quarter turn and forward must follow it round.
    const forwardAtZero = headingFromCameraSpace(0, 1, 0);
    const forwardAtQuarter = headingFromCameraSpace(0, 1, Math.PI / 2);
    expect(deg(shortestAngleTo(forwardAtZero, forwardAtQuarter))).toBe(90);
  });
});

describe('shortestAngleTo', () => {
  it('takes the short way round rather than spinning 350 degrees', () => {
    const almostFullTurn = (350 * Math.PI) / 180;
    expect(deg(shortestAngleTo(0, almostFullTurn))).toBe(-10);
  });

  it('is zero for the same angle', () => {
    expect(shortestAngleTo(1.2, 1.2)).toBe(0);
  });

  it('handles angles that have wound past a full turn', () => {
    // The heading accumulates and is never normalised, so this really happens.
    // A half turn is equally short either way round, so only the size is
    // meaningful -- asserting the sign would be asserting an implementation
    // detail of the modulo.
    expect(Math.abs(deg(shortestAngleTo(7 * Math.PI, 0)))).toBe(180);
  });
});

describe('clearSteering', () => {
  it('drops the bearing and shuts the throttle', () => {
    controlState.desiredHeading = 1.5;
    controlState.throttle = 0.8;
    clearSteering();
    expect(controlState.desiredHeading).toBeNull();
    expect(controlState.throttle).toBe(0);
  });

  it('leaves the heading alone, so he coasts on rather than snapping straight', () => {
    controlState.heading = 1.5;
    clearSteering();
    expect(controlState.heading).toBe(1.5);
  });
});
