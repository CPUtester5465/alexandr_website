import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { controlState } from '../../../state/controlState';
import { PLAYER_CONFIG } from '../../../utils/constants';

/**
 * Shows where he is going, on the ground beneath him.
 *
 * A ring marking his footprint, and an arrow along the heading whose length and
 * opacity follow the throttle. Without it, holding a thumb somewhere off to the
 * side is an act of faith -- you cannot tell whether the input registered, which
 * way it resolved, or how hard you are pushing.
 *
 * It fades out entirely when he is standing still, so it is a control surface
 * rather than decoration bolted to the character.
 */

const SteeringIndicator: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const arrowRef = useRef<THREE.Group>(null);
  const ringMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const arrowMaterial = useRef<THREE.MeshBasicMaterial>(null);

  const shown = useRef(0);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const { playerPosition, heading, throttle, speed, desiredHeading, moveAxis } = controlState;

    // Visible while there is input, not merely while he is moving -- so it
    // appears the instant a thumb goes down, before he has built any speed.
    const hasInput = throttle > 0.01 || moveAxis.lengthSq() > 0.0001 || desiredHeading !== null;
    const target = hasInput || speed > 0.5 ? 1 : 0;
    shown.current = THREE.MathUtils.lerp(shown.current, target, 1 - Math.pow(0.002, delta));

    group.visible = shown.current > 0.02;
    if (!group.visible) return;

    group.position.set(playerPosition.x, 0.06, playerPosition.z);
    group.rotation.y = heading;

    const drive = Math.max(throttle, speed / PLAYER_CONFIG.SPEED);

    if (ringRef.current) {
      // Breathes with the throttle, so a light touch reads as a light touch.
      const scale = 1 + drive * 0.18;
      ringRef.current.scale.set(scale, scale, 1);
    }
    if (ringMaterial.current) ringMaterial.current.opacity = shown.current * 0.55;

    if (arrowRef.current) {
      arrowRef.current.visible = drive > 0.02;
      // Reaches further the harder you push.
      arrowRef.current.position.z = 1.5 + drive * 1.6;
      const scale = 0.55 + drive * 0.65;
      arrowRef.current.scale.setScalar(scale);
    }
    if (arrowMaterial.current) arrowMaterial.current.opacity = shown.current * (0.35 + drive * 0.5);
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Footprint ring, flat on the ground. */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.82, 1.0, 48]} />
        <meshBasicMaterial
          ref={ringMaterial}
          color="#FFFFFF"
          transparent
          opacity={0}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Heading arrow. +Z is forward, matching how heading is built. */}
      <group ref={arrowRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.42, 0.95, 3]} />
          <meshBasicMaterial
            ref={arrowMaterial}
            color="#FFFFFF"
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
};

export default SteeringIndicator;
