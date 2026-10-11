import { Html } from '@react-three/drei';
import { useEnvironmentStore } from '@/store/useEnvironmentStore';
import { useEffect, useState } from 'react';

export default function WallDisplay() {
  const store = useEnvironmentStore();
  const [sourceStatus, setSourceStatus] = useState<'LIVE' | 'STALE' | 'DEMO'>('LIVE');
  const [ageText, setAgeText] = useState('just now');

  useEffect(() => {
    const isDemo = new URLSearchParams(window.location.search).get('demo') === '1';
    
    const interval = setInterval(() => {
      if (isDemo) {
        setSourceStatus('DEMO');
        setAgeText('demo active');
        return;
      }
      
      const age = Date.now() - store.lastUpdated;
      if (age > 2 * 60 * 1000) {
        setSourceStatus('STALE');
      } else {
        setSourceStatus('LIVE');
      }

      if (age < 10000) setAgeText('just now');
      else if (age < 60000) setAgeText(`${Math.floor(age/1000)}s ago`);
      else setAgeText(`${Math.floor(age/60000)}m ago`);
    }, 1000);

    return () => clearInterval(interval);
  }, [store.lastUpdated]);

  const rec = store.recommendation;
  const isWait = rec === 'WAIT';
  const isOpen = rec === 'OPEN_WINDOW';
  const colorHex = isWait ? '#eab308' : isOpen ? '#00d8a5' : '#ff5f1f';

  return (
    <group position={[2.48, 1.5, 1.0]} rotation={[0, -Math.PI / 2, 0]}>
      <mesh receiveShadow>
        <boxGeometry args={[1.2, 1.6, 0.04]} />
        <meshStandardMaterial color="#eeeeee" roughness={0.8} />
      </mesh>
      {/* Three LEDs */}
      <group position={[0, -0.6, 0.021]}>
        <mesh position={[-0.2, 0, 0]}>
          <circleGeometry args={[0.03, 16]} />
          <meshBasicMaterial color={isOpen ? colorHex : '#444'} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <circleGeometry args={[0.03, 16]} />
          <meshBasicMaterial color={isWait ? colorHex : '#444'} />
        </mesh>
        <mesh position={[0.2, 0, 0]}>
          <circleGeometry args={[0.03, 16]} />
          <meshBasicMaterial color={!isOpen && !isWait ? colorHex : '#444'} />
        </mesh>
      </group>

      <Html 
        transform 
        position={[0, 0, 0.021]} 
        scale={0.2}
        className="w-[250px] bg-transparent text-[#111] font-sans pointer-events-none flex flex-col items-center justify-center p-4 text-center"
      >
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[8px] px-1 font-mono text-white ${sourceStatus === 'LIVE' ? 'bg-[#111]' : sourceStatus === 'STALE' ? 'bg-[#eab308]' : 'bg-[#ff5f1f]'}`}>
            {sourceStatus}
          </span>
          <span className="text-[8px] font-mono text-gray-500">{ageText}</span>
        </div>

        <div className="font-mono font-bold tracking-tight text-xl mb-3" style={{ color: colorHex }}>
          {rec.replace('_', ' ')}
        </div>

        <div className="text-xs mb-1">
          <span className="font-mono text-lg">{store.sensorData.co2Estimated}</span>
          <span className="text-[10px] text-gray-500 ml-1">ppm</span>
        </div>
        <div className="text-[9px] text-gray-400 italic font-serif mb-2">est.</div>

        <div className="text-xs mb-1">
          <span className="font-mono text-lg">{store.sensorData.outdoorAQI}</span>
          <span className="text-[10px] text-gray-500 ml-1">AQI</span>
        </div>
        <div className="text-[9px] text-gray-400 italic font-serif">modelled</div>
      </Html>
    </group>
  );
}
