import { Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

export default function Lighting() {
  const target = new THREE.Object3D();
  target.position.set(-1, 0, 1.5);
  
  return (
    <>
      <Environment 
        files="/hdri/snow_field_puresky_1k.hdr" 
        background={true}
        environmentIntensity={0.9}
      />
      {/* Soft cool fill */}
      <ambientLight intensity={0.85} color="#dbeafe" />
      
      {/* Soft cool hemisphere fill */}
      <hemisphereLight intensity={1.1} color="#ffffff" groundColor="#8C735C" />

      {/* Key light from the window casting a warm patch on the floor */}
      <primitive object={target} />
      <directionalLight 
        position={[2, 4, -3]}
        target={target}
        intensity={1.2} 
        color="#ffebd6" 
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={15}
        shadow-camera-left={-2.5}
        shadow-camera-right={2.5}
        shadow-camera-top={2.5}
        shadow-camera-bottom={-2.5}
        shadow-bias={-0.0001}
      />

      <ContactShadows 
        position={[0, 0, 1.9]} 
        opacity={0.5} 
        scale={10} 
        blur={2} 
        far={4} 
      />
    </>
  );
}
