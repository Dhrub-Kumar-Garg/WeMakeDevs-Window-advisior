import { useEnvironmentStore } from '@/store/useEnvironmentStore';
import { updateCO2 } from '@/lib/co2Model';
import { Html } from '@react-three/drei';

export default function PreviewRibbon({ openness }: { openness: number | null }) {
  const store = useEnvironmentStore();
  
  const isHeldOpen = store.windowState === 'open' || store.sashAngle > 0;
  const isDragging = openness !== null;

  // Appears only while dragging or while the sash is held open; otherwise it hides
  if (!isDragging && !isHeldOpen) return null;

  const effectiveOpenness = openness !== null 
    ? openness 
    : (store.sashAngle > 0 ? store.sashAngle / 60 : 1);

  const achOpenLow = store.modelParams.achOpenRange?.[0] ?? 2;
  const achOpenHigh = store.modelParams.achOpenRange?.[1] ?? 6;
  const avgACHOpen = (achOpenLow + achOpenHigh) / 2;
  const ACH = store.modelParams.achClosed + effectiveOpenness * (avgACHOpen - store.modelParams.achClosed);
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

  // Open projection (assumed ACH range midpoint scaled by openness)
  const assumedLine: number[] = [currentCO2];
  c = currentCO2;
  for (let i = 0; i < steps; i++) {
    c = updateCO2(c, activeOccupants, store.modelParams.roomVolume, ACH, 60);
    assumedLine.push(c);
  }

  const maxCO2 = Math.max(...closedLine, 1100);
  const minCO2 = 400; // Outdoor baseline

  const toY = (val: number) => 100 - ((val - minCO2) / (maxCO2 - minCO2)) * 100;
  
  const closedPoints = closedLine.map((val, i) => `${(i / steps) * 190},${toY(val)}`).join(' ');
  const assumedPoints = assumedLine.map((val, i) => `${(i / steps) * 190},${toY(val)}`).join(' ');

  // Ribbon area between closed and assumed
  const areaPoints = `${assumedPoints} ${closedLine.map((val, i) => `${((steps - i) / steps) * 190},${toY(closedLine[steps - i])}`).join(' ')}`;

  const closedEnd = toY(closedLine[steps]);
  const assumedEnd = toY(assumedLine[steps]);

  return (
    <Html
      position={[0.75, -0.65, 0.05]}
      center={false}
      style={{
        pointerEvents: 'none',
        background: 'transparent',
        width: 320,
      }}
    >
      <div className="relative select-none pointer-events-none">
        <svg width="320" height="135" viewBox="0 0 320 135" className="overflow-visible">
          {/* Hairline axes */}
          <line x1="0" y1="100" x2="190" y2="100" stroke="#111111" strokeOpacity="0.25" strokeWidth="1" />
          <line x1="0" y1="0" x2="0" y2="100" stroke="#111111" strokeOpacity="0.25" strokeWidth="1" />
          
          {/* Ribbon area between closed and open */}
          <polygon points={areaPoints} fill="rgba(0, 216, 165, 0.16)" />
          
          {/* Closed Line (dashed) */}
          <polyline points={closedPoints} fill="none" stroke="#111111" strokeOpacity="0.45" strokeWidth="1.2" strokeDasharray="3 3" />

          {/* Open Line (teal) */}
          <polyline points={assumedPoints} fill="none" stroke="#00a880" strokeWidth="1.6" />

          {/* Labels with thin paper halo for readability */}
          <text
            x="0"
            y="-6"
            fill="#111111"
            stroke="rgba(244,240,234,0.95)"
            strokeWidth="3"
            paintOrder="stroke fill"
            fontFamily="Space Mono, monospace"
            fontSize="9"
            letterSpacing="0.05em"
            fontWeight="bold"
          >
            PROJECTION PREVIEW
          </text>

          <text
            x="196"
            y={Math.max(10, Math.min(95, closedEnd))}
            fill="#111111"
            stroke="rgba(244,240,234,0.95)"
            strokeWidth="3.5"
            paintOrder="stroke fill"
            fontFamily="Space Mono, monospace"
            fontSize="9.5"
            dominantBaseline="middle"
          >
            closed (est.)
          </text>

          <text
            x="196"
            y={Math.max(10, Math.min(95, assumedEnd))}
            fill="#111111"
            stroke="rgba(244,240,234,0.95)"
            strokeWidth="3.5"
            paintOrder="stroke fill"
            fontFamily="Space Mono, monospace"
            fontSize="9.5"
            dominantBaseline="middle"
          >
            open (assumed ACH 2-6)
          </text>

          <text
            x="0"
            y="114"
            fill="#111111"
            stroke="rgba(244,240,234,0.95)"
            strokeWidth="3"
            paintOrder="stroke fill"
            fontFamily="Space Mono, monospace"
            fontSize="9"
          >
            NOW
          </text>

          <text
            x="190"
            y="114"
            textAnchor="end"
            fill="#111111"
            stroke="rgba(244,240,234,0.95)"
            strokeWidth="3"
            paintOrder="stroke fill"
            fontFamily="Space Mono, monospace"
            fontSize="9"
          >
            +60m
          </text>
        </svg>
      </div>
    </Html>
  );
}
