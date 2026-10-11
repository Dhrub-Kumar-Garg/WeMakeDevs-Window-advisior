import { SensorData, HourlyForecast, ModelParams, LatestReading } from './types';
import { aqiToVentilationQuality, co2ReductionEstimate } from './co2Model';

export type { LatestReading };

export type SourceStatus = 'LIVE' | 'STALE' | 'DEMO' | 'NO DEVICE CONFIGURED' | 'NO DEVICE DATA YET';

export type FetchReadingResult =
  | { success: true; reading: LatestReading }
  | { success: false; reason: 'NO_CONFIG' | 'NOT_FOUND' | 'ERROR'; error?: unknown };

export async function fetchLatestReading(): Promise<FetchReadingResult> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    return { success: false, reason: 'NO_CONFIG' };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${apiUrl}/latest`, {
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.status === 404) {
      return { success: false, reason: 'NOT_FOUND' };
    }

    if (!res.ok) {
      return { success: false, reason: 'ERROR', error: new Error(`HTTP ${res.status}`) };
    }

    const data = await res.json();
    const reading: LatestReading = {
      deviceId: String(data.deviceId || 'esp32-advisor'),
      ts: Number(data.ts ?? (data.timestamp ? Math.floor(data.timestamp / 1000) : Math.floor(Date.now() / 1000))),
      tempC: data.tempC !== undefined ? Number(data.tempC) : undefined,
      humidity: data.humidity !== undefined ? Number(data.humidity) : undefined,
      pir: Boolean(data.pir),
      windowOpen: Boolean(data.windowOpen),
      distanceCm: data.distanceCm !== undefined ? Number(data.distanceCm) : undefined,
      mq135Mv: Number(data.mq135Mv ?? 0),
      mq135Idx: data.mq135Idx !== undefined ? Number(data.mq135Idx) : undefined,
      co2Est: Number(data.co2Est ?? 420),
      people: Number(data.people ?? 1),
      ach: Number(data.ach ?? (data.windowOpen ? 4.0 : 0.4)),
      volumeM3: Number(data.volumeM3 ?? 36),
      aqiOut: Number(data.aqiOut ?? 50),
      aqiSrc: String(data.aqiSrc ?? 'Open-Meteo'),
      led: (data.led === 'green' || data.led === 'red' || data.led === 'off') ? data.led : (data.windowOpen ? 'green' : 'off'),
      timeScale: Number(data.timeScale ?? 1),
    };

    return { success: true, reading };
  } catch (err) {
    clearTimeout(timeoutId);
    return { success: false, reason: 'ERROR', error: err };
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

export function getSourceStatus(
  lastUpdated: number,
  isDemo: boolean,
  lastFetchStatus?: 'IDLE' | 'SUCCESS' | 'NO_CONFIG' | 'NOT_FOUND' | 'ERROR',
  hasApiConfig?: boolean
): SourceStatus {
  if (isDemo) return 'DEMO';
  if (hasApiConfig === false || lastFetchStatus === 'NO_CONFIG') return 'NO DEVICE CONFIGURED';
  if (lastUpdated <= 0) return 'NO DEVICE DATA YET';
  if (lastFetchStatus === 'ERROR') return 'STALE';
  const ageMs = Date.now() - lastUpdated;
  if (ageMs > 60 * 1000) return 'STALE';
  return 'LIVE';
}
