import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneInputs } from './useSceneInputs';

const vertexShader = `
  uniform float uTime;
  uniform float uSpeed;
  uniform float uDpr;
  attribute float aOffset;
  attribute float aSize;
  varying float vAlpha;
  
  void main() {
    vec3 pos = position;
    
    float driftZ = uTime * uSpeed * (0.5 + aOffset * 0.5);
    float driftX = uTime * uSpeed * 0.2 * sin(aOffset * 10.0);
    float driftY = uTime * 0.05 * cos(aOffset * 20.0);
    
    pos.z += driftZ;
    pos.x += driftX;
    pos.y -= driftY;

    pos.x = mod(pos.x + 2.5, 5.0) - 2.5;
    pos.y = mod(pos.y, 3.0);
    pos.z = mod(pos.z + 0.5, 4.5) - 0.5;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Clamp point size 1.5 - 5.0, multiply by DPR
    float pointSize = aSize * (10.0 / -mvPosition.z);
    gl_PointSize = clamp(pointSize, 1.5, 5.0) * uDpr;
    
    // Light cone masking: Window is at X=0, Y=1.65, Z=0
    vec2 coneCenter = vec2(0.0, 1.65);
    
    // Light is coming from top right (X=2, Y=4, Z=-3) targeting left floor (X=-1, Y=0, Z=1.5)
    // The beam roughly shifts left (-X) and down (-Y) as it enters the room (+Z).
    vec2 beamCenter = coneCenter + vec2(-0.2, -0.3) * pos.z;
    
    float distToCenter = length(pos.xy - beamCenter);
    float maxRadius = 0.5 + pos.z * 0.1; // very tight beam, expanding slightly
    
    float coneAlpha = smoothstep(maxRadius, maxRadius - 0.2, distToCenter);
    
    // Fade out dust entirely if it's outside the window (Z < 0) or too close to camera
    float zAlpha = smoothstep(-0.1, 0.1, pos.z) * smoothstep(4.0, 3.5, pos.z);
    
    float baseOpacity = 0.15 + 0.2 * aOffset; // 0.15 - 0.35
    vAlpha = coneAlpha * baseOpacity * zAlpha;
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
  const { effectiveACH, windowOpen, reducedMotion, isMobile } = useSceneInputs();
  const { viewport } = useThree();
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  const count = isMobile ? 300 : 600;
  
  const [positions, offsets, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const off = new Float32Array(count);
    const size = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 5;
      pos[i * 3 + 1] = Math.random() * 3;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4.5;
      off[i] = Math.random();
      size[i] = 1.5 + Math.random() * 3.5;
    }
    return [pos, off, size];
  }, [count]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      const targetSpeed = reducedMotion ? 0 : (windowOpen ? Math.max(0.2, effectiveACH * 0.1) : 0.02);
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
          uSpeed: { value: 0.02 },
          uDpr: { value: viewport.dpr }
        }}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
