import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { DimensionSpec } from '../../../world/dimensions/specs';

/**
 * The sky, in one of two honest forms.
 *
 * If the dimension owns a Marble pano — a sky generated FROM its painting —
 * that texture goes on the dome. Otherwise the dome carries a three-stop
 * gradient built from the sampled palette (interpolate, never invent; the
 * brightness multipliers are shading, not new hues).
 *
 * Either way the dome follows the camera, which is what puts it at optical
 * infinity: it never gets closer, so it reads as horizon rather than wall.
 * depthWrite off and renderOrder -1 keep it permanently behind the world, and
 * fog:false because an atmosphere must not swallow its own sky.
 */

const RADIUS = 420;

/** Direction of the scene's one directional light, normalised. */
const SUN_DIR = new THREE.Vector3(10, 20, 5).normalize();

const VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAG = /* glsl */ `
uniform vec3 uZenith;
uniform vec3 uMid;
uniform vec3 uHorizon;
uniform vec3 uGround;
uniform vec3 uSunTint;
uniform vec3 uSunDir;
varying vec3 vDir;

void main() {
  float t = vDir.y;
  vec3 low = mix(uGround, uHorizon, smoothstep(-0.30, 0.02, t));
  vec3 high = mix(uMid, uZenith, smoothstep(0.14, 0.60, t));
  vec3 col = mix(low, high, smoothstep(0.0, 0.20, t));
  float glow = pow(max(dot(vDir, uSunDir), 0.0), 14.0);
  col += uSunTint * glow * 0.38;
  gl_FragColor = vec4(col, 1.0);
}
`;

const FollowingDome: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ camera }) => {
    groupRef.current?.position.copy(camera.position);
  });
  return <group ref={groupRef}>{children}</group>;
};

const PanoDome: React.FC<{ url: string }> = ({ url }) => {
  const texture = useTexture(url);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.mapping = THREE.EquirectangularReflectionMapping;

  return (
    <FollowingDome>
      <mesh frustumCulled={false} renderOrder={-1} userData={{ cameraTransparent: true }}>
        <sphereGeometry args={[RADIUS, 48, 32]} />
        <meshBasicMaterial map={texture} side={THREE.BackSide} fog={false} depthWrite={false} />
      </mesh>
    </FollowingDome>
  );
};

const GradientDome: React.FC<{ spec: DimensionSpec }> = ({ spec }) => {
  const material = useMemo(() => {
    const hex = (i: number) => new THREE.Color(spec.palette[i] ?? '#888888');
    const zenith = hex(0).multiplyScalar(1.05);
    const mid = hex(4).multiplyScalar(1.18);
    const horizon = hex(4).lerp(hex(5), 0.55).multiplyScalar(1.22);
    const ground = hex(1);
    const sunTint = hex(5);
    return new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uZenith: { value: zenith },
        uMid: { value: mid },
        uHorizon: { value: horizon },
        uGround: { value: ground },
        uSunTint: { value: sunTint },
        uSunDir: { value: SUN_DIR.clone() }
      },
      side: THREE.BackSide,
      depthWrite: false,
      fog: false
    });
  }, [spec]);

  return (
    <FollowingDome>
      <mesh material={material} frustumCulled={false} renderOrder={-1}
            userData={{ cameraTransparent: true }}>
        <sphereGeometry args={[RADIUS, 24, 14]} />
      </mesh>
    </FollowingDome>
  );
};

const SkyDome: React.FC<{ spec: DimensionSpec }> = ({ spec }) =>
  spec.pano ? <PanoDome url={spec.pano} /> : <GradientDome spec={spec} />;

export default SkyDome;
