import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useInput } from '../../../hooks/useInput';
import { useLegoPlayer } from '../../../hooks/useLegoPlayer';
import { PLAYER_CONFIG } from '../../../utils/constants';
import { clampToWorldBounds, createLegoMaterial } from '../../../utils/three-helpers';
import { globalPlayerPosition } from './CameraController';

const LegoPlayer: React.FC = () => {
  const playerGroupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);

  const { keys, velocity, position, isJumping, canJump } = useInput();
  const { updateAnimation } = useLegoPlayer();

  useFrame((state, delta) => {
    if (!playerGroupRef.current) return;

    const speed = PLAYER_CONFIG.SPEED;
    const jumpSpeed = PLAYER_CONFIG.JUMP_SPEED;
    const gravity = PLAYER_CONFIG.GRAVITY;

    // Movement input
    if (keys.w || keys.arrowup) velocity.current.z = -speed;
    else if (keys.s || keys.arrowdown) velocity.current.z = speed;
    else velocity.current.z *= 0.85;

    if (keys.a || keys.arrowleft) velocity.current.x = -speed;
    else if (keys.d || keys.arrowright) velocity.current.x = speed;
    else velocity.current.x *= 0.85;

    // Jumping
    if ((keys.space || keys[' ']) && canJump.current) {
      velocity.current.y = jumpSpeed;
      canJump.current = false;
      isJumping.current = true;
    }

    // Gravity
    velocity.current.y -= gravity;

    // Apply movement
    position.current.add(velocity.current);
    
    // Ground collision
    if (position.current.y <= PLAYER_CONFIG.HEIGHT) {
      position.current.y = PLAYER_CONFIG.HEIGHT;
      velocity.current.y = 0;
      canJump.current = true;
      isJumping.current = false;
    }

    // World boundaries
    position.current.copy(clampToWorldBounds(position.current));
    playerGroupRef.current.position.copy(position.current);
    
    // Character rotation based on movement direction
    const isMoving = Math.abs(velocity.current.x) > 0.01 || Math.abs(velocity.current.z) > 0.01;
    if (isMoving) {
      const targetRotation = Math.atan2(velocity.current.x, velocity.current.z);
      
      // Smooth rotation interpolation
      const currentRotation = playerGroupRef.current.rotation.y;
      let rotationDiff = targetRotation - currentRotation;
      
      // Handle rotation wrap-around (shortest path)
      if (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
      if (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
      
      // Apply smooth rotation
      playerGroupRef.current.rotation.y += rotationDiff * 0.1;
    }
    
    // Update global player position for camera
    globalPlayerPosition.copy(position.current);

    // Update animation state
    updateAnimation(isMoving, isJumping.current);

    // Apply animations
    animateLegoCharacter(state.clock.getElapsedTime(), isMoving, isJumping.current);
  });

  const animateLegoCharacter = (time: number, isMoving: boolean, isJumping: boolean) => {
    if (!bodyRef.current || !headRef.current) return;

    if (isJumping) {
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
