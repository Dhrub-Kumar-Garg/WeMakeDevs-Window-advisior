import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { updateCO2 } from '@/lib/co2Model';
import type { SensorData, ModelParams, CO2DataPoint, HourlyForecast, EventEntry } from '@/lib/types';
import { generateHourlyForecast, DEMO_EVENTS, DEFAULT_MODEL_PARAMS } from '@/lib/mockData';
import { computeVerdict } from '@/lib/decision';

export type Verdict = 'OPEN_WINDOW' | 'KEEP_CLOSED' | 'WAIT';

export interface AdvisorState {
  co2Estimated: number;
  outdoorAQI: number;
  occupants: number;
  windowState: 'closed' | 'open';
  ach: number;
  verdict: Verdict;
  forecast: HourlyForecast[];
  history: CO2DataPoint[];
  events: EventEntry[];
  isDemo: boolean;
  timeCompression: number;
  setOccupants: (n: number) => void;
  setWindowState: (state: 'closed' | 'open') => void;
  setSashAngle: (angle: number) => void; // 0 to 60
  sashAngle: number;
}

export function useAdvisorState(): AdvisorState {
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === '1';
  
  // Real or mock data bases
  const [co2Estimated, setCo2Estimated] = useState(600);
  const [outdoorAQI, setOutdoorAQI] = useState(42);
  const [occupants, setOccupants] = useState(1);
  const [windowState, setWindowState] = useState<'closed' | 'open'>('closed');
  const [sashAngle, setSashAngle] = useState(0); // 0 to 60 deg
  
  const [forecast, setForecast] = useState<HourlyForecast[]>([]);
  const [history, setHistory] = useState<CO2DataPoint[]>([]);
  const [events, setEvents] = useState<EventEntry[]>([]);

  const paramsRef = useRef(DEFAULT_MODEL_PARAMS);

  // Computed ACH from sash angle
  // 0 deg -> achClosed (e.g. 0.3)
  // 60 deg -> achOpen (e.g. 5.0)
  const ach = windowState === 'closed' 
    ? paramsRef.current.achClosed 
    : paramsRef.current.achClosed + (sashAngle / 60) * (paramsRef.current.achOpen - paramsRef.current.achClosed);

  const verdict = computeVerdict(co2Estimated, outdoorAQI, paramsRef.current.co2Threshold, paramsRef.current.aqiThreshold);

  useEffect(() => {
    // Initialize
    setForecast(generateHourlyForecast());
  }, []);

  // TICK
  useEffect(() => {
    const timeCompression = isDemo ? 60 : 1;
    const tickRate = isDemo ? 100 : 5000; // Fast ticks in demo
    const dtRealSeconds = (tickRate / 1000) * timeCompression;

    const interval = setInterval(() => {
      setCo2Estimated(prev => {
        const next = updateCO2(prev, occupants, paramsRef.current.roomVolume, ach, dtRealSeconds);
        
        // Add history point occasionally
        if (Math.random() > 0.8) {
          setHistory(h => {
            const now = new Date();
            const newPoint = {
              time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
              estimated: Math.round(next),
              min: Math.round(next) - 50,
              max: Math.round(next) + 50,
              mq135: Math.round(30 + (next - 420) / 900 * 65)
            };
            const nextHistory = [...h, newPoint];
            if (nextHistory.length > 50) nextHistory.shift();
            return nextHistory;
          });
        }
        return next;
      });
    }, tickRate);

    return () => clearInterval(interval);
  }, [isDemo, occupants, ach]);

  // Demo script scenario runner
  useEffect(() => {
    if (!isDemo) return;
    // Scripted scenario: empty room, thin air > PIR trigger, N=3, CO2 ramp to ~1100 > outdoor AQI spike to 160 (HOLD) > user drags the sash (ghost trace shows harm) > forecast clearing 06:00-07:00 AQI 38 > outdoor clears (OPEN) > limit switch pressed > CO2 falls toward 420
    
    // We can simulate external events here using timeouts
    const t1 = setTimeout(() => { setOccupants(3); }, 2000);
    const t2 = setTimeout(() => { setOutdoorAQI(160); }, 6000);
    const t3 = setTimeout(() => { setOutdoorAQI(38); }, 15000);
    
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [isDemo]);

  const handleSetWindowState = useCallback((state: 'closed' | 'open') => {
    setWindowState(state);
    if (state === 'closed') setSashAngle(0);
    else if (sashAngle === 0) setSashAngle(60);
  }, [sashAngle]);

  const handleSetSashAngle = useCallback((angle: number) => {
    const clamped = Math.max(0, Math.min(60, angle));
    setSashAngle(clamped);
    if (clamped === 0 && windowState !== 'closed') setWindowState('closed');
    if (clamped > 0 && windowState !== 'open') setWindowState('open');
  }, [windowState]);

  return {
    co2Estimated: Math.round(co2Estimated),
    outdoorAQI,
    occupants,
    windowState,
    ach,
    verdict,
    forecast,
    history,
    events,
    isDemo,
    timeCompression: isDemo ? 60 : 1,
    setOccupants,
    setWindowState: handleSetWindowState,
    setSashAngle: handleSetSashAngle,
    sashAngle
  };
}
