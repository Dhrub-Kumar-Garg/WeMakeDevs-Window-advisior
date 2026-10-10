import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { easing } from 'maath';
import { useSceneInputs } from './useSceneInputs';

export default function WindowAssembly() {
  const { openness } = useSceneInputs();
  const sashRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();
  
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
      // openness is 0-1, swing 0-70 degrees (0 to 1.22 radians)
      const targetAngle = -openness * (70 * Math.PI / 180);
      easing.dampE(sashRef.current.rotation, [0, targetAngle, 0], 0.25, delta);
    }
  });

  return (
    <group position={[0, yCenter, -0.05]}>
      {/* Outer Frame Bars */}
      <mesh position={[0, height/2 - frameThickness/2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, frameThickness, frameDepth]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0, -height/2 + frameThickness/2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, frameThickness, frameDepth]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[-width/2 + frameThickness/2, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[frameThickness, height, frameDepth]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[width/2 - frameThickness/2, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[frameThickness, height, frameDepth]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      {/* Mullion */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[frameThickness, height, frameDepth]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      
      {/* Right Fixed Glass */}
      <mesh position={[width/4, 0, 0]}>
        <boxGeometry args={[width/2 - frameThickness, height - frameThickness*2, 0.01]} />
        {isLowPerf ? (
          <meshStandardMaterial color="#88ccff" transparent opacity={0.3} roughness={0.1} />
        ) : (
          <meshPhysicalMaterial transmission={0.95} thickness={0.02} roughness={0.05} ior={1.5} color="#e0f0ff" />
        )}
      </mesh>

      {/* Sash Group (Left half) */}
      <group position={[-width/2, 0, 0]} ref={sashRef}>
        {/* The sash pivot is at the local origin, so we offset the sash visual center */}
        <group position={[width/4, 0, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[width/2, height, frameThickness]} />
            <meshStandardMaterial color="#444" />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[width/2 - frameThickness*2, height - frameThickness*2, 0.011]} />
            {isLowPerf ? (
              <meshStandardMaterial color="#88ccff" transparent opacity={0.3} roughness={0.1} />
            ) : (
              <meshPhysicalMaterial transmission={0.95} thickness={0.02} roughness={0.05} ior={1.5} color="#e0f0ff" />
            )}
          </mesh>
        </group>
      </group>
    </group>
  );
}
