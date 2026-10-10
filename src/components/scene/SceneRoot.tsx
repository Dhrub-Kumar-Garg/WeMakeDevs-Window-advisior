'use client';

import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr, PerformanceMonitor, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useState } from 'react';
import Room from './Room';
import Lighting from './Lighting';
import Effects from './Effects';
import { useSceneInputs } from './useSceneInputs';

export default function SceneRoot() {
  const { reducedMotion } = useSceneInputs();
  const [dpr, setDpr] = useState(1.5);

  if (reducedMotion) {
    return (
      <div className="w-full h-full bg-gradient-to-b from-[#e2e8f0] to-[#f8fafc] flex items-center justify-center">
        <p className="font-mono text-sm text-[#666]">Reduced motion enabled: 3D scene paused.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full absolute inset-0 bg-[#f8fafc]">
      <Canvas 
        shadows 
        dpr={dpr} 
        gl={{ toneMapping: THREE.ACESFilmicToneMapping, antialias: false }}
      >
        <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)} />
        <AdaptiveDpr pixelated />
        
        <PerspectiveCamera makeDefault position={[1.5, 1.2, 4]} fov={50} />
        
        <Room />
        <Lighting />
        <Effects />
      </Canvas>
    </div>
  );
}
