import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEnvironmentStore } from '@/store/useEnvironmentStore';
import type { Verdict } from '@/lib/decision';
import type { CO2DataPoint, HourlyForecast, EventEntry, ModelParams, WindowState } from '@/lib/types';
import { fetchLatestReading, fetchOutdoorForecast, type SourceStatus } from '@/lib/dataSource';
import { findBestVentilationWindow, updateCO2, computeRecommendation } from '@/lib/co2Model';
import { useSystemStatus, type SystemStatus } from './useSystemStatus';

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
  systemStatus: SystemStatus;
  forecast: HourlyForecast[];
  history: CO2DataPoint[];
  events: EventEntry[];
  isDemo: boolean;
  timeCompression: number;
  setOccupants: (n: number) => void;
  setWindowState: (state: WindowState) => void;
  setSashAngle: (angle: number) => void;
  sashAngle: number;
  scrubHour: number | null;
  setScrubHour: (h: number | null) => void;
  predictedVerdict?: Verdict;
  predictedCO2?: number;
  previewOpen: boolean | null;
  setPreviewOpen: (open: boolean | null) => void;
  togglePreviewOpen: () => void;
}

export function useAdvisorState(): AdvisorState {
  const store = useEnvironmentStore();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === '1';

  const systemStatus = useSystemStatus();

  // Compute ACH and waitUntil inline
  const ach = store.windowState === 'closed' 
    ? store.modelParams.achClosed 
    : store.modelParams.achClosed + (store.sashAngle / 60) * (store.modelParams.achOpen - store.modelParams.achClosed);

  let waitUntil: string | undefined;
  if (store.recommendation === 'WAIT' && store.hourlyForecast.length > 0) {
    const bestWindow = findBestVentilationWindow(store.hourlyForecast, store.modelParams.aqiThreshold);
    if (bestWindow) {
      const timeStr = String(bestWindow.startHour).padStart(2, '0') + ':00';
      waitUntil = bestWindow.isOvernight ? `${timeStr} (overnight)` : timeStr;
    }
  }

  let predictedVerdict: Verdict | undefined;
  let predictedCO2: number | undefined;

  if (store.scrubHour !== null) {
    const currentHour = new Date(store.sensorData.timestamp).getHours();
    let hoursAhead = store.scrubHour - currentHour;
    if (hoursAhead < 0) hoursAhead += 24;
    
    if (hoursAhead > 0) {
      const activeOccupants = store.sensorData.pirPresence ? store.modelParams.occupants : 0;
      const ACH = store.modelParams.achClosed; // assuming window closed
      const dt = hoursAhead * 3600; // seconds
      predictedCO2 = Math.round(updateCO2(store.sensorData.co2Estimated, activeOccupants, store.modelParams.roomVolume, ACH, dt));
      
      const targetForecast = store.hourlyForecast.find(f => f.hour === store.scrubHour) || store.hourlyForecast[0];
      predictedVerdict = computeRecommendation(predictedCO2, targetForecast.aqi, store.modelParams, false) as Verdict;
    } else {
      predictedVerdict = store.recommendation as Verdict;
      predictedCO2 = store.sensorData.co2Estimated;
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
    sourceStatus: systemStatus.status,
    systemStatus,
    forecast: store.hourlyForecast,
    history: store.historicalCO2,
    events: store.events,
    isDemo,
    timeCompression: isDemo ? 60 : 1,
    setOccupants: store.setOccupants,
    setWindowState: store.setWindowState,
    setSashAngle: store.setSashAngle,
    sashAngle: store.sashAngle,
    scrubHour: store.scrubHour,
    setScrubHour: store.setScrubHour,
    predictedVerdict,
    predictedCO2,
    previewOpen: store.previewOpen,
    setPreviewOpen: store.setPreviewOpen,
    togglePreviewOpen: store.togglePreviewOpen
  };
}
