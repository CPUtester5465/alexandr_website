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

// Player, camera and input
import Player from '../Player/Player';
import CameraController from '../Player/CameraController';
import PointerControls from '../Controls/PointerControls';
import SteeringIndicator from '../Player/SteeringIndicator';

// Import section positions
import { SECTIONS } from '../../../utils/constants';
import Dimension from '../World/Dimension';
import SmoothDimension from '../World/SmoothDimension';
import Hub from '../World/Hub';
import { useWorld, setWorldImmediately } from '../../../state/worldState';
import IntroSequence from '../../Intro/IntroSequence';

/**
 * Which world to show.
 *
 * Dimension 01 lives behind #poppy for now so it can be compared against the
 * old scene rather than replacing it before the hub exists. The old sections
 * are on their way out; this is a viewing arrangement, not an architecture.
 */
/**
 * Which world is on screen.
 *
 * The hash is an entry point, not the router: it seeds where you land so a link
 * can drop someone straight into a dimension, and after that the doors decide.
 * The old scene stays reachable at #legacy while it is still being cannibalised.
 */
function useWorldMode(): 'legacy' | 'hub' | string {
  const { current } = useWorld();

  React.useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash.slice(1) : '';
    if (hash) setWorldImmediately(hash);
  }, []);

  return current;
}

const Scene3D: React.FC = () => {
  const sceneRef = useRef<THREE.Group>(null);
  const mode = useWorldMode();

  useFrame(({ clock }) => {
    // Global scene animations can go here
    if (sceneRef.current) {
      // Subtle scene breathing or ambient effects
    }
  });

  return (
    <group ref={sceneRef}>
      {mode === 'intro' ? (
        <IntroSequence />
      ) : mode !== 'hub' && mode !== 'legacy' ? (
        // The smooth painterly study replaces the poppy dimension's view on
        // this branch; the other seventeen still render the voxel path.
        // The smooth painterly path serves the worlds whose skies have been
        // through the fidelity court; the rest stay voxel until their turn.
        ['poppy', 'pagoda'].includes(mode)
          ? <SmoothDimension slug={mode} />
          : <Dimension slug={mode} />
      ) : mode === 'legacy' ? (
        <>
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
        </>
      ) : (
        <Hub />
      )}

      {/* The player and his controls exist everywhere EXCEPT the opening
          shot -- the first walkthrough had the block boy standing proudly on
          top of the painting mid-dive. The silent-failure lesson repeats: the
          first gating attempt matched nothing because of trailing whitespace,
          and python replace does not complain. Verify every patch landed. */}
      {mode !== 'intro' && (
        <>
          <Player />
          <SteeringIndicator />
          <CameraController />
          <PointerControls />
        </>
      )}
    </group>
  );
};

export default Scene3D;
