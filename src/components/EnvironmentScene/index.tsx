'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, SoftShadows, PresentationControls } from '@react-three/drei';
import { useEnvironmentStore } from '@/store/useEnvironmentStore';
import Room3D from './Room3D';
import Window3D from './Window3D';
import Occupants3D from './Occupants3D';
import Airflow3D from './Airflow3D';
import Atmosphere3D from './Atmosphere3D';

export default function EnvironmentScene() {
  const { envState, windowState, modelParams, sensorData, toggleWindow } = useEnvironmentStore();

  return (
    <div className="relative w-full aspect-[21/9] bg-[#F7F7F6] rounded-xl overflow-hidden border border-subtle flex items-end justify-center shadow-inner cursor-grab active:cursor-grabbing">
      
      <Canvas 
        shadows 
        camera={{ position: [8, 6, 10], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Atmosphere3D density={sensorData.co2Estimated} />
        
        {/* Lights */}
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[5, 10, 5]} 
          intensity={0.8} 
          castShadow 
          shadow-mapSize={1024}
          shadow-bias={-0.0001}
        />
        <directionalLight 
          position={[-5, 5, -5]} 
          intensity={0.2} 
        />

        <PresentationControls 
          global 
          rotation={[0, -Math.PI / 4, 0]} 
          polar={[-0.1, 0.2]} 
          azimuth={[-Math.PI / 4, Math.PI / 4]} 
          config={{ mass: 2, tension: 400 }} 
          snap={{ mass: 4, tension: 400 }}
        >
          <group position={[0, -1.5, 0]}>
            <Room3D />
            <Window3D state={windowState} onClick={toggleWindow} />
            <Occupants3D count={modelParams.occupants} />
            <Airflow3D active={windowState !== 'closed'} />
          </group>
        </PresentationControls>

        <SoftShadows size={20} samples={10} focus={0.5} />
      </Canvas>
      
      {/* Overlay labels */}
      <div className="absolute top-4 right-4 pointer-events-none flex items-center gap-2 text-xs font-mono text-muted">
        <span>Click & Drag to Inspect</span>
      </div>
    </div>
  );
}
