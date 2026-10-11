'use client';

import { useEnvironmentStore } from '@/store/useEnvironmentStore';

export default function EvidenceTraces() {
  const liveTrendHistory = useEnvironmentStore((s) => s.liveTrendHistory);
  const sensorData = useEnvironmentStore((s) => s.sensorData);

  // SVG metrics
  const width = 1280;
  const height = 690;
  const padLeft = 60;
  const padTopLive = 70;
  const padTopExp = 425;
  const plotHeight = 190;

  const maxPPM = 1300;
  const minPPM = 400;
  const maxRel = 100;
  const minRel = 0;

  const ink = '#2c2825';
  const inkDim = '#8c8273';

  // Live session readings
  const hasLivePoints = liveTrendHistory.length >= 2;
  const livePhysics = hasLivePoints
    ? liveTrendHistory.map((p) => p.co2Est)
    : [sensorData.co2Estimated, sensorData.co2Estimated];
  const liveMQ135 = hasLivePoints
    ? liveTrendHistory.map((p) => p.mq135Idx ?? (sensorData.mq135Idx ?? 35))
    : [sensorData.mq135Idx ?? 35, sensorData.mq135Idx ?? 35];

  // Mock data for Experiment 1 (Sealed room, CO2 rising)
  const exp1Pts = 50;
  const exp1Physics = Array.from({ length: exp1Pts }).map((_, i) => 420 + Math.pow(i / exp1Pts, 2) * 800);
  const exp1MQ135 = Array.from({ length: exp1Pts }).map((_, i) => 30 + Math.pow(i / exp1Pts, 2.2) * 55 + (Math.sin(i * 12.4) * 5 - 2.5));

  // Mock data for Experiment 2 (Window open, CO2 falling)
  const exp2Pts = 50;
  const exp2Physics = Array.from({ length: exp2Pts }).map((_, i) => 1200 - Math.pow(i / exp2Pts, 0.5) * 780);
  const exp2MQ135 = Array.from({ length: exp2Pts }).map((_, i) => 85 - Math.pow(i / exp2Pts, 0.6) * 50 + (Math.sin(i * 9.8) * 5 - 2.5));

  const renderTrace = (
    physicsData: number[],
    mq135Data: number[],
    title: string,
    caption: string,
    description: string,
    chartWidth: number,
    originX: number,
    originY: number
  ) => {
    const pLeft = originX + padLeft;
    const pTop = originY;
    const rightAxisX = pLeft + chartWidth;
    const yBaseline = pTop + plotHeight;

    const count = physicsData.length;
    const getX = (i: number) => (pLeft + (count > 1 ? (i / (count - 1)) * chartWidth : 0)).toFixed(1);

    const getYPhysics = (ppm: number) =>
      (pTop + plotHeight - ((ppm - minPPM) / (maxPPM - minPPM)) * plotHeight).toFixed(1);
    const getYMQ135 = (val: number) =>
      (pTop + plotHeight - ((val - minRel) / (maxRel - minRel)) * plotHeight).toFixed(1);

    const pathPhysics = physicsData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getYPhysics(d)}`).join(' ');
    const pathMQ135 = mq135Data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getYMQ135(d)}`).join(' ');

    return (
      <g>
        {/* Title in serif italic */}
        <text x={pLeft} y={pTop - 45} fontFamily="serif" fontStyle="italic" fontSize="22" fill={ink}>
          {title}
        </text>

        {/* Mono caption */}
        <text x={pLeft} y={pTop - 28} fontFamily="monospace" fontSize="10.5" fill={inkDim}>
          {caption}
        </text>
        <text x={pLeft} y={pTop - 14} fontFamily="monospace" fontSize="9.5" fill={inkDim} opacity={0.85}>
          {description}
        </text>

        {/* Axes */}
        <line x1={pLeft} y1={yBaseline} x2={rightAxisX} y2={yBaseline} stroke={ink} strokeWidth="1" />
        <line x1={pLeft} y1={pTop} x2={pLeft} y2={yBaseline} stroke={ink} strokeWidth="1" />
        <line x1={rightAxisX} y1={pTop} x2={rightAxisX} y2={yBaseline} stroke={inkDim} strokeWidth="1" strokeDasharray="2 2" />

        {/* Y Axis Labels (Left: PPM, Right: Relative) */}
        <text x={pLeft - 10} y={pTop + 4} textAnchor="end" fontFamily="monospace" fontSize="10" fill={ink}>{maxPPM}</text>
        <text x={pLeft - 10} y={yBaseline + 4} textAnchor="end" fontFamily="monospace" fontSize="10" fill={ink}>{minPPM}</text>

        <text x={rightAxisX + 10} y={pTop + 4} textAnchor="start" fontFamily="monospace" fontSize="10" fill={inkDim}>{maxRel}</text>
        <text x={rightAxisX + 10} y={yBaseline + 4} textAnchor="start" fontFamily="monospace" fontSize="10" fill={inkDim}>{minRel}</text>

        {/* Right axis title: titled "relative trend, not ppm" */}
        <text x={rightAxisX + 10} y={pTop - 12} textAnchor="start" fontFamily="monospace" fontSize="9" fill={inkDim} className="uppercase tracking-wider">
          relative trend, not ppm
        </text>

        {/* Traces */}
        <path d={pathPhysics} fill="none" stroke={ink} strokeWidth="2" />
        <path d={pathMQ135} fill="none" stroke={inkDim} strokeWidth="1.5" strokeDasharray="4 4" />
      </g>
    );
  };

  return (
    <div className="w-full bg-[#f4f0ea] text-[#2c2825] border-t border-[#111111]/15 p-6 lg:p-12 flex flex-col items-center">
      <div className="w-full max-w-7xl">
        <h2 className="font-serif italic text-3xl md:text-4xl mb-4 text-[#2c2825]">Scientific Evidence</h2>
        <div className="flex flex-col md:flex-row justify-between md:items-end mb-10 gap-4">
          <p className="font-mono text-xs uppercase tracking-widest text-[#8c8273] max-w-2xl leading-relaxed">
            We use a physics model for CO₂ because cheap sensors drift. The MQ135 sensor is only used to cross-check that the trend direction agrees, ensuring the model isn't drastically wrong.
          </p>
        </div>

        <div className="w-full overflow-x-auto outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-2" tabIndex={0} role="region" aria-label="Evidence traces scroll area">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[1040px] h-auto" role="img" aria-label="Physics Model vs MQ135 Relative Trend Chart">
            
            {/* Top Chart: Live Trend Strip (Rolling 60) */}
            {renderTrace(
              livePhysics,
              liveMQ135,
              "Live Session Trend",
              "since page load",
              hasLivePoints 
                ? `Rolling history (${liveTrendHistory.length} readings, max 60). Solid = est. CO₂, dashed = MQ135 index.`
                : `Awaiting live readings from device... Baseline seeded from current estimate (${sensorData.co2Estimated} ppm).`,
              1120,
              0,
              padTopLive
            )}

            {/* Bottom Row: Experiment 01 */}
            {renderTrace(
              exp1Physics,
              exp1MQ135,
              "Experiment 01",
              "illustrative model run, not recorded data",
              "Sealed room + occupants. Estimate rises.",
              460,
              0,
              padTopExp
            )}

            {/* Bottom Row: Experiment 02 */}
            {renderTrace(
              exp2Physics,
              exp2MQ135,
              "Experiment 02",
              "illustrative model run, not recorded data",
              "Window open. Estimate falls toward 420.",
              460,
              660,
              padTopExp
            )}

            {/* Legend positioned strictly below */}
            <g transform={`translate(${width / 2 - 140}, ${height - 15})`} fontFamily="monospace" fontSize="10">
              <line x1="0" y1="-4" x2="20" y2="-4" stroke="#2c2825" strokeWidth="2" />
              <text x="28" y="0" fill="#2c2825">Physics / est. CO₂ (ppm)</text>

              <line x1="160" y1="-4" x2="180" y2="-4" stroke="#8c8273" strokeWidth="1.5" strokeDasharray="4 4" />
              <text x="188" y="0" fill="#8c8273">MQ135 (relative trend, not ppm)</text>
            </g>

          </svg>
        </div>
      </div>
    </div>
  );
}
