import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DimensionSpec } from '../../../world/dimensions/specs';

/**
 * The sky as a graded dome instead of a flat clear colour.
 *
 * A large inverted sphere carrying a three-stop vertical gradient plus a soft
 * warm glow around the light direction. Every stop is a palette entry or an
 * interpolation between two of them (Law 2: interpolate, never invent), and
 * brightness scaling is shading, not a new hue.
 *
 * The dome follows the camera, so the horizon never gets closer no matter how
 * far he walks; depth writing is off so it always sits behind the world.
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

const SkyDome: React.FC<{ spec: DimensionSpec }> = ({ spec }) => {
  const groupRef = useRef<THREE.Group>(null);

  const material = useMemo(() => {
    const hex = (i: number) => new THREE.Color(spec.palette[i] ?? '#888888');
    // Poppy palette order: surface green, deep green, red, dark red, pale
    // green, warm tan. The sky is the greens with the warm tan at the horizon
    // and around the sun -- green weather, exactly as the painting says.
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

  useFrame(({ camera }) => {
    groupRef.current?.position.copy(camera.position);
  });

  return (
    <group ref={groupRef}>
      <mesh material={material} frustumCulled={false} renderOrder={-1}>
        <sphereGeometry args={[RADIUS, 24, 14]} />
      </mesh>
    </group>
  );
};

export default SkyDome;
