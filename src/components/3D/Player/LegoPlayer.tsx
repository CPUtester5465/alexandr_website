import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useLegoPlayer } from '../../../hooks/useLegoPlayer';
import {
  controlState,
  headingFromCameraSpace,
  shortestAngleTo
} from '../../../state/controlState';
import { MAX_FRAME_DELTA, PLAYER_CONFIG } from '../../../utils/constants';
import { clampToWorldBounds, createLegoMaterial } from '../../../utils/three-helpers';
import {
  createAnimationState,
  poseCharacter,
  CharacterMotion,
  CharacterRig
} from './characterAnimation';

/**
 * The character.
 *
 * The mesh below is the placeholder Lego minifigure and is on its way out. What
 * matters here is the movement, and all of the animation lives in
 * ./characterAnimation so it survives the replacement untouched.
 *
 * Two sources of steering, resolved in this order:
 *
 *   moveAxis        keyboard or on-screen stick, camera-relative, so forward
 *                   keeps meaning "away from you" as the camera orbits
 *   desiredHeading  the thumb or mouse held on screen, already a world bearing
 *
 * Held keys win, because reaching for the keyboard is a clear change of mind.
 *
 * He goes where he is pointed. Acceleration and braking exist for weight, not
 * physics -- they stop a tap twitching him and let him settle out of a run --
 * but he does not have a turning circle and the throttle is never cut for being
 * misaligned. That was tried and it made him feel reluctant on a phone.
 */

const velocity = new THREE.Vector3();

const LegoPlayer: React.FC = () => {
  const playerGroupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);

  const verticalSpeed = useRef(0);
  const canJump = useRef(true);
  const isJumping = useRef(false);
  const animation = useRef(createAnimationState());
  const motion = useRef<CharacterMotion>({
    speed: 0,
    maxSpeed: PLAYER_CONFIG.SPEED,
    turnRate: 0,
    airborne: false,
    verticalSpeed: 0
  });
  const { updateAnimation } = useLegoPlayer();

  useFrame((state, rawDelta) => {
    const group = playerGroupRef.current;
    if (!group) return;

    const delta = Math.min(rawDelta, MAX_FRAME_DELTA);
    const position = controlState.playerPosition;

    // 1. What are the controls asking for?
    let requestedHeading: number | null = null;
    let requestedThrottle = 0;

    const axis = controlState.moveAxis;
    if (axis.lengthSq() > 0.0001) {
      requestedHeading = headingFromCameraSpace(axis.x, axis.y, controlState.cameraYaw);
      requestedThrottle = Math.min(axis.length(), 1);
    } else if (controlState.desiredHeading !== null) {
      requestedHeading = controlState.desiredHeading;
      requestedThrottle = controlState.throttle;
    }

    // 2. Turn, and open or close the throttle.
    let turnedBy = 0;
    if (requestedHeading !== null && requestedThrottle > 0) {
      const offBy = shortestAngleTo(controlState.heading, requestedHeading);
      const maxTurn = PLAYER_CONFIG.TURN_RATE * delta;
      turnedBy = THREE.MathUtils.clamp(offBy, -maxTurn, maxTurn);
      controlState.heading += turnedBy;

      controlState.speed = Math.min(
        controlState.speed + PLAYER_CONFIG.ACCELERATION * delta,
        PLAYER_CONFIG.SPEED * requestedThrottle
      );
    } else {
      controlState.speed = Math.max(0, controlState.speed - PLAYER_CONFIG.BRAKING * delta);
    }

    velocity.set(
      Math.sin(controlState.heading) * controlState.speed,
      0,
      Math.cos(controlState.heading) * controlState.speed
    );

    // 3. Jump and gravity.
    if (controlState.jumpQueued) {
      controlState.jumpQueued = false;
      if (canJump.current) {
        verticalSpeed.current = PLAYER_CONFIG.JUMP_SPEED;
        canJump.current = false;
        isJumping.current = true;
      }
    }
    verticalSpeed.current -= PLAYER_CONFIG.GRAVITY * delta;

    position.addScaledVector(velocity, delta);
    position.y += verticalSpeed.current * delta;

    if (position.y <= PLAYER_CONFIG.HEIGHT) {
      position.y = PLAYER_CONFIG.HEIGHT;
      verticalSpeed.current = 0;
      canJump.current = true;
      isJumping.current = false;
    }

    position.copy(clampToWorldBounds(position));
    group.position.copy(position);
    group.rotation.y = controlState.heading;

    // 4. Pose him.
    const isMoving = controlState.speed > 0.2;
    updateAnimation(isMoving, isJumping.current);

    motion.current.speed = controlState.speed;
    motion.current.turnRate = delta > 0 ? turnedBy / delta : 0;
    motion.current.airborne = isJumping.current;
    motion.current.verticalSpeed = verticalSpeed.current;

    if (bodyRef.current && headRef.current && leftArmRef.current && rightArmRef.current &&
        leftLegRef.current && rightLegRef.current) {
      const rig: CharacterRig = {
        root: group,
        body: bodyRef.current,
        head: headRef.current,
        leftArm: leftArmRef.current,
        rightArm: rightArmRef.current,
        leftLeg: leftLegRef.current,
        rightLeg: rightLegRef.current
      };
      poseCharacter(rig, motion.current, animation.current, delta, state.clock.getElapsedTime());
    }
  });

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
