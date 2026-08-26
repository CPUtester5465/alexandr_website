import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useLegoPlayer } from '../../../hooks/useLegoPlayer';
import { controlState } from '../../../state/controlState';
import { MAX_FRAME_DELTA, PLAYER_CONFIG } from '../../../utils/constants';
import { clampToWorldBounds, createLegoMaterial } from '../../../utils/three-helpers';

/**
 * The character.
 *
 * Movement takes one of two forms and they never fight:
 *
 *   held input   -- keyboard or on-screen stick, interpreted relative to
 *                   wherever the camera is looking, so "forward" always means
 *                   away from you
 *   a destination -- the point you tapped; he walks there and stops
 *
 * Held input wins and clears the destination, because reaching for the controls
 * means you have changed your mind.
 *
 * Everything below is in units per second and scaled by the frame delta. It
 * used to be per frame, which made the character travel twice as far per second
 * on a 120 Hz phone as on a 60 Hz laptop.
 */

const direction = new THREE.Vector2();
const velocity = new THREE.Vector3();

const LegoPlayer: React.FC = () => {
  const playerGroupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);

  const canJump = useRef(true);
  const isJumping = useRef(false);
  const { updateAnimation } = useLegoPlayer();

  useFrame((state, rawDelta) => {
    const group = playerGroupRef.current;
    if (!group) return;

    const delta = Math.min(rawDelta, MAX_FRAME_DELTA);
    const position = controlState.playerPosition;
    direction.set(0, 0);

    const axis = controlState.moveAxis;
    if (axis.lengthSq() > 0.0001) {
      // Camera-relative. The camera orbits to (sin yaw, cos yaw) from the
      // player, so walking away from it is the negative of that, and right is
      // the cross product of forward and up.
      const yaw = controlState.cameraYaw;
      const forwardX = -Math.sin(yaw);
      const forwardZ = -Math.cos(yaw);
      const rightX = Math.cos(yaw);
      const rightZ = -Math.sin(yaw);
      direction.set(
        forwardX * axis.y + rightX * axis.x,
        forwardZ * axis.y + rightZ * axis.x
      );
    } else if (controlState.moveTarget) {
      const dx = controlState.moveTarget.x - position.x;
      const dz = controlState.moveTarget.z - position.z;
      const remaining = Math.hypot(dx, dz);
      if (remaining < PLAYER_CONFIG.ARRIVE_DISTANCE) {
        controlState.moveTarget = null;
      } else {
        direction.set(dx / remaining, dz / remaining);
      }
    }

    if (direction.lengthSq() > 0.0001) {
      if (direction.lengthSq() > 1) direction.normalize();
      velocity.x = direction.x * PLAYER_CONFIG.SPEED;
      velocity.z = direction.y * PLAYER_CONFIG.SPEED;
    } else {
      const damping = Math.pow(PLAYER_CONFIG.DAMPING_PER_SECOND, delta);
      velocity.x *= damping;
      velocity.z *= damping;
      if (Math.abs(velocity.x) < 0.01) velocity.x = 0;
      if (Math.abs(velocity.z) < 0.01) velocity.z = 0;
    }

    if (controlState.jumpQueued) {
      controlState.jumpQueued = false;
      if (canJump.current) {
        velocity.y = PLAYER_CONFIG.JUMP_SPEED;
        canJump.current = false;
        isJumping.current = true;
      }
    }

    velocity.y -= PLAYER_CONFIG.GRAVITY * delta;
    position.addScaledVector(velocity, delta);

    if (position.y <= PLAYER_CONFIG.HEIGHT) {
      position.y = PLAYER_CONFIG.HEIGHT;
      velocity.y = 0;
      canJump.current = true;
      isJumping.current = false;
    }

    position.copy(clampToWorldBounds(position));
    group.position.copy(position);

    const isMoving = Math.abs(velocity.x) > 0.05 || Math.abs(velocity.z) > 0.05;
    if (isMoving) {
      const targetFacing = Math.atan2(velocity.x, velocity.z);
      let difference = targetFacing - controlState.playerFacing;
      // Take the short way round rather than spinning 350 degrees.
      while (difference > Math.PI) difference -= Math.PI * 2;
      while (difference < -Math.PI) difference += Math.PI * 2;
      controlState.playerFacing += difference * (1 - Math.pow(0.0001, delta));
      group.rotation.y = controlState.playerFacing;
    }

    updateAnimation(isMoving, isJumping.current);
    animateLegoCharacter(state.clock.getElapsedTime(), isMoving, isJumping.current);
  });

  const animateLegoCharacter = (time: number, isMoving: boolean, jumping: boolean) => {
    if (!bodyRef.current || !headRef.current) return;

    if (jumping) {
      // Jumping animation
      if (leftLegRef.current && rightLegRef.current) {
        leftLegRef.current.rotation.x = -0.5;  // Legs tucked
        rightLegRef.current.rotation.x = -0.5;
      }
      if (leftArmRef.current && rightArmRef.current) {
        leftArmRef.current.rotation.x = -1.2;  // Arms up
        rightArmRef.current.rotation.x = -1.2;
      }
    } else if (isMoving) {
      // Walking animation
      const walkCycle = Math.sin(time * 8);

      if (leftLegRef.current && rightLegRef.current) {
        leftLegRef.current.rotation.x = walkCycle * 0.5;
        rightLegRef.current.rotation.x = -walkCycle * 0.5;
      }
      if (leftArmRef.current && rightArmRef.current) {
        leftArmRef.current.rotation.x = -walkCycle * 0.3;
        rightArmRef.current.rotation.x = walkCycle * 0.3;
      }

      // Body bob
      bodyRef.current.position.y = Math.abs(Math.sin(time * 8)) * 0.05;
    } else {
      // Idle animation
      if (leftLegRef.current && rightLegRef.current) {
        leftLegRef.current.rotation.x = 0;
        rightLegRef.current.rotation.x = 0;
      }
      if (leftArmRef.current && rightArmRef.current) {
        leftArmRef.current.rotation.x = 0;
        rightArmRef.current.rotation.x = 0;
      }

      // Breathing motion
      bodyRef.current.position.y = Math.sin(time * 2) * 0.02;

      // Subtle head turn
      headRef.current.rotation.y = Math.sin(time * 1.5) * 0.1;
    }
  };

  return (
    <group ref={playerGroupRef} position={[0, PLAYER_CONFIG.HEIGHT, 0]}>
      {/* Body (torso) */}
      <mesh ref={bodyRef} castShadow>
        <boxGeometry args={[1.2, 1.8, 1.2]} />
        <primitive object={createLegoMaterial('#FF6B6B')} />
      </mesh>

      {/* Head */}
      <group ref={headRef} position={[0, 1.25, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.5, 0.5, 0.8, 16]} />
          <primitive object={createLegoMaterial('#FFD93D')} />
        </mesh>

        {/* Head studs (classic Lego) */}
        {[...Array(3)].map((_, i) => (
          <mesh key={i} position={[
            (i - 1) * 0.2,
            0.45,
            0
          ]}>
            <cylinderGeometry args={[0.05, 0.05, 0.1, 8]} />
            <primitive object={createLegoMaterial('#FFD93D')} />
          </mesh>
        ))}

        {/* Eyes */}
        <mesh position={[-0.15, 0, 0.4]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshPhongMaterial color="#000000" />
        </mesh>
        <mesh position={[0.15, 0, 0.4]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshPhongMaterial color="#000000" />
        </mesh>

        {/* Mouth */}
        <mesh position={[0, -0.15, 0.4]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshPhongMaterial color="#000000" />
        </mesh>
      </group>

      {/* Left Arm */}
      <group ref={leftArmRef} position={[-0.7, 0.5, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.15, 0.15, 1.2, 8]} />
          <primitive object={createLegoMaterial('#FFD93D')} />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -0.8, 0]}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <primitive object={createLegoMaterial('#FFD93D')} />
        </mesh>
      </group>

      {/* Right Arm */}
      <group ref={rightArmRef} position={[0.7, 0.5, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.15, 0.15, 1.2, 8]} />
          <primitive object={createLegoMaterial('#FFD93D')} />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -0.8, 0]}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <primitive object={createLegoMaterial('#FFD93D')} />
        </mesh>
      </group>

      {/* Left Leg */}
      <group ref={leftLegRef} position={[-0.3, -1.2, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.2, 0.2, 1.0, 8]} />
          <primitive object={createLegoMaterial('#4169E1')} />
        </mesh>
        {/* Foot */}
        <mesh position={[0, -0.7, 0.1]}>
          <boxGeometry args={[0.5, 0.2, 0.8]} />
          <primitive object={createLegoMaterial('#000000')} />
        </mesh>
      </group>

      {/* Right Leg */}
      <group ref={rightLegRef} position={[0.3, -1.2, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.2, 0.2, 1.0, 8]} />
          <primitive object={createLegoMaterial('#4169E1')} />
        </mesh>
        {/* Foot */}
        <mesh position={[0, -0.7, 0.1]}>
          <boxGeometry args={[0.5, 0.2, 0.8]} />
          <primitive object={createLegoMaterial('#000000')} />
        </mesh>
      </group>
    </group>
  );
};

export default LegoPlayer;
