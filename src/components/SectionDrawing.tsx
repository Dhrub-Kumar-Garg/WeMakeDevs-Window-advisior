'use client';

import { useRef, useEffect } from 'react';
import type { AdvisorState } from '@/hooks/useAdvisorState';
import { tokens } from '@/design/tokens';
import Sash from '@/components/Sash';

export default function SectionDrawing({ state }: { state: AdvisorState }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Adaptive stipple field
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;
    let particles: {x: number, y: number, isIndoor: boolean, targetX: number, active: boolean}[] = [];

    // Initialize random deterministic particles for both sides
    for(let i=0; i<400; i++) {
      particles.push({
        x: 640 + Math.random() * (1600 - 640),
        y: Math.random() * 900,
        isIndoor: true,
        targetX: 0,
        active: false,
      });
      particles.push({
        x: Math.random() * 600,
        y: Math.random() * 900,
        isIndoor: false,
        targetX: 0,
        active: false,
      });
    }

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      
      ctx.clearRect(0, 0, w, h);
      
      const indoorDensity = (state.co2Estimated - 420) / (1000 - 420);
      const targetIndoorCount = Math.min(800, Math.max(0, indoorDensity * 400));
      
      const outdoorDensity = state.outdoorAQI / 100;
      const targetOutdoorCount = Math.min(800, Math.max(0, outdoorDensity * 400));

      const isVentilating = state.windowState === 'open' || state.sashAngle > 0;
      const achSpeed = isVentilating ? state.ach * 1.5 : 0;
      
      // Consequence coloring: if outdoor air is worse (density > indoor), then incoming air is signal color.
      // Wait, let's use the explicit model values.
      const isHarmful = state.outdoorAQI >= 100; // Simplified threshold check based on typical logic

      let currentIndoor = 0;
      let currentOutdoor = 0;

      for(let p of particles) {
        if (p.isIndoor && currentIndoor > targetIndoorCount) continue;
        if (!p.isIndoor && currentOutdoor > targetOutdoorCount) continue;

        if (p.isIndoor) currentIndoor++;
        if (!p.isIndoor) currentOutdoor++;

        // Advection logic
        if (isVentilating) {
          // If indoor, drift left towards window (x=640)
          if (p.isIndoor && p.y > 300 && p.y < 600) {
            p.x -= achSpeed * (Math.random() * 0.5 + 0.5);
            // Wrap around
            if (p.x < 0) {
              p.x = 1600;
              p.y = Math.random() * 900;
            }
          }
          // If outdoor, drift right towards window
          if (!p.isIndoor && p.y > 300 && p.y < 600) {
            p.x += achSpeed * (Math.random() * 0.5 + 0.5);
            if (p.x > 1600) {
              p.x = 0;
              p.y = Math.random() * 900;
            }
          }
        }

        // Determine color
        ctx.fillStyle = tokens.colors.ink;
        
        // If an outdoor particle crosses the wall into the room, and it's harmful, color it signal.
        if (!p.isIndoor && p.x > 640) {
           ctx.fillStyle = isHarmful ? tokens.colors.signal : tokens.colors.ink;
        }
        // If an indoor particle crosses out, color it ink (it's escaping).
        
        ctx.fillRect(p.x, p.y, 1.5, 1.5);
      }
      
      animationFrame = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrame);
  }, [state.co2Estimated, state.outdoorAQI, state.ach, state.windowState, state.sashAngle]);

  return (
    <div className="absolute inset-0 w-full h-full">
      {/* SVG Linework & Solid Ink Poche */}
      <svg 
        viewBox="0 0 1600 900" 
        className="absolute inset-0 w-full h-full" 
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Wall geometry: Solid Ink */}
        {/* x=640 is the wall. It is 40px thick. */}
        {/* The window is from y=300 to y=600 */}
        <rect x="640" y="0" width="40" height="300" fill={tokens.colors.ink} />
        <rect x="640" y="600" width="40" height="300" fill={tokens.colors.ink} />
        
        {/* Ground Line */}
        <line x1="0" y1="880" x2="1600" y2="880" stroke={tokens.colors.ink} strokeWidth="2" />
        
        {/* Floor hatched or solid block below ground */}
        <rect x="0" y="880" width="1600" height="20" fill={tokens.colors.inkDim} opacity="0.1" />

        {/* Minimal human glyphs */}
        <g transform="translate(1000, 700)" stroke={tokens.colors.ink} strokeWidth="1.5" fill="none">
          {Array.from({ length: state.occupants }).map((_, i) => (
            <g key={i} transform={`translate(${i * 80}, 0)`}>
              <circle cx="20" cy="20" r="12" />
              <path d="M 20 32 L 20 120 M 20 60 L 0 90 M 20 60 L 40 90 M 20 120 L 0 180 M 20 120 L 40 180" />
            </g>
          ))}
        </g>

        {/* Labels & Annotations */}
        <g fontFamily="Space Mono" fontSize="16" fill={tokens.colors.inkDim}>
          <text x="80" y="80">OUTDOORS</text>
          <text x="80" y="110">AQI: {state.outdoorAQI}</text>
          
          <text x="1400" y="80" textAnchor="end">INDOORS</text>
          <text x="1400" y="110" textAnchor="end">ESTIMATED CO₂: {state.co2Estimated} ppm</text>
          
          {/* Dimension Line across opening (showing ACH) */}
          <line x1="610" y1="450" x2="710" y2="450" stroke={tokens.colors.inkDim} strokeWidth="1" strokeDasharray="4 4" />
          <text x="730" y="455" fontSize="14">ACH: {state.ach.toFixed(1)}</text>
        </g>
      </svg>

      {/* Sash rendering and interaction */}
      <Sash state={state} />
      
      {/* Canvas for Stipple Field superimposed */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none mix-blend-multiply"
        width="1600"
        height="900"
      />
    </div>
  );
}
