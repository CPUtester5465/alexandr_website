import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { usePopup } from '../../../contexts/PopupContext';

interface AboutSectionProps {
  position: [number, number, number];
}

const AboutSection: React.FC<AboutSectionProps> = ({ position }) => {
  const bookCoverGroupRef = useRef<THREE.Group>(null);
  const pagesRef = useRef<THREE.Mesh>(null);
  const bookGroupRef = useRef<THREE.Group>(null);
  const [isHovered, setIsHovered] = useState(false);
  const { openPopup } = usePopup();

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    
    if (bookCoverGroupRef.current) {
      // Animate book cover opening/closing - rotate around front edge upward
      const targetRotation = isHovered ? Math.PI * 0.5 : 0; // Open 90 degrees upward
      bookCoverGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        bookCoverGroupRef.current.rotation.x, 
        targetRotation, 
        0.12
      );
    }
    
    if (pagesRef.current) {
      if (isHovered) {
        // Page flutter animation when open
        pagesRef.current.rotation.z = Math.sin(time * 4) * 0.02;
        
        // Warm reading light effect
        const material = pagesRef.current.material as THREE.MeshPhongMaterial;
        material.emissiveIntensity = 0.15 + Math.sin(time * 2) * 0.05;
      } else {
        // Reset pages when not hovered
        pagesRef.current.rotation.z = THREE.MathUtils.lerp(
          pagesRef.current.rotation.z,
          0,
          0.1
        );
        const material = pagesRef.current.material as THREE.MeshPhongMaterial;
        material.emissiveIntensity = THREE.MathUtils.lerp(
          material.emissiveIntensity,
          0.05,
          0.1
        );
      }
    }
  });

  return (
    <group position={position}>
      {/* Section Sign */}
      <group position={[0, 0, -8]}>
        {/* Sign post */}
        <mesh position={[0, 1.5, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 3]} />
          <meshPhongMaterial color="#8B4513" />
        </mesh>
        
        {/* Sign board */}
        <mesh position={[0, 3.5, 0]} castShadow>
          <boxGeometry args={[6, 2, 0.3]} />
          <meshPhongMaterial color="#FFA500" />
        </mesh>
        
        {/* Sign text */}
        <Text
          position={[0, 3.5, 0.2]}
          fontSize={0.5}
          color="#8B4513"
          anchorX="center"
          anchorY="middle"
        >
          📖 ABOUT ME
        </Text>
      </group>

      {/* Book Monument */}
      <group 
        ref={bookGroupRef}
        rotation={[0, Math.PI / 6, 0]}
        onPointerEnter={() => {
          setIsHovered(true);
        }}
        onPointerLeave={() => {
          setIsHovered(false);
        }}
        onClick={() => openPopup({ type: 'about' })}
        onPointerOver={() => document.body.style.cursor = 'pointer'}
        onPointerOut={() => document.body.style.cursor = 'default'}
      >
        {/* Book base/back cover (stationary) */}
        <mesh position={[0, 2, 0]} castShadow>
          <boxGeometry args={[5.5, 1, 4]} />
          <meshPhongMaterial color="#654321" />
        </mesh>

        {/* Book pages (stationary, slightly raised) */}
        <mesh 
          ref={pagesRef}
          position={[0, 2.05, 0]}
          castShadow
        >
          <boxGeometry args={[5.3, 0.8, 3.8]} />
          <meshPhongMaterial 
            color="#FFFAF0"
            emissive="#FFF8E1"
            emissiveIntensity={isHovered ? 0.15 : 0.05}
          />
        </mesh>

        {/* Book spine */}
        <mesh position={[-2.75, 2, 0]} castShadow>
          <boxGeometry args={[0.2, 1.1, 4.1]} />
          <meshPhongMaterial color="#5D4037" />
        </mesh>

        {/* Book cover (rotates around back edge to open upward) */}
        <group ref={bookCoverGroupRef} position={[0, 2, 2]}>
          <mesh 
            position={[0, 0, -2]}
            castShadow
            userData={{ type: 'about' }}
          >
            <boxGeometry args={[5.5, 1.05, 4]} />
            <meshPhongMaterial 
              color="#8B4513"
              emissive="#4A2C17"
              emissiveIntensity={isHovered ? 0.3 : 0}
            />
          </mesh>
          
          {/* Book title on cover */}
          <Text
            position={[0, 0.1, 0.3]}
            fontSize={0.4}
            color="#FFD700"
            anchorX="center"
            anchorY="middle"
          >
            📖 My Story
          </Text>
        </group>

        {/* Pages content visible when open */}
        {isHovered && (
          <group position={[0, 2.1, 0]}>
            <Text
              position={[0, 0.3, 1.9]}
              fontSize={0.25}
              color="#2C1810"
              anchorX="center"
              anchorY="middle"
              maxWidth={4}
            >
              Creative • Curious • Ambitious
            </Text>
            <Text
              position={[0, -0.1, 1.9]}
              fontSize={0.2}
              color="#4A2C17"
              anchorX="center"
              anchorY="middle"
              maxWidth={4}
            >
              Student • Artist • Dreamer
            </Text>
            <Text
              position={[0, -0.4, 1.9]}
              fontSize={0.15}
              color="#666"
              anchorX="center"
              anchorY="middle"
              maxWidth={4}
            >
              Click to read more...
            </Text>
          </group>
        )}

        {/* Book spine text */}
        <Text
          position={[-2.8, 2, 0]}
          fontSize={0.3}
          color="#FFD700"
          anchorX="center"
          anchorY="middle"
          rotation={[0, -Math.PI / 2, 0]}
        >
          ABOUT
        </Text>
      </group>

      {/* Magical reading aura when book opens */}
      {isHovered && (
        <group position={[0, 2, 0]}>
          {/* Golden reading aura */}
          <mesh>
            <sphereGeometry args={[6, 16, 8]} />
            <meshBasicMaterial 
              color="#FFD700" 
              transparent 
              opacity={0.08}
            />
          </mesh>
          
          {/* Floating story symbols */}
          {[...Array(8)].map((_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const radius = 3 + Math.sin(Date.now() * 0.002 + i) * 0.5;
            return (
              <Text
                key={i}
                position={[
                  Math.cos(angle) * radius,
                  Math.sin(Date.now() * 0.003 + i) * 1.5 + 2,
                  Math.sin(angle) * radius
                ]}
                fontSize={0.6}
                color="#B8860B"
                anchorX="center"
                anchorY="middle"
              >
                {['📚', '🎨', '🔬', '🎭', '🎮', '💡', '🌟', '✨'][i]}
              </Text>
            );
          })}
        </group>
      )}

      {/* Warm reading light when book opens */}
      {isHovered && (
        <pointLight
          position={[1, 5, 2]}
          intensity={1.5}
          color="#FFF8E1"
          distance={15}
          decay={1.5}
          castShadow
        />
      )}
    </group>
  );
};

export default AboutSection;
