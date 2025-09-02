import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Global player position that can be accessed by camera
export const globalPlayerPosition = new THREE.Vector3(0, 1, 10);

const CameraController: React.FC = () => {
  const { camera } = useThree();

  useFrame(() => {
    // Calculate desired camera position behind and above player
    const idealOffset = new THREE.Vector3(0, 8, 12);
    const idealLookAt = new THREE.Vector3(0, 2, 0);
    
    // Add player position to offsets
    const desiredCameraPos = idealOffset.clone().add(globalPlayerPosition);
    const desiredLookAt = idealLookAt.clone().add(globalPlayerPosition);
    
    // Smoothly interpolate camera position
    camera.position.lerp(desiredCameraPos, 0.05);
    camera.lookAt(desiredLookAt);
  });

  // This component doesn't render anything visible
  return null;
};

export default CameraController;
