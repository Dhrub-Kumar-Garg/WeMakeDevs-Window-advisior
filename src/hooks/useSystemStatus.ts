import { useState, useEffect } from 'react';
import { useEnvironmentStore } from '@/store/useEnvironmentStore';
import { useSearchParams } from 'next/navigation';

export type SystemStatusType = 'LIVE' | 'STALE' | 'DEMO';

export interface SystemStatus {
  status: SystemStatusType;
  ageSeconds: number;
  ageText: string;
}

export function computeSystemStatus(lastUpdated: number, isDemo: boolean): SystemStatus {
  const ageSeconds = Math.max(0, Math.floor((Date.now() - lastUpdated) / 1000));
  
  let status: SystemStatusType = 'LIVE';
  if (isDemo) {
    status = 'DEMO';
  } else if (ageSeconds >= 120) {
    status = 'STALE';
  } else {
    status = 'LIVE';
  }

  let ageText = '';
  if (isDemo) {
    ageText = `${ageSeconds}s ago`;
  } else if (status === 'STALE') {
    // "last reading just now" can NEVER appear with STALE.
    if (ageSeconds < 3600) {
      ageText = `${Math.floor(ageSeconds / 60)}m ago`;
    } else {
      ageText = `${Math.floor(ageSeconds / 3600)}h ago`;
    }
  } else {
    // LIVE
    if (ageSeconds === 0) {
      ageText = 'just now';
    } else if (ageSeconds < 60) {
      ageText = `${ageSeconds}s ago`;
    } else {
      ageText = `${Math.floor(ageSeconds / 60)}m ago`;
    }
  }

  return { status, ageSeconds, ageText };
}

/**
 * Universal selector for system status and reading age.
 * Used identically across TopRail, Verdict Caption (LeftOverlay), and EvidenceStrip.
 */
export function useSystemStatus(): SystemStatus {
  const lastUpdated = useEnvironmentStore((s) => s.lastUpdated);
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === '1' || searchParams.get('demo') === 'true';

  const [isMounted, setIsMounted] = useState(false);
  const [state, setState] = useState<SystemStatus>(() => computeSystemStatus(lastUpdated, isDemo));

  useEffect(() => {
    setIsMounted(true);
    setState(computeSystemStatus(lastUpdated, isDemo));
    const interval = setInterval(() => {
      setState(computeSystemStatus(lastUpdated, isDemo));
    }, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated, isDemo]);

  if (!isMounted) {
    return {
      status: isDemo ? 'DEMO' : 'LIVE',
      ageSeconds: 0,
      ageText: isDemo ? '0s ago' : 'just now',
    };
  }

  return state;
}
