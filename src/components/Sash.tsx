'use client';

import { useRef, useEffect, useState } from 'react';
import type { AdvisorState } from '@/hooks/useAdvisorState';
import { predictCO2Trajectory } from '@/lib/co2Model';
import { tokens } from '@/design/tokens';
import { DEFAULT_MODEL_PARAMS } from '@/lib/mockData';

export default function Sash({ state }: { state: AdvisorState }) {
  const [isDragging, setIsDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const modelParams = DEFAULT_MODEL_PARAMS;

  const dragStartX = useRef<number | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    e.target.setPointerCapture(e.pointerId);
    dragStartX.current = e.clientX;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !svgRef.current) return;
    
    const svgRect = svgRef.current.getBoundingClientRect();
    const relativeX = Math.max(0, e.clientX - svgRect.left - 640);
    const maxDragDistance = 200;
    
    const dragRatio = Math.min(1, relativeX / maxDragDistance);
    const angle = dragRatio * 60;
    
    state.setSashAngle(angle);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.target.releasePointerCapture(e.pointerId);
    
    // Check if it was a click (didn't move much)
    if (dragStartX.current !== null) {
      const delta = Math.abs(e.clientX - dragStartX.current);
      if (delta < 10) {
        state.setWindowState(state.windowState === 'open' ? 'closed' : 'open');
        dragStartX.current = null;
        return;
      }
    }
    dragStartX.current = null;
    
    // Snap back to real window state
    state.setSashAngle(state.windowState === 'open' ? 60 : 0);
  };

  // When not dragging, ensure it matches actual state
  useEffect(() => {
    if (!isDragging) {
      state.setSashAngle(state.windowState === 'open' ? 60 : 0);
    }
  }, [state.windowState, isDragging]);

  // Compute ghost trace
  let ghostPath = '';
  let isHarmful = false;

  if (isDragging && state.sashAngle > 0) {
    const projectedACH = modelParams.achClosed + (state.sashAngle / 60) * (modelParams.achOpen - modelParams.achClosed);
    
    // temporarily modify model params for prediction
    const tempParams = { ...modelParams, achOpen: projectedACH };
    
    const trajectory = predictCO2Trajectory(
      state.co2Estimated,
      tempParams,
      true, // open
      60, // 60 mins
      60
    );
    
    // Map trajectory to SVG coordinates (x: 1000 to 1500, y: 300 to 700)
    // Very naive mapping just for the visual ghost trace
    const xStart = 1000;
    const xEnd = 1500;
    const yMax = 700; // 400 ppm
    const yMin = 300; // 1200 ppm
    
    ghostPath = trajectory.map((pt, i) => {
      const x = xStart + (i / 60) * (xEnd - xStart);
      const yRatio = Math.min(1, Math.max(0, (pt.co2 - 400) / 800)); // 400 to 1200
      const y = yMax - yRatio * (yMax - yMin);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    const finalCO2 = trajectory[trajectory.length - 1].co2;
    if (finalCO2 > state.co2Estimated && state.outdoorAQI >= modelParams.aqiThreshold) {
      isHarmful = true; // Bringing in bad air makes it worse or keeps it bad
    } else if (state.outdoorAQI >= modelParams.aqiThreshold) {
      isHarmful = true; // Outdoor air is just bad
    }
  }

  // Sash geometry:
  // Hinge at x=640, y=300 (top of window opening)
  // Length = 300 (height of window opening)
  const sashLength = 300;
  // Convert angle to radians
  const angleRad = (state.sashAngle * Math.PI) / 180;
  
  // Calculate bottom coordinate of the sash
  const sashX = 640 + Math.sin(angleRad) * sashLength;
  const sashY = 300 + Math.cos(angleRad) * sashLength;

  return (
    <>
      <svg 
        ref={svgRef}
        className="absolute inset-0 w-full h-full pointer-events-none" 
        viewBox="0 0 1600 900" 
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Ghost Trace */}
        {isDragging && ghostPath && (
          <g>
            <path 
              d={ghostPath} 
              fill="none" 
              stroke={isHarmful ? tokens.colors.signal : tokens.colors.inkDim} 
              strokeWidth="2" 
              strokeDasharray="4 4" 
            />
            <text 
              x="1510" 
              y="500" 
              fontFamily={tokens.fonts.mono} 
              fontSize="12" 
              fill={isHarmful ? tokens.colors.signal : tokens.colors.inkDim}
            >
              +60m PROJECTED
            </text>
          </g>
        )}

        {/* The Sash Line */}
        <line 
          x1="640" 
          y1="300" 
          x2={sashX} 
          y2={sashY} 
          stroke={tokens.colors.ink} 
          strokeWidth="6"
        />
        
        {/* The Drag Handle (invisible but clickable area) */}
        <circle 
          cx={sashX} 
          cy={sashY} 
          r="40" 
          fill="transparent" 
          className="cursor-pointer pointer-events-auto"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
        
        {/* Visible Handle Indicator */}
        <circle 
          cx={sashX} 
          cy={sashY} 
          r="8" 
          fill={tokens.colors.paper} 
          stroke={tokens.colors.ink} 
          strokeWidth="2" 
          className="pointer-events-none"
        />
      </svg>
    </>
  );
}
