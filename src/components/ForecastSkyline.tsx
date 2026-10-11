'use client';

import { useState, useEffect } from 'react';
import type { AdvisorState } from '@/hooks/useAdvisorState';
import { tokens } from '@/design/tokens';
import { findBestVentilationWindow } from '@/lib/co2Model';

export default function ForecastSkyline({ state }: { state: AdvisorState }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { forecast } = state;
  if (!forecast || forecast.length === 0) {
    return (
      <section className="w-full border-b border-[#e2e8f0] p-6 lg:p-12 flex flex-col items-center">
        <div className="w-full max-w-7xl min-h-[400px] flex items-center justify-center">
          <p className="font-mono text-xs uppercase tracking-widest text-[#666666]">waiting for device...</p>
        </div>
      </section>
    );
  }

  const bestWindow = findBestVentilationWindow(forecast, state.modelParams.aqiThreshold);

  // SVG metrics
  const width = 1200;
  const height = 400;
  const paddingX = 40;
  const paddingY = 80;

  const maxAQI = Math.max(100, ...forecast.map(d => d.aqi));

  // Scales
  const getX = (index: number) => paddingX + (index / (forecast.length - 1)) * (width - paddingX * 2);
  const getY = (aqi: number) => height - paddingY - (aqi / maxAQI) * (height - paddingY * 2);

  // Path generation
  let pathD = `M ${getX(0)} ${height - paddingY}`;
  forecast.forEach((d, i) => {
    // Step function (skyline silhouette)
    const x = getX(i);
    const y = getY(d.aqi);
    if (i === 0) {
      pathD += ` L ${x} ${y}`;
    } else {
      pathD += ` L ${x} ${getY(forecast[i-1].aqi)} L ${x} ${y}`;
    }
  });
  // Close path
  pathD += ` L ${getX(forecast.length - 1)} ${height - paddingY} Z`;

  // Determine current hour (for "now" marker)
  const currentHour = mounted ? new Date().getHours() : (forecast[0]?.hour ?? 0);
  const foundIndex = forecast.findIndex(f => f.hour === currentHour);
  const nowIndex = foundIndex >= 0 ? foundIndex : 0;
  const nowX = getX(nowIndex);

  return (
    <section className="w-full bg-[#f4f0ea] border-b border-[#111111]/15 p-6 lg:p-12 flex flex-col items-center text-[#2c2825]">
      <div className="w-full max-w-7xl">
        <h2 className="font-serif italic text-3xl md:text-4xl text-[#2c2825] mb-2">Outdoor Forecast</h2>
        <div className="flex flex-col md:flex-row justify-between md:items-end mb-12 gap-4">
          <p className="font-mono text-xs uppercase tracking-widest text-[#8c8273]">24h AQI Skyline</p>
          <p className="font-mono text-[10px] text-[#8c8273]">
            Suitable clearing: AQI &lt; {state.modelParams.aqiThreshold} (Source: Open-Meteo)
          </p>
        </div>
        
        <div className="w-full overflow-x-auto outline-none focus-visible:ring-2 focus-visible:ring-[#ff5f1f] focus-visible:ring-offset-2" tabIndex={0} role="region" aria-label="Forecast timeline scroll area">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[800px] h-auto font-mono text-[10px]" role="img" aria-label="24-hour Air Quality Forecast Skyline">
            {/* Background grid lines */}
            <line x1={paddingX} y1={getY(100)} x2={width - paddingX} y2={getY(100)} stroke={tokens.colors.inkDim} strokeDasharray="4 4" strokeWidth="0.5" />
            <text x={paddingX - 5} y={getY(100) + 4} textAnchor="end" fill={tokens.colors.inkDim}>100</text>
            
            <line x1={paddingX} y1={getY(50)} x2={width - paddingX} y2={getY(50)} stroke={tokens.colors.inkDim} strokeDasharray="4 4" strokeWidth="0.5" />
            <text x={paddingX - 5} y={getY(50) + 4} textAnchor="end" fill={tokens.colors.inkDim}>50</text>

            <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke={tokens.colors.ink} strokeWidth="1" />

            {/* Silhouette */}
            <path d={pathD} fill={tokens.colors.ink} opacity="0.05" />
            <path d={pathD} fill="none" stroke={tokens.colors.ink} strokeWidth="2" />

            {/* X Axis Labels */}
            {forecast.map((d, i) => (
              i % 3 === 0 && (
                <g key={i} transform={`translate(${getX(i)}, ${height - paddingY + 20})`}>
                  <line x1="0" y1="-20" x2="0" y2="-15" stroke={tokens.colors.ink} strokeWidth="1" />
                  <text x="0" y="0" textAnchor="middle" fill={tokens.colors.ink}>{String(d.hour).padStart(2, '0')}:00</text>
                </g>
              )
            ))}

            {/* "Now" Marker */}
            {mounted && (
              <g>
                <line x1={nowX} y1={paddingY} x2={nowX} y2={height - paddingY} stroke={tokens.colors.ink} strokeWidth="1" strokeDasharray="2 2" />
                <text x={nowX} y={paddingY - 10} textAnchor="middle" fill={tokens.colors.ink} fontWeight="bold">NOW</text>
              </g>
            )}

            {/* Best Window Clearing */}
            {bestWindow && (
              <g>
                <rect 
                  x={getX(forecast.findIndex(f => f.hour === bestWindow.startHour))} 
                  y={paddingY} 
                  width={getX(bestWindow.endHour > bestWindow.startHour ? bestWindow.endHour - bestWindow.startHour : 1) - getX(0)} 
                  height={height - paddingY * 2} 
                  fill={tokens.colors.oxide} 
                  opacity="0.1" 
                />
                
                {/* Dimension line */}
                <g transform={`translate(${getX(forecast.findIndex(f => f.hour === bestWindow.startHour))}, ${paddingY - 30})`}>
                  <line x1="0" y1="0" x2={getX(bestWindow.endHour > bestWindow.startHour ? bestWindow.endHour - bestWindow.startHour : 1) - getX(0)} y2="0" stroke={tokens.colors.oxide} strokeWidth="1" />
                  <line x1="0" y1="-5" x2="0" y2="5" stroke={tokens.colors.oxide} strokeWidth="1" />
                  <line x1={getX(bestWindow.endHour > bestWindow.startHour ? bestWindow.endHour - bestWindow.startHour : 1) - getX(0)} y1="-5" x2={getX(bestWindow.endHour > bestWindow.startHour ? bestWindow.endHour - bestWindow.startHour : 1) - getX(0)} y2="5" stroke={tokens.colors.oxide} strokeWidth="1" />
                  <text x={(getX(bestWindow.endHour > bestWindow.startHour ? bestWindow.endHour - bestWindow.startHour : 1) - getX(0))/2} y="-10" textAnchor="middle" fill={tokens.colors.oxide} fontWeight="bold">
                    CLEARING (AQI {bestWindow.aqi})
                  </text>
                </g>
              </g>
            )}

            {/* Hover columns */}
            {forecast.map((d, i) => {
              const xPos = getX(i);
              const colW = i < forecast.length - 1 ? getX(i+1) - xPos : getX(1) - getX(0);
              return (
                <rect 
                  key={`hover-${i}`}
                  x={xPos - colW/2} 
                  y={paddingY} 
                  width={colW} 
                  height={height - paddingY * 2} 
                  fill="transparent" 
                  className="hover:fill-black/5 transition-colors cursor-crosshair"
                >
                  <title>{`Hour: ${String(d.hour).padStart(2, '0')}:00\nAQI: ${d.aqi}\nPM2.5: ${d.pm25.toFixed(1)} μg/m³`}</title>
                </rect>
              );
            })}
          </svg>
        </div>
      </div>
    </section>
  );
}
