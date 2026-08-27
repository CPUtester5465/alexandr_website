import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { Door, HUB } from '../../../world/hub';
import { BLOCK } from '../../../world/voxel';
import { BLOOM_LAYER } from '../PostFX';

/**
 * The study itself, rebuilt as architecture instead of voxels.
 *
 * Tim's verdict on the block hub was "a placeholder", and he was right: the
 * worlds went painterly weeks of iterations ago and the room stayed cubes.
 * This is a real room -- a smooth drum of hand-painted plaster over a
 * herringbone parquet floor, wooden arches at every door, a kilim rug whose
 * border (by a genuinely happy accident of generation) carries tiny red
 * poppies, an oculus skylight with a visible shaft of light, and paper
 * planes circling under the beams -- a boy's study, scaled up to hold
 * eighteen worlds.
 *
 * Textures are Higgsfield-generated (nano banana, 2cr each), compressed to
 * 229KB for all three.
 */

const WALL_RADIUS = (HUB.radius + 2.6) * BLOCK;
const WALL_HEIGHT = 21;

const HubRoom: React.FC<{ doors: Door[] }> = ({ doors }) => {
  const [parquet, plaster, rug] = useTexture([
    '/hub/parquet.webp', '/hub/plaster.webp', '/hub/rug.webp'
  ]);

  const materials = useMemo(() => {
    parquet.wrapS = parquet.wrapT = THREE.RepeatWrapping;
    parquet.repeat.set(9, 9);
    parquet.colorSpace = THREE.SRGBColorSpace;
    plaster.wrapS = THREE.RepeatWrapping;
    plaster.wrapT = THREE.MirroredRepeatWrapping;
    plaster.repeat.set(7, 1.15);
    plaster.colorSpace = THREE.SRGBColorSpace;
    rug.colorSpace = THREE.SRGBColorSpace;
    return {
      floor: new THREE.MeshLambertMaterial({ map: parquet }),
      wall: new THREE.MeshLambertMaterial({ map: plaster, side: THREE.BackSide }),
      rug: new THREE.MeshLambertMaterial({ map: rug, transparent: true }),
      wood: new THREE.MeshLambertMaterial({ color: 0x8A5A33 }),
      woodDark: new THREE.MeshLambertMaterial({ color: 0x5C4229 }),
      paper: new THREE.MeshLambertMaterial({ color: 0xEDE6D2, side: THREE.DoubleSide })
    };
  }, [parquet, plaster, rug]);

  // Paper planes circling under the beams -- the "nice details flying around
  // the character". Paper, because this is a boy's study, not a hangar.
  const planes = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    // A folded dart: four triangles, one crease.
    const v = new Float32Array([
      0, 0, 1.6,   -0.9, 0.12, -1,   -0.12, 0, -0.7,
      0, 0, 1.6,   -0.12, 0, -0.7,    0.12, 0, -0.7,
      0, 0, 1.6,    0.12, 0, -0.7,    0.9, 0.12, -1,
      0, -0.34, 1.2, -0.1, 0, -0.7,  0.1, 0, -0.7
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(v, 3));
    geometry.computeVertexNormals();
    const mesh = new THREE.InstancedMesh(geometry, materials.paper, 7);
    return mesh;
  }, [materials]);

  const planeState = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => ({
      radius: 14 + (i % 3) * 9,
      height: 9 + ((i * 37) % 50) / 10,
      speed: 0.14 + ((i * 61) % 30) / 200,
      phase: (i / 7) * Math.PI * 2
    })), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    planeState.forEach((p, i) => {
      const a = p.phase + t * p.speed;
      const x = Math.sin(a) * p.radius;
      const z = Math.cos(a) * p.radius;
      const bob = Math.sin(t * 0.9 + p.phase * 3) * 0.5;
      // Nose along the tangent, banked into the turn.
      e.set(0.06, a + Math.PI / 2, 0.34, 'YXZ');
      q.setFromEuler(e);
      m.compose(new THREE.Vector3(x, p.height + bob, z), q, new THREE.Vector3(1.4, 1.4, 1.4));
      planes.setMatrixAt(i, m);
    });
    planes.instanceMatrix.needsUpdate = true;
  });

  const arches = useMemo(() => doors.map((door) => {
    const inward = door.facing.clone().multiplyScalar(-1);
    const yaw = Math.atan2(inward.x, inward.z);
    return { door, yaw };
  }), [doors]);

  return (
    <group>
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, BLOCK + 0.02, 0]}
            material={materials.floor} userData={{ cameraTransparent: true }}>
        <circleGeometry args={[WALL_RADIUS + 1, 64]} />
      </mesh>
      {/* the rug, textured, its border full of small red poppies */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, BLOCK + 0.09, 0]} material={materials.rug}>
        <circleGeometry args={[13.5, 48]} />
      </mesh>
      {/* the drum */}
      <mesh position={[0, BLOCK + WALL_HEIGHT / 2, 0]} material={materials.wall}>
        <cylinderGeometry args={[WALL_RADIUS, WALL_RADIUS, WALL_HEIGHT, 72, 1, true]} />
      </mesh>
      {/* ceiling with an oculus */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, BLOCK + WALL_HEIGHT, 0]}
            material={materials.woodDark}>
        <ringGeometry args={[6, WALL_RADIUS + 0.5, 64]} />
      </mesh>
      {/* the shaft of light through the oculus */}
      <mesh position={[0, BLOCK + WALL_HEIGHT / 2 + 1, 0]}>
        <coneGeometry args={[7.5, WALL_HEIGHT, 32, 1, true]} />
        <meshBasicMaterial
          color={0xF3D9A4} transparent opacity={0.07}
          side={THREE.DoubleSide} depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, BLOCK + 0.12, 0]}
            layers-mask={(1 << 0) | (1 << BLOOM_LAYER)}>
        <circleGeometry args={[6.4, 40]} />
        <meshBasicMaterial color={0xF3D9A4} transparent opacity={0.10} depthWrite={false}
          blending={THREE.AdditiveBlending} />
      </mesh>

      {/* one wooden arch per door: jambs, lintel, step */}
      {arches.map(({ door, yaw }) => (
        <group key={door.slug}
               position={[door.position.x, 0, door.position.z]}
               rotation={[0, yaw, 0]}>
          <mesh position={[-4.4, BLOCK + 5.4, 1.4]} material={materials.wood}>
            <boxGeometry args={[1.3, 10.8, 1.3]} />
          </mesh>
          <mesh position={[4.4, BLOCK + 5.4, 1.4]} material={materials.wood}>
            <boxGeometry args={[1.3, 10.8, 1.3]} />
          </mesh>
          <mesh position={[0, BLOCK + 11.2, 1.4]} material={materials.wood}>
            <boxGeometry args={[10.4, 1.5, 1.6]} />
          </mesh>
          <mesh position={[0, BLOCK + 12.15, 1.4]} material={materials.woodDark}>
            <boxGeometry args={[11.6, 0.5, 1.9]} />
          </mesh>
          <mesh position={[0, BLOCK + 0.18, 2.6]} material={materials.woodDark}>
            <boxGeometry args={[9.6, 0.36, 2.6]} />
          </mesh>
        </group>
      ))}

      <primitive object={planes} />
    </group>
  );
};

export default HubRoom;
