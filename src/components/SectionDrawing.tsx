'use client';

import { useRef, useEffect, useState } from 'react';
import type { AdvisorState } from '@/hooks/useAdvisorState';
import { tokens } from '@/design/tokens';
import Sash from '@/components/Sash';
import { Stipple } from '@/components/Stipple';

export default function SectionDrawing({ state, focus }: { state: AdvisorState, focus?: string | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dim, setDim] = useState({ w: 1000, h: 600 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    
    // Initial size
    setDim({ w: el.clientWidth, h: el.clientHeight });
    
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setDim({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { w, h } = dim;
  const isHarmful = state.outdoorAQI >= state.modelParams.aqiThreshold;
  const isVentilating = state.windowState === 'open' || state.sashAngle > 0;
  
  const windowTopY = h * 0.333;
  const windowBottomY = h * 0.666;
  const wallX = w / 2;
  const wallThickness = 40;

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full bg-[#f8f9fc] overflow-hidden">
      
      {/* 1. Outdoor Background Stipple */}
      <div 
        className="absolute top-0 bottom-0 left-0 w-1/2 overflow-hidden pointer-events-none"
        style={{ opacity: focus === 'indoor' ? 0.2 : 1 }}
      >
         <Stipple 
           density={Math.min(1, state.outdoorAQI / state.modelParams.aqiThreshold)} 
           color={tokens.colors.inkDim} 
           seed={1} 
         />
      </div>

      {/* 2. Indoor Background Stipple */}
      <div 
        className="absolute top-0 bottom-0 left-1/2 w-1/2 overflow-hidden pointer-events-none"
        style={{ opacity: focus === 'outdoor' ? 0.2 : 1 }}
      >
         <Stipple 
           density={Math.min(1, state.co2Estimated / state.modelParams.co2Threshold)} 
           color={tokens.colors.ink} 
           seed={2} 
         />
      </div>

      {/* 3. Incoming Air Stipple (Only when ventilating) */}
      <div 
        className="absolute top-0 bottom-0 left-1/2 w-1/2 overflow-hidden pointer-events-none"
        style={{ opacity: isVentilating ? 1 : 0 }}
      >
        <div 
          className="absolute inset-0"
          style={{ 
            clipPath: `polygon(0 ${windowTopY}px, 100% ${windowTopY - h * 0.15}px, 100% ${windowBottomY + h * 0.15}px, 0 ${windowBottomY}px)`
          }}
        >
          <Stipple 
            density={Math.min(1, state.outdoorAQI / state.modelParams.aqiThreshold)} 
            color={isHarmful ? tokens.colors.signal : tokens.colors.oxide} 
            seed={3} 
          />
        </div>
      </div>

      {/* SVG Linework & Solid Ink Poche */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none text-[#111111]">
        {/* Wall geometry: Solid Ink at 50% */}
        <rect x={wallX - wallThickness/2} y={0} width={wallThickness} height={windowTopY} fill="currentColor" />
        <rect x={wallX - wallThickness/2} y={windowBottomY} width={wallThickness} height={h - windowBottomY} fill="currentColor" />
        
        {/* Ground Line */}
        <line x1={0} y1={h * 0.9} x2={w} y2={h * 0.9} stroke="currentColor" strokeWidth="2" />
        
        {/* ACH dimension line (only show when ventilating) */}
        {isVentilating && (
          <g>
            <line x1={wallX - 40} y1={h * 0.5} x2={wallX + 40} y2={h * 0.5} stroke={tokens.colors.inkDim} strokeWidth="1" strokeDasharray="4 4" />
            <text x={wallX + 50} y={h * 0.5 + 4} fontSize="12" fontFamily="var(--font-mono)" fill={tokens.colors.inkDim}>
              Air Changes per Hour (ACH): {state.ach.toFixed(1)}
            </text>
          </g>
        )}
      </svg>

      {/* Labels */}
      {/* Outdoor Label */}
      <div 
        className="absolute top-8 left-8 sm:top-12 sm:left-12 font-mono text-[10px] sm:text-sm text-[#666666]"
        style={{ opacity: focus === 'indoor' ? 0.2 : 1 }}
      >
        OUTDOOR AQI
        <div className="text-xl sm:text-4xl text-[#111111] mt-1 sm:mt-2">{state.outdoorAQI}</div>
        <div className="text-[10px] sm:text-xs mt-1">Limit: {state.modelParams.aqiThreshold}</div>
        <div className="text-[8px] sm:text-[10px] mt-4 uppercase opacity-50 hidden sm:block">Density = AQI / Threshold</div>
      </div>

      {/* Indoor Label */}
      <div 
        className="absolute top-8 right-8 sm:top-12 sm:right-12 font-mono text-[10px] sm:text-sm text-[#666666] text-right"
        style={{ opacity: focus === 'outdoor' ? 0.2 : 1 }}
      >
        ESTIMATED CO₂
        <div className="text-xl sm:text-6xl tracking-tighter text-[#111111] mt-1 sm:mt-2">
          {state.co2Estimated} <span className="text-xs sm:text-2xl tracking-normal text-[#666666]">ppm</span>
        </div>
        <div className="text-[8px] sm:text-[10px] mt-4 uppercase opacity-50 hidden sm:block">Density = CO₂ / Limit</div>
        
        {/* Limit tick indicator */}
        <div className="mt-2 flex flex-col items-end gap-1">
          <div className="w-24 sm:w-32 h-1 bg-[#e2e8f0] relative">
            <div 
              className="absolute top-0 left-0 h-full bg-[#111111]" 
              style={{ width: `${Math.min(100, (state.co2Estimated / state.modelParams.co2Threshold) * 100)}%` }} 
            />
            <div className="absolute top-[-4px] left-full w-0.5 h-3 bg-[#ff5f1f]" />
          </div>
          <div className="text-[10px] sm:text-xs mt-1">Limit: {state.modelParams.co2Threshold} ppm</div>
        </div>
      </div>

      {/* PIR Marker */}
      <div className="absolute bottom-6 right-8 sm:right-12 font-mono text-[8px] sm:text-[10px] bg-white/80 backdrop-blur px-3 py-2 border border-[#e2e8f0] text-[#111111] uppercase z-10">
        PIR: {state.occupants > 0 ? 'Presence Detected' : 'Not Detected'} &middot; Assumed Occupants {state.occupants}
      </div>

      {/* Sash rendering and interaction */}
      <Sash state={state} />
      
    </div>
  );
}
