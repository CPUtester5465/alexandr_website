import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { setIntroPhase, getUi } from '../../state/uiState';
import { setWorldImmediately } from '../../state/worldState';
import { isTouchPrimary } from '../../utils/device-detection';

/**
 * OUT OF PAPER, phase 1: paper -> relief -> the splat world -> the hub.
 *
 * One continuous camera move. The painting hangs flat in space; on begin it
 * gains relief (luminance-as-depth displacement ramping up) while the camera
 * dollies in; a white wipe hides the handoff into the Marble splat world of
 * the same painting; a slow drift through real paint-space; white again; the
 * hub. 2D -> 2.5D -> 3D: the site's thesis, performed.
 *
 * The splat is cinematic-only: loaded lazily (100k tier on phones, 500k
 * otherwise), disposed the moment the intro ends. If Spark fails for any
 * reason the dive wipes straight to the hub -- a broken opening is worse
 * than a shorter one.
 */

const DIVE_SECONDS = 3.2;
const SPLAT_SECONDS = 6.0;

const VERT = /* glsl */ `
uniform sampler2D uMap;
uniform float uAmount;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 c = texture2D(uMap, uv).rgb;
  float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
  // Dark impasto sits proud, pale ground recedes -- inverted luminance reads
  // correctly for oil on a light ground.
  vec3 displaced = position + normal * (1.0 - lum) * uAmount;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
`;
const FRAG = /* glsl */ `
uniform sampler2D uMap;
varying vec2 vUv;
void main() { gl_FragColor = vec4(texture2D(uMap, vUv).rgb, 1.0); }
`;

/** Drives the white wipe div in the DOM overlay. */
export const wipe = { value: 0 };

const IntroSequence: React.FC = () => {
  const { scene, camera, gl } = useThree();
  const texture = useTexture('/intro/poppy-paper.webp');
  const clockRef = useRef(0);
  const phaseRef = useRef<'paper' | 'dive' | 'splat' | 'leaving'>('paper');
  const [splat, setSplat] = useState<THREE.Object3D | null>(null);
  const splatFailed = useRef(false);

  texture.colorSpace = THREE.SRGBColorSpace;

  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: { uMap: { value: texture }, uAmount: { value: 0 } }
  }), [texture]);

  // Preload the splat during the paper phase, so the dive never waits on it.
  useEffect(() => {
    let disposed = false;
    let mesh: (THREE.Object3D & { dispose?: () => void }) | null = null;
    (async () => {
      try {
        const { SplatMesh } = await import('@sparkjsdev/spark');
        const url = isTouchPrimary() ? '/marble/poppy-100k.spz' : '/marble/poppy-500k.spz';
        mesh = new SplatMesh({ url });
        if (!disposed) setSplat(mesh);
      } catch (error) {
        console.warn('[intro] splat unavailable, shortening the shot:', error);
        splatFailed.current = true;
      }
    })();
    return () => {
      disposed = true;
      mesh?.dispose?.();
    };
  }, []);

  const leave = React.useCallback(() => {
    if (phaseRef.current === 'leaving') return;
    phaseRef.current = 'leaving';
    if (splat) {
      scene.remove(splat);
      (splat as { dispose?: () => void }).dispose?.();
    }
    wipe.value = 1;
    setIntroPhase('done');
    setWorldImmediately('hub');
  }, [splat, scene]);

  // Background set on the scene itself -- the attach-inside-a-group bug bit
  // this file too before this line existed.
  useEffect(() => {
    const previous = scene.background;
    scene.background = new THREE.Color(0x0b0908);
    return () => { scene.background = previous; };
  }, [scene]);

  // Watch the shared phase (the DOM title card advances it).
  //
  // PRIORITY > 0 MEANS WE OWN THE RENDER: r3f disables its own loop the
  // moment any positive-priority subscriber exists, exactly as it does for
  // PostFX's composer. Forgetting gl.render here produced a fully transparent
  // canvas -- the whole intro played out as a white page.
  useFrame((_, delta) => {
    const uiPhase = getUi().introPhase;
    if (uiPhase === 'done' && phaseRef.current !== 'leaving') {
      leave();  // skip pressed
      return;
    }
    if (phaseRef.current === 'paper' && uiPhase === 'dive') {
      phaseRef.current = 'dive';
      clockRef.current = 0;
    }
    clockRef.current += delta;
    const t = clockRef.current;

    if (phaseRef.current === 'paper') {
      // The card is alive, not a poster: the paint breathes a few millimetres
      // of relief and the camera sways as if the sheet were held in hands.
      material.uniforms.uAmount.value = 0.10 + 0.07 * Math.sin(t * 0.55);
      camera.position.set(Math.sin(t * 0.21) * 0.35, Math.sin(t * 0.17) * 0.22, 10.4);
      camera.lookAt(0, 0, 0);
      wipe.value = 0;
      gl.render(scene, camera);
      return;
    }

    if (phaseRef.current === 'dive') {
      const k = Math.min(t / DIVE_SECONDS, 1);
      const ease = 1 - Math.pow(1 - k, 3);
      material.uniforms.uAmount.value = ease * 2.5;
      // Stop just above the highest impasto peak (2.5) -- diving past it put
      // the near plane inside the paint and rendered clipped shards.
      camera.position.set(0, 0, 10.4 - ease * 6.6);
      camera.lookAt(0, 0, 0);
      // White rises across the last quarter, hiding the handoff.
      wipe.value = Math.max(0, (k - 0.75) / 0.25) ;
      gl.render(scene, camera);
      if (k >= 1) {
        if (splat && !splatFailed.current) {
          phaseRef.current = 'splat';
          clockRef.current = 0;
          // The SPZ export's ground plane arrives vertical relative to three's
          // axes -- the second walkthrough showed the meadow standing on its
          // side like a wall of strokes.
          splat.rotation.x = -Math.PI / 2;
          scene.add(splat);
          // A splat has no sky: whatever the camera sees past the last
          // gaussian is raw background. Deep meadow green makes those gaps
          // read as depth of paint rather than a hole in the film.
          scene.background = new THREE.Color(0x3A542B);
          setIntroPhase('splat');
        } else {
          leave();
        }
      }
      return;
    }

    if (phaseRef.current === 'splat' && splat) {
      const k = Math.min(t / SPLAT_SECONDS, 1);
      wipe.value = k < 0.12 ? 1 - k / 0.12 : Math.max(0, (k - 0.85) / 0.15);
      // A slow orbit through paint-space, starting from a respectful distance
      // so the camera is never inside the splat's hollow core -- the first
      // attempt began at the centre of the volume and saw nothing but black.
      // Stay on the dense side of the volume; the far sweep of the first
      // orbit spent its second half facing empty space.
      const yaw = 0.25 + k * 0.6;
      const radius = 4.0 - k * 0.8;
      camera.position.set(Math.sin(yaw) * radius, 1.35 - k * 0.25, Math.cos(yaw) * radius);
      camera.lookAt(0.4, 0.85, 0);
      gl.render(scene, camera);
      if (k >= 1) leave();
    }
  }, 2); // positive priority: the intro owns both the camera AND the render

  return (
    <group>
      {/* The painting, hanging in near-black. Proportions match the artwork. */}
      <mesh material={material}>
        <planeGeometry args={[14, 14 * 1.004, 196, 196]} />
      </mesh>
    </group>
  );
};

export default IntroSequence;
