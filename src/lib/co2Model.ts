import type { ModelParams, HourlyForecast, CO2DataPoint, VentilationWindow } from './types';

// CO₂ Physics Model
// C += [ (N × 5 / V) − (ACH / 3600) × (C − 420) ] × Δt
export function updateCO2(
  C: number,
  N: number,
  V: number,
  ACH: number,
  dt: number // seconds
): number {
  const emissionRate = (N * 5) / V; // ppm/s contribution
  const ventilationRemoval = (ACH / 3600) * (C - 420);
  const dC = (emissionRate - ventilationRemoval) * dt;
  return Math.max(420, C + dC);
}

// Predict CO₂ trajectory forward in time
export function predictCO2Trajectory(
  C0: number,
  params: ModelParams,
  windowOpen: boolean,
  steps: number,
  dtSeconds: number = 60
): Array<{ time: number; co2: number }> {
  const ACH = windowOpen ? params.achOpen : params.achClosed;
  let C = C0;
  const result = [];

  for (let i = 0; i < steps; i++) {
    C = updateCO2(C, params.occupants, params.roomVolume, ACH, dtSeconds);
    result.push({ time: (i + 1) * dtSeconds, co2: Math.round(C) });
  }

  return result;
}

// Decision logic
export function computeRecommendation(
  co2Estimated: number,
  outdoorAQI: number,
  params: ModelParams,
  windowOpen: boolean
): 'OPEN_WINDOW' | 'KEEP_CLOSED' | 'WAIT' | 'OPTIMAL' {
  if (windowOpen && co2Estimated < 600) return 'OPTIMAL';
  if (windowOpen) return 'OPTIMAL';
  if (co2Estimated > params.co2Threshold && outdoorAQI < params.aqiThreshold) {
    return 'OPEN_WINDOW';
  }
  if (co2Estimated > params.co2Threshold && outdoorAQI >= params.aqiThreshold) {
    return 'WAIT';
  }
  return 'KEEP_CLOSED';
}

// Compute confidence score
export function computeConfidence(
  co2Estimated: number,
  outdoorAQI: number,
  params: ModelParams,
  occupancySource: 'manual' | 'pir'
): number {
  let confidence = 90;
  // Occupancy uncertainty
  if (occupancySource === 'pir') confidence -= 10;
  // CO₂ near threshold → less confident
  const co2Distance = Math.abs(co2Estimated - params.co2Threshold);
  if (co2Distance < 100) confidence -= 15;
  else if (co2Distance < 200) confidence -= 5;
  // AQI near threshold → less confident
  const aqiDistance = Math.abs(outdoorAQI - params.aqiThreshold);
  if (aqiDistance < 20) confidence -= 10;
  return Math.max(40, Math.min(98, confidence));
}

// AQI to level label
export function aqiToLevel(aqi: number): string {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

// AQI to ventilation quality
export function aqiToVentilationQuality(aqi: number): 'excellent' | 'good' | 'moderate' | 'poor' {
  if (aqi <= 40) return 'excellent';
  if (aqi <= 70) return 'good';
  if (aqi <= 100) return 'moderate';
  return 'poor';
}

// CO₂ reduction estimate when ventilating
export function co2ReductionEstimate(aqi: number, windSpeed: number): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (aqi <= 50 && windSpeed >= 5) return 'HIGH';
  if (aqi <= 80) return 'MEDIUM';
  return 'LOW';
}

// Find best ventilation window in hourly forecast
export function findBestVentilationWindow(forecast: HourlyForecast[]): VentilationWindow | null {
  let bestScore = Infinity;
  let bestHour = -1;

  for (const h of forecast) {
    const score = h.aqi;
    if (score < bestScore) {
      bestScore = score;
      bestHour = h.hour;
    }
  }

  if (bestHour === -1) return null;

  const entry = forecast.find(f => f.hour === bestHour)!;
  return {
    startHour: bestHour,
    endHour: (bestHour + 1) % 24,
    aqi: entry.aqi,
    benefit: entry.co2ReductionEstimate,
  };
}

// CO₂ status label
export function co2StatusLabel(ppm: number): { label: string; level: 'safe' | 'caution' | 'danger' } {
  if (ppm < 700) return { label: 'Healthy', level: 'safe' };
  if (ppm < 1000) return { label: 'Acceptable', level: 'caution' };
  return { label: 'Ventilate', level: 'danger' };
}

// Format hour as HH:00
export function formatHour(h: number): string {
  return `${String(h).padStart(2, '0')}:00`;
}
