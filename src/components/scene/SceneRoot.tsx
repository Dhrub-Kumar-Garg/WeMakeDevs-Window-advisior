'use client';

import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr, PerformanceMonitor, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useState } from 'react';
import Room from './Room';
import Lighting from './Lighting';
import Effects from './Effects';
import { useSceneInputs } from './useSceneInputs';

import WindowAssembly from './WindowAssembly';
import Sky from './Sky';
import Dust from './Dust';
import WallDisplay from './WallDisplay';

export default function SceneRoot() {
  const { reducedMotion, co2Ratio } = useSceneInputs();
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
        
        <Sky />
        <Room />
        <WindowAssembly />
        <WallDisplay />
        <Lighting />
        <Dust />
        <Effects />
        
        {/* Indoor tint based on CO2 */}
        <mesh position={[0, 1.5, 2]}>
          <boxGeometry args={[6, 4, 6]} />
          <meshBasicMaterial 
            color="#5a4d45" 
            transparent 
            opacity={Math.min(0.2, (co2Ratio - 0.4) * 0.15)} 
            side={THREE.BackSide} 
            depthWrite={false}
          />
        </mesh>
      </Canvas>
      {/* Captions layer */}
      <div className="absolute bottom-4 right-4 text-right font-mono text-[10px] text-[#111111]/40 pointer-events-none">
        <p>sky haze is illustrative</p>
        <p>illustrative airflow, speed ∝ assumed ACH</p>
        <p>visualisation of estimated CO2; CO2 itself is invisible</p>
      </div>
    </div>
  );
}
