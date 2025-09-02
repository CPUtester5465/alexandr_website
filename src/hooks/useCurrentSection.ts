import { useState, useEffect } from 'react';
import { globalPlayerPosition } from '../components/3D/Player/CameraController';
import { SECTIONS } from '../utils/constants';

export const useCurrentSection = () => {
  const [currentSection, setCurrentSection] = useState('Welcome to My World!');

  useEffect(() => {
    const updateSection = () => {
      const playerX = globalPlayerPosition.x;
      const playerZ = globalPlayerPosition.z;

      if (Math.abs(playerZ - SECTIONS.ACHIEVEMENTS.z) < 20) {
        setCurrentSection('🏆 Achievements Zone');
      } else if (Math.abs(playerZ - SECTIONS.ART_GALLERY.z) < 20) {
        setCurrentSection('🎨 Art Gallery');
      } else if (Math.abs(playerX - SECTIONS.ABOUT.x) < 20) {
        setCurrentSection('📖 About Me');
      } else if (Math.abs(playerX - SECTIONS.CONTACT.x) < 20) {
        setCurrentSection('📧 Contact Area');
      } else {
        setCurrentSection('Welcome to My World!');
      }
    };

    const intervalId = setInterval(updateSection, 100); // Update 10 times per second
    return () => clearInterval(intervalId);
  }, []);

  return currentSection;
};
