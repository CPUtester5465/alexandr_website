import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  EffectComposer, RenderPass, EffectPass,
  SelectiveBloomEffect, VignetteEffect, Effect, BlendFunction,
  ToneMappingEffect, ToneMappingMode
} from 'postprocessing';


/**
 * The painterly post stack, mounted only while a smooth dimension is on
 * screen. While it is mounted it owns the render (useFrame priority 1
 * disables fiber's own render), and unmounting hands the loop back.
 *
 * Three effects in one pass:
 *   selective bloom -- only objects on BLOOM_LAYER glow (the poppy petals),
 *     computed at half resolution;
 *   a palette grade -- shadows pulled toward the painting's deep colour,
 *     highlights toward its warm one, both fed from spec.palette;
 *   a vignette.
 *
 * prefers-reduced-motion skips the bloom: it is the one element that shimmers
 * as the flowers move.
 */

export const BLOOM_LAYER = 11;

const GRADE_FRAG = /* glsl */ `
uniform vec3 uShadowTint;
uniform vec3 uHighTint;
uniform float uAmount;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 c = inputColor.rgb;
  float l = clamp(dot(c, vec3(0.2126, 0.7152, 0.0722)), 0.0, 1.0);

  // Lift-gamma-gain toward the painting: shadows lifted toward its deep
  // colour, highlights gained toward its warm one, and a gentle saturation.
  vec3 g = pow(c, vec3(0.96));
  g += uShadowTint * 0.06 * (1.0 - l) * (1.0 - l);
  g *= mix(vec3(1.0), uHighTint * 1.9, 0.10 * l);
  float lg = dot(g, vec3(0.2126, 0.7152, 0.0722));
  g = mix(vec3(lg), g, 1.07);

  outputColor = vec4(mix(c, g, uAmount), inputColor.a);
}
`;

class PaletteGradeEffect extends Effect {
  constructor(shadowTint: THREE.Color, highTint: THREE.Color) {
    super('PaletteGradeEffect', GRADE_FRAG, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, THREE.Uniform>([
        ['uShadowTint', new THREE.Uniform(new THREE.Vector3(shadowTint.r, shadowTint.g, shadowTint.b))],
        ['uHighTint', new THREE.Uniform(new THREE.Vector3(highTint.r, highTint.g, highTint.b))],
        ['uAmount', new THREE.Uniform(0.65)]
      ])
    });
  }
}

/**
 * palette: sampled hexes, most-used first; the grade reads [1] for shadows and
 * [5] for highlights, the same slots every recipe fills.
 */
const PostFX: React.FC<{ palette: string[] }> = ({ palette }) => {
  const { gl, scene, camera, size } = useThree();
  const composerRef = useRef<EffectComposer | null>(null);
  const sizeRef = useRef(size);

  const reducedMotion = useMemo(
    () => typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  // The composer is built and torn down INSIDE one effect. Building it in a
  // useMemo with a separate dispose-on-cleanup effect left StrictMode's double
  // mount holding an already-disposed composer with zero passes, which
  // rendered the sky and nothing else and looked exactly like a broken world.
  useEffect(() => {
    const composer = new EffectComposer(gl, {
      frameBufferType: THREE.HalfFloatType
    });
    composer.addPass(new RenderPass(scene, camera));

    const effects: Effect[] = [];
    if (!reducedMotion) {
      const bloom = new SelectiveBloomEffect(scene, camera, {
        mipmapBlur: true,
        intensity: 0.85,
        radius: 0.72,
        levels: 6,
        luminanceThreshold: 0.08,
        luminanceSmoothing: 0.2,
        resolutionScale: 0.5
      });
      bloom.selection.layer = BLOOM_LAYER;
      effects.push(bloom);
    }

    // Shadows toward the deep green, highlights toward the warm tan -- the
    // grade is fed from the painting's own palette.
    const shadow = new THREE.Color(palette[1] ?? palette[0] ?? '#444444');
    const high = new THREE.Color(palette[5] ?? palette[0] ?? '#cccccc');
    // Rendering through the composer bypasses the renderer's own ACES pass
    // (three only tone maps the default framebuffer), so without this the
    // whole world comes back linear: bright, milky and flat.
    effects.push(new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC }));
    effects.push(new PaletteGradeEffect(shadow, high));
    effects.push(new VignetteEffect({ offset: 0.24, darkness: 0.4 }));

    composer.addPass(new EffectPass(camera, ...effects));
    composer.setSize(sizeRef.current.width, sizeRef.current.height);
    composerRef.current = composer;
    if (import.meta.env.DEV && typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>).__studyComposer = composer;
    }
    return () => {
      composerRef.current = null;
      if (import.meta.env.DEV && typeof window !== 'undefined') {
        delete (window as unknown as Record<string, unknown>).__studyComposer;
      }
      composer.dispose();
    };
  }, [gl, scene, camera, palette, reducedMotion]);

  useEffect(() => {
    sizeRef.current = size;
    composerRef.current?.setSize(size.width, size.height);
  }, [size]);

  useFrame((_, delta) => {
    composerRef.current?.render(delta);
  }, 1);

  return null;
};

export default PostFX;
