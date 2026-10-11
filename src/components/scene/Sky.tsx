import { useMemo } from 'react';
import { Sky as DreiSky, Stars } from '@react-three/drei';
import * as THREE from 'three';
import * as SunCalc from 'suncalc';
import { useSceneInputs } from './useSceneInputs';

export default function Sky() {
  const { sceneTime, outdoorAQI } = useSceneInputs();
  
  const lat = parseFloat(process.env.NEXT_PUBLIC_LAT || '12.9692');
  const lon = parseFloat(process.env.NEXT_PUBLIC_LON || '79.1559');

  const { altitude, azimuth } = useMemo(() => {
    return SunCalc.getPosition(sceneTime, lat, lon);
  }, [sceneTime, lat, lon]);

  // Convert to Three.js coordinates (azimuth is from south, altitude from horizon)
  const phi = Math.PI / 2 - altitude;
  const theta = azimuth + Math.PI; // Adjust base rotation depending on window facing. Let's assume window faces south-ish.

  const sunPosition = new THREE.Vector3().setFromSphericalCoords(100, phi, theta);

  // Regimes
  const isNight = altitude < -0.1;
  const isTwilight = altitude >= -0.1 && altitude < 0.1;
  const isDay = altitude >= 0.1;

  // Turbidity mapping
  const turbidity = 2 + 10 * Math.max(0, Math.min(1, outdoorAQI / 200));

  // Sun color
  const sunColor = isTwilight ? '#ff8c00' : '#ffffff';
  const sunIntensity = Math.max(0, altitude) * 2;
  
  // Stars visibility at night based on AQI
  const starOpacity = isNight ? Math.max(0, 1 - (outdoorAQI / 100)) : 0;

  const skyMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        colorBottom: { value: new THREE.Color(isNight ? '#050a1f' : isTwilight ? '#ffb055' : '#b4d5ff') },
        colorTop: { value: new THREE.Color(isNight ? '#020410' : isTwilight ? '#552255' : '#4a90e2') }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 colorBottom;
        uniform vec3 colorTop;
        varying vec2 vUv;
        void main() {
          gl_FragColor = vec4(mix(colorBottom, colorTop, vUv.y), 1.0);
        }
      `,
      toneMapped: false,
      depthWrite: false
    });
  }, [isNight, isTwilight]);

  return (
    <group>
      {/* Emissive Sky Plane */}
      <mesh position={[0, 10, -40]}>
        <planeGeometry args={[120, 120]} />
        <primitive object={skyMaterial} attach="material" />
      </mesh>

      {/* Stars */}
      {starOpacity > 0 && (
        <Stars radius={38} depth={10} count={2000} factor={4} saturation={0} fade speed={1} />
      )}

      {/* City lights (emissive points) */}
      {isNight && (
        <points position={[0, -2, -50]}>
          <bufferGeometry>
            <bufferAttribute 
              attach="attributes-position" 
              args={[new Float32Array(300).map(() => (Math.random() - 0.5) * 100), 3]} 
            />
          </bufferGeometry>
          <pointsMaterial color="#ffaa55" size={0.5} sizeAttenuation={true} transparent opacity={0.6} />
        </points>
      )}

      {/* Lighting has been moved to Lighting.tsx for stable exposure */}

      {/* Distant Skyline */}
      <group position={[0, -1, -30]}>
        {Array.from({ length: 20 }).map((_, i) => (
          <mesh key={i} position={[(i - 10) * 4 + (Math.random() - 0.5) * 2, Math.random() * 2, (Math.random() - 0.5) * 5]}>
            <boxGeometry args={[2 + Math.random() * 2, 4 + Math.random() * 4, 2]} />
            <meshBasicMaterial color={isNight ? "#02040a" : "#4a5568"} fog={true} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
