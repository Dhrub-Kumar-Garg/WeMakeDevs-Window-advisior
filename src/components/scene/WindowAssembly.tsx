import { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { easing } from 'maath';
import { useSceneInputs } from './useSceneInputs';
import PreviewRibbon from './PreviewRibbon';
import { Html } from '@react-three/drei';

export default function WindowAssembly() {
  const { openness, reducedMotion } = useSceneInputs();
  const sashRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();
  
  const [previewOpenness, setPreviewOpenness] = useState<number | null>(null);
  const activeOpenness = previewOpenness !== null ? previewOpenness : openness;

  // Basic frame geometry
  const frameThickness = 0.05;
  const frameDepth = 0.1;
  const width = 1.2;
  const height = 1.5;
  const yCenter = 0.9 + height / 2; // 1.65

  // Glass material: fallback if low dpr
  const isLowPerf = viewport.dpr < 1.5;

  useFrame((state, delta) => {
    if (sashRef.current) {
      // activeOpenness is 0-1, swing 0-70 degrees (0 to 1.22 radians)
      const targetAngle = -activeOpenness * (70 * Math.PI / 180);
      if (reducedMotion) {
        sashRef.current.rotation.y = targetAngle;
      } else {
        easing.dampE(sashRef.current.rotation, [0, targetAngle, 0], 0.25, delta);
      }
    }
  });

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    if (e.target.setPointerCapture) e.target.setPointerCapture(e.pointerId);
    setPreviewOpenness(activeOpenness);
  };

  const handlePointerMove = (e: any) => {
    if (previewOpenness === null) return;
    e.stopPropagation();
    // R3F movementX is screen pixels. Moving mouse left (-movementX) means opening.
    const newOpenness = Math.max(0, Math.min(1, previewOpenness - e.movementX * 0.005));
    setPreviewOpenness(newOpenness);
  };

  const handlePointerUp = (e: any) => {
    if (previewOpenness === null) return;
    if (e.target.releasePointerCapture) e.target.releasePointerCapture(e.pointerId);
    setPreviewOpenness(null);
  };

  const handlePointerCancel = (e: any) => {
    if (previewOpenness === null) return;
    if (e.target.releasePointerCapture) e.target.releasePointerCapture(e.pointerId);
    setPreviewOpenness(null);
  };

  return (
    <group position={[0, yCenter, -0.05]}>
      {/* Outer Frame Bars */}
      <mesh position={[0, height/2 - frameThickness/2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, frameThickness, frameDepth]} />
        <meshStandardMaterial color="#f4f4f4" roughness={0.4} />
      </mesh>
      <mesh position={[0, -height/2 + frameThickness/2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, frameThickness, frameDepth]} />
        <meshStandardMaterial color="#f4f4f4" roughness={0.4} />
      </mesh>
      <mesh position={[-width/2 + frameThickness/2, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[frameThickness, height, frameDepth]} />
        <meshStandardMaterial color="#f4f4f4" roughness={0.4} />
      </mesh>
      <mesh position={[width/2 - frameThickness/2, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[frameThickness, height, frameDepth]} />
        <meshStandardMaterial color="#f4f4f4" roughness={0.4} />
      </mesh>
      {/* Mullion */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[frameThickness, height, frameDepth]} />
        <meshStandardMaterial color="#f4f4f4" roughness={0.4} />
      </mesh>
      
      {/* Right Fixed Glass */}
      <mesh position={[width/4, 0, 0]}>
        <boxGeometry args={[width/2 - frameThickness, height - frameThickness*2, 0.01]} />
        <meshPhysicalMaterial transparent opacity={0.12} roughness={0.05} color="#ffffff" toneMapped={false} />
      </mesh>

      {/* Sash Group (Left half) */}
      <group 
        position={[-width/2, 0, 0]} 
        ref={sashRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        {/* The sash pivot is at the local origin, so we offset the sash visual center */}
        <group position={[width/4, 0, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[width/2, height, frameThickness]} />
            <meshStandardMaterial color="#f4f4f4" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[width/2 - frameThickness*2, height - frameThickness*2, 0.011]} />
            <meshPhysicalMaterial transparent opacity={0.12} roughness={0.05} color="#ffffff" toneMapped={false} />
          </mesh>
          
          <Html position={[0, 0, frameThickness]} center zIndexRange={[100, 0]} transform>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              className="opacity-0 focus:opacity-100 hover:opacity-20 transition-opacity w-32 outline-none focus-visible:ring-4 focus-visible:ring-black bg-white rounded-full p-2 cursor-grab active:cursor-grabbing"
              value={activeOpenness}
              onChange={(e) => setPreviewOpenness(parseFloat(e.target.value))}
              onBlur={() => setPreviewOpenness(null)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setPreviewOpenness(null);
                  e.currentTarget.blur();
                }
              }}
              aria-label="Preview sash opening"
            />
          </Html>
        </group>
      </group>

      {/* Renders bottom-right inside the window assembly local coords */}
      <PreviewRibbon openness={previewOpenness} />
    </group>
  );
}
