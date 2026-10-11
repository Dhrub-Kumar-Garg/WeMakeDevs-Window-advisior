'use client';

import { useState, useEffect } from 'react';
import { tokens } from '@/design/tokens';

export default function EvidenceTraces() {
  // SVG metrics
  const width = 1200;
  const height = 300;
  const paddingX = 70;
  const paddingY = 60;

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

  const renderTrace = (physicsData: number[], mq135Data: number[], title: string, caption: string) => {
    const getX = (i: number) => (paddingX + (i / (physicsData.length - 1)) * ((width / 2) - paddingX * 2)).toFixed(1);
    
    const getYPhysics = (ppm: number) => (height - paddingY - ((ppm - minPPM) / (maxPPM - minPPM)) * (height - paddingY * 2)).toFixed(1);
    const getYMQ135 = (val: number) => (height - paddingY - ((val - minRel) / (maxRel - minRel)) * (height - paddingY * 2)).toFixed(1);

    const pathPhysics = physicsData.map((d, i) => `${i===0?'M':'L'} ${getX(i)} ${getYPhysics(d)}`).join(' ');
    const pathMQ135 = mq135Data.map((d, i) => `${i===0?'M':'L'} ${getX(i)} ${getYMQ135(d)}`).join(' ');

    const ink = '#2c2825';
    const inkDim = '#8c8273';
    const accent = '#ff5f1f'; // keeping signal orange for emphasis

    return (
      <g>
        <text x={paddingX} y={paddingY - 35} fontFamily="serif" fontStyle="italic" fontSize="18" fill={ink}>{title}</text>
        <text x={paddingX} y={paddingY - 15} fontFamily="monospace" fontSize="10" fill={inkDim}>{caption}</text>

        {/* Axes */}
        <line x1={paddingX} y1={height - paddingY} x2={(width/2) - paddingX} y2={height - paddingY} stroke={ink} strokeWidth="1" />
        <line x1={paddingX} y1={paddingY} x2={paddingX} y2={height - paddingY} stroke={ink} strokeWidth="1" />
        <line x1={(width/2) - paddingX} y1={paddingY} x2={(width/2) - paddingX} y2={height - paddingY} stroke={inkDim} strokeWidth="1" strokeDasharray="2 2" />
        
        {/* Y Axis Labels (Left: PPM, Right: Relative) */}
        <text x={paddingX - 10} y={paddingY + 4} textAnchor="end" fontFamily="monospace" fontSize="10" fill={ink}>{maxPPM}</text>
        <text x={paddingX - 10} y={height - paddingY + 4} textAnchor="end" fontFamily="monospace" fontSize="10" fill={ink}>{minPPM}</text>
        
        <text x={(width/2) - paddingX + 10} y={paddingY + 4} textAnchor="start" fontFamily="monospace" fontSize="10" fill={inkDim}>{maxRel}</text>
        <text x={(width/2) - paddingX + 10} y={height - paddingY + 4} textAnchor="start" fontFamily="monospace" fontSize="10" fill={inkDim}>{minRel}</text>

        {/* Right axis title */}
        <text x={(width/2) - paddingX + 10} y={paddingY - 15} textAnchor="start" fontFamily="monospace" fontSize="9" fill={inkDim} className="uppercase tracking-widest">
          relative trend, not ppm
        </text>

        {/* Traces */}
        <path d={pathPhysics} fill="none" stroke={ink} strokeWidth="2" />
        <path d={pathMQ135} fill="none" stroke={inkDim} strokeWidth="1.5" strokeDasharray="4 4" />
      </g>
    );
  };

  return (
    <div className="w-full bg-[#f4efe6] text-[#2c2825] border-t border-[#e6decb] p-6 lg:p-12 flex flex-col items-center">
      <div className="w-full max-w-7xl">
        <h2 className="font-serif italic text-3xl md:text-4xl mb-4 text-[#2c2825]">Scientific Evidence</h2>
        <div className="flex flex-col md:flex-row justify-between md:items-end mb-12 gap-4">
          <p className="font-mono text-xs uppercase tracking-widest text-[#8c8273] max-w-2xl">
            We use a physics model for CO₂ because cheap sensors drift. The MQ135 sensor is only used to cross-check that the trend direction agrees, ensuring the model isn't drastically wrong.
          </p>
        </div>
        
        <div className="w-full overflow-x-auto outline-none focus-visible:ring-2 focus-visible:ring-[#ff5f1f] focus-visible:ring-offset-2" tabIndex={0} role="region" aria-label="Evidence traces scroll area">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[1000px] h-auto" role="img" aria-label="Physics Model vs MQ135 Relative Trend Chart">
            
            {/* Legend */}
            <g transform={`translate(${width - 250}, 25)`} fontFamily="monospace" fontSize="10">
              <line x1="0" y1="-4" x2="20" y2="-4" stroke="#2c2825" strokeWidth="2" />
              <text x="30" y="0" fill="#2c2825">Physics (ppm)</text>

              <line x1="120" y1="-4" x2="140" y2="-4" stroke="#8c8273" strokeWidth="1.5" strokeDasharray="4 4" />
              <text x="150" y="0" fill="#8c8273">MQ135 (rel)</text>
            </g>

            <g transform="translate(0, 0)">
              {renderTrace(exp1Physics, exp1MQ135, "Experiment 01 (illustrative model run, not recorded data)", "Sealed room + occupants. Estimate rises.")}
            </g>
            <g transform={`translate(${width / 2}, 0)`}>
              {renderTrace(exp2Physics, exp2MQ135, "Experiment 02 (illustrative model run, not recorded data)", "Window open. Estimate falls toward 420.")}
            </g>

          </svg>
        </div>
      </div>
    </div>
  );
}
