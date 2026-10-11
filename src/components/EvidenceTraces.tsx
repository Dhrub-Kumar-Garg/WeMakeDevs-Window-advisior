'use client';

import { useState, useEffect } from 'react';
import { tokens } from '@/design/tokens';

export default function EvidenceTraces() {
  // SVG metrics
  const width = 1280;
  const height = 340;
  const chartWidth = 400; // Plot width
  const padLeft = 60;     // For PPM labels
  const padTop = 75;      // For title and captions
  const padBottom = 60;   // Above legend
  const plotHeight = height - padTop - padBottom; // ~205

  const maxPPM = 1300;
  const minPPM = 400;
  const maxRel = 100;
  const minRel = 0;

  // Mock data for Experiment 1 (Sealed room, CO2 rising)
  const exp1Pts = 50;
  const exp1Physics = Array.from({length: exp1Pts}).map((_, i) => 420 + Math.pow(i/exp1Pts, 2) * 800);
  const exp1MQ135 = Array.from({length: exp1Pts}).map((_, i) => 30 + Math.pow(i/exp1Pts, 2.2) * 55 + (Math.sin(i*12.4)*5 - 2.5));

  // Mock data for Experiment 2 (Window open, CO2 falling)
  const exp2Pts = 50;
  const exp2Physics = Array.from({length: exp2Pts}).map((_, i) => 1200 - Math.pow(i/exp2Pts, 0.5) * 780);
  const exp2MQ135 = Array.from({length: exp2Pts}).map((_, i) => 85 - Math.pow(i/exp2Pts, 0.6) * 50 + (Math.sin(i*9.8)*5 - 2.5));

  const renderTrace = (physicsData: number[], mq135Data: number[], title: string, description: string) => {
    const getX = (i: number) => (padLeft + (i / (physicsData.length - 1)) * chartWidth).toFixed(1);
    
    const getYPhysics = (ppm: number) => (padTop + plotHeight - ((ppm - minPPM) / (maxPPM - minPPM)) * plotHeight).toFixed(1);
    const getYMQ135 = (val: number) => (padTop + plotHeight - ((val - minRel) / (maxRel - minRel)) * plotHeight).toFixed(1);

    const pathPhysics = physicsData.map((d, i) => `${i===0?'M':'L'} ${getX(i)} ${getYPhysics(d)}`).join(' ');
    const pathMQ135 = mq135Data.map((d, i) => `${i===0?'M':'L'} ${getX(i)} ${getYMQ135(d)}`).join(' ');

    const ink = '#2c2825';
    const inkDim = '#8c8273';

    const rightAxisX = padLeft + chartWidth;
    const yBaseline = padTop + plotHeight;

    return (
      <g>
        {/* Short title in serif italic */}
        <text x={padLeft} y={26} fontFamily="serif" fontStyle="italic" fontSize="22" fill={ink}>
          {title}
        </text>

        {/* Mono caption: illustrative model run, not recorded data */}
        <text x={padLeft} y={44} fontFamily="monospace" fontSize="10.5" fill={inkDim}>
          illustrative model run, not recorded data
        </text>
        <text x={padLeft} y={58} fontFamily="monospace" fontSize="9.5" fill={inkDim} opacity={0.85}>
          {description}
        </text>

        {/* Axes */}
        <line x1={padLeft} y1={yBaseline} x2={rightAxisX} y2={yBaseline} stroke={ink} strokeWidth="1" />
        <line x1={padLeft} y1={padTop} x2={padLeft} y2={yBaseline} stroke={ink} strokeWidth="1" />
        <line x1={rightAxisX} y1={padTop} x2={rightAxisX} y2={yBaseline} stroke={inkDim} strokeWidth="1" strokeDasharray="2 2" />
        
        {/* Y Axis Labels (Left: PPM, Right: Relative) */}
        <text x={padLeft - 10} y={padTop + 4} textAnchor="end" fontFamily="monospace" fontSize="10" fill={ink}>{maxPPM}</text>
        <text x={padLeft - 10} y={yBaseline + 4} textAnchor="end" fontFamily="monospace" fontSize="10" fill={ink}>{minPPM}</text>
        
        <text x={rightAxisX + 10} y={padTop + 4} textAnchor="start" fontFamily="monospace" fontSize="10" fill={inkDim}>{maxRel}</text>
        <text x={rightAxisX + 10} y={yBaseline + 4} textAnchor="start" fontFamily="monospace" fontSize="10" fill={inkDim}>{minRel}</text>

        {/* Right axis title: generous margin to prevent clipping or collision */}
        <text x={rightAxisX + 10} y={padTop - 12} textAnchor="start" fontFamily="monospace" fontSize="9" fill={inkDim} className="uppercase tracking-wider">
          RELATIVE TREND, NOT PPM
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
            
            {/* Chart 1 */}
            <g transform="translate(0, 0)">
              {renderTrace(exp1Physics, exp1MQ135, "Experiment 01", "Sealed room + occupants. Estimate rises.")}
            </g>

            {/* Chart 2 with generous gap */}
            <g transform="translate(640, 0)">
              {renderTrace(exp2Physics, exp2MQ135, "Experiment 02", "Window open. Estimate falls toward 420.")}
            </g>

            {/* Legend positioned strictly below both charts */}
            <g transform={`translate(${width / 2 - 130}, ${height - 15})`} fontFamily="monospace" fontSize="10">
              <line x1="0" y1="-4" x2="20" y2="-4" stroke="#2c2825" strokeWidth="2" />
              <text x="28" y="0" fill="#2c2825">Physics (ppm)</text>

              <line x1="140" y1="-4" x2="160" y2="-4" stroke="#8c8273" strokeWidth="1.5" strokeDasharray="4 4" />
              <text x="168" y="0" fill="#8c8273">MQ135 (rel)</text>
            </g>

          </svg>
        </div>
      </div>
    </div>
  );
}
