import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Environment components
import Ground from '../Environment/Ground';
import Skybox from '../Environment/Skybox';
import FloatingIslands from '../Environment/FloatingIslands';

// Section components
import WelcomeArea from '../Sections/WelcomeArea';
import AchievementsSection from '../Sections/AchievementsSection';
import ArtGallery from '../Sections/ArtGallery';
import AboutSection from '../Sections/AboutSection';
import ContactSection from '../Sections/ContactSection';

// Player and camera
import LegoPlayer from '../Player/LegoPlayer';
import CameraController from '../Player/CameraController';

// Import section positions
import { SECTIONS } from '../../../utils/constants';

const Scene3D: React.FC = () => {
  const sceneRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    // Global scene animations can go here
    if (sceneRef.current) {
      // Subtle scene breathing or ambient effects
    }
  });

  return (
    <group ref={sceneRef}>
      {/* Environment */}
      <Ground />
      <Skybox />
      <FloatingIslands count={8} />
      
      {/* Interactive Sections */}
      <WelcomeArea position={[SECTIONS.WELCOME.x, 0, SECTIONS.WELCOME.z]} />
      <AchievementsSection position={[SECTIONS.ACHIEVEMENTS.x, 0, SECTIONS.ACHIEVEMENTS.z]} />
      <ArtGallery position={[SECTIONS.ART_GALLERY.x, 0, SECTIONS.ART_GALLERY.z]} />
      <AboutSection position={[SECTIONS.ABOUT.x, 0, SECTIONS.ABOUT.z]} />
      <ContactSection position={[SECTIONS.CONTACT.x, 0, SECTIONS.CONTACT.z]} />

      {/* Player Character */}
      <LegoPlayer />
      
      {/* Camera Controller */}
      <CameraController />
    </group>
  );
};

export default Scene3D;
