import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { achievements } from '../../../data/achievements';
import { usePopup } from '../../../contexts/PopupContext';

interface AchievementsSectionProps {
  position: [number, number, number];
}

const AchievementsSection: React.FC<AchievementsSectionProps> = ({ position }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const { openPopup } = usePopup();

  // Create row positions for achievements
  const createRowPositions = (count: number, spacing: number = 4) => {
    const positions: THREE.Vector3[] = [];
    const startX = -(count - 1) * spacing / 2; // Center the row
    
    for (let i = 0; i < count; i++) {
      positions.push(new THREE.Vector3(startX + i * spacing, 0, 0));
    }
    return positions;
  };

  const trophyPositions = createRowPositions(achievements.length);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    // Animate floating trophies
    groupRef.current.children.forEach((child, index) => {
      if (child.userData.floating) {
        const time = clock.getElapsedTime();
        const originalY = 3.5;
        child.position.y = originalY + Math.sin(time + index) * 0.3;
        
        // Rotate trophies slightly
        child.rotation.y += 0.005;
      }
    });
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Section Sign */}
      <group position={[0, 0, -12]}>
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
          🏆 ACHIEVEMENTS
        </Text>
      </group>

      {/* Achievement Platforms and Trophies */}
      {achievements.map((achievement, index) => {
        const pos = trophyPositions[index];
        return (
          <group key={achievement.id} position={[pos.x, 0, -27]}>
            {/* Platform */}
            <mesh position={[0, 1, 0]} castShadow>
              <cylinderGeometry args={[1.5, 1.5, 2, 16]} />
              <meshPhongMaterial 
                color={achievement.color}
                emissive={achievement.color}
                emissiveIntensity={hoveredIndex === index ? 0.4 : 0.1}
              />
            </mesh>
            
            {/* Trophy */}
            <mesh 
              position={[0, 3.5, 0]} 
              castShadow
              onClick={() => openPopup({ type: 'achievement', data: achievement })}
              onPointerOver={(e) => {
                document.body.style.cursor = 'pointer';
                setHoveredIndex(index);
                e.stopPropagation();
              }}
              onPointerOut={() => {
                document.body.style.cursor = 'default';
                setHoveredIndex(null);
              }}
              userData={{ 
                type: 'achievement', 
                index: index,
                floating: true,
                data: achievement
              }}
            >
              <coneGeometry args={[0.8, 2, 8]} />
              <meshPhongMaterial 
                color={achievement.color}
                emissive={achievement.color}
                emissiveIntensity={hoveredIndex === index ? 0.8 : 0.2}
              />
            </mesh>

            {/* Trophy text label */}
            <Text
              position={[0, 1, 2]}
              fontSize={0.3}
              color="#333"
              anchorX="center"
              anchorY="middle"
              maxWidth={3}
            >
              {achievement.emoji} {achievement.title.split(' ').slice(0, 2).join(' ')}
            </Text>
          </group>
        );
      })}

      {/* Particle effects could be added here */}
      {/* Golden sparkles around active trophies */}
    </group>
  );
};

export default AchievementsSection;
