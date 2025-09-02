import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
// import './App.css'; // Removed - using Tailwind CSS

// UI Components
import LoadingScreen from './components/UI/HUD/LoadingScreen';
import SectionLabel from './components/UI/HUD/SectionLabel';
import ControlsPanel from './components/UI/Controls/ControlsPanel';
import ContentPopup from './components/UI/Popups/ContentPopup';

// 3D Components  
import Scene3D from './components/3D/Scene/Scene3D';

// Context
import { PopupProvider, usePopup } from './contexts/PopupContext';

const AppContent: React.FC = () => {
  const popup = usePopup();

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      {/* 3D Canvas - Full screen */}
      <Canvas
        className="h-full w-full"
        camera={{ 
          fov: 75, 
          position: [0, 10, 20],
          near: 0.1,
          far: 1000 
        }}
        shadows
        gl={{ 
          antialias: true
        }}
        style={{ height: '100vh', width: '100vw', pointerEvents: 'auto' }}
        onPointerMissed={() => {}}
      >
        {/* Basic lighting setup */}
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[10, 20, 5]} 
          intensity={0.8}
          castShadow
          shadow-camera-left={-50}
          shadow-camera-right={50}
          shadow-camera-top={50}
          shadow-camera-bottom={-50}
        />
        
        {/* Fog for atmosphere */}
        <fog attach="fog" args={[0x87CEEB, 10, 100]} />
        
        {/* 3D Scene */}
        <Suspense fallback={null}>
          <Scene3D />
        </Suspense>
        
        {/* Development helpers disabled for player controls */}
      </Canvas>

      {/* UI Overlay - Positioned absolutely over canvas */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10" style={{ pointerEvents: 'none' }}>
        <Suspense fallback={<LoadingScreen />}>
          <div className="pointer-events-auto">
            <SectionLabel />
          </div>
          <div className="pointer-events-auto">
            <ControlsPanel />
          </div>
        </Suspense>
      </div>

      {/* Popup outside of pointer-events-none container */}
      <Suspense fallback={null}>
        <ContentPopup 
          isOpen={popup.isOpen} 
          onClose={popup.closePopup}
          content={popup.content}
        />
      </Suspense>
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
