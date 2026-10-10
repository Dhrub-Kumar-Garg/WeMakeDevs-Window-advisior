'use client';

import { useState, useEffect } from 'react';
import { tokens } from '@/design/tokens';

export default function EvidenceTraces() {
  // SVG metrics
  const width = 1200;
  const height = 300;
  const paddingX = 60;
  const paddingY = 40;

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

    return (
      <g>
        <text x={paddingX} y={paddingY - 15} fontFamily={tokens.fonts.sans} fontSize="16" fontWeight="bold" fill={tokens.colors.ink}>{title}</text>
        <text x={paddingX} y={paddingY + 5} fontFamily={tokens.fonts.mono} fontSize="11" fill={tokens.colors.inkDim}>{caption}</text>

        {/* Axes */}
        <line x1={paddingX} y1={height - paddingY} x2={(width/2) - paddingX} y2={height - paddingY} stroke={tokens.colors.ink} strokeWidth="1" />
        <line x1={paddingX} y1={paddingY} x2={paddingX} y2={height - paddingY} stroke={tokens.colors.ink} strokeWidth="1" />
        <line x1={(width/2) - paddingX} y1={paddingY} x2={(width/2) - paddingX} y2={height - paddingY} stroke={tokens.colors.ink} strokeWidth="1" />
        
        {/* Y Axis Labels (Left: PPM, Right: Relative) */}
        <text x={paddingX - 10} y={paddingY} textAnchor="end" fontFamily={tokens.fonts.mono} fontSize="10" fill={tokens.colors.ink}>{maxPPM}</text>
        <text x={paddingX - 10} y={height - paddingY} textAnchor="end" fontFamily={tokens.fonts.mono} fontSize="10" fill={tokens.colors.ink}>{minPPM}</text>
        
        <text x={(width/2) - paddingX + 10} y={paddingY} textAnchor="start" fontFamily={tokens.fonts.mono} fontSize="10" fill={tokens.colors.inkDim}>{maxRel}</text>
        <text x={(width/2) - paddingX + 10} y={height - paddingY} textAnchor="start" fontFamily={tokens.fonts.mono} fontSize="10" fill={tokens.colors.inkDim}>{minRel}</text>

        {/* Traces */}
        <path d={pathPhysics} fill="none" stroke={tokens.colors.ink} strokeWidth="2" />
        <path d={pathMQ135} fill="none" stroke={tokens.colors.inkDim} strokeWidth="1" strokeDasharray="2 2" />
      </g>
    );
  };

  return (
    <section className="w-full border-b border-[#e2e8f0] p-6 lg:p-12 flex flex-col items-center">
      <div className="w-full max-w-7xl">
        <h2 className="font-serif italic text-3xl md:text-4xl text-[#111111] mb-2">Scientific Evidence</h2>
        <div className="flex flex-col md:flex-row justify-between md:items-end mb-12 gap-4">
          <p className="font-mono text-xs uppercase tracking-widest text-[#666666]">Indoor VOC/Gas Trend (MQ135) relative trend, not ppm</p>
          <p className="font-mono text-[10px] text-[#666666]">
            It only cross-checks that the trends agree in direction.
          </p>
        </div>
        
        <div className="w-full overflow-x-auto outline-none focus-visible:ring-2 focus-visible:ring-[#ff5f1f] focus-visible:ring-offset-2" tabIndex={0} role="region" aria-label="Evidence traces scroll area">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[1000px] h-auto" role="img" aria-label="Physics Model vs MQ135 Relative Trend Chart">
            
            {/* Legend */}
            <g transform={`translate(${width - 250}, 15)`} fontFamily={tokens.fonts.mono} fontSize="11">
              <line x1="0" y1="-4" x2="20" y2="-4" stroke={tokens.colors.ink} strokeWidth="2" />
              <text x="30" y="0" fill={tokens.colors.ink}>Physics (ppm)</text>

              <line x1="120" y1="-4" x2="140" y2="-4" stroke={tokens.colors.inkDim} strokeWidth="1" strokeDasharray="2 2" />
              <text x="150" y="0" fill={tokens.colors.inkDim}>MQ135 (rel)</text>
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
    </section>
  );
}
