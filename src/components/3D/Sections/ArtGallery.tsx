import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { artworks } from '../../../data/artworks';
import { usePopup } from '../../../contexts/PopupContext';

interface ArtGalleryProps {
  position: [number, number, number];
}

const Easel: React.FC<{
  position: THREE.Vector3;
  artwork: typeof artworks[0];
  index: number;
}> = ({ position, artwork, index }) => {
  const easelRef = useRef<THREE.Group>(null);
  const [isHovered, setIsHovered] = useState(false);
  const { openPopup } = usePopup();
  
  // Try to load artwork texture from public folder
  const texture = useTexture(`/assets/art/${artwork.filename}`, (texture) => {
    // Success callback - fix upside down images
    texture.flipY = true;
    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  });

  useFrame(() => {
    if (easelRef.current && isHovered) {
      // Gentle rotation when hovered
      easelRef.current.rotation.y = Math.sin(Date.now() * 0.002) * 0.1;
    }
  });

  return (
    <group 
      ref={easelRef}
      position={position}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
    >
      {/* Easel stand */}
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 4]} />
        <meshPhongMaterial color="#8B4513" />
      </mesh>
      
      {/* Frame */}
      <mesh 
        position={[0, 3, 0]} 
        castShadow
        onClick={() => openPopup({ type: 'art', data: artwork })}
        onPointerOver={(e) => {
          document.body.style.cursor = 'pointer';
          e.stopPropagation();
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
        }}
        userData={{
          type: 'art',
          index: index,
          data: artwork
        }}
      >
        <boxGeometry args={[4, 4, 0.2]} />
        <meshPhongMaterial 
          color={artwork.frameColor}
          emissive={isHovered ? artwork.frameColor : '#000000'}
          emissiveIntensity={isHovered ? 0.2 : 0}
        />
      </mesh>
      
      {/* Canvas with artwork */}
      <mesh position={[0, 3, 0.15]}>
        <boxGeometry args={[3.5, 3.5, 0.1]} />
        <meshPhongMaterial 
          color="white"
          map={texture}
          emissiveIntensity={isHovered ? 0.1 : 0}
        />
      </mesh>

      {/* Spotlight effect when hovered */}
      {isHovered && (
        <spotLight
          position={[0, 8, 2]}
          angle={0.3}
          penumbra={0.5}
          intensity={2}
          color={artwork.frameColor}
          target={easelRef.current || undefined}
          castShadow
        />
      )}

      {/* Title label */}
      <Text
        position={[0, 1.5, 2]}
        fontSize={0.35}
        color="#333"
        anchorX="center"
        anchorY="middle"
        maxWidth={6}
      >
        {artwork.emoji} {artwork.title}
      </Text>
      
      {/* Hover glow effect */}
      {isHovered && (
        <mesh position={[0, 3, 0]}>
          <boxGeometry args={[4.3, 4.3, 0.1]} />
          <meshBasicMaterial 
            color={artwork.frameColor}
            transparent
            opacity={0.3}
          />
        </mesh>
      )}
    </group>
  );
};

const ArtGallery: React.FC<ArtGalleryProps> = ({ position }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Create single row formation positions for all artworks
  const easelPositions = useMemo(() => {
    const positions: THREE.Vector3[] = [];
    const totalArtworks = artworks.length; // Show all artworks
    const spacing = 8; // Spacing between artworks
    const startX = position[0] - ((totalArtworks - 1) * spacing) / 2;
    
    for (let i = 0; i < totalArtworks; i++) {
      const x = startX + i * spacing;
      const z = position[2]; // All in same row (valley formation)
      const y = 0;
      positions.push(new THREE.Vector3(x, y, z));
    }
    
    return positions;
  }, [position]);

  return (
    <group ref={groupRef} position={position}>
      {/* Ground Text */}
      <group position={[0, 0.1, 12]}>
        {/* Ground text */}
        <Text
          position={[0, 0, 0]}
          fontSize={1.2}
          color="#8B4513"
          anchorX="center"
          anchorY="middle"
          rotation={[-Math.PI/2, 0, 0]}
        >
          🎨 ART GALLERY
        </Text>
      </group>

      {/* Valley terrain effect - expanded for single row of all artworks */}
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <cylinderGeometry args={[60, 60, 1, 32]} />
        <meshLambertMaterial 
          color="#90EE90" 
          transparent 
          opacity={0.7}
        />
      </mesh>

      {/* Art Easels */}
      {artworks.map((artwork, index) => (
        <Easel
          key={artwork.id}
          position={easelPositions[index]}
          artwork={artwork}
          index={index}
        />
      ))}

      {/* Ambient lighting for gallery */}
      <ambientLight intensity={0.4} />
      
      {/* Soft directional lighting */}
      <directionalLight
        position={[0, 20, 10]}
        intensity={0.5}
        color="#FFF8E1"
        castShadow
      />
    </group>
  );
};

export default ArtGallery;
