import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

/**
 * The world's named landmark, generated from the painting itself.
 *
 * The lore briefs each name one: the First Poppy at the meadow's origin, the
 * Grand Pagoda over the mist. These are image-to-3D generations from crops of
 * the actual canvases -- his painted forms, not my geometry -- run through
 * draco+webp (54MB -> 1.7MB, 56MB -> 0.9MB).
 *
 * Auto-scaled to a stated height, because generated models arrive at whatever
 * size the model felt like: the contract here is "this tall in world units",
 * measured from its own bounding box.
 */
const HeroProp: React.FC<{
  url: string;
  position: [number, number, number];
  height: number;
  yaw?: number;
}> = ({ url, position, height, yaw = 0 }) => {
  const { scene } = useGLTF(url);

  const prepared = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const scale = height / Math.max(size.y, 0.001);
    clone.scale.setScalar(scale);
    // Sit its feet on the ground, whatever origin the generator chose.
    const scaledBox = new THREE.Box3().setFromObject(clone);
    clone.position.y = -scaledBox.min.y;
    return clone;
  }, [scene, height]);

  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <primitive object={prepared} />
    </group>
  );
};

export default HeroProp;
