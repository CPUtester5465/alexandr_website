import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { DimensionSpec } from '../../../world/dimensions/specs';

/**
 * Fog and background, set on the scene itself.
 *
 * The study agent found the bug this fixes: declaring <fog attach="fog">
 * inside a <group> attaches the fog to the group, where three.js never reads
 * it -- so every dimension's carefully sampled atmosphere was silently ignored
 * and the App-level sky-blue fog (far: 100) quietly ruled every world since
 * the first one shipped. Imperative assignment to the actual scene is the only
 * placement that works from inside the tree.
 *
 * The fog far fringe must sit inside the sky dome radius (420) or the
 * atmosphere fogs out its own sky.
 */
const SceneAtmosphere: React.FC<{ spec: DimensionSpec }> = ({ spec }) => {
  const { scene } = useThree();

  useEffect(() => {
    const previousFog = scene.fog;
    const previousBackground = scene.background;
    scene.fog = new THREE.Fog(spec.sky, spec.fog.near, Math.min(spec.fog.far, 400));
    scene.background = new THREE.Color(spec.sky);
    return () => {
      scene.fog = previousFog;
      scene.background = previousBackground;
    };
  }, [scene, spec]);

  return null;
};

export default SceneAtmosphere;
