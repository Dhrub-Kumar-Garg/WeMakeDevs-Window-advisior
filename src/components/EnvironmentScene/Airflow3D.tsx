'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Airflow3DProps {
  active: boolean;
}

export default function Airflow3D({ active }: Airflow3DProps) {
  const count = 30;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Store individual particle data
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        t: Math.random() * 100,
        factor: 20 + Math.random() * 20, // speed factor
        speed: 0.01 + Math.random() / 200,
        xFactor: -2 + Math.random() * 4,
        yFactor: Math.random() * 2,
        zFactor: -2 + Math.random() * 4,
      });
    }
    return temp;
  }, [count]);

  useFrame(() => {
    if (!meshRef.current || !active) return;
    
    particles.forEach((particle, i) => {
      let { t, factor, speed, xFactor, yFactor, zFactor } = particle;
      t = particle.t += speed / 2;
      
      const x = 1.5 - (t % factor) * 0.2 + xFactor * 0.5; 
      const y = 2 - (t % factor) * 0.05 + Math.sin(t) * 0.2 + yFactor;
      const z = -2.8 + (t % factor) * 0.2 + zFactor;

      dummy.position.set(x, y, z);
      // Fade scale based on life
      const life = (t % factor) / factor; // 0 to 1
      const scale = Math.max(0, 0.1 * (1 - life));
      dummy.scale.set(scale, scale, scale);
      
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#4CA685" transparent opacity={0.6} />
    </instancedMesh>
  );
}
