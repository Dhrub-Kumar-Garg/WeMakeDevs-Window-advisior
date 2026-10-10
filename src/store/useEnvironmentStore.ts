'use client';

import { create } from 'zustand';
import type { EnvironmentState, Recommendation, WindowState, SensorData, ModelParams, CO2DataPoint, HourlyForecast, EventEntry } from '@/lib/types';
import { computeRecommendation, computeConfidence, predictCO2Trajectory, updateCO2 } from '@/lib/co2Model';
import { INITIAL_SENSOR_DATA, DEFAULT_MODEL_PARAMS, generateHistoricalCO2, generateHourlyForecast, DEMO_EVENTS } from '@/lib/mockData';

interface EnvironmentStore {
  // Core state
  envState: EnvironmentState;
  recommendation: Recommendation;
  windowState: WindowState;
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

  // Device health
  esp32Connected: boolean;
  awsConnected: boolean;
  lastUpdated: number;

  // Actions
  setOccupants: (n: number) => void;
  toggleWindow: () => void;
  toggleSimulation: () => void;
  setShowModelExplainer: (v: boolean) => void;
  setShowWindowDetail: (v: boolean) => void;
  tick: () => void;
  setModelParam: <K extends keyof ModelParams>(key: K, value: ModelParams[K]) => void;
}

function deriveEnvState(
  co2: number,
  windowOpen: boolean,
  pirPresence: boolean,
  recommendation: Recommendation,
  prevState: EnvironmentState
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
    initialRec,
    'OPEN_RECOMMENDED'
  );

  return {
    envState: initialEnvState,
    recommendation: initialRec,
    windowState: 'closed',
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
      const newEnvState = deriveEnvState(state.sensorData.co2Estimated, state.windowState !== 'closed', state.sensorData.pirPresence, newRec, state.envState);

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
        state.sensorData.co2Estimated, false, state.sensorData.pirPresence, newRec, state.envState
      );

      const event: EventEntry = {
        id: String(Date.now()),
        timestamp: Date.now(),
        type: newOpen ? 'window_open' : 'window_close',
        message: newOpen ? 'Window opened (ESP32 button)' : 'Window closed (ESP32 button)',
      };

      set({
        windowState: newWindowState,
        sensorData: newSensor,
        recommendation: newRec,
        confidence: newConf,
        envState: newEnvState,
        events: [event, ...state.events].slice(0, 20),
      });
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

    tick: () => {
      const state = get();
      const dt = 5; // 5 second tick

      const ACH = state.windowState !== 'closed' ? state.modelParams.achOpen : state.modelParams.achClosed;
      const newCO2 = updateCO2(
        state.sensorData.co2Estimated,
        state.modelParams.occupants,
        state.modelParams.roomVolume,
        ACH,
        dt
      );
      const newCO2Rounded = Math.round(newCO2);

      const newSensor: SensorData = {
        ...state.sensorData,
        timestamp: Date.now(),
        co2Estimated: newCO2Rounded,
        co2Min: newCO2Rounded - 120,
        co2Max: newCO2Rounded + 120,
        mq135Raw: Math.round(30 + (newCO2Rounded - 420) / 900 * 65),
      };

      const newRec = computeRecommendation(newCO2Rounded, state.sensorData.outdoorAQI, state.modelParams, state.windowState !== 'closed');
      const newConf = computeConfidence(newCO2Rounded, state.sensorData.outdoorAQI, state.modelParams, 'manual');
      const newEnvState = deriveEnvState(newCO2Rounded, state.windowState !== 'closed', state.sensorData.pirPresence, newRec, state.envState);

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
