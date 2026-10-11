import type { AdvisorState } from '@/hooks/useAdvisorState';
import { updateCO2 } from '@/lib/co2Model';

export default function ProjectionRibbon({ state, className = '' }: { state: AdvisorState; className?: string }) {
  if (state.previewOpen === null) return null;

  const { modelParams, co2Estimated, occupants } = state;
  const achOpenLow = modelParams.achOpenRange?.[0] ?? 2;
  const achOpenHigh = modelParams.achOpenRange?.[1] ?? 6;
  const avgACHOpen = (achOpenLow + achOpenHigh) / 2;
  const activeOccupants = occupants;

  // Predict next 60 minutes
  const steps = 60;
  const currentCO2 = co2Estimated;

  // 1) Closed projection
  const closedLine: number[] = [currentCO2];
  let cClosed = currentCO2;
  for (let i = 0; i < steps; i++) {
    cClosed = updateCO2(cClosed, activeOccupants, modelParams.roomVolume, modelParams.achClosed, 60);
    closedLine.push(cClosed);
  }

  // 2) Open projection
  const openLine: number[] = [currentCO2];
  let cOpen = currentCO2;
  for (let i = 0; i < steps; i++) {
    cOpen = updateCO2(cOpen, activeOccupants, modelParams.roomVolume, avgACHOpen, 60);
    openLine.push(cOpen);
  }

  const maxCO2 = Math.max(...closedLine, 1100);
  const minCO2 = 400; // Outdoor baseline

  const graphWidth = 175;
  const graphHeight = 85;
  const toY = (val: number) => graphHeight - ((val - minCO2) / (maxCO2 - minCO2)) * graphHeight;

  const closedPoints = closedLine.map((val, i) => `${(i / steps) * graphWidth},${toY(val)}`).join(' ');
  const openPoints = openLine.map((val, i) => `${(i / steps) * graphWidth},${toY(val)}`).join(' ');

  // Ribbon polygon between open and closed lines
  const areaPoints = `${openPoints} ${closedLine.map((val, i) => `${((steps - i) / steps) * graphWidth},${toY(closedLine[steps - i])}`).join(' ')}`;

  const closedEnd = toY(closedLine[steps]);
  const openEnd = toY(openLine[steps]);

  return (
    <div className={`relative select-none pointer-events-none text-[#111111] ${className}`}>
      <div className="font-mono text-[9px] uppercase tracking-wider font-bold mb-1 opacity-70">
        Projection Preview
      </div>

      <svg viewBox="0 0 320 115" className="w-full h-auto overflow-visible">
        {/* Hairline axes */}
        <line x1="0" y1={graphHeight} x2={graphWidth} y2={graphHeight} stroke="#111111" strokeOpacity="0.25" strokeWidth="1" />
        <line x1="0" y1="0" x2="0" y2={graphHeight} stroke="#111111" strokeOpacity="0.25" strokeWidth="1" />

        {/* Ribbon Area between curves */}
        <polygon points={areaPoints} fill="rgba(0, 216, 165, 0.16)" />

        {/* Closed curve (dashed) */}
        <polyline points={closedPoints} fill="none" stroke="#111111" strokeOpacity="0.45" strokeWidth="1.2" strokeDasharray="3 3" />

        {/* Open curve (solid teal) */}
        <polyline points={openPoints} fill="none" stroke="#00a880" strokeWidth="1.6" />

        {/* Labels with thin paper halo for readability */}
        <text
          x={graphWidth + 6}
          y={Math.max(10, Math.min(graphHeight - 4, closedEnd))}
          fill="#111111"
          stroke="rgba(244,240,234,0.95)"
          strokeWidth="3.5"
          paintOrder="stroke fill"
          fontFamily="Space Mono, monospace"
          fontSize="9"
          dominantBaseline="middle"
        >
          closed (est.)
        </text>

        <text
          x={graphWidth + 6}
          y={Math.max(10, Math.min(graphHeight - 4, openEnd))}
          fill="#111111"
          stroke="rgba(244,240,234,0.95)"
          strokeWidth="3.5"
          paintOrder="stroke fill"
          fontFamily="Space Mono, monospace"
          fontSize="9"
          dominantBaseline="middle"
        >
          open (assumed ACH 2-6)
        </text>

        <text
          x="0"
          y={graphHeight + 14}
          fill="#111111"
          stroke="rgba(244,240,234,0.95)"
          strokeWidth="3"
          paintOrder="stroke fill"
          fontFamily="Space Mono, monospace"
          fontSize="8.5"
        >
          NOW
        </text>

        <text
          x={graphWidth}
          y={graphHeight + 14}
          textAnchor="end"
          fill="#111111"
          stroke="rgba(244,240,234,0.95)"
          strokeWidth="3"
          paintOrder="stroke fill"
          fontFamily="Space Mono, monospace"
          fontSize="8.5"
        >
          +60m
        </text>
      </svg>

      {/* One-line caption */}
      <div className="font-mono text-[9px] text-[#111111]/60 mt-1">
        estimated / assumed
      </div>
    </div>
  );
}
