import { useRef, useState, useEffect } from 'react';
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
  const [hovered, setHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showHint, setShowHint] = useState(true);

  const pointerStartX = useRef(0);
  const initialOpenness = useRef(0);

  const activeOpenness = previewOpenness !== null ? previewOpenness : openness;

  // Hint disappears after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Cursor handling
  useEffect(() => {
    if (isDragging) {
      document.body.style.cursor = 'grabbing';
    } else if (hovered) {
      document.body.style.cursor = 'grab';
    } else {
      document.body.style.cursor = 'auto';
    }
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered, isDragging]);

  // Basic frame geometry
  const frameThickness = 0.05;
  const frameDepth = 0.1;
  const width = 1.2;
  const height = 1.5;
  const yCenter = 0.9 + height / 2; // 1.65

  useFrame((_, delta) => {
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

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    setHovered(true);
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    setHovered(false);
  };

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    try {
      e.target.setPointerCapture(e.pointerId);
    } catch (_) {}
    setIsDragging(true);
    pointerStartX.current = e.clientX || 0;
    initialOpenness.current = activeOpenness;
    setPreviewOpenness(activeOpenness);
  };

  const handlePointerMove = (e: any) => {
    if (!isDragging) return;
    e.stopPropagation();
    const deltaX = (e.clientX || 0) - pointerStartX.current;
    // Moving mouse left pulls the sash open
    const deltaOpen = -deltaX * 0.004;
    const newOpen = Math.max(0, Math.min(1, initialOpenness.current + deltaOpen));
    setPreviewOpenness(newOpen);
  };

  const handlePointerUp = (e: any) => {
    if (!isDragging) return;
    e.stopPropagation();
    try {
      e.target.releasePointerCapture(e.pointerId);
    } catch (_) {}
    setIsDragging(false);
  };

  const handlePointerCancel = (e: any) => {
    if (!isDragging) return;
    e.stopPropagation();
    try {
      e.target.releasePointerCapture(e.pointerId);
    } catch (_) {}
    setIsDragging(false);
  };

  // Subtle hover highlight (slightly lighter material, no glow)
  const sashColor = hovered ? '#ffffff' : '#f0ece3';
  const sashRoughness = hovered ? 0.35 : 0.45;

  return (
    <group position={[0, yCenter, -0.05]}>
      {/* Outer Frame Bars */}
      <mesh position={[0, height/2 - frameThickness/2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, frameThickness, frameDepth]} />
        <meshStandardMaterial color="#f0ece3" roughness={0.45} />
      </mesh>
      <mesh position={[0, -height/2 + frameThickness/2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, frameThickness, frameDepth]} />
        <meshStandardMaterial color="#f0ece3" roughness={0.45} />
      </mesh>
      <mesh position={[-width/2 + frameThickness/2, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[frameThickness, height, frameDepth]} />
        <meshStandardMaterial color="#f0ece3" roughness={0.45} />
      </mesh>
      <mesh position={[width/2 - frameThickness/2, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[frameThickness, height, frameDepth]} />
        <meshStandardMaterial color="#f0ece3" roughness={0.45} />
      </mesh>
      {/* Mullion */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[frameThickness, height, frameDepth]} />
        <meshStandardMaterial color="#f0ece3" roughness={0.45} />
      </mesh>
      
      {/* Right Fixed Glass */}
      <mesh position={[width/4, 0, 0]}>
        <boxGeometry args={[width/2 - frameThickness, height - frameThickness*2, 0.01]} />
        <meshPhysicalMaterial transparent opacity={0.12} roughness={0.05} color="#ffffff" toneMapped={false} />
      </mesh>

      {/* Sash Group (Left half, hinged at -width/2) */}
      <group 
        position={[-width/2, 0, 0]} 
        ref={sashRef}
      >
        {/* The sash pivot is at the local origin, so we offset the sash visual center */}
        <group position={[width/4, 0, 0]}>
          {/* Main sash frame mesh — drag target with pointer capture & hover highlight */}
          <mesh 
            castShadow 
            receiveShadow
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
          >
            <boxGeometry args={[width/2, height, frameThickness]} />
            <meshStandardMaterial color={sashColor} roughness={sashRoughness} />
          </mesh>

          {/* Sash Glass */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[width/2 - frameThickness*2, height - frameThickness*2, 0.011]} />
            <meshPhysicalMaterial transparent opacity={0.12} roughness={0.05} color="#ffffff" toneMapped={false} />
          </mesh>

          {/* Small ring pull-knob on sash edge (5cm scene scale, <3% viewport height) */}
          <group position={[width/4 - 0.03, 0, frameThickness/2 + 0.005]}>
            {/* Mount bracket */}
            <mesh castShadow receiveShadow>
              <cylinderGeometry args={[0.007, 0.007, 0.008, 16]} />
              <meshStandardMaterial color="#2d2a27" roughness={0.3} metalness={0.7} />
            </mesh>
            {/* Ring */}
            <mesh position={[0, -0.018, 0.008]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
              <torusGeometry args={[0.022, 0.0035, 16, 24]} />
              <meshStandardMaterial color="#2d2a27" roughness={0.3} metalness={0.7} />
            </mesh>
          </group>

          {/* Tiny mono hint "drag to open" (visible for first 5 seconds) */}
          {showHint && (
            <Html 
              position={[width/4 - 0.03, 0.07, frameThickness/2 + 0.02]} 
              center 
              style={{ pointerEvents: 'none' }}
            >
              <div className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-[rgba(244,240,234,0.95)] text-[#111111] border border-[#111111]/20 whitespace-nowrap shadow-none select-none">
                drag to open
              </div>
            </Html>
          )}
          
          {/* Accessible HTML control (focusable, arrow keys) */}
          <Html position={[0, 0, frameThickness]} center zIndexRange={[100, 0]} transform>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              className="opacity-0 focus:opacity-100 hover:opacity-10 transition-opacity w-32 outline-none focus-visible:ring-2 focus-visible:ring-black bg-white rounded-full p-2 cursor-grab active:cursor-grabbing"
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

      {/* Projection Preview: appears only while dragging or while sash held open */}
      <PreviewRibbon openness={previewOpenness} />
    </group>
  );
}
