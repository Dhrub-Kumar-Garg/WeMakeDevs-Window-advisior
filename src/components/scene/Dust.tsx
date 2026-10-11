import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneInputs } from './useSceneInputs';

const vertexShader = `
  uniform float uTime;
  uniform float uSpeed;
  attribute float aOffset;
  attribute float aSize;
  varying float vAlpha;
  
  void main() {
    // Brownian motion base
    vec3 pos = position;
    
    // Wind drift towards +Z (into the room) and +X (across) based on speed
    float driftZ = uTime * uSpeed * (0.5 + aOffset * 0.5);
    float driftX = uTime * uSpeed * 0.2 * sin(aOffset * 10.0);
    float driftY = uTime * 0.05 * cos(aOffset * 20.0); // slow settling
    
    pos.z += driftZ;
    pos.x += driftX;
    pos.y -= driftY;

    // Wrap around bounds: Room is ~[-2.5, 2.5] in X, [0, 3] in Y, [-0.5, 4] in Z
    pos.x = mod(pos.x + 2.5, 5.0) - 2.5;
    pos.y = mod(pos.y, 3.0);
    pos.z = mod(pos.z + 0.5, 4.5) - 0.5;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    gl_PointSize = aSize * (10.0 / -mvPosition.z);
    
    // Fade at edges
    float distToCenter = length(pos.xy - vec2(0.0, 1.5));
    vAlpha = smoothstep(2.0, 0.0, distToCenter) * 0.4;
  }
`;

const fragmentShader = `
  varying float vAlpha;
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    float alpha = smoothstep(0.5, 0.2, dist) * vAlpha;
    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
  }
`;

export default function Dust() {
  const { effectiveACH, windowOpen } = useSceneInputs();
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  const count = 1000;
  
  const [positions, offsets, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const off = new Float32Array(count);
    const size = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 5; // x
      pos[i * 3 + 1] = Math.random() * 3;         // y
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4.5; // z
      off[i] = Math.random();
      size[i] = 2.0 + Math.random() * 3.0;
    }
    return [pos, off, size];
  }, [count]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      // When closed, slight brownian drift. When open, proportional to effectiveACH
      const targetSpeed = windowOpen ? Math.max(0.2, effectiveACH * 0.1) : 0.02;
      
      // smoothly interpolate speed
      const currentSpeed = materialRef.current.uniforms.uSpeed.value;
      materialRef.current.uniforms.uSpeed.value = THREE.MathUtils.lerp(currentSpeed, targetSpeed, 0.05);
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aOffset" args={[offsets, 1]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
      </bufferGeometry>
      <shaderMaterial 
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uSpeed: { value: 0.02 }
        }}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
