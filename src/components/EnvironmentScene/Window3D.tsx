'use client';

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Edges } from '@react-three/drei';
import * as THREE from 'three';
import type { WindowState } from '@/lib/types';
import { useEnvironmentStore } from '@/store/useEnvironmentStore';

interface Window3DProps {
  state: WindowState;
  onClick: () => void;
}

export default function Window3D({ state, onClick }: Window3DProps) {
  const { setShowWindowDetail } = useEnvironmentStore();
  const groupRef = useRef<THREE.Group>(null);
  
  const isOpen = state === 'open' || state === 'ajar';
  const targetRotation = isOpen ? -Math.PI / 2.5 : 0; // -72 degrees

  useFrame((_, delta) => {
    if (groupRef.current) {
      // Simple smooth lerp for animation
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotation,
        delta * 3 // speed
      );
    }
  });

  const edgeColor = "#CCCCCC";
  const frameMaterial = <meshStandardMaterial color="#EAEAEA" roughness={0.8} />;
  const glassMaterial = <meshPhysicalMaterial color="#4A7A96" transmission={0.9} opacity={1} transparent roughness={0.1} ior={1.5} thickness={0.1} />;

  return (
    <group position={[1.5, 2, -2.8]} onClick={(e) => { e.stopPropagation(); setShowWindowDetail(true); }}>
      
      {/* Window Hole / Frame Outer */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[1.6, 2, 0.1]} />
        {frameMaterial}
        <Edges color={edgeColor} scale={1.001} />
      </mesh>

      {/* The hinged sash */}
      {/* Positioned at the left edge of the frame to hinge correctly */}
      <group position={[-0.7, 0, 0.05]}>
        <group ref={groupRef} position={[0, 0, 0]}>
          {/* Shift geometry so its left edge is at origin */}
          <group position={[0.7, 0, 0]}>
            {/* Inner Frame */}
            <mesh castShadow>
              <boxGeometry args={[1.4, 1.8, 0.05]} />
              {frameMaterial}
              <Edges color={edgeColor} scale={1.001} />
            </mesh>
            
            {/* Glass */}
            <mesh castShadow position={[0, 0, 0]}>
              <boxGeometry args={[1.2, 1.6, 0.02]} />
              {glassMaterial}
            </mesh>
            
            {/* Handle */}
            <mesh position={[0.6, 0, 0.05]}>
              <boxGeometry args={[0.05, 0.3, 0.05]} />
              <meshStandardMaterial color="#999999" roughness={0.5} />
              <Edges color={edgeColor} scale={1.001} />
            </mesh>
          </group>
        </group>
      </group>
      
      {/* Hole in the back wall for light to enter */}
      {/* We achieve this by having directional light pass through, but we also want the outdoor backdrop to be visible */}
      {/* A simple outdoor backdrop behind the window */}
      <mesh position={[0, 0, -0.5]}>
        <planeGeometry args={[2, 2.5]} />
        <meshBasicMaterial color="#E6E6E6" /> 
        {/* Very light grey outdoor placeholder */}
      </mesh>
    </group>
  );
}
