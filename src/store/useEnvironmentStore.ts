'use client';

import { create } from 'zustand';
import type { EnvironmentState, Recommendation, WindowState, SensorData, ModelParams, CO2DataPoint, HourlyForecast, EventEntry } from '@/lib/types';
import { computeRecommendation, computeConfidence, predictCO2Trajectory, updateCO2 } from '@/lib/co2Model';
import { computeVerdict } from '@/lib/decision';
import { INITIAL_SENSOR_DATA, DEFAULT_MODEL_PARAMS, generateHistoricalCO2, generateHourlyForecast, DEMO_EVENTS } from '@/lib/mockData';
import type { LatestReading } from '@/lib/dataSource';

interface EnvironmentStore {
  // Core state
  envState: EnvironmentState;
  recommendation: Recommendation;
  windowState: WindowState;
  sashAngle: number;
  confidence: number;

  // Live sensor data
  sensorData: SensorData;

  // Model parameters (user-editable)
  modelParams: ModelParams;

  // Historical data for charts
  historicalCO2: CO2DataPoint[];
  hourlyForecast: HourlyForecast[];

  // Event stream
  events: EventEntry[];

  // UI state
  simulationActive: boolean;
  simulatedCO2Trajectory: Array<{ time: number; co2: number }>;
  showModelExplainer: boolean;
  showWindowDetail: boolean;
  scrubHour: number | null;
  previewOpen: boolean | null;

  // Device health
  esp32Connected: boolean;
  awsConnected: boolean;
  lastUpdated: number;

  // Actions
  setOccupants: (n: number) => void;
  toggleWindow: () => void;
  setWindowState: (state: WindowState) => void;
  setSashAngle: (angle: number) => void;
  setPreviewOpen: (open: boolean | null) => void;
  togglePreviewOpen: () => void;
  toggleSimulation: () => void;
  setShowModelExplainer: (v: boolean) => void;
  setShowWindowDetail: (v: boolean) => void;
  setScrubHour: (h: number | null) => void;
  tick: (dtSeconds?: number) => void;
  setModelParam: <K extends keyof ModelParams>(key: K, value: ModelParams[K]) => void;
  applyLatestReading: (r: LatestReading) => void;
  applyForecast: (f: HourlyForecast[]) => void;
}

function deriveEnvState(
  co2: number,
  windowOpen: boolean,
  pirPresence: boolean,
  recommendation: Recommendation
): EnvironmentState {
  if (!pirPresence) return 'NORMAL';
  if (windowOpen && co2 < 600) return 'VENTILATED';
  if (windowOpen) return 'VENTILATING';
  if (recommendation === 'OPEN_WINDOW') return 'OPEN_RECOMMENDED';
  if (co2 > 900) return 'CAUTION';
  if (co2 > 700) return 'RISING';
  if (pirPresence) return 'OCCUPIED';
  return 'NORMAL';
}

let previewResetTimer: ReturnType<typeof setTimeout> | null = null;

export const useEnvironmentStore = create<EnvironmentStore>((set, get) => {
  const initialForecast = generateHourlyForecast();
  const initialHistory = generateHistoricalCO2(INITIAL_SENSOR_DATA.co2Estimated);

  const initialRec = computeRecommendation(
    INITIAL_SENSOR_DATA.co2Estimated,
    INITIAL_SENSOR_DATA.outdoorAQI,
    DEFAULT_MODEL_PARAMS,
    INITIAL_SENSOR_DATA.windowOpen
  );
  const initialConf = computeConfidence(
    INITIAL_SENSOR_DATA.co2Estimated,
    INITIAL_SENSOR_DATA.outdoorAQI,
    DEFAULT_MODEL_PARAMS,
    'manual'
  );
  const initialEnvState = deriveEnvState(
    INITIAL_SENSOR_DATA.co2Estimated,
    false,
    true,
    initialRec
  );

  return {
    envState: initialEnvState,
    recommendation: initialRec,
    windowState: 'closed',
    sashAngle: 0,
    confidence: initialConf,

    sensorData: { ...INITIAL_SENSOR_DATA },
    modelParams: { ...DEFAULT_MODEL_PARAMS },

    historicalCO2: initialHistory,
    hourlyForecast: initialForecast,

    events: [...DEMO_EVENTS],

    simulationActive: false,
    simulatedCO2Trajectory: [],
    showModelExplainer: false,
    showWindowDetail: false,
    scrubHour: null,
    previewOpen: null,

    esp32Connected: true,
    awsConnected: true,
    lastUpdated: Date.now(),

    setOccupants: (n) => {
      const state = get();
      const newParams = { ...state.modelParams, occupants: n };
      const newRec = computeRecommendation(
        state.sensorData.co2Estimated,
        state.sensorData.outdoorAQI,
        newParams,
        state.windowState !== 'closed'
      );
      const newConf = computeConfidence(state.sensorData.co2Estimated, state.sensorData.outdoorAQI, newParams, 'manual');
      const newEnvState = deriveEnvState(state.sensorData.co2Estimated, state.windowState !== 'closed', state.sensorData.pirPresence, newRec);

      const event: EventEntry = {
        id: String(Date.now()),
        timestamp: Date.now(),
        type: 'occupancy_change',
        message: `Occupancy set to ${n} person${n !== 1 ? 's' : ''}`,
      };

      set({
        modelParams: newParams,
        recommendation: newRec,
        confidence: newConf,
        envState: newEnvState,
        events: [event, ...state.events].slice(0, 20),
      });
    },

    toggleWindow: () => {
      const state = get();
      const newOpen = state.windowState === 'closed';
      const newWindowState: WindowState = newOpen ? 'open' : 'closed';

      const newSensor = {
        ...state.sensorData,
        windowOpen: newOpen,
      };

      const newRec = computeRecommendation(
        state.sensorData.co2Estimated,
        state.sensorData.outdoorAQI,
        state.modelParams,
        newOpen
      );
      const newConf = computeConfidence(state.sensorData.co2Estimated, state.sensorData.outdoorAQI, state.modelParams, 'manual');
      const newEnvState = newOpen ? 'VENTILATING' : deriveEnvState(
        state.sensorData.co2Estimated, false, state.sensorData.pirPresence, newRec
      );

      const event: EventEntry = {
        id: String(Date.now()),
        timestamp: Date.now(),
        type: newOpen ? 'window_open' : 'window_close',
        message: newOpen ? 'Window opened (ESP32 button)' : 'Window closed (ESP32 button)',
      };

      set({
        windowState: newWindowState,
        sashAngle: newOpen ? 60 : 0,
        sensorData: newSensor,
        recommendation: newRec,
        confidence: newConf,
        envState: newEnvState,
        events: [event, ...state.events].slice(0, 20),
      });
    },

    setWindowState: (newWindowState: WindowState) => {
      const state = get();
      const newOpen = newWindowState === 'open';
      const newSensor = { ...state.sensorData, windowOpen: newOpen };
      const newRec = computeRecommendation(state.sensorData.co2Estimated, state.sensorData.outdoorAQI, state.modelParams, newOpen);
      set({ 
        windowState: newWindowState, 
        sashAngle: newOpen ? 60 : 0,
        sensorData: newSensor, 
        recommendation: newRec 
      });
    },

    setSashAngle: (angle: number) => {
      const clamped = Math.max(0, Math.min(60, angle));
      const state = get();
      const updates: Partial<EnvironmentStore> = { sashAngle: clamped };
      
      if (clamped === 0 && state.windowState !== 'closed') {
        get().setWindowState('closed');
      } else if (clamped > 0 && state.windowState !== 'open') {
        get().setWindowState('open');
      } else {
        set(updates);
      }
    },

    setPreviewOpen: (open: boolean | null) => {
      if (previewResetTimer) {
        clearTimeout(previewResetTimer);
        previewResetTimer = null;
      }
      set({ previewOpen: open });
      if (open !== null) {
        previewResetTimer = setTimeout(() => {
          set({ previewOpen: null });
          previewResetTimer = null;
        }, 20000);
      }
    },

    togglePreviewOpen: () => {
      const current = get().previewOpen;
      const realOpen = get().windowState === 'open' || get().sensorData.windowOpen;
      const next = current === null ? !realOpen : !current;
      get().setPreviewOpen(next);
    },

    toggleSimulation: () => {
      const state = get();
      if (state.simulationActive) {
        set({ simulationActive: false, simulatedCO2Trajectory: [] });
        return;
      }
      // Compute what happens if window opens now
      const trajectory = predictCO2Trajectory(
        state.sensorData.co2Estimated,
        state.modelParams,
        true, // simulate window open
        60,   // 60 steps of 1 min each
        60
      );
      set({ simulationActive: true, simulatedCO2Trajectory: trajectory });
    },

    setShowModelExplainer: (v) => set({ showModelExplainer: v }),
    setShowWindowDetail: (v) => set({ showWindowDetail: v }),
    setScrubHour: (h) => set({ scrubHour: h }),

    setModelParam: (key, value) => {
      const state = get();
      const newParams = { ...state.modelParams, [key]: value };
      const newRec = computeRecommendation(
        state.sensorData.co2Estimated,
        state.sensorData.outdoorAQI,
        newParams,
        state.windowState !== 'closed'
      );
      set({ modelParams: newParams, recommendation: newRec });
    },

    applyLatestReading: (reading: LatestReading) => {
      const state = get();

      // UI and device agree on model parameters
      const newParams: ModelParams = {
        ...state.modelParams,
        roomVolume: reading.volumeM3 ?? state.modelParams.roomVolume,
        occupants: reading.people ?? state.modelParams.occupants,
        achClosed: !reading.windowOpen ? (reading.ach ?? state.modelParams.achClosed) : state.modelParams.achClosed,
        achOpen: reading.windowOpen ? (reading.ach ?? state.modelParams.achOpen) : state.modelParams.achOpen,
      };

      const readingTsMs = reading.ts > 1e11 ? reading.ts : reading.ts * 1000;
      const pirActive = Boolean(reading.pir);
      const co2Val = Math.round(reading.co2Est);
      const outdoorAQIVal = Math.round(reading.aqiOut ?? state.sensorData.outdoorAQI);

      const newSensor: SensorData = {
        ...state.sensorData,
        timestamp: readingTsMs,
        co2Estimated: co2Val,
        co2Min: co2Val - 120,
        co2Max: co2Val + 120,
        tempC: reading.tempC,
        temperature: reading.tempC ?? state.sensorData.temperature,
        humidity: reading.humidity,
        pirPresence: pirActive,
        windowOpen: reading.windowOpen,
        mq135Mv: reading.mq135Mv,
        mq135Idx: reading.mq135Idx,
        mq135Raw: reading.mq135Idx ?? Math.round(reading.mq135Mv / 10),
        distanceCm: reading.distanceCm,
        people: reading.people,
        volumeM3: reading.volumeM3,
        ach: reading.ach,
        outdoorAQI: outdoorAQIVal,
        aqiSrc: reading.aqiSrc ?? state.sensorData.aqiSrc,
        led: reading.led,
        timeScale: reading.timeScale ?? 1,
        deviceId: reading.deviceId,
      };

      const newWindowState: WindowState = reading.windowOpen ? 'open' : 'closed';
      
      // Compute verdict in the frontend (computeVerdict) from co2Est and outdoor AQI
      const newVerdict = computeVerdict(
        co2Val,
        outdoorAQIVal,
        newParams.co2Threshold,
        newParams.aqiThreshold
      );

      const newEnvState = deriveEnvState(co2Val, reading.windowOpen, pirActive, newVerdict as Recommendation);

      // Seed history / projections from co2Est
      const newHistory = [...state.historicalCO2];
      const now = new Date(readingTsMs);
      const timeLabel = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      newHistory.push({
        time: timeLabel,
        estimated: co2Val,
        min: co2Val - 120,
        max: co2Val + 120,
        mq135: reading.mq135Idx ?? Math.round(reading.mq135Mv / 10),
      });
      if (newHistory.length > 30) newHistory.shift();

      set({
        sensorData: newSensor,
        modelParams: newParams,
        windowState: newWindowState,
        sashAngle: reading.windowOpen ? 60 : 0,
        recommendation: newVerdict as Recommendation,
        envState: newEnvState,
        lastUpdated: readingTsMs,
        historicalCO2: newHistory,
      });
    },

    applyForecast: (forecast: HourlyForecast[]) => {
      if (!forecast || forecast.length === 0) return;
      const currentAQI = forecast[0].aqi;
      const currentPM25 = forecast[0].pm25;
      
      const state = get();
      const newSensor = {
        ...state.sensorData,
        outdoorAQI: currentAQI,
        outdoorPM25: currentPM25,
      };
      
      set({
        hourlyForecast: forecast,
        sensorData: newSensor,
        recommendation: computeRecommendation(state.sensorData.co2Estimated, currentAQI, state.modelParams, state.windowState !== 'closed'),
      });
    },

    tick: (dtSeconds?: number) => {
      const state = get();
      const dt = dtSeconds !== undefined ? dtSeconds : 5; // default 5 second tick

      const ACH = state.windowState !== 'closed' ? state.modelParams.achOpen : state.modelParams.achClosed;
      const activeOccupants = state.sensorData.pirPresence ? state.modelParams.occupants : 0;
      
      const newCO2 = updateCO2(
        state.sensorData.co2Estimated,
        activeOccupants,
        state.modelParams.roomVolume,
        ACH,
        dt
      );
      const newCO2Rounded = Math.round(newCO2);

      const mqIdx = Math.round(30 + (newCO2Rounded - 420) / 900 * 65);
      const mqMv = Math.round(150 + (newCO2Rounded - 420) / 900 * 500);

      const newSensor: SensorData = {
        ...state.sensorData,
        timestamp: Date.now(),
        co2Estimated: newCO2Rounded,
        co2Min: newCO2Rounded - 120,
        co2Max: newCO2Rounded + 120,
        mq135Raw: mqIdx,
        mq135Idx: mqIdx,
        mq135Mv: mqMv,
      };

      const newRec = computeVerdict(newCO2Rounded, state.sensorData.outdoorAQI, state.modelParams.co2Threshold, state.modelParams.aqiThreshold) as Recommendation;
      const newConf = computeConfidence(newCO2Rounded, state.sensorData.outdoorAQI, state.modelParams, 'manual');
      const newEnvState = deriveEnvState(newCO2Rounded, state.windowState !== 'closed', state.sensorData.pirPresence, newRec);

      // Add to history (every 10 ticks = 50s ≈ keep it manageable for demo)
      const newHistory = [...state.historicalCO2];
      if (newHistory.length > 30) newHistory.shift();
      const now = new Date();
      newHistory.push({
        time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
        estimated: newCO2Rounded,
        min: newCO2Rounded - 120,
        max: newCO2Rounded + 120,
        mq135: newSensor.mq135Raw,
      });

      // Check recommendation change
      const events = [...state.events];
      if (newRec !== state.recommendation) {
        events.unshift({
          id: String(Date.now()),
          timestamp: Date.now(),
          type: 'recommendation_change',
          message: `Recommendation → ${newRec.replace('_', ' ')}`,
        });
      }

      set({
        sensorData: newSensor,
        recommendation: newRec,
        confidence: newConf,
        envState: newEnvState,
        historicalCO2: newHistory,
        lastUpdated: Date.now(),
        events: events.slice(0, 20),
      });
    },
  };
});

if (typeof window !== 'undefined') {
  (window as any).__store = useEnvironmentStore;
}
