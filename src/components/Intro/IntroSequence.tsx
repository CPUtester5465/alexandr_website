import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { setIntroPhase, getUi } from '../../state/uiState';
import { setWorldImmediately } from '../../state/worldState';
import { isTouchPrimary } from '../../utils/device-detection';
import { useGLTF } from '@react-three/drei';
import { makeStream } from '../../world/rng';
import { SPECS } from '../../world/dimensions/specs';
import { palettePhrase } from '../../state/audio';

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
const SPLAT_SECONDS = 4.6;
const ASCENT_SECONDS = 11.0;

/** Today as an integer seed: the ascent's sky exists only today, and says so. */
export function todaySeed(): number {
  const now = new Date();
  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
}

/** The helix the plane climbs. k in 0..1 -> position. */
function helix(k: number, out: THREE.Vector3): THREE.Vector3 {
  const angle = k * 2.4;
  const radius = 9 - k * 3.5;
  return out.set(Math.sin(angle) * radius, k * 46, Math.cos(angle) * radius);
}

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
  const phaseRef = useRef<'paper' | 'dive' | 'splat' | 'ascent' | 'leaving'>('paper');
  const paperRef = useRef<THREE.Mesh>(null);
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

  const { scene: pagodaGlb } = useGLTF('/props/pagoda-lite.glb');

  /**
   * THE ASCENT, built once. A cream paper dart, six world-fragments arranged
   * by TODAY'S seed (the sky exists only today), a ribbon strip whose
   * vertices trail the plane, and a drift of soft cloud sprites. Fragment
   * kinds come from the lore: petals, a pagoda, ink moon-spirits, a tilted
   * balance, crystals, a grey vessel.
   */
  const ascent = useMemo(() => {
    const group = new THREE.Group();
    group.visible = false;
    const rng = makeStream(todaySeed(), 'ascent');

    // -- the plane --
    const dartGeometry = new THREE.BufferGeometry();
    dartGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
      0, 0, 1.6, -0.9, 0.12, -1, -0.12, 0, -0.7,
      0, 0, 1.6, -0.12, 0, -0.7, 0.12, 0, -0.7,
      0, 0, 1.6, 0.12, 0, -0.7, 0.9, 0.12, -1,
      0, -0.34, 1.2, -0.1, 0, -0.7, 0.1, 0, -0.7
    ]), 3));
    dartGeometry.computeVertexNormals();
    const plane = new THREE.Mesh(
      dartGeometry,
      // Basic, not Lambert: against a bright sky a lit dart reads as a black
      // silhouette; paper should read as paper from every angle.
      new THREE.MeshBasicMaterial({ color: 0xF7F2E6, side: THREE.DoubleSide })
    );
    plane.scale.setScalar(1.0);
    group.add(plane);

    // -- the ribbon: a triangle strip trailing the plane --
    const RIBBON_POINTS = 110;
    const ribbonPositions = new Float32Array(RIBBON_POINTS * 2 * 3);
    const ribbonGeometry = new THREE.BufferGeometry();
    ribbonGeometry.setAttribute('position', new THREE.BufferAttribute(ribbonPositions, 3));
    const ribbonIndex: number[] = [];
    for (let i = 0; i < RIBBON_POINTS - 1; i++) {
      const a = i * 2;
      ribbonIndex.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    ribbonGeometry.setIndex(ribbonIndex);
    const ribbon = new THREE.Mesh(
      ribbonGeometry,
      new THREE.MeshBasicMaterial({
        color: 0xC2402A, side: THREE.DoubleSide,
        transparent: true, opacity: 0.8, depthWrite: false
      })
    );
    ribbon.frustumCulled = false;
    group.add(ribbon);

    // -- clouds: sprites, so they always face the camera. The disc version
    // was rotated flat and viewed edge-on: forty invisible clouds. --
    const cloudCanvas = document.createElement('canvas');
    cloudCanvas.width = cloudCanvas.height = 128;
    const cctx = cloudCanvas.getContext('2d')!;
    const grad = cctx.createRadialGradient(64, 64, 8, 64, 64, 62);
    grad.addColorStop(0, 'rgba(250,246,236,0.85)');
    grad.addColorStop(1, 'rgba(250,246,236,0)');
    cctx.fillStyle = grad;
    cctx.fillRect(0, 0, 128, 128);
    const cloudTexture = new THREE.CanvasTexture(cloudCanvas);
    for (let i = 0; i < 34; i++) {
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: cloudTexture, transparent: true, opacity: 0.5, depthWrite: false
      }));
      const angle = rng() * Math.PI * 2;
      const radius = 7 + rng() * 20;
      sprite.position.set(Math.sin(angle) * radius, rng() * 52, Math.cos(angle) * radius);
      const sc = 5 + rng() * 8;
      sprite.scale.set(sc, sc * 0.55, 1);
      sprite.raycast = () => {};
      group.add(sprite);
    }

    // -- the fragments, seeded by today --
    const lambert = (hex: string) => new THREE.MeshLambertMaterial({ color: new THREE.Color(hex) });
    const makers: Array<{ palette: string[]; build: () => THREE.Object3D }> = [
      { palette: SPECS.find((x) => x.slug === 'poppy')?.palette ?? [], build: () => {
          const g = new THREE.Group();
          for (let i = 0; i < 7; i++) {
            const petal = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 6), lambert('#A23637'));
            petal.scale.set(1.4, 0.35, 1);
            petal.position.set(Math.sin(i) * 1.5, (i % 3) * 0.5, Math.cos(i * 2) * 1.5);
            petal.rotation.set(i, i * 2, 0);
            g.add(petal);
          }
          return g;
        } },
      { palette: SPECS.find((x) => x.slug === 'pagoda')?.palette ?? [], build: () => {
          const g = new THREE.Group();
          let src: THREE.Mesh | null = null;
          pagodaGlb.traverse((n: THREE.Object3D) => { if (!src && (n as THREE.Mesh).isMesh) src = n as THREE.Mesh; });
          if (src) {
            const m = new THREE.Mesh((src as THREE.Mesh).geometry, (src as THREE.Mesh).material as THREE.Material);
            m.scale.setScalar(0.9);
            g.add(m);
          }
          return g;
        } },
      { palette: SPECS.find((x) => x.slug === 'gravity')?.palette ?? [], build: () => {
          const g = new THREE.Group();
          for (let i = 0; i < 5; i++) {
            const crescent = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.14, 6, 14, Math.PI * 1.3), lambert('#D8D2C4'));
            crescent.position.set(i * 0.8 - 1.6, Math.sin(i * 1.9) * 0.8, 0);
            crescent.rotation.z = i * 0.7;
            g.add(crescent);
          }
          return g;
        } },
      { palette: SPECS.find((x) => x.slug === 'economics')?.palette ?? [], build: () => {
          const g = new THREE.Group();
          const beam = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.18, 0.3), lambert('#3A4A6B'));
          beam.rotation.z = 0.16;
          g.add(beam);
          for (const side of [-1.5, 1.5]) {
            const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.12, 12), lambert('#C8B392'));
            pan.position.set(side, side * 0.16 - 0.5, 0);
            g.add(pan);
          }
          return g;
        } },
      { palette: SPECS.find((x) => x.slug === 'chemistry')?.palette ?? [], build: () => {
          const g = new THREE.Group();
          for (let i = 0; i < 6; i++) {
            const crystal = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.2 + (i % 3) * 0.6, 5), lambert(i % 2 ? '#3E7C74' : '#8A8578'));
            crystal.position.set(Math.sin(i * 2.4) * 0.9, 0, Math.cos(i * 2.4) * 0.9);
            crystal.rotation.set((i % 3) * 0.2, i, 0);
            g.add(crystal);
          }
          return g;
        } },
      { palette: SPECS.find((x) => x.slug === 'vessel')?.palette ?? [], build: () => {
          const points: THREE.Vector2[] = [];
          for (let i = 0; i <= 10; i++) {
            const v = i / 10;
            points.push(new THREE.Vector2(0.35 + Math.sin(v * Math.PI) * 0.45, v * 1.8));
          }
          return new THREE.Mesh(new THREE.LatheGeometry(points, 14), lambert('#8E877C'));
        } }
    ];

    // Shuffle the order by today's seed and hang them along the climb.
    const order = makers.map((m, i) => ({ m, r: rng(), i }))
      .sort((a, b) => a.r - b.r).map((x) => x.m);
    const fragments = order.map((maker, i) => {
      const k = 0.14 + (i / order.length) * 0.66;
      const anchor = helix(k, new THREE.Vector3());
      const side = i % 2 === 0 ? 1 : -1;
      const object = maker.build();
      object.scale.multiplyScalar(1.7);
      object.position.copy(anchor).add(new THREE.Vector3(side * (3.1 + rng() * 1.2), 0.6 + rng() * 1.6, side * -1.5));
      object.rotation.y = rng() * Math.PI * 2;
      group.add(object);
      return { object, k, palette: maker.palette, sounded: false, baseScale: object.scale.x };
    });

    const hemi = new THREE.HemisphereLight(0xF7F3E8, 0x6E9767, 0.9);
    group.add(hemi);

    return { group, plane, ribbon, ribbonPositions, RIBBON_POINTS, fragments, written: { count: 0 } };
  }, [pagodaGlb]);

  useEffect(() => {
    scene.add(ascent.group);
    return () => { scene.remove(ascent.group); };
  }, [scene, ascent]);

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
      if (k >= 1) {
        // Splat done: hand off to the climb under the white.
        if (splat) {
          scene.remove(splat);
          (splat as { dispose?: () => void }).dispose?.();
        }
        phaseRef.current = 'ascent';
        clockRef.current = 0;
        ascent.group.visible = true;
        if (paperRef.current) paperRef.current.visible = false;
        // Seed every ribbon vertex at the flight's start, or the strip spans
        // from the plane to the uninitialized origin -- the giant white wedge
        // of the first walkthrough.
        const start = helix(0, new THREE.Vector3());
        for (let i = 0; i < ascent.RIBBON_POINTS; i++) {
          ascent.ribbonPositions.set([start.x, start.y - 0.09, start.z, start.x, start.y + 0.09, start.z], i * 6);
        }
        ascent.written.count = 0;
        ascent.ribbon.geometry.setDrawRange(0, 0);
        setIntroPhase('ascent');
      }
      return;
    }

    if (phaseRef.current === 'ascent') {
      const k = Math.min(t / ASCENT_SECONDS, 1);
      wipe.value = k < 0.1 ? 1 - k / 0.1 : Math.max(0, (k - 0.88) / 0.12);

      // Sky brightens as we climb: meadow green up into paper white.
      const sky = new THREE.Color(0x6E9767).lerp(new THREE.Color(0xF4EFE4), Math.pow(k, 1.4));
      scene.background = sky;

      // The plane flies the helix; the camera chases it from behind-above.
      const at = helix(k, new THREE.Vector3());
      const ahead = helix(Math.min(k + 0.02, 1), new THREE.Vector3());
      ascent.plane.position.copy(at);
      ascent.plane.lookAt(ahead);
      ascent.plane.rotation.z += Math.sin(t * 1.7) * 0.15 + 0.25; // bank + wobble

      const behind = helix(Math.max(k - 0.11, 0), new THREE.Vector3());
      const outward = new THREE.Vector3(behind.x, 0, behind.z);
      if (outward.lengthSq() < 1) outward.set(0, 0, 1);
      outward.normalize().multiplyScalar(4.5);
      camera.position.set(behind.x + outward.x, behind.y + 2.6, behind.z + outward.z);
      camera.lookAt(at.x, at.y + 0.4, at.z);

      // The ribbon: shift the strip and append the plane's tail position.
      const w = ascent.written;
      const positions = ascent.ribbonPositions;
      if (w.count < ascent.RIBBON_POINTS) {
        w.count++;
        ascent.ribbon.geometry.setDrawRange(0, Math.max(0, (w.count - 1) * 6));
      }
      positions.copyWithin(6, 0, (ascent.RIBBON_POINTS - 1) * 6);
      const up = 0.09;
      positions[0] = at.x; positions[1] = at.y - up; positions[2] = at.z;
      positions[3] = at.x; positions[4] = at.y + up; positions[5] = at.z;
      (ascent.ribbon.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;

      // Fragments: as the plane passes each, it swells once and its palette
      // sounds -- the painting heard as it is strung onto the thread.
      for (const fragment of ascent.fragments) {
        if (!fragment.sounded && k >= fragment.k) {
          fragment.sounded = true;
          palettePhrase(fragment.palette.length ? fragment.palette : ['#888888']);
        }
        if (fragment.sounded) {
          const since = (k - fragment.k) * ASCENT_SECONDS;
          const pulse = 1 + Math.max(0, 0.35 - since * 0.5);
          fragment.object.scale.setScalar(fragment.baseScale * pulse);
          fragment.object.rotation.y += delta * 0.25;
        }
      }

      gl.render(scene, camera);
      if (k >= 1) leave();
    }
  }, 2); // positive priority: the intro owns both the camera AND the render

  return (
    <group>
      {/* The painting, hanging in near-black. Proportions match the artwork. */}
      <mesh ref={paperRef} material={material}>
        <planeGeometry args={[14, 14 * 1.004, 196, 196]} />
      </mesh>
    </group>
  );
};

export default IntroSequence;
