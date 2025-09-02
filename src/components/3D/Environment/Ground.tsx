import React from 'react';
import { Plane } from '@react-three/drei';
import { WORLD_SIZE, COLORS } from '../../../utils/constants';

const Ground: React.FC = () => {
  return (
    <group>
      {/* Main ground plane */}
      <Plane
        args={[WORLD_SIZE, WORLD_SIZE]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <meshLambertMaterial color={COLORS.GROUND} side={2} />
      </Plane>

      {/* Grid overlay for visual reference */}
      <gridHelper 
        args={[WORLD_SIZE, 40, '#444444', '#444444']} 
        position={[0, 0.01, 0]}
      />
    </group>
  );
};

export default Ground;
