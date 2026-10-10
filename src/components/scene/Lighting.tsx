import { Environment, ContactShadows } from '@react-three/drei';

export default function Lighting() {
  return (
    <>
      <Environment 
        files="/hdri/snow_field_puresky_1k.hdr" 
        background={true}
        environmentIntensity={0.8}
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
