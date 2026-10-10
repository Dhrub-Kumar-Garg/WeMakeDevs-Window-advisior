'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { AdvisorState } from '@/hooks/useAdvisorState';
import { predictCO2Trajectory } from '@/lib/co2Model';
import { tokens } from '@/design/tokens';
import { DEFAULT_MODEL_PARAMS } from '@/lib/mockData';

export default function Sash({ state }: { state: AdvisorState }) {
  const [isDragging, setIsDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragStartX = useRef<number | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const [dim, setDim] = useState({ w: 1000, h: 600 });
  const modelParams = DEFAULT_MODEL_PARAMS;

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    setDim({ w: el.clientWidth, h: el.clientHeight });
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setDim({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStartX.current = e.clientX;
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging || !svgRef.current) return;
      const pt = svgRef.current.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const ctm = svgRef.current.getScreenCTM();
      if (!ctm) return;
      const svgPt = pt.matrixTransform(ctm.inverse());

      const hingeX = dim.w / 2;
      const relativeX = Math.max(0, svgPt.x - hingeX);
      const dragRatio = Math.min(1, relativeX / 150);
      const angle = dragRatio * 60;
      state.setSashAngle(angle);
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!isDragging) return;
      setIsDragging(false);
      
      if (dragStartX.current !== null) {
        const delta = Math.abs(e.clientX - dragStartX.current);
        if (delta < 10) {
          state.setWindowState(state.windowState === 'open' ? 'closed' : 'open');
          dragStartX.current = null;
          return;
        }
      }
      dragStartX.current = null;
      // Snap open or closed based on angle
      if (state.sashAngle > 30) {
        state.setWindowState('open');
        state.setSashAngle(60);
      } else {
        state.setWindowState('closed');
        state.setSashAngle(0);
      }
    };

    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isDragging, state, dim.w]);

  // Sync angle with state when not dragging
  useEffect(() => {
    if (!isDragging) {
      state.setSashAngle(state.windowState === 'open' ? 60 : 0);
    }
  }, [state.windowState, isDragging]); // eslint-disable-line react-hooks/exhaustive-deps

  // Projection Chart
  const isHarmful = state.outdoorAQI >= modelParams.aqiThreshold;
  const showProjection = isDragging || state.windowState === 'open';

  // Projection dimensions
  const xStart = dim.w * 0.55;
  const xEnd = dim.w * 0.95;
  const yMax = dim.h * 0.8;
  const yMin = dim.h * 0.2;
  const graphH = yMax - yMin;

  const mapPt = (co2: number, i: number) => {
    const x = xStart + (i / 60) * (xEnd - xStart);
    // Range: 400 to Limit + 600
    const topCO2 = modelParams.co2Threshold + 600;
    const yRatio = Math.min(1, Math.max(0, (co2 - 400) / (topCO2 - 400)));
    const y = yMax - yRatio * graphH;
    return { x, y };
  };

  let pathClosed = '';
  let bandPath = '';
  let crossingLabel = null;

  if (showProjection) {
    const trajClosed = predictCO2Trajectory(state.co2Estimated, modelParams, false, 60, 60);
    pathClosed = trajClosed.map((pt, i) => {
      const p = mapPt(pt.co2, i);
      return `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
    }).join(' ');

    const achLow = modelParams.achOpenRange ? modelParams.achOpenRange[0] : 2;
    const achHigh = modelParams.achOpenRange ? modelParams.achOpenRange[1] : 6;
    
    // Scale ACH based on sash angle if dragging
    const currentRatio = isDragging ? state.sashAngle / 60 : 1;
    const currentLow = modelParams.achClosed + currentRatio * (achLow - modelParams.achClosed);
    const currentHigh = modelParams.achClosed + currentRatio * (achHigh - modelParams.achClosed);

    const trajLow = predictCO2Trajectory(state.co2Estimated, { ...modelParams, achOpen: currentLow }, true, 60, 60);
    const trajHigh = predictCO2Trajectory(state.co2Estimated, { ...modelParams, achOpen: currentHigh }, true, 60, 60);

    const ptsLow = trajLow.map((pt, i) => mapPt(pt.co2, i));
    const ptsHigh = trajHigh.map((pt, i) => mapPt(pt.co2, i));

    bandPath = [
      ...ptsLow.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`),
      ...ptsHigh.reverse().map(p => `L ${p.x} ${p.y}`),
      'Z'
    ].join(' ');

    // Find crossing time for high ACH (optimistic)
    const crossingIdx = trajHigh.findIndex(pt => pt.co2 <= modelParams.co2Threshold);
    if (crossingIdx !== -1 && crossingIdx > 0 && state.co2Estimated > modelParams.co2Threshold) {
      const crossPt = ptsHigh[trajHigh.length - 1 - crossingIdx]; // Reverse lookup due to reversal? No, just ptsHigh[crossingIdx]
      const forwardPt = ptsHigh[crossingIdx];
      crossingLabel = {
        x: forwardPt.x,
        y: forwardPt.y,
        min: crossingIdx
      };
    }
  }

  const limitY = mapPt(modelParams.co2Threshold, 0).y;
  const bandColor = isHarmful ? tokens.colors.signal : tokens.colors.oxide;

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none">
      
      {/* Projection Chart SVG Layer */}
      <svg ref={svgRef} className="absolute inset-0 w-full h-full z-0">
        {showProjection && (
          <g>
            {/* Limit Hairline */}
            <line x1={xStart} x2={xEnd} y1={limitY} y2={limitY} stroke={tokens.colors.inkDim} strokeWidth="1" strokeDasharray="4 4" />
            <text x={xStart} y={limitY - 4} fontSize="10" fontFamily="var(--font-mono)" fill={tokens.colors.inkDim}>
              LIMIT {modelParams.co2Threshold}
            </text>

            {/* Closed Trajectory */}
            <path d={pathClosed} fill="none" stroke={tokens.colors.ink} strokeWidth="2" strokeDasharray="2 2" />
            <text x={xEnd} y={mapPt(predictCO2Trajectory(state.co2Estimated, modelParams, false, 60, 60)[59].co2, 59).y - 4} fontSize="10" fontFamily="var(--font-mono)" fill={tokens.colors.ink} textAnchor="end">
              CLOSED (EST.)
            </text>

            {/* Open Trajectory Band */}
            <path d={bandPath} fill={bandColor} opacity="0.2" />
            
            <text x={xEnd} y={mapPt(predictCO2Trajectory(state.co2Estimated, { ...modelParams, achOpen: (modelParams.achOpenRange?.[1]||6) }, true, 60, 60)[59].co2, 59).y + 12} fontSize="10" fontFamily="var(--font-mono)" fill={bandColor} textAnchor="end">
              OPEN (ASSUMED ACH)
            </text>

            {/* Crossing marker */}
            {crossingLabel && (
              <g>
                <circle cx={crossingLabel.x} cy={crossingLabel.y} r="3" fill={bandColor} />
                <text x={crossingLabel.x} y={crossingLabel.y - 8} fontSize="10" fontFamily="var(--font-mono)" fill={bandColor} textAnchor="middle">
                  ~{crossingLabel.min}m
                </text>
              </g>
            )}
            
            {/* Note about hardware constraint */}
            {isDragging && (
              <text x={xEnd} y={yMax + 20} fontSize="10" fontFamily="var(--font-mono)" fill={tokens.colors.inkDim} textAnchor="end">
                *DRAG PREVIEWS ONLY. NO DEVICE WRITE PATH.
              </text>
            )}
          </g>
        )}
      </svg>

      {/* HTML/CSS Sash Line - Framer Motion */}
      <motion.div 
        role="slider"
        tabIndex={0}
        aria-label="Window Sash"
        aria-valuemin={0}
        aria-valuemax={60}
        aria-valuenow={state.sashAngle}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
            state.setWindowState('open');
          } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
            state.setWindowState('closed');
          } else if (e.key === 'Enter' || e.key === ' ') {
            state.setWindowState(state.windowState === 'open' ? 'closed' : 'open');
          }
        }}
        className="absolute left-[calc(50%-3px)] top-[33.3%] h-[33.3%] w-[6px] origin-top pointer-events-auto cursor-grab active:cursor-grabbing outline-none focus-visible:ring-2 focus-visible:ring-[#ff5f1f] focus-visible:ring-offset-2 z-10"
        style={{ backgroundColor: tokens.colors.ink }}
        animate={{ rotate: -state.sashAngle }}
        transition={shouldReduceMotion || isDragging ? { duration: 0 } : { type: 'spring', bounce: 0.2, duration: 0.6 }}
        onPointerDown={handlePointerDown}
      >
        {/* Invisible Click/Drag Target (larger hit area) */}
        <div className="absolute inset-x-[-20px] inset-y-0 bg-transparent" />
        
        {/* Visible Handle Indicator */}
        <div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-4 h-4 rounded-full pointer-events-none"
          style={{ 
            backgroundColor: tokens.colors.paper,
            border: `2px solid ${tokens.colors.ink}` 
          }}
        />
      </motion.div>
    </div>
  );
}
