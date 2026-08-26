import { useState, useCallback } from 'react';

type AnimationState = 'idle' | 'walking' | 'jumping';

interface PlayerAnimationState {
  animationState: AnimationState;
  updateAnimation: (isMoving: boolean, isJumping: boolean) => void;
}

export const usePlayerAnimationState = (): PlayerAnimationState => {
  const [animationState, setAnimationState] = useState<AnimationState>('idle');

  const updateAnimation = useCallback((isMoving: boolean, isJumping: boolean) => {
    if (isJumping) {
      setAnimationState('jumping');
    } else if (isMoving) {
      setAnimationState('walking');
    } else {
      setAnimationState('idle');
    }
  }, []);

  return {
    animationState,
    updateAnimation
  };
};
