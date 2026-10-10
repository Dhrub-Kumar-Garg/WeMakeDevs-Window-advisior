import { SensorData, HourlyForecast, ModelParams } from './types';
import { aqiToVentilationQuality, co2ReductionEstimate } from './co2Model';

export interface LatestReading {
  timestamp: number;
  windowOpen: boolean;
  pirPresence: boolean;
  temperature: number;
  mq135Raw: number;
}

export type SourceStatus = 'LIVE' | 'STALE' | 'DEMO';

export async function fetchLatestReading(): Promise<LatestReading | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;
  try {
    const res = await fetch(`${apiUrl}/latest`, { next: { revalidate: 30 } });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      timestamp: data.timestamp || Date.now(),
      windowOpen: Boolean(data.windowOpen),
      pirPresence: Boolean(data.pirPresence),
      temperature: Number(data.temperature),
      mq135Raw: Number(data.mq135Raw),
    };
  } catch (err) {
    console.error('Failed to fetch latest reading:', err);
    return null;
  }
}

export async function fetchOutdoorForecast(): Promise<HourlyForecast[]> {
  const lat = process.env.NEXT_PUBLIC_LAT || '51.5074';
  const lon = process.env.NEXT_PUBLIC_LON || '-0.1278';
  
  try {
    const [aqiRes, weatherRes] = await Promise.all([
      fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=us_aqi,pm2_5`),
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=wind_speed_10m`)
    ]);

    if (!aqiRes.ok || !weatherRes.ok) return [];

    const aqiData = await aqiRes.json();
    const weatherData = await weatherRes.json();

    const hours = aqiData.hourly.time;
    const forecasts: HourlyForecast[] = [];

    // Map to next 24 hours starting from current hour
    const now = new Date();
    const currentHour = now.getHours();
    
    // Open-Meteo returns ISO8601 strings in time array
    // Find the index of the closest hour
    let startIndex = hours.findIndex((t: string) => new Date(t).getTime() >= now.getTime());
    if (startIndex === -1) startIndex = 0;
    if (startIndex > 0 && new Date(hours[startIndex]).getHours() !== currentHour) {
       // if we passed it slightly, adjust to match current hour exactly
       startIndex = Math.max(0, startIndex - 1);
    }

    for (let i = 0; i < 24; i++) {
      const idx = startIndex + i;
      if (idx >= hours.length) break;
      
      const timeStr = hours[idx];
      const hourVal = new Date(timeStr).getHours();
      const aqi = aqiData.hourly.us_aqi[idx] || 0;
      const pm25 = aqiData.hourly.pm2_5[idx] || 0;
      const windSpeed = weatherData.hourly.wind_speed_10m[idx] || 0;

      forecasts.push({
        hour: hourVal,
        aqi,
        pm25,
        windSpeed,
        ventilationQuality: aqiToVentilationQuality(aqi),
        co2ReductionEstimate: co2ReductionEstimate(aqi, windSpeed)
      });
    }

    return forecasts;
  } catch (err) {
    console.error('Failed to fetch Open-Meteo data', err);
    return [];
  }
}

export function getSourceStatus(readingTime: number, isDemo: boolean): SourceStatus {
  if (isDemo) return 'DEMO';
  const ageMs = Date.now() - readingTime;
  if (ageMs > 2 * 60 * 1000) return 'STALE';
  return 'LIVE';
}
