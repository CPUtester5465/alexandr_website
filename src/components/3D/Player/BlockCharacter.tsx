import React, { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Alexandr, as a block character.
 *
 * Proportions and texture layout are the classic Minecraft ones -- head 8x8x8,
 * body 8x12x4, limbs 4x12x4, on a 64x64 skin. That is not nostalgia: it means
 * the skin at public/assets/avatar/alexandr-skin.png opens in any skin editor
 * on the internet, so he can change his own hair without touching this file.
 *
 * The rig is head / body / two arms / two legs, which is exactly what
 * characterAnimation.ts was written against, so the whole procedural animation
 * layer applies untouched.
 *
 * Pivots are anatomical here, unlike the minifigure this replaces: arms swing
 * from the shoulder and legs from the hip, because a limb that rotates about its
 * own centre shears instead of swinging.
 */

/** One Minecraft pixel, in world units. 32px tall character -> 3.68 units. */
export const PX = 0.115;

/** The skin, as (x, y, w, h) rectangles in a 64x64 sheet. */
type Rect = readonly [number, number, number, number];
interface BoxSkin {
  top: Rect; bottom: Rect; right: Rect; front: Rect; left: Rect; back: Rect;
}

const HEAD: BoxSkin = {
  top: [8, 0, 8, 8], bottom: [16, 0, 8, 8], right: [0, 8, 8, 8],
  front: [8, 8, 8, 8], left: [16, 8, 8, 8], back: [24, 8, 8, 8]
};
const HAT: BoxSkin = {
  top: [40, 0, 8, 8], bottom: [48, 0, 8, 8], right: [32, 8, 8, 8],
  front: [40, 8, 8, 8], left: [48, 8, 8, 8], back: [56, 8, 8, 8]
};
const BODY: BoxSkin = {
  top: [20, 16, 8, 4], bottom: [28, 16, 8, 4], right: [16, 20, 4, 12],
  front: [20, 20, 8, 12], left: [28, 20, 4, 12], back: [32, 20, 8, 12]
};
const R_ARM: BoxSkin = {
  top: [44, 16, 4, 4], bottom: [48, 16, 4, 4], right: [40, 20, 4, 12],
  front: [44, 20, 4, 12], left: [48, 20, 4, 12], back: [52, 20, 4, 12]
};
const L_ARM: BoxSkin = {
  top: [36, 48, 4, 4], bottom: [40, 48, 4, 4], right: [32, 52, 4, 12],
  front: [36, 52, 4, 12], left: [40, 52, 4, 12], back: [44, 52, 4, 12]
};
const R_LEG: BoxSkin = {
  top: [4, 16, 4, 4], bottom: [8, 16, 4, 4], right: [0, 20, 4, 12],
  front: [4, 20, 4, 12], left: [8, 20, 4, 12], back: [12, 20, 4, 12]
};
const L_LEG: BoxSkin = {
  top: [20, 48, 4, 4], bottom: [24, 48, 4, 4], right: [16, 52, 4, 12],
  front: [20, 52, 4, 12], left: [24, 52, 4, 12], back: [28, 52, 4, 12]
};

const SHEET = 64;

/**
 * Rewrite a BoxGeometry's UVs to point at skin rectangles.
 *
 * BoxGeometry emits faces in the order +X, -X, +Y, -Y, +Z, -Z, four vertices
 * each, laid out (0,1) (1,1) (0,0) (1,0). The character faces +Z, so its own
 * right hand is at -X -- which is why `right` lands on face 1 and not face 0.
 * Getting that backwards mirrors the whole skin and is invisible on a
 * symmetrical face, so it is worth stating rather than discovering.
 */
function skinBox(w: number, h: number, d: number, skin: BoxSkin): THREE.BufferGeometry {
  const geometry = new THREE.BoxGeometry(w * PX, h * PX, d * PX);
  const uv = geometry.attributes.uv as THREE.BufferAttribute;
  const order: Rect[] = [skin.left, skin.right, skin.top, skin.bottom, skin.front, skin.back];

  order.forEach((rect, face) => {
    const [x, y, rw, rh] = rect;
    const u0 = x / SHEET;
    const u1 = (x + rw) / SHEET;
    const v0 = 1 - y / SHEET;
    const v1 = 1 - (y + rh) / SHEET;
    const i = face * 4;
    uv.setXY(i + 0, u0, v0);
    uv.setXY(i + 1, u1, v0);
    uv.setXY(i + 2, u0, v1);
    uv.setXY(i + 3, u1, v1);
  });
  uv.needsUpdate = true;
  return geometry;
}

interface BlockCharacterProps {
  bodyRef: React.RefObject<THREE.Group | null>;
  headRef: React.RefObject<THREE.Group | null>;
  leftArmRef: React.RefObject<THREE.Group | null>;
  rightArmRef: React.RefObject<THREE.Group | null>;
  leftLegRef: React.RefObject<THREE.Group | null>;
  rightLegRef: React.RefObject<THREE.Group | null>;
}

const BlockCharacter: React.FC<BlockCharacterProps> = ({
  bodyRef, headRef, leftArmRef, rightArmRef, leftLegRef, rightLegRef
}) => {
  const texture = useTexture('/assets/avatar/alexandr-skin.png');

  // Nearest filtering with no mipmaps. Anything else turns a 64px skin into
  // grey mush the moment he walks away from the camera.
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;

  const geometry = useMemo(() => ({
    head: skinBox(8, 8, 8, HEAD),
    hat: skinBox(8, 8, 8, HAT),
    body: skinBox(8, 12, 4, BODY),
    rightArm: skinBox(4, 12, 4, R_ARM),
    leftArm: skinBox(4, 12, 4, L_ARM),
    rightLeg: skinBox(4, 12, 4, R_LEG),
    leftLeg: skinBox(4, 12, 4, L_LEG)
  }), []);

  const skinMaterial = useMemo(
    () => new THREE.MeshLambertMaterial({ map: texture }),
    [texture]
  );
  // The overlay carries his curls, so it needs cutout transparency. alphaTest
  // rather than blending, so it still writes depth and does not sort wrongly
  // against the head behind it.
  const overlayMaterial = useMemo(
    () => new THREE.MeshLambertMaterial({ map: texture, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }),
    [texture]
  );

  return (
    <group>
      {/* Legs pivot at the hip, which is the group origin. */}
      <group ref={rightLegRef} position={[-2 * PX, 0, 0]}>
        <mesh geometry={geometry.rightLeg} material={skinMaterial} position={[0, -6 * PX, 0]} castShadow />
      </group>
      <group ref={leftLegRef} position={[2 * PX, 0, 0]}>
        <mesh geometry={geometry.leftLeg} material={skinMaterial} position={[0, -6 * PX, 0]} castShadow />
      </group>

      {/* Torso, and everything the torso carries. */}
      <group ref={bodyRef}>
        <mesh geometry={geometry.body} material={skinMaterial} position={[0, 6 * PX, 0]} castShadow />

        <group ref={headRef} position={[0, 12 * PX, 0]}>
          <mesh geometry={geometry.head} material={skinMaterial} position={[0, 4 * PX, 0]} castShadow />
          {/* The curl volume. Scaled out slightly so it sits proud of the skull. */}
          <mesh
            geometry={geometry.hat}
            material={overlayMaterial}
            position={[0, 4 * PX, 0]}
            scale={1.09}
          />
        </group>

        {/* Arms pivot at the shoulder, not their own centre. */}
        <group ref={rightArmRef} position={[-6 * PX, 11 * PX, 0]}>
          <mesh geometry={geometry.rightArm} material={skinMaterial} position={[0, -5 * PX, 0]} castShadow />
        </group>
        <group ref={leftArmRef} position={[6 * PX, 11 * PX, 0]}>
          <mesh geometry={geometry.leftArm} material={skinMaterial} position={[0, -5 * PX, 0]} castShadow />
        </group>
      </group>
    </group>
  );
};

export default BlockCharacter;
