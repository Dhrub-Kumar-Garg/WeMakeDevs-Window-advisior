import { useMemo } from 'react';
import * as THREE from 'three';

export default function Room() {
  const windowWallShape = useMemo(() => {
    const shape = new THREE.Shape();
    // 5m wide x 3m high
    shape.moveTo(-2.5, 0);
    shape.lineTo(2.5, 0);
    shape.lineTo(2.5, 3);
    shape.lineTo(-2.5, 3);
    shape.lineTo(-2.5, 0);

    // Hole for the window (1.2m wide, 1.5m high, starting 0.9m off floor, centered)
    const hole = new THREE.Path();
    hole.moveTo(-0.6, 0.9);
    hole.lineTo(-0.6, 2.4);
    hole.lineTo(0.6, 2.4);
    hole.lineTo(0.6, 0.9);
    hole.lineTo(-0.6, 0.9);
    shape.holes.push(hole);

    return shape;
  }, []);

  const extrudeSettings = { depth: 0.2, bevelEnabled: false };

  return (
    <group>
      {/* Window Wall (Back) */}
      <mesh position={[0, 0, -0.2]} castShadow receiveShadow>
        <extrudeGeometry args={[windowWallShape, extrudeSettings]} />
        <meshStandardMaterial color="#BFB6A8" roughness={0.9} />
      </mesh>

      {/* Right Wall */}
      <mesh position={[2.6, 1.5, 1.9]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 3, 4]} />
        <meshStandardMaterial color="#D9D2C7" roughness={0.9} />
      </mesh>

      {/* Left Wall */}
      <mesh position={[-2.6, 1.5, 1.9]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 3, 4]} />
        <meshStandardMaterial color="#BFB6A8" roughness={0.9} />
      </mesh>

      {/* Floor */}
      <mesh position={[0, -0.05, 1.9]} receiveShadow>
        <boxGeometry args={[5.4, 0.1, 4.2]} />
        <meshStandardMaterial color="#8C735C" roughness={0.6} />
      </mesh>

      {/* Skirting Board Back */}
      <mesh position={[0, 0.05, -0.01]} receiveShadow>
        <boxGeometry args={[5, 0.1, 0.02]} />
        <meshStandardMaterial color="#ffffff" roughness={0.8} />
      </mesh>

      {/* Skirting Board Right */}
      <mesh position={[2.49, 0.05, 1.9]} receiveShadow>
        <boxGeometry args={[0.02, 0.1, 4]} />
        <meshStandardMaterial color="#ffffff" roughness={0.8} />
      </mesh>

      {/* Deep Window Sill */}
      <mesh position={[0, 0.88, -0.1]} receiveShadow castShadow>
        <boxGeometry args={[1.3, 0.04, 0.3]} />
        <meshStandardMaterial color="#ffffff" roughness={0.7} />
      </mesh>
      
      {/* Window Frame / Sash Indicator (mockup) */}
      <mesh position={[0, 1.65, -0.1]} receiveShadow castShadow>
        <boxGeometry args={[1.2, 1.5, 0.05]} />
        <meshStandardMaterial color="#222" roughness={0.5} transparent opacity={0.1} />
      </mesh>
    </group>
  );
}
