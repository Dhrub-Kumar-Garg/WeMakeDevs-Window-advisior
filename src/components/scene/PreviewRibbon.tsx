import { useEnvironmentStore } from '@/store/useEnvironmentStore';
import { updateCO2 } from '@/lib/co2Model';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

export default function PreviewRibbon({ openness }: { openness: number | null }) {
  const store = useEnvironmentStore();
  
  if (openness === null) return null;

  const ACH = store.modelParams.achClosed + openness * (store.modelParams.achOpen - store.modelParams.achClosed);
  const activeOccupants = store.sensorData.pirPresence ? store.modelParams.occupants : 0;
  
  // Predict next 60 minutes
  const steps = 60;
  const currentCO2 = store.sensorData.co2Estimated;
  
  // Closed projection
  const closedLine: number[] = [currentCO2];
  let c = currentCO2;
  for (let i = 0; i < steps; i++) {
    c = updateCO2(c, activeOccupants, store.modelParams.roomVolume, store.modelParams.achClosed, 60);
    closedLine.push(c);
  }

  // Assumed ACH projection (dragged)
  const assumedLine: number[] = [currentCO2];
  c = currentCO2;
  for (let i = 0; i < steps; i++) {
    c = updateCO2(c, activeOccupants, store.modelParams.roomVolume, ACH, 60);
    assumedLine.push(c);
  }

  const maxCO2 = Math.max(...closedLine, 1000);
  const minCO2 = 400; // Outdoor baseline

  const toY = (val: number) => 100 - ((val - minCO2) / (maxCO2 - minCO2)) * 100;
  
  const closedPoints = closedLine.map((val, i) => `${(i / steps) * 200},${toY(val)}`).join(' ');
  const assumedPoints = assumedLine.map((val, i) => `${(i / steps) * 200},${toY(val)}`).join(' ');

  // Ribbon area between closed and assumed
  const areaPoints = `${assumedPoints} ${closedLine.map((val, i) => `${((steps - i) / steps) * 200},${toY(closedLine[steps - i])}`).join(' ')}`;

  return (
    <Html
      position={[0.6, -0.6, 0]}
      center
      style={{
        pointerEvents: 'none',
        width: 250,
        background: 'rgba(255,255,255,0.95)',
        padding: '12px',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        fontFamily: 'monospace'
      }}
    >
      <div className="text-[10px] uppercase tracking-wider mb-2 font-bold opacity-70">Projection Preview</div>
      <svg width="200" height="100" className="overflow-visible">
        {/* Fill Area */}
        <polygon points={areaPoints} fill="rgba(0,216,165,0.1)" />
        
        {/* Closed Line */}
        <polyline points={closedPoints} fill="none" stroke="#ccc" strokeWidth="2" strokeDasharray="4 4" />
        <text x="205" y={toY(closedLine[steps])} fill="#ccc" fontSize="10" dominantBaseline="middle">closed</text>

        {/* Assumed Line */}
        <polyline points={assumedPoints} fill="none" stroke="#00d8a5" strokeWidth="2" />
        <text x="205" y={toY(assumedLine[steps])} fill="#00d8a5" fontSize="10" dominantBaseline="middle">assumed</text>
      </svg>
      <div className="flex justify-between text-[9px] text-gray-500 mt-2">
        <span>Now</span>
        <span>+60m</span>
      </div>
    </Html>
  );
}
