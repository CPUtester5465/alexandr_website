import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';

// UI Components
import LoadingScreen from './components/UI/HUD/LoadingScreen';
import SectionLabel from './components/UI/HUD/SectionLabel';
import ControlsPanel from './components/UI/Controls/ControlsPanel';
import LookPad from './components/UI/Controls/LookPad';
import FloatingMoveStick from './components/UI/Controls/FloatingMoveStick';
import JumpButton from './components/UI/Controls/JumpButton';
import DoorLabel from './components/UI/HUD/DoorLabel';
import TravelFade from './components/UI/HUD/TravelFade';
import WayHome from './components/UI/HUD/WayHome';
import WorldMap from './components/UI/HUD/WorldMap';
import ActivityBadge from './components/UI/HUD/ActivityBadge';
import ConsentBanner from './components/UI/ConsentBanner';
import WorldHint from './components/UI/HUD/WorldHint';
import SoundToggle from './components/UI/HUD/SoundToggle';
import { installAudioUnlock } from './state/audio';
import LocaleToggle from './components/UI/HUD/LocaleToggle';
import ContentPopup from './components/UI/Popups/ContentPopup';

// 3D Components
import Scene3D from './components/3D/Scene/Scene3D';

// Context
import { PopupProvider, usePopup } from './contexts/PopupContext';
import { useWorld } from './state/worldState';

// Input
import { useKeyboardControls } from './hooks/useKeyboardControls';
import { useInputMode } from './hooks/useInputMode';
import { getMaxPixelRatio } from './utils/device-detection';

const AppContent: React.FC = () => {
  const popup = usePopup();
  const { isTouch } = useInputMode();
  const { current: currentWorld } = useWorld();

  useKeyboardControls();

  React.useEffect(() => installAudioUnlock(), []);

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      <Canvas
        className="h-full w-full"
        camera={{
          fov: 75,
          position: [0, 10, 20],
          near: 0.1,
          far: 1000
        }}
        // Shadow maps are the most expensive thing in this scene and the least
        // missed on a small screen.
        shadows={!isTouch}
        // A phone reporting devicePixelRatio 3 would otherwise render nine
        // times the pixels of 1x for a difference nobody can see while moving.
        dpr={[1, getMaxPixelRatio()]}
        gl={{ antialias: !isTouch, powerPreference: 'high-performance' }}
        style={{ height: '100dvh', width: '100vw', touchAction: 'none' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[10, 20, 5]}
          intensity={0.8}
          castShadow={!isTouch}
          shadow-camera-left={-50}
          shadow-camera-right={50}
          shadow-camera-top={50}
          shadow-camera-bottom={-50}
        />

        <fog attach="fog" args={[0x87CEEB, 10, 100]} />

        <Suspense fallback={null}>
          <Scene3D />
        </Suspense>
      </Canvas>

      {/* UI overlay, above the canvas. */}
      <div
        className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
        style={{ pointerEvents: 'none' }}
      >
        {/* The section label narrates the LEGACY scene's zones; in a dimension
            it fires nonsense ("Achievements Zone" over a poppy meadow). */}
        {currentWorld === 'legacy' && (
          <div className="pointer-events-auto">
            <SectionLabel />
          </div>
        )}
        <DoorLabel />
        <WayHome />
        <ActivityBadge />
        <WorldHint />
        <div className="pointer-events-auto">
          <LocaleToggle />
        </div>
        <div className="pointer-events-auto">
          <SoundToggle />
        </div>
        <div className="pointer-events-auto">
          <WorldMap />
        </div>
        <div className="pointer-events-auto">
          <ControlsPanel isTouch={isTouch} />
        </div>
        {isTouch && (
          <div className="pointer-events-auto">
            <FloatingMoveStick />
            <LookPad />
            <JumpButton />
          </div>
        )}
      </div>

      {/* Covers the canvas until the artwork has actually loaded. */}
      <LoadingScreen />

      {/* Covers it again, briefly, when going through a door. */}
      <TravelFade />

      <ConsentBanner />

      <ContentPopup
        isOpen={popup.isOpen}
        onClose={popup.closePopup}
        content={popup.content}
      />
    </div>
  );
};

function App() {
  return (
    <PopupProvider>
      <AppContent />
    </PopupProvider>
  );
}

export default App;
