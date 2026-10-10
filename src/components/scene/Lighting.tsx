import { Environment, ContactShadows } from '@react-three/drei';

export default function Lighting() {
  return (
    <>
      <Environment 
        files="/hdri/snow_field_puresky_1k.hdr" 
        background={true}
        environmentIntensity={0.8}
      />
      <ambientLight intensity={0.2} />
      <directionalLight 
        position={[2, 4, 3]} 
        intensity={0.5} 
        castShadow 
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
