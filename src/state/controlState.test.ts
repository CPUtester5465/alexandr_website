import { describe, it, expect, beforeEach } from 'vitest';
import {
  headingFromCameraSpace,
  shortestAngleTo,
  controlState,
  clearSteering,
  engageInput,
  releaseInput,
  resetControlState
} from './controlState';

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

describe('engageInput / releaseInput -- the two-yaw freeze', () => {
  it('freezes the input frame at the camera yaw when a hold begins', () => {
    controlState.cameraYaw = 1.2;
    engageInput();
    controlState.cameraYaw = 2.9;          // the camera swings behind him
    expect(controlState.inputYaw).toBe(1.2); // the direction under the thumb does not move
  });

  it('does not re-base when a second input joins an existing hold', () => {
    // Pressing W while already steering with a thumb must not swivel the
    // direction the thumb is asking for.
    controlState.cameraYaw = 0.5;
    engageInput();
    controlState.cameraYaw = 3.0;
    engageInput();
    expect(controlState.inputYaw).toBe(0.5);
  });

  it('resyncs only when the last input lets go', () => {
    controlState.cameraYaw = 0.5;
    engageInput();
    engageInput();
    controlState.cameraYaw = 3.0;
    releaseInput();
    expect(controlState.inputYaw).toBe(0.5);
    releaseInput();
    expect(controlState.inputYaw).toBe(3.0);
  });

  it('cannot go negative if a release arrives without a hold', () => {
    releaseInput();
    releaseInput();
    expect(controlState.activeInputs).toBe(0);
  });
});
