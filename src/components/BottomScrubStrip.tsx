import { useState, useRef, KeyboardEvent } from 'react';
import type { AdvisorState } from '@/hooks/useAdvisorState';

function getAQIColor(aqi: number) {
  if (aqi < 90) return '#00d8a5'; // teal = AQI under 100
  if (aqi <= 110) return '#eab308'; // amber = borderline
  return '#ef4444'; // red = above the limit
}

function getHourTextColor(aqi: number) {
  // AA contrast check:
  // On red (#ef4444), white (#ffffff) has 4.5+:1 contrast.
  // On teal (#00d8a5) and amber (#eab308), ink (#111111) has > 10:1 contrast.
  if (aqi > 110) return '#ffffff';
  return '#111111';
}

export default function BottomScrubStrip({ state }: { state: AdvisorState }) {
  const stripRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const forecast = state.forecast || [];
  if (forecast.length === 0) return null;

  const bestWindowStart = state.waitUntil ? parseInt(state.waitUntil) : null;
  const currentForecastHour = forecast[0]?.hour;

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    updateScrub(e.clientX);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    updateScrub(e.clientX);
  };
  
  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    state.setScrubHour(null);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    setIsDragging(false);
    state.setScrubHour(null);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const updateScrub = (clientX: number) => {
    if (!stripRef.current) return;
    const rect = stripRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    const index = Math.floor(percent * forecast.length);
    const hour = forecast[Math.min(index, forecast.length - 1)].hour;
    state.setScrubHour(hour);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      state.setScrubHour(null);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const activeHour = state.scrubHour !== null ? state.scrubHour : currentForecastHour;
      const idx = forecast.findIndex(f => f.hour === activeHour);
      if (idx === -1) return;
      const newIdx = e.key === 'ArrowLeft' ? Math.max(0, idx - 1) : Math.min(forecast.length - 1, idx + 1);
      state.setScrubHour(forecast[newIdx].hour);
    }
  };

  const activeIndex = state.scrubHour !== null ? forecast.findIndex(f => f.hour === state.scrubHour) : -1;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col justify-end pointer-events-auto">
      <div className="px-3 pb-1 pt-1 bg-[rgba(244,240,234,0.92)] text-[9px] sm:text-[11px] font-mono text-[#111111] flex items-center justify-between gap-1.5 border-t border-[#111111]/15 overflow-x-auto whitespace-nowrap">
        <span className="font-semibold tracking-wide text-[9px] sm:text-[11px]">DRAG TO PREDICT</span>
        <div className="flex items-center gap-2 sm:gap-3 text-[8.5px] sm:text-[10px]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-[#00d8a5] inline-block border border-black/10" />
            <span>teal = AQI under 100</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-[#eab308] inline-block border border-black/10" />
            <span>amber = borderline</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-[#ef4444] inline-block border border-black/10" />
            <span>red = above the limit</span>
          </span>
        </div>
      </div>
      <div 
        ref={stripRef}
        className="relative w-full h-8 sm:h-12 flex cursor-ew-resize touch-none outline-none focus-visible:ring-2 focus-visible:ring-black"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        aria-label="Forecast timeline scrubber. Use arrow keys to scrub hours."
      >
        {forecast.map((f, i) => {
          const color = getAQIColor(f.aqi);
          const textColor = getHourTextColor(f.aqi);
          const isBest = bestWindowStart === f.hour;
          return (
            <div key={`${f.hour}-${i}`} className="flex-1 h-full border-r border-black/10 last:border-0 relative group" style={{ backgroundColor: color }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-white transition-opacity" />
              {isBest && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold bg-white text-black px-1 rounded shadow-sm z-10">
                  BEST
                </div>
              )}
              {f.hour === currentForecastHour && (
                <div className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-black shadow-lg z-20" />
              )}
              <div 
                className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[11px] font-mono font-bold select-none pointer-events-none"
                style={{ color: textColor }}
              >
                {String(f.hour).padStart(2, '0')}
              </div>
            </div>
          );
        })}

        {/* Thumb overlay */}
        {activeIndex !== -1 && (
          <div 
            className="absolute top-0 bottom-0 bg-white/40 pointer-events-none transition-transform duration-75 border-x border-white shadow-[0_0_10px_rgba(255,255,255,0.5)] z-30"
            style={{ 
              left: `${(activeIndex / forecast.length) * 100}%`,
              width: `${100 / forecast.length}%`
            }}
          />
        )}
      </div>
    </div>
  );
}
