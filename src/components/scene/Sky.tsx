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

  return (
    <group>
      {/* Dynamic Sky */}
      {!isNight && (
        <DreiSky 
          sunPosition={sunPosition} 
          turbidity={turbidity} 
          rayleigh={1.5} 
          mieCoefficient={0.005} 
          mieDirectionalG={0.7} 
        />
      )}

      {/* Night Sky */}
      {isNight && (
        <mesh scale={100}>
          <sphereGeometry />
          <meshBasicMaterial color="#050a1f" side={THREE.BackSide} />
        </mesh>
      )}

      {/* Stars */}
      {starOpacity > 0 && (
        <Stars radius={50} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
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

      {/* Lighting */}
      <ambientLight intensity={isNight ? 0.05 : 0.2} />
      {!isNight && (
        <directionalLight 
          position={sunPosition} 
          intensity={sunIntensity} 
          color={sunColor} 
          castShadow 
          shadow-bias={-0.0001}
        />
      )}
      
      {/* Interior Lamp at night */}
      {isNight && (
        <pointLight position={[0, 2.5, 2]} intensity={0.5} color="#ffeebb" castShadow />
      )}

      {/* Distant Skyline */}
      <group position={[0, -1, -30]}>
        {Array.from({ length: 20 }).map((_, i) => (
          <mesh key={i} position={[(i - 10) * 4 + (Math.random() - 0.5) * 2, Math.random() * 2, (Math.random() - 0.5) * 5]}>
            <boxGeometry args={[2 + Math.random() * 2, 4 + Math.random() * 4, 2]} />
            <meshBasicMaterial color={isNight ? "#02040a" : "#4a5568"} fog={true} />
          </mesh>
        ))}
      </group>

      {/* Fog for depth */}
      <fog attach="fog" args={[isNight ? '#050a1f' : '#cbd5e1', 20, 60]} />
      
      {/* Light shafts (Gradient Cone) */}
      {!isNight && sunPosition.z < 0 && (
        <mesh position={[0, 1.65, 0]} rotation={[phi, theta, 0]}>
          <cylinderGeometry args={[0.6, 2, 6, 32, 1, true]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.015 * Math.max(0, altitude)} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      )}
    </group>
  );
}
