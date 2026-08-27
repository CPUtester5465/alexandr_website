import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { DimensionSpec } from '../../../world/dimensions/specs';
import { SmoothField, poppiesForArea } from '../../../world/smoothMesh';
import { BLOCK } from '../../../world/voxel';
import { CHUNK } from '../../../world/chunk';
import { useChunkWindow } from '../../../hooks/useChunkWindow';

/**
 * The towers ARE the generated pagoda now: the tripo image-to-3D model made
 * from the painting itself, instanced at the same seeded structure sites the
 * voxel pillars used -- determinism and the map untouched, but every tower in
 * the valley carries his painted walls and lit windows instead of a stack of
 * primitive boxes. Tim: "there are so many 3D objects we can use and put the
 * textures on them, and not just primitives." One InstancedMesh; a valley of
 * towers is one draw call.
 *
 * The window follows the player, so towers exist wherever he walks, forever.
 */
const Pagodas: React.FC<{ spec: DimensionSpec; field: SmoothField }> = ({ spec, field }) => {
  const window = useChunkWindow();
  // The LOD: 16k triangles instead of ~270k. Sixty towers of the full model
  // was millions of triangles and 67fps on a desktop GPU -- a phone funeral.
  const { scene } = useGLTF('/props/pagoda-lite.glb');

  const towers = useMemo(
    () => poppiesForArea(
      spec,
      window.cx * CHUNK - 96, window.cz * CHUNK - 96,
      window.cx * CHUNK + 96, window.cz * CHUNK + 96,
      field
      // Thinned: the full site set is ~130 towers in view; landmark towers
      // should be countable, and 16k tris x 50 is the budget's ceiling.
    ).filter((t) => t.petalMix < 0.4),
    [spec, field, window.cx, window.cz]
  );

  const instanced = useMemo(() => {
    let source: THREE.Mesh | null = null;
    scene.traverse((node: THREE.Object3D) => {
      if (!source && (node as THREE.Mesh).isMesh) source = node as THREE.Mesh;
    });
    if (!source) return null;
    const src = source as THREE.Mesh;
    // Bounding box from the GEOMETRY, not setFromObject: the mesh node can
    // carry a baked transform the instancing must not double-apply -- that is
    // exactly what buried every tower underground on the first attempt.
    src.geometry.computeBoundingBox();
    const box = src.geometry.boundingBox!.clone();
    const size = box.getSize(new THREE.Vector3());
    const baseHeight = Math.max(size.y, 0.001);

    const mesh = new THREE.InstancedMesh(
      src.geometry, src.material as THREE.Material, towers.length
    );
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    towers.forEach((t, i) => {
      q.setFromAxisAngle(up, t.yaw);
      // Site "stem" carried the pillar height; the model scales to ~1.6x that,
      // so the valley keeps its height hierarchy (age = height, per the lore).
      const s = (t.stem * 1.6 + 10) / baseHeight;
      m.compose(
        new THREE.Vector3(t.x, t.y - box.min.y * s, t.z), q,
        new THREE.Vector3(s, s, s)
      );
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }, [scene, towers]);

  return instanced ? <primitive object={instanced} /> : null;
};

export default Pagodas;
