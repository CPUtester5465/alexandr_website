import React from 'react';
import { Sphere } from '@react-three/drei';
import { COLORS } from '../../../utils/constants';

const Skybox: React.FC = () => {
  return (
    <Sphere args={[500, 32, 32]} userData={{ cameraTransparent: true }}>
      <meshBasicMaterial 
        color={COLORS.SKY} 
        side={2} // BackSide equivalent 
        fog={false}
      />
    </Sphere>
  );
};

export default Skybox;
