import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import * as THREE from 'three';
import { useKeyboardControls } from './useKeyboardControls';
import { controlState, resetControlState } from '../state/controlState';

const press = (key: string, init: KeyboardEventInit = {}) =>
  window.dispatchEvent(new KeyboardEvent('keydown', { key, cancelable: true, ...init }));
const release = (key: string) =>
  window.dispatchEvent(new KeyboardEvent('keyup', { key }));

beforeEach(() => resetControlState());
afterEach(() => resetControlState());

describe('useKeyboardControls', () => {
  it('maps W to forward and releases cleanly', () => {
    const { unmount } = renderHook(() => useKeyboardControls());
    press('w');
    expect(controlState.moveAxis.y).toBe(1);
    release('w');
    expect(controlState.moveAxis.y).toBe(0);
    unmount();
  });

  it('treats the arrow keys as equivalent to WASD', () => {
    const { unmount } = renderHook(() => useKeyboardControls());
    press('ArrowLeft');
    expect(controlState.moveAxis.x).toBe(-1);
    unmount();
  });

  it('normalises diagonals, so they are not 41% faster', () => {
    const { unmount } = renderHook(() => useKeyboardControls());
    press('w');
    press('d');
    expect(controlState.moveAxis.length()).toBeCloseTo(1);
    unmount();
  });

  it('cancels a walk-to-here target as soon as a key is pressed', () => {
    const { unmount } = renderHook(() => useKeyboardControls());
    controlState.moveTarget = new THREE.Vector3(10, 0, 10);
    press('w');
    expect(controlState.moveTarget).toBeNull();
    unmount();
  });

  it('queues a jump on space and prevents the page scrolling', () => {
    const { unmount } = renderHook(() => useKeyboardControls());
    const event = new KeyboardEvent('keydown', { key: ' ', cancelable: true });
    window.dispatchEvent(event);
    expect(controlState.jumpQueued).toBe(true);
    expect(event.defaultPrevented).toBe(true);
    unmount();
  });

  it('ignores keys aimed at a text field', () => {
    const { unmount } = renderHook(() => useKeyboardControls());
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'w', bubbles: true }));
    expect(controlState.moveAxis.y).toBe(0);
    input.remove();
    unmount();
  });

  it('ignores browser shortcuts such as Cmd-D', () => {
    const { unmount } = renderHook(() => useKeyboardControls());
    press('d', { metaKey: true });
    expect(controlState.moveAxis.x).toBe(0);
    unmount();
  });

  it('stops moving when the window loses focus mid-stride', () => {
    // Otherwise the keyup never arrives and he walks into the horizon.
    const { unmount } = renderHook(() => useKeyboardControls());
    press('w');
    expect(controlState.moveAxis.y).toBe(1);
    window.dispatchEvent(new Event('blur'));
    expect(controlState.moveAxis.y).toBe(0);
    unmount();
  });

  it('detaches its listeners on unmount', () => {
    const { unmount } = renderHook(() => useKeyboardControls());
    unmount();
    press('w');
    expect(controlState.moveAxis.y).toBe(0);
  });
});
