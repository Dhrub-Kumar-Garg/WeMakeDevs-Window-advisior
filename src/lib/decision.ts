export type Verdict = 'OPEN_WINDOW' | 'KEEP_CLOSED' | 'WAIT';

export function computeVerdict(
  co2Estimated: number,
  outdoorAQI: number,
  co2Threshold: number,
  aqiThreshold: number
): Verdict {
  if (co2Estimated > co2Threshold) {
    if (outdoorAQI < aqiThreshold) {
      return 'OPEN_WINDOW';
    } else {
      return 'WAIT';
    }
  }
  return 'KEEP_CLOSED';
}
