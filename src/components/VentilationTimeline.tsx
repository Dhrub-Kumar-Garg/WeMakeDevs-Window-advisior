'use client';

import { useEnvironmentStore } from '@/store/useEnvironmentStore';
import { findBestVentilationWindow, formatHour } from '@/lib/co2Model';

export default function VentilationTimeline() {
  const { hourlyForecast } = useEnvironmentStore();
  const bestWindow = findBestVentilationWindow(hourlyForecast);
  const currentHour = new Date().getHours();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-sans font-medium text-primary">Best Window Today</h2>
        
        {bestWindow && (
          <div className="text-sm font-mono text-status-safe font-medium">
            Optimal: {formatHour(bestWindow.startHour)} – {formatHour(bestWindow.endHour)}
          </div>
        )}
      </div>

      <div className="relative pt-8 pb-4">
        {/* Continuous Timeline */}
        <div className="flex items-end h-16 w-full relative">
          
          {/* Base Axis Line */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-border-dark" />

          {hourlyForecast.map((forecast, i) => {
            const isBest = bestWindow?.startHour === forecast.hour;
            const isCurrent = forecast.hour === currentHour;
            
            // Map AQI to a clean architectural block height
            // Lower AQI = Better = Taller block
            const height = Math.max(4, 48 - (forecast.aqi / 3));

            return (
              <div 
                key={forecast.hour}
                className="relative flex-1 group flex flex-col justify-end"
              >
                {/* Time Label */}
                {(i % 3 === 0 || isCurrent || isBest) && (
                  <div className={`absolute -top-8 left-0 text-[10px] font-mono whitespace-nowrap 
                    ${isBest ? 'text-status-safe font-bold' : isCurrent ? 'text-primary font-bold' : 'text-muted'}`}
                  >
                    {formatHour(forecast.hour)}
                  </div>
                )}

                {/* Current Time Indicator Line */}
                {isCurrent && (
                  <div className="absolute -top-10 left-0 w-px h-[calc(100%+40px)] bg-primary z-20 pointer-events-none" />
                )}

                {/* The block */}
                <div
                  style={{ height: `${height}px` }}
                  className={`w-full border-r border-base transition-colors
                    ${isBest ? 'bg-status-safe' : 'bg-[#E0E0E0]'}
                    ${forecast.hour < currentHour ? 'opacity-30' : 'opacity-100'}
                  `}
                />

                {/* Hover info (pure CSS based) */}
                <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-30 pointer-events-none w-32">
                  <div className="bg-surface border border-default p-2 text-[10px] font-mono shadow-sm">
                    <div className="text-primary font-bold mb-1">{formatHour(forecast.hour)}</div>
                    <div className="text-secondary">AQI: {forecast.aqi}</div>
                    <div className="text-secondary">PM2.5: {forecast.pm25}</div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
