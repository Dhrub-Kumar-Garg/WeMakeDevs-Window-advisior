// Environment States — the core state machine
export type EnvironmentState =
  | 'NORMAL'
  | 'OCCUPIED'
  | 'RISING'
  | 'CAUTION'
  | 'OPEN_RECOMMENDED'
  | 'WINDOW_OPENING'
  | 'VENTILATING'
  | 'VENTILATED';

// Recommendation
export type Recommendation = 'OPEN_WINDOW' | 'KEEP_CLOSED' | 'WAIT' | 'OPTIMAL';

// Window state
export type WindowState = 'closed' | 'ajar' | 'open';

// AQI level label
export type AQILevel = 'Good' | 'Moderate' | 'Unhealthy for Sensitive' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous';

export interface SensorData {
  timestamp: number;        // Unix ms
  co2Estimated: number;     // ppm (model-based)
  co2Min: number;           // ppm low bound
  co2Max: number;           // ppm high bound
  mq135Raw: number;         // raw relative value (0-100)
  temperature: number;      // °C from LM35
  pirPresence: boolean;     // PIR state
  windowOpen: boolean;      // from push button
  outdoorAQI: number;       // 0-500
  outdoorPM25: number;      // μg/m³
  outdoorTemp: number;      // °C
}

export interface ModelParams {
  roomVolume: number;       // m³
  occupants: number;        // N
  achClosed: number;        // air changes/h window closed
  achOpen: number;          // air changes/h window open (legacy, or midpoint)
  achOpenRange: [number, number]; // [low, high] assumed ACH when open
  outdoorBaseline: number;  // ppm (420)
  co2Threshold: number;     // ppm for recommendation (1000)
  aqiThreshold: number;     // for recommendation (100)
}

export interface HourlyForecast {
  hour: number;             // 0-23
  aqi: number;
  pm25: number;
  windSpeed: number;        // km/h
  ventilationQuality: 'excellent' | 'good' | 'moderate' | 'poor';
  co2ReductionEstimate: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface VentilationWindow {
  startHour: number;
  endHour: number;
  aqi: number;
  benefit: 'HIGH' | 'MEDIUM' | 'LOW';
  isOvernight?: boolean;
}

export interface CO2DataPoint {
  time: string;
  estimated: number;
  min: number;
  max: number;
  mq135: number;
  event?: string;
}

export interface EventEntry {
  id: string;
  timestamp: number;
  type: 'recommendation_change' | 'window_open' | 'window_close' | 'occupancy_change' | 'threshold_crossed' | 'model_reset';
  message: string;
}
