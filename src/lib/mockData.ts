import type { SensorData, HourlyForecast, CO2DataPoint, ModelParams } from './types';
import { aqiToVentilationQuality, co2ReductionEstimate } from './co2Model';

// Default model parameters
export const DEFAULT_MODEL_PARAMS: ModelParams = {
  roomVolume: 36,        // 4m × 5m × 2m
  occupants: 1,
  achClosed: 0.4,
  achOpen: 4.0,
  achOpenRange: [2, 6],
  outdoorBaseline: 420,
  co2Threshold: 1000,
  aqiThreshold: 100,
};

// Generate simulated 24-hour hourly forecast
export function generateHourlyForecast(): HourlyForecast[] {
  // Pattern: clean at night/morning, peaks midday (traffic), eases evening
  const baseAQI = [
    30, 28, 26, 25, 27, 30, 35, 45,
    85, 130, 145, 155, 160, 170, 165, 150, 140, 135,
    80, 45, 38, 35, 32, 30
  ];
  const windSpeeds = [8, 9, 10, 11, 12, 10, 8, 6, 4, 3, 3, 4, 3, 3, 4, 5, 6, 8, 9, 10, 11, 10, 9, 8];

  return baseAQI.map((aqi, hour) => {
    const windSpeed = windSpeeds[hour];
    const quality = aqiToVentilationQuality(aqi);
    const benefit = co2ReductionEstimate(aqi, windSpeed);
    return {
      hour,
      aqi,
      pm25: Math.round(aqi * 0.12 * 10) / 10,
      windSpeed,
      ventilationQuality: quality,
      co2ReductionEstimate: benefit,
    };
  });
}

// Generate historical CO₂ data (2 hours) for chart
export function generateHistoricalCO2(currentCO2: number = 1050): CO2DataPoint[] {
  const points: CO2DataPoint[] = [];
  const now = Date.now();
  const twoHoursAgo = now - 2 * 60 * 60 * 1000;
  const intervalMs = 5 * 60 * 1000; // 5-minute intervals → 24 points

  // Simulate: starts low, rises as room gets occupied, nears threshold
  const n = 24;
  for (let i = 0; i < n; i++) {
    const t = twoHoursAgo + i * intervalMs;
    const fraction = i / (n - 1);

    // CO₂ rises from 480 to current
    let estimated: number;
    if (fraction < 0.25) {
      // Idle start
      estimated = 480 + fraction * 4 * 80;
    } else if (fraction < 0.6) {
      // Rising phase — room gets occupied
      estimated = 560 + (fraction - 0.25) / 0.35 * (currentCO2 - 560);
    } else {
      // Near plateau / current value
      estimated = currentCO2 - 30 + Math.sin(fraction * 8) * 20;
    }

    const noise = (Math.random() - 0.5) * 30;
    estimated = Math.round(estimated + noise);

    // MQ135 raw: roughly correlates but is relative
    const mq135 = Math.round(30 + (estimated - 420) / 900 * 65 + (Math.random() - 0.5) * 8);

    const date = new Date(t);
    const timeLabel = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

    let event: string | undefined;
    if (i === 6) event = 'Occupied';
    if (i === 20) event = 'Threshold';

    points.push({
      time: timeLabel,
      estimated,
      min: estimated - 120,
      max: estimated + 120,
      mq135,
      event,
    });
  }

  return points;
}

// Initial live sensor data for demo
export const INITIAL_SENSOR_DATA: SensorData = {
  timestamp: Date.now(),
  co2Estimated: 1087,
  co2Min: 967,
  co2Max: 1207,
  mq135Raw: 72,
  mq135Mv: 420,
  mq135Idx: 72,
  tempC: 24.1,
  humidity: 52.0,
  temperature: 24.1,
  pirPresence: true,
  windowOpen: false,
  outdoorAQI: 145,
  outdoorPM25: 55.2,
  outdoorTemp: 19.3,
  distanceCm: 125.4,
  people: 1,
  volumeM3: 36,
  ach: 0.4,
  aqiSrc: 'Open-Meteo',
  led: 'AMBER',
  timeScale: 1,
  deviceId: 'esp32-advisor-01',
};

// Demo event stream
export const DEMO_EVENTS = [
  { id: '1', timestamp: Date.now() - 3 * 60000, type: 'recommendation_change' as const, message: 'Recommendation → OPEN WINDOW' },
  { id: '2', timestamp: Date.now() - 8 * 60000, type: 'threshold_crossed' as const, message: 'CO₂ crossed 1,000 ppm threshold' },
  { id: '3', timestamp: Date.now() - 15 * 60000, type: 'occupancy_change' as const, message: 'Occupancy set to 2 persons' },
  { id: '4', timestamp: Date.now() - 42 * 60000, type: 'window_close' as const, message: 'Window closed (ESP32 button)' },
  { id: '5', timestamp: Date.now() - 67 * 60000, type: 'model_reset' as const, message: 'CO₂ model reset → 420 ppm (15-min open)' },
];
