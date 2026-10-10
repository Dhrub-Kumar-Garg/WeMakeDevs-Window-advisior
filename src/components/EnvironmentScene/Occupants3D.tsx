'use client';

import { useEnvironmentStore } from '@/store/useEnvironmentStore';
import { Edges } from '@react-three/drei';

interface Occupants3DProps {
  count: number;
}

export default function Occupants3D({ count }: Occupants3DProps) {
  const { setOccupants } = useEnvironmentStore();
  const material = <meshStandardMaterial color="#D9D9D9" roughness={0.7} />;
  const edgeColor = "#A6A6A6";

  const renderFigure = (index: number) => {
    // Positioning based on index
    const positions: [number, number, number][] = [
      [-2, 0.7, -1], // at desk
      [1, 0.7, 1],   // standing
      [-1, 0.7, 2],
      [2, 0.7, -1]
    ];
    
    const pos = positions[index] || [0, 0, 0];

    return (
      <group key={index} position={pos} castShadow>
        {/* Body */}
        <mesh castShadow receiveShadow position={[0, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 1.4, 8]} />
          {material}
          <Edges color={edgeColor} scale={1.001} />
        </mesh>
        {/* Head */}
        <mesh castShadow receiveShadow position={[0, 0.9, 0]}>
          <sphereGeometry args={[0.2, 8, 8]} />
          {material}
        </mesh>
      </group>
    );
  };

  return (
    <group>
      {Array.from({ length: Math.min(count, 4) }).map((_, i) => renderFigure(i))}
    </group>
  );
}
