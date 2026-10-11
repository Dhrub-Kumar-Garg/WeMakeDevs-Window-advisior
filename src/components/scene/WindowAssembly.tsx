import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { easing } from 'maath';
import { useSceneInputs } from './useSceneInputs';
import { useEnvironmentStore } from '@/store/useEnvironmentStore';

export default function WindowAssembly() {
  const { openness, reducedMotion } = useSceneInputs();
  const togglePreviewOpen = useEnvironmentStore((s) => s.togglePreviewOpen);
  const sashRef = useRef<THREE.Group>(null);
  
  const [hovered, setHovered] = useState(false);

  // Cursor handling
  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = 'pointer';
    } else {
      document.body.style.cursor = 'auto';
    }
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered]);

  // Frame geometry
  const frameThickness = 0.05;
  const frameDepth = 0.1;
  const width = 1.2;
  const height = 1.5;
  const yCenter = 0.9 + height / 2; // 1.65

  useFrame((_, delta) => {
    if (sashRef.current) {
      // openness is 0-1, swings 0-70 degrees (0 to 1.22 radians)
      const targetAngle = -openness * (70 * Math.PI / 180);
      if (reducedMotion) {
        sashRef.current.rotation.y = targetAngle;
      } else {
        easing.dampE(sashRef.current.rotation, [0, targetAngle, 0], 0.25, delta);
      }
    }
  });

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    setHovered(true);
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    setHovered(false);
  };

  const handleClick = (e: any) => {
    e.stopPropagation();
    togglePreviewOpen();
  };

  // Subtle hover highlight (slightly lighter material, no glow)
  const sashColor = hovered ? '#ffffff' : '#f0ece3';
  const sashRoughness = hovered ? 0.35 : 0.45;

  return (
    <group position={[0, yCenter, -0.05]}>
      {/* Outer Frame Bars */}
      <mesh position={[0, height / 2 - frameThickness / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, frameThickness, frameDepth]} />
        <meshStandardMaterial color="#f0ece3" roughness={0.45} />
      </mesh>
      <mesh position={[0, -height / 2 + frameThickness / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, frameThickness, frameDepth]} />
        <meshStandardMaterial color="#f0ece3" roughness={0.45} />
      </mesh>
      <mesh position={[-width / 2 + frameThickness / 2, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[frameThickness, height, frameDepth]} />
        <meshStandardMaterial color="#f0ece3" roughness={0.45} />
      </mesh>
      <mesh position={[width / 2 - frameThickness / 2, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[frameThickness, height, frameDepth]} />
        <meshStandardMaterial color="#f0ece3" roughness={0.45} />
      </mesh>
      {/* Mullion */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[frameThickness, height, frameDepth]} />
        <meshStandardMaterial color="#f0ece3" roughness={0.45} />
      </mesh>
      
      {/* Right Fixed Glass */}
      <mesh position={[width / 4, 0, 0]}>
        <boxGeometry args={[width / 2 - frameThickness, height - frameThickness * 2, 0.01]} />
        <meshPhysicalMaterial transparent opacity={0.12} roughness={0.05} color="#ffffff" toneMapped={false} />
      </mesh>

      {/* Sash Group (Left half, hinged at -width/2) */}
      <group 
        position={[-width / 2, 0, 0]} 
        ref={sashRef}
      >
        {/* The sash pivot is at the local origin, so we offset the sash visual center */}
        <group position={[width / 4, 0, 0]}>
          {/* Main sash frame mesh — click/tap toggles previewOpen */}
          <mesh 
            castShadow 
            receiveShadow
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            onClick={handleClick}
          >
            <boxGeometry args={[width / 2, height, frameThickness]} />
            <meshStandardMaterial color={sashColor} roughness={sashRoughness} />
          </mesh>

          {/* Sash Glass */}
          <mesh 
            position={[0, 0, 0]}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            onClick={handleClick}
          >
            <boxGeometry args={[width / 2 - frameThickness * 2, height - frameThickness * 2, 0.011]} />
            <meshPhysicalMaterial transparent opacity={0.12} roughness={0.05} color="#ffffff" toneMapped={false} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
