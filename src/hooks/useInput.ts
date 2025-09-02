import { useEffect, useRef, MutableRefObject } from 'react';
import * as THREE from 'three';

interface UseInputReturn {
  keys: { [key: string]: boolean };
  velocity: MutableRefObject<THREE.Vector3>;
  position: MutableRefObject<THREE.Vector3>;
  isJumping: MutableRefObject<boolean>;
  canJump: MutableRefObject<boolean>;
}

export const useInput = (): UseInputReturn => {
  const keys = useRef<{ [key: string]: boolean }>({}).current;
  const velocity = useRef(new THREE.Vector3());
  const position = useRef(new THREE.Vector3(0, 2.2, 3));
  const isJumping = useRef(false);
  const canJump = useRef(true);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      keys[key] = true;
      
      // Prevent default for space bar to avoid page scrolling
      if (key === ' ') {
        event.preventDefault();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      keys[key] = false;
    };

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [keys]);

  return {
    keys,
    velocity,
    position,
    isJumping,
    canJump
  };
};
