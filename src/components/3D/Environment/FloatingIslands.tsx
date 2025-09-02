import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface FloatingIslandsProps {
  count: number;
}

interface IslandData {
  position: THREE.Vector3;
  scale: number;
  color: THREE.Color;
  rotationSpeed: number;
  floatOffset: number;
}

const FloatingIslands: React.FC<FloatingIslandsProps> = ({ count }) => {
  const groupRef = useRef<THREE.Group>(null);

  // Generate random island data
  const islandData = useMemo<IslandData[]>(() => {
    return Array.from({ length: count }, () => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 120, // Spread across world
        Math.random() * 10 + 15,    // Height between 15-25
        (Math.random() - 0.5) * 120
      ),
      scale: Math.random() * 2 + 1,
      color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5),
      rotationSpeed: (Math.random() - 0.5) * 0.004,
      floatOffset: Math.random() * Math.PI * 2
    }));
  }, [count]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    groupRef.current.children.forEach((island, index) => {
      const data = islandData[index];
      const time = clock.getElapsedTime();
      
      // Floating animation
      island.position.y = data.position.y + Math.sin(time * 0.5 + data.floatOffset) * 0.5;
      
      // Rotation animation
      island.rotation.y += data.rotationSpeed;
    });
  });

  return (
    <group ref={groupRef}>
      {islandData.map((data, index) => (
        <group key={index} position={data.position}>
          <mesh castShadow scale={[data.scale, data.scale * 0.5, data.scale]}>
            <sphereGeometry args={[1, 8, 4]} />
            <meshPhongMaterial color={data.color} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

export default FloatingIslands;
