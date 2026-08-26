import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';

// UI Components
import LoadingScreen from './components/UI/HUD/LoadingScreen';
import SectionLabel from './components/UI/HUD/SectionLabel';
import ControlsPanel from './components/UI/Controls/ControlsPanel';
import LookPad from './components/UI/Controls/LookPad';
import ContentPopup from './components/UI/Popups/ContentPopup';

// 3D Components
import Scene3D from './components/3D/Scene/Scene3D';

// Context
import { PopupProvider, usePopup } from './contexts/PopupContext';

// Input
import { useKeyboardControls } from './hooks/useKeyboardControls';
import { useInputMode } from './hooks/useInputMode';
import { getMaxPixelRatio } from './utils/device-detection';

const AppContent: React.FC = () => {
  const popup = usePopup();
  const { isTouch } = useInputMode();

  useKeyboardControls();

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
        <div className="pointer-events-auto">
          <SectionLabel />
        </div>
        <div className="pointer-events-auto">
          <ControlsPanel isTouch={isTouch} />
        </div>
        {isTouch && (
          <div className="pointer-events-auto">
            <LookPad />
          </div>
        )}
      </div>

      {/* Covers the canvas until the artwork has actually loaded. */}
      <LoadingScreen />

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
