import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { Door } from '../../../world/hub';
import { dimensionBySlug } from '../../../world/dimensions/registry';
import { specBySlug } from '../../../world/dimensions/specs';
import { BLOOM_LAYER } from '../PostFX';

/**
 * The portal itself -- the thing that was "really plain and really poor".
 *
 * Two honest forms, matching the two states a door can be in:
 *
 * A world with a courted Marble sky gets a WINDOW: its actual sky pano,
 * slowly drifting inside the arch, edge-vignetted so it reads as depth
 * beyond the wall rather than a poster on it. You are literally looking
 * into the world you are about to enter.
 *
 * Every other door gets living paint: a slow shader swirl mixing that
 * painting's own sampled colours -- domain-warped noise, no textures, one
 * plane -- bright enough to bloom. Nothing generic: every portal's motion
 * carries only its own palette.
 */

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const SWIRL_FRAG = /* glsl */ `
uniform float uTime;
uniform vec3 uA;
uniform vec3 uB;
uniform vec3 uC;
varying vec2 vUv;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1,0)), f.x),
             mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
}

void main() {
  vec2 p = vUv * 3.0;
  // Domain warp, the same trick the terrain uses: the swirl reads as paint
  // folding into paint rather than as scrolling noise.
  vec2 w = vec2(noise(p + uTime * 0.11), noise(p + 7.3 - uTime * 0.09));
  float n = noise(p + w * 1.8 + vec2(0.0, uTime * 0.06));
  vec3 col = mix(uA, uB, smoothstep(0.25, 0.75, n));
  col = mix(col, uC, smoothstep(0.55, 0.95, noise(p * 1.7 - w + uTime * 0.05)) * 0.5);
  // Darkened toward the arch edges: depth, not poster. The global 0.66 keeps
  // pale palettes (the graphite worlds are mostly silver) from blowing out to
  // white slabs under bloom -- a portal is a deep thing, not a lightbox.
  float d = distance(vUv, vec2(0.5));
  col *= (1.0 - smoothstep(0.32, 0.62, d) * 0.65) * 0.66;
  gl_FragColor = vec4(col, 1.0);
}
`;

const PANO_FRAG = /* glsl */ `
uniform sampler2D uMap;
uniform float uTime;
varying vec2 vUv;
void main() {
  // A slice of the equirect sky, drifting slowly sideways: the world seen
  // through its own doorway.
  vec2 uv = vec2(fract(vUv.x * 0.22 + uTime * 0.006), 0.30 + vUv.y * 0.38);
  vec3 col = texture2D(uMap, uv).rgb;
  float d = distance(vUv, vec2(0.5));
  col *= 1.0 - smoothstep(0.30, 0.62, d) * 0.7;
  gl_FragColor = vec4(col, 1.0);
}
`;

const PortalSurface: React.FC<{ door: Door }> = ({ door }) => {
  const entry = dimensionBySlug(door.slug);
  const spec = specBySlug(door.slug);
  const pano = spec?.pano;
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const texture = useTexture(pano ?? '/marble/poppy-sky.webp');

  const material = useMemo(() => {
    if (pano) {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.RepeatWrapping;
      return new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: PANO_FRAG,
        uniforms: { uMap: { value: texture }, uTime: { value: 0 } }
      });
    }
    const hexes = entry?.palette ?? ['#888888'];
    const c = (i: number) => new THREE.Color(hexes[Math.min(i, hexes.length - 1)] ?? '#888888');
    return new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: SWIRL_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uA: { value: c(0) },
        uB: { value: c(2) },
        uC: { value: c(4) }
      }
    });
  }, [pano, texture, entry]);

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.getElapsedTime() + door.angle * 40;
  });

  const inward = door.facing.clone().multiplyScalar(-1);

  return (
    <mesh
      position={[
        // INWARD of the door anchor. The old minus pushed the plane 1.6 units
        // outward -- into what used to be the voxel alcove and is now the far
        // side of the plaster drum, where every portal glowed at a wall.
        door.position.x + inward.x * 2.2,
        6.4,
        door.position.z + inward.z * 2.2
      ]}
      rotation={[0, Math.atan2(inward.x, inward.z), 0]}
      material={material}
      ref={undefined}
      layers-mask={(1 << 0) | (1 << BLOOM_LAYER)}
    >
      <planeGeometry args={[7.4, 10.2]} />
    </mesh>
  );
};

export default PortalSurface;
