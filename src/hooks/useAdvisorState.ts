import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEnvironmentStore } from '@/store/useEnvironmentStore';
import type { Verdict } from '@/lib/decision';
import type { CO2DataPoint, HourlyForecast, EventEntry, ModelParams, WindowState } from '@/lib/types';
import { fetchLatestReading, fetchOutdoorForecast, getSourceStatus, type SourceStatus } from '@/lib/dataSource';
import { findBestVentilationWindow } from '@/lib/co2Model';

export interface AdvisorState {
  co2Estimated: number;
  outdoorAQI: number;
  occupants: number;
  windowState: WindowState;
  ach: number;
  verdict: Verdict;
  modelParams: ModelParams;
  waitUntil?: string;
  sourceStatus: SourceStatus;
  forecast: HourlyForecast[];
  history: CO2DataPoint[];
  events: EventEntry[];
  isDemo: boolean;
  timeCompression: number;
  setOccupants: (n: number) => void;
  setWindowState: (state: WindowState) => void;
  setSashAngle: (angle: number) => void;
  sashAngle: number;
}

export function useAdvisorState(): AdvisorState {
  const store = useEnvironmentStore();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === '1';

  // Compute ACH and waitUntil inline
  const ach = store.windowState === 'closed' 
    ? store.modelParams.achClosed 
    : store.modelParams.achClosed + (store.sashAngle / 60) * (store.modelParams.achOpen - store.modelParams.achClosed);

  let waitUntil: string | undefined;
  if (store.recommendation === 'WAIT' && store.hourlyForecast.length > 0) {
    const bestWindow = findBestVentilationWindow(store.hourlyForecast, store.modelParams.aqiThreshold);
    if (bestWindow) {
      waitUntil = String(bestWindow.startHour).padStart(2, '0') + ':00';
    }
  }

  // Simulation tick and live polling
  useEffect(() => {
    // Poll AWS/Live Data
    if (!isDemo) {
      const fetchLiveData = async () => {
        try {
          const reading = await fetchLatestReading();
          if (reading) {
            store.applyLatestReading(reading);
          }
        } catch (_) {}
      };
      
      const fetchForecast = async () => {
        try {
          const forecast = await fetchOutdoorForecast();
          if (forecast && forecast.length > 0) {
            store.applyForecast(forecast);
          }
        } catch (_) {}
      };

      fetchLiveData();
      fetchForecast();

      const pollSensors = setInterval(fetchLiveData, 30000); // 30s
      const pollForecast = setInterval(fetchForecast, 1000 * 60 * 60); // 1h
      
      // And the physics simulation tick
      const tickInterval = setInterval(() => {
        store.tick();
      }, 5000);

      return () => {
        clearInterval(pollSensors);
        clearInterval(pollForecast);
        clearInterval(tickInterval);
      };
    } else {
      // Demo Mode
      const tickRate = 100; // fast ticks (10x per second)
      // 10 ticks per real second. If we want 60x time compression,
      // 1 real second = 60 physics seconds. So each tick = 6 physics seconds.
      const tickInterval = setInterval(() => {
        store.tick(6);
      }, tickRate);

      // Scripted events
      const t1 = setTimeout(() => store.setOccupants(3), 2000);
      
      return () => {
        clearInterval(tickInterval);
        clearTimeout(t1);
      };
    }
  }, [isDemo, store]);

  return {
    co2Estimated: store.sensorData.co2Estimated,
    outdoorAQI: store.sensorData.outdoorAQI,
    occupants: store.modelParams.occupants,
    windowState: store.windowState,
    ach,
    verdict: store.recommendation as Verdict, // Maps Recommendation to Verdict
    modelParams: store.modelParams,
    waitUntil,
    sourceStatus: getSourceStatus(store.lastUpdated, isDemo),
    forecast: store.hourlyForecast,
    history: store.historicalCO2,
    events: store.events,
    isDemo,
    timeCompression: isDemo ? 60 : 1,
    setOccupants: store.setOccupants,
    setWindowState: store.setWindowState,
    setSashAngle: store.setSashAngle,
    sashAngle: store.sashAngle,
  };
}
