import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { usePopup } from '../../../contexts/PopupContext';

interface ContactSectionProps {
  position: [number, number, number];
}

const ContactSection: React.FC<ContactSectionProps> = ({ position }) => {
  const mailboxRef = useRef<THREE.Mesh>(null);
  const flagRef = useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);
  const { openPopup } = usePopup();

  useFrame(({ clock }) => {
    if (flagRef.current) {
      // Flag waving animation (more active when hovered)
      const time = clock.getElapsedTime();
      const intensity = isHovered ? 2 : 1;
      flagRef.current.rotation.z = Math.sin(time * 3 * intensity) * 0.1 * intensity;
    }

    if (mailboxRef.current && isHovered) {
      // Mailbox glow animation
      const material = mailboxRef.current.material as THREE.MeshPhongMaterial;
      material.emissiveIntensity = 0.1 + Math.sin(clock.getElapsedTime() * 2) * 0.1;
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
          📧 CONTACT
        </Text>
      </group>

      {/* Mailbox */}
      <group
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
        onClick={() => openPopup({ type: 'contact' })}
        onPointerOver={() => document.body.style.cursor = 'pointer'}
        onPointerOut={() => document.body.style.cursor = 'default'}
      >
        <mesh 
          ref={mailboxRef}
          position={[0, 2, 0]} 
          castShadow
          userData={{ type: 'contact' }}
        >
          <boxGeometry args={[3, 4, 2]} />
          <meshPhongMaterial 
            color="#FF0000"
            emissive="#FF0000"
            emissiveIntensity={isHovered ? 0.2 : 0.05}
          />
        </mesh>

        {/* Mailbox door */}
        <mesh position={[0, 1.5, 1.1]}>
          <boxGeometry args={[2.5, 2, 0.1]} />
          <meshPhongMaterial color="#CC0000" />
        </mesh>

        {/* Mail slot */}
        <mesh position={[0, 2, 1.15]}>
          <boxGeometry args={[1.5, 0.2, 0.05]} />
          <meshPhongMaterial 
            color="#000000"
            emissive={isHovered ? "#FFFF00" : "#000000"}
            emissiveIntensity={isHovered ? 0.5 : 0}
          />
        </mesh>

        {/* Mailbox post */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 4]} />
          <meshPhongMaterial color="#8B4513" />
        </mesh>

        {/* Flag */}
        <mesh 
          ref={flagRef}
          position={[1.5, 3.5, 0]}
          rotation={[0, 0, 0]}
        >
          <boxGeometry args={[0.1, 2, 1]} />
          <meshPhongMaterial 
            color="#FFFF00"
            emissive="#FFFF00"
            emissiveIntensity={isHovered ? 0.3 : 0.1}
          />
        </mesh>

        {/* Flag pole */}
        <mesh position={[1.55, 3.5, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 2]} />
          <meshPhongMaterial color="#333333" />
        </mesh>
      </group>

      {/* Contact symbols floating around when hovered */}
      {isHovered && (
        <group position={[0, 3, 0]}>
          {[
            { symbol: '📧', pos: [3, 1, 0] },
            { symbol: '🐦', pos: [-3, 1, 0] },
            { symbol: '📷', pos: [0, 1, 3] },
            { symbol: '🎨', pos: [0, 1, -3] }
          ].map((item, i) => (
            <Text
              key={i}
              position={[
                item.pos[0] + Math.sin(Date.now() * 0.001 + i) * 0.5,
                item.pos[1] + Math.cos(Date.now() * 0.001 + i) * 0.5,
                item.pos[2]
              ]}
              fontSize={0.8}
              color="#FFFF00"
              anchorX="center"
              anchorY="middle"
            >
              {item.symbol}
            </Text>
          ))}
        </group>
      )}

      {/* Delivery notification light */}
      {isHovered && (
        <pointLight
          position={[0, 5, 0]}
          intensity={1}
          color="#FFFF00"
          distance={15}
          decay={2}
        />
      )}
    </group>
  );
};

export default ContactSection;
