'use client';

import { Edges } from '@react-three/drei';

export default function Room3D() {
  const wallMaterial = <meshStandardMaterial color="#F4F4F3" roughness={0.9} />;
  const edgeColor = "#CCCCCC";
  const accentMaterial = <meshStandardMaterial color="#EAEAEA" roughness={0.8} />;

  return (
    <group>
      {/* Floor */}
      <mesh receiveShadow position={[0, -0.1, 0]}>
        <boxGeometry args={[8, 0.2, 6]} />
        {wallMaterial}
        <Edges color={edgeColor} scale={1.001} />
      </mesh>

      {/* Left Wall */}
      <mesh receiveShadow position={[-3.9, 2, 0]}>
        <boxGeometry args={[0.2, 4, 6]} />
        {wallMaterial}
        <Edges color={edgeColor} scale={1.001} />
      </mesh>

      {/* Back Wall */}
      <mesh receiveShadow position={[0, 2, -2.9]}>
        <boxGeometry args={[8, 4, 0.2]} />
        {wallMaterial}
        <Edges color={edgeColor} scale={1.001} />
      </mesh>

      {/* Desk */}
      <group position={[-2, 1, -2]}>
        {/* Desk top */}
        <mesh castShadow receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[2.5, 0.1, 1]} />
          {accentMaterial}
          <Edges color={edgeColor} scale={1.001} />
        </mesh>
        {/* Legs */}
        <mesh castShadow receiveShadow position={[-1.1, -0.5, 0]}>
          <boxGeometry args={[0.1, 1, 0.8]} />
          {accentMaterial}
          <Edges color={edgeColor} scale={1.001} />
        </mesh>
        <mesh castShadow receiveShadow position={[1.1, -0.5, 0]}>
          <boxGeometry args={[0.1, 1, 0.8]} />
          {accentMaterial}
          <Edges color={edgeColor} scale={1.001} />
        </mesh>
        
        {/* Monitor */}
        <mesh castShadow receiveShadow position={[0, 0.5, -0.3]}>
          <boxGeometry args={[1.2, 0.7, 0.05]} />
          <meshStandardMaterial color="#D9D9D9" roughness={0.5} />
          <Edges color={edgeColor} scale={1.001} />
        </mesh>
        <mesh castShadow receiveShadow position={[0, 0.25, -0.35]}>
          <boxGeometry args={[0.2, 0.5, 0.1]} />
          {accentMaterial}
          <Edges color={edgeColor} scale={1.001} />
        </mesh>
      </group>
    </group>
  );
}
