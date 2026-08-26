import * as THREE from 'three';

/**
 * Procedural character animation.
 *
 * Kept separate from the character mesh on purpose. The Lego minifigure is
 * placeholder and is being replaced by a designed avatar -- when that happens
 * only the rig bindings change and every motion below carries over, because
 * nothing here knows or cares what the limbs look like.
 *
 * The rules it follows are the ordinary ones animators use, and they are what
 * make a figure read as alive rather than as a sliding token:
 *
 *   anticipation   he crouches before he leaves the ground
 *   squash/stretch he stretches at take-off and compresses on landing
 *   banking        he leans into a turn, and out of it again
 *   drag           the head and arms arrive slightly after the body
 *   overlap        the landing spring is still settling while he walks off
 *   weight         stride length and tempo both grow with speed, not just tempo
 */

export interface CharacterRig {
  root: THREE.Object3D;
  body: THREE.Object3D;
  head: THREE.Object3D;
  leftArm: THREE.Object3D;
  rightArm: THREE.Object3D;
  leftLeg: THREE.Object3D;
  rightLeg: THREE.Object3D;
}

export interface CharacterMotion {
  /** Ground speed, units per second. */
  speed: number;
  /** Top speed, for normalising. */
  maxSpeed: number;
  /** Signed radians turned this frame, divided by delta. */
  turnRate: number;
  /** Off the ground right now. */
  airborne: boolean;
  /** Positive up, units per second. */
  verticalSpeed: number;
}

/** Everything the animator remembers between frames. */
export interface AnimationState {
  phase: number;
  bank: number;
  pitch: number;
  headYaw: number;
  squash: number;
  squashVelocity: number;
  wasAirborne: boolean;
  idleFor: number;
  glanceAt: number;
  glance: number;
}

export function createAnimationState(): AnimationState {
  return {
    phase: 0,
    bank: 0,
    pitch: 0,
    headYaw: 0,
    squash: 0,
    squashVelocity: 0,
    wasAirborne: false,
    idleFor: 0,
    glanceAt: 3,
    glance: 0
  };
}

/** Frame-rate independent approach: reaches `target` at a fixed rate per second. */
function approach(current: number, target: number, perSecond: number, delta: number): number {
  return THREE.MathUtils.lerp(current, target, 1 - Math.pow(1 - perSecond, delta * 60));
}

const IDLE_GLANCE_EVERY = 4.5;

export function poseCharacter(
  rig: CharacterRig,
  motion: CharacterMotion,
  state: AnimationState,
  delta: number,
  time: number
): void {
  const pace = motion.maxSpeed > 0 ? Math.min(motion.speed / motion.maxSpeed, 1) : 0;
  const moving = motion.speed > 0.2;

  // --- landing impact -------------------------------------------------------
  // A critically damped spring rather than a timed keyframe, so a small hop and
  // a long fall land differently and the recoil is still settling as he walks
  // away from it.
  if (state.wasAirborne && !motion.airborne) {
    const impact = THREE.MathUtils.clamp(Math.abs(motion.verticalSpeed) / 30, 0.15, 1);
    state.squashVelocity -= impact * 9;
  }
  state.wasAirborne = motion.airborne;

  const stiffness = 190;
  const damping = 2 * Math.sqrt(stiffness) * 0.55;
  state.squashVelocity += (-stiffness * state.squash - damping * state.squashVelocity) * delta;
  state.squash += state.squashVelocity * delta;
  state.squash = THREE.MathUtils.clamp(state.squash, -0.45, 0.45);

  // --- banking and lean -----------------------------------------------------
  // He leans into a turn like a runner, and forward in proportion to how hard
  // he is going. Both are damped, which is what supplies the "arrives late"
  // feeling that reads as weight.
  const targetBank = THREE.MathUtils.clamp(-motion.turnRate * 0.055, -0.42, 0.42) * pace;
  state.bank = approach(state.bank, moving ? targetBank : 0, 0.14, delta);

  let targetPitch = pace * 0.16;
  if (motion.airborne) targetPitch = motion.verticalSpeed > 0 ? -0.12 : 0.2;
  state.pitch = approach(state.pitch, targetPitch, 0.12, delta);

  rig.root.rotation.z = state.bank;
  rig.body.rotation.x = state.pitch;
  rig.body.rotation.z = state.bank * 0.35; // the torso lags the whole figure

  // --- squash and stretch ---------------------------------------------------
  let stretch = 1 + state.squash;
  if (motion.airborne) {
    // Stretched going up, gathering on the way down.
    stretch *= 1 + THREE.MathUtils.clamp(motion.verticalSpeed / 60, -0.08, 0.14);
  }
  const widen = 1 / Math.sqrt(Math.max(stretch, 0.2)); // preserve volume
  rig.body.scale.set(widen, stretch, widen);

  // --- the walk cycle -------------------------------------------------------
  // Tempo AND stride both grow with speed. Tempo alone is the classic mistake:
  // it gives you a figure taking tiny frantic steps at walking pace.
  if (moving && !motion.airborne) {
    state.phase += (5.5 + pace * 5.5) * delta;
    const swing = Math.sin(state.phase);
    const stride = 0.28 + pace * 0.42;

    rig.leftLeg.rotation.x = swing * stride;
    rig.rightLeg.rotation.x = -swing * stride;
    // Arms lag the legs by a fraction of a cycle -- perfect opposition looks
    // mechanical.
    const armSwing = Math.sin(state.phase - 0.35);
    rig.leftArm.rotation.x = -armSwing * stride * 0.7;
    rig.rightArm.rotation.x = armSwing * stride * 0.7;
    rig.leftArm.rotation.z = 0.06 + pace * 0.1;
    rig.rightArm.rotation.z = -(0.06 + pace * 0.1);

    // Two bounces per stride, one per footfall.
    rig.body.position.y = Math.abs(Math.cos(state.phase)) * (0.03 + pace * 0.06);
    state.idleFor = 0;
  } else if (motion.airborne) {
    const rising = motion.verticalSpeed > 0;
    rig.leftLeg.rotation.x = approach(rig.leftLeg.rotation.x, rising ? -0.7 : 0.25, 0.2, delta);
    rig.rightLeg.rotation.x = approach(rig.rightLeg.rotation.x, rising ? -0.35 : 0.1, 0.2, delta);
    rig.leftArm.rotation.x = approach(rig.leftArm.rotation.x, rising ? -1.9 : -0.9, 0.18, delta);
    rig.rightArm.rotation.x = approach(rig.rightArm.rotation.x, rising ? -1.9 : -0.9, 0.18, delta);
    rig.leftArm.rotation.z = approach(rig.leftArm.rotation.z, 0.4, 0.15, delta);
    rig.rightArm.rotation.z = approach(rig.rightArm.rotation.z, -0.4, 0.15, delta);
    rig.body.position.y = approach(rig.body.position.y, 0, 0.1, delta);
    state.idleFor = 0;
  } else {
    // --- idle ---------------------------------------------------------------
    state.idleFor += delta;
    for (const limb of [rig.leftLeg, rig.rightLeg, rig.leftArm, rig.rightArm]) {
      limb.rotation.x = approach(limb.rotation.x, 0, 0.15, delta);
    }
    rig.leftArm.rotation.z = approach(rig.leftArm.rotation.z, 0.08, 0.1, delta);
    rig.rightArm.rotation.z = approach(rig.rightArm.rotation.z, -0.08, 0.1, delta);

    // Breathing, plus a slow weight shift from one foot to the other so he is
    // never perfectly still.
    rig.body.position.y = Math.sin(time * 1.7) * 0.022;
    rig.root.rotation.z = state.bank + Math.sin(time * 0.55) * 0.014;

    // Every few seconds he looks around. Standing figures that never break
    // symmetry read as switched off.
    if (state.idleFor > state.glanceAt) {
      state.glance = 1;
      state.glanceAt = state.idleFor + IDLE_GLANCE_EVERY;
    }
  }

  // --- head -----------------------------------------------------------------
  // Leads the turn slightly: you look where you are going before you get there.
  let targetHeadYaw = THREE.MathUtils.clamp(motion.turnRate * 0.07, -0.5, 0.5);
  if (!moving && state.glance > 0) {
    state.glance = Math.max(0, state.glance - delta * 0.5);
    targetHeadYaw = Math.sin(time * 1.1) * 0.45 * state.glance;
  }
  state.headYaw = approach(state.headYaw, targetHeadYaw, 0.1, delta);
  rig.head.rotation.y = state.headYaw;
  rig.head.rotation.x = approach(
    rig.head.rotation.x,
    motion.airborne ? (motion.verticalSpeed > 0 ? -0.2 : 0.25) : -pace * 0.1,
    0.12,
    delta
  );
  rig.head.rotation.z = -state.bank * 0.4; // the head stays more upright than the body
}
