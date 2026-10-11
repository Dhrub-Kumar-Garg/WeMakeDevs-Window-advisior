import { useState, useEffect } from 'react';
import { useEnvironmentStore } from '@/store/useEnvironmentStore';
import { useSearchParams } from 'next/navigation';

export type SystemStatusType = 'LIVE' | 'STALE' | 'DEMO' | 'NO DEVICE CONFIGURED' | 'NO DEVICE DATA YET';

export interface SystemStatus {
  status: SystemStatusType;
  ageSeconds: number;
  ageText: string;
}

export function computeSystemStatus(
  lastUpdated: number,
  isDemo: boolean,
  lastFetchStatus: 'IDLE' | 'SUCCESS' | 'NO_CONFIG' | 'NOT_FOUND' | 'ERROR',
  hasApiConfig: boolean
): SystemStatus {
  if (isDemo) {
    const ageSeconds = lastUpdated > 0 ? Math.max(0, Math.floor((Date.now() - lastUpdated) / 1000)) : 0;
    return {
      status: 'DEMO',
      ageSeconds,
      ageText: `${ageSeconds}s ago`,
    };
  }

  if (!hasApiConfig || lastFetchStatus === 'NO_CONFIG') {
    return {
      status: 'NO DEVICE CONFIGURED',
      ageSeconds: 0,
      ageText: '—',
    };
  }

  if (lastFetchStatus === 'NOT_FOUND' && lastUpdated <= 0) {
    return {
      status: 'NO DEVICE DATA YET',
      ageSeconds: 0,
      ageText: '—',
    };
  }

  if (lastUpdated <= 0) {
    return {
      status: 'NO DEVICE DATA YET',
      ageSeconds: 0,
      ageText: '—',
    };
  }

  const ageSeconds = Math.max(0, Math.floor((Date.now() - lastUpdated) / 1000));

  // On failure keep the last value and show STALE
  if (lastFetchStatus === 'ERROR') {
    const ageText = ageSeconds < 60
      ? `${ageSeconds}s ago`
      : (ageSeconds < 3600 ? `${Math.floor(ageSeconds / 60)}m ago` : `${Math.floor(ageSeconds / 3600)}h ago`);
    return {
      status: 'STALE',
      ageSeconds,
      ageText,
    };
  }

  // LIVE if age <= 60 s, STALE otherwise
  if (ageSeconds <= 60) {
    return {
      status: 'LIVE',
      ageSeconds,
      ageText: ageSeconds === 0 ? 'just now' : `${ageSeconds}s ago`,
    };
  }

  const ageText = ageSeconds < 3600
    ? `${Math.floor(ageSeconds / 60)}m ago`
    : `${Math.floor(ageSeconds / 3600)}h ago`;

  return {
    status: 'STALE',
    ageSeconds,
    ageText,
  };
}

/**
 * Universal selector for system status and reading age.
 * Used identically across TopRail, Verdict Caption (LeftOverlay), and EvidenceStrip.
 */
export function useSystemStatus(): SystemStatus {
  const lastUpdated = useEnvironmentStore((s) => s.lastUpdated);
  const lastFetchStatus = useEnvironmentStore((s) => s.lastFetchStatus);
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === '1';
  const hasApiConfig = Boolean(process.env.NEXT_PUBLIC_API_URL);

  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return computeSystemStatus(lastUpdated, isDemo, lastFetchStatus, hasApiConfig);
}
