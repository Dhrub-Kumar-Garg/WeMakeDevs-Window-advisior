'use client';

import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr, PerformanceMonitor, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useState, useEffect } from 'react';
import Room from './Room';
import Lighting from './Lighting';
import Effects from './Effects';
import { useSceneInputs } from './useSceneInputs';

import WindowAssembly from './WindowAssembly';
import Sky from './Sky';
import Dust from './Dust';

export default function SceneRoot({ isIntersecting = true }: { isIntersecting?: boolean }) {
  const { co2Ratio, isMobile } = useSceneInputs();
  const [dpr, setDpr] = useState(1.5);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    const handleVis = () => setIsHidden(document.hidden);
    document.addEventListener('visibilitychange', handleVis);
    return () => document.removeEventListener('visibilitychange', handleVis);
  }, []);

  const frameloop = (!isIntersecting || isHidden) ? 'never' : 'always';

  return (
    <div className="w-full h-full absolute inset-0 bg-[#f8fafc]">
      {isIntersecting && (
        <Canvas 
          frameloop={frameloop}
          shadows 
          dpr={dpr} 
          gl={{ toneMapping: THREE.ACESFilmicToneMapping, antialias: false }}
        >
          <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)} />
          <AdaptiveDpr pixelated />
          
          <PerspectiveCamera makeDefault position={[isMobile ? 0 : -0.6, 1.2, 3.2]} fov={50} />
          
          <Sky />
          <Room />
          <WindowAssembly />
          <Lighting />
          <Dust />
          <Effects enabled={dpr > 1} />
        </Canvas>
      )}
      {/* Captions layer */}
      <div className="absolute bottom-4 right-4 text-right font-mono text-[10px] text-[#111111]/40 pointer-events-none">
        <p>sky haze is illustrative</p>
        <p>illustrative airflow, speed ∝ assumed ACH</p>
      </div>
    </div>
  );
}
