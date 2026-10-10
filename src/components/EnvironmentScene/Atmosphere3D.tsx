'use client';

import { useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Atmosphere3DProps {
  density: number;
}

export default function Atmosphere3D({ density }: Atmosphere3DProps) {
  const { scene } = useThree();
  
  // Normal color: matches the #F7F7F6 background
  // High CO2 color: slightly amber / muddy #DED3C4
  const cleanColor = new THREE.Color('#F7F7F6');
  const staleColor = new THREE.Color('#E3D6C1');
  
  useEffect(() => {
    // Initialize fog
    scene.fog = new THREE.Fog('#F7F7F6', 5, 25);
    scene.background = new THREE.Color('#F7F7F6');
    
    return () => {
      scene.fog = null;
      scene.background = null;
    };
  }, [scene]);

  useFrame((_, delta) => {
    if (scene.fog && scene.background) {
      const isStale = density > 800;
      const targetColor = isStale ? staleColor : cleanColor;
      
      // Smooth color transition
      (scene.fog as THREE.Fog).color.lerp(targetColor, delta * 0.5);
      (scene.background as THREE.Color).lerp(targetColor, delta * 0.5);
      
      // Also adjust fog density/near plane based on CO2
      const targetNear = isStale ? 2 : 5;
      (scene.fog as THREE.Fog).near = THREE.MathUtils.lerp((scene.fog as THREE.Fog).near, targetNear, delta * 0.5);
    }
  });

  return null;
}
