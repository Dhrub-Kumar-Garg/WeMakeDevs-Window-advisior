import { useState, useRef, KeyboardEvent } from 'react';
import type { AdvisorState } from '@/hooks/useAdvisorState';

function getAQIColor(aqi: number) {
  if (aqi <= 50) return '#00d8a5'; // Good
  if (aqi <= 100) return '#eab308'; // Moderate
  if (aqi <= 150) return '#ff5f1f'; // Unhealthy for sensitive
  return '#ef4444'; // Unhealthy/Hazardous
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
      <div className="px-4 pb-1 text-[10px] font-mono text-gray-400 opacity-60">
        DRAG TO PREDICT CO₂ & VERDICT
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
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-mono opacity-40 font-bold mix-blend-overlay">
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
