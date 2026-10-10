import { useEnvironmentStore } from '@/store/useEnvironmentStore';
import { useEffect, useState } from 'react';

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  return reduced;
}

export function useSceneInputs() {
  const store = useEnvironmentStore();
  const reducedMotion = useReducedMotion();

  const co2Limit = store.modelParams.co2Threshold;
  const co2Ratio = store.sensorData.co2Estimated / co2Limit;
  
  const effectiveACH = store.windowState === 'closed'
    ? store.modelParams.achClosed
    : store.modelParams.achClosed + (store.sashAngle / 60) * (store.modelParams.achOpen - store.modelParams.achClosed);

  return {
    co2Ratio,
    outdoorAQI: store.sensorData.outdoorAQI,
    effectiveACH,
    openness: store.sashAngle / 60,
    windowOpen: store.windowState === 'open',
    sceneTime: new Date(store.sensorData.timestamp),
    state: store.recommendation === 'OPEN_WINDOW' ? 'open' : store.recommendation === 'WAIT' ? 'wait' : 'closed',
    reducedMotion
  };
}
