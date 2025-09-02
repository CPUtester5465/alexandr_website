import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Center } from '@react-three/drei';
// import { motion } from 'framer-motion-3d'; // Not available
import * as THREE from 'three';
// import { createGlowMaterial } from '../../../utils/three-helpers';
import { COLORS, SECTIONS } from '../../../utils/constants';
import { usePopup } from '../../../contexts/PopupContext';

interface WelcomeAreaProps {
  position: [number, number, number];
}

const WelcomeArea: React.FC<WelcomeAreaProps> = ({ position }) => {
  const crystalRef = useRef<THREE.Mesh>(null);
  const baseRef = useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showText, setShowText] = useState(true);
  const { openPopup } = usePopup();

  useFrame(({ clock }) => {
    if (crystalRef.current) {
      // Crystal rotation animation
      crystalRef.current.rotation.y += 0.01;
      crystalRef.current.rotation.x += 0.005;
      
      // Enhanced glow when hovered
      const intensity = isHovered ? 0.6 : 0.3;
      const material = crystalRef.current.material as THREE.MeshPhongMaterial;
      material.emissiveIntensity = intensity;
    }

    if (baseRef.current && isHovered) {
      // Base illumination effect
      const time = clock.getElapsedTime();
      const pulse = Math.sin(time * 3) * 0.1 + 0.2;
      const material = baseRef.current.material as THREE.MeshPhongMaterial;
      material.emissiveIntensity = pulse;
    }
  });

  const handleClick = () => {
    openPopup({ type: 'welcome' });
    if (!showText) {
      setShowText(true);
      // Auto-hide text after 5 seconds
      setTimeout(() => setShowText(false), 5000);
    }
  };

  return (
    <group position={position}>
      {/* Base platform */}
      <mesh
        ref={baseRef}
        position={[0, 0.25, 0]}
        castShadow
      >
        <cylinderGeometry args={[5, 5, 0.5, 32]} />
        <meshPhongMaterial 
          color="#4ECDC4"
          emissive="#4ECDC4"
          emissiveIntensity={isHovered ? 0.2 : 0.05}
        />
      </mesh>

      {/* Floating crystal monument */}
      <mesh
        ref={crystalRef}
        position={[0, 4, 0]}
        castShadow
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
        onPointerEnter={(e) => {
          e.stopPropagation();
          setIsHovered(true);
        }}
        onPointerLeave={(e) => {
          e.stopPropagation();
          setIsHovered(false);
        }}
        userData={{ type: 'welcome' }}
      >
        <octahedronGeometry args={[2, 0]} />
        <meshPhongMaterial 
          color={COLORS.CRYSTAL}
          emissive={COLORS.CRYSTAL}
          emissiveIntensity={isHovered ? 0.6 : 0.3}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* 3D Welcome Text */}
      {showText && (
        <group position={[0, 8, 0]}>
          <Center>
            {/* Using regular Text instead of Text3D for now to avoid font loading issues */}
            <Text
              fontSize={1.2}
              color="#FFD700"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.02}
              outlineColor="#B8860B"
            >
              Welcome to My Creative World!
            </Text>
          </Center>
        </group>
      )}

      {/* Arrow pointing to Art Gallery */}
      <group position={[0, 0.3, 7]}>
        {/* Arrow pointing toward art gallery (south) */}
        <group position={[0, 0, 1]} rotation={[Math.PI/2, 0, 0]}>
          <mesh>
            <coneGeometry args={[0.8, 2, 8]} />
            <meshPhongMaterial 
              color="#FFD700"
              emissive="#FFD700"
              emissiveIntensity={0.4}
            />
          </mesh>
        </group>
        
        {/* Arrow shaft */}
        <mesh position={[0, 0.05, -1]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 1.5]} />
          <meshPhongMaterial 
            color="#FFD700"
            emissive="#FFD700"
            emissiveIntensity={0.3}
          />
        </mesh>

        {/* Ground text */}
        <Text
          position={[0, 0, 2.5]}
          fontSize={0.6}
          color="#8B4513"
          anchorX="center"
          anchorY="middle"
          rotation={[-Math.PI/2, 0, 0]}
        >
          🎨 ART GALLERY
        </Text>
      </group>

      {/* Light beams when hovered */}
      {isHovered && (
        <group position={[0, 0.5, 0]}>
          {[...Array(8)].map((_, i) => (
            <mesh
              key={i}
              position={[
                Math.cos((i / 8) * Math.PI * 2) * 3,
                2,
                Math.sin((i / 8) * Math.PI * 2) * 3
              ]}
              rotation={[0, (i / 8) * Math.PI * 2, 0]}
            >
              <cylinderGeometry args={[0.1, 0.1, 4]} />
              <meshBasicMaterial 
                color="#4ECDC4" 
                transparent 
                opacity={0.6}
              />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
};

export default WelcomeArea;
