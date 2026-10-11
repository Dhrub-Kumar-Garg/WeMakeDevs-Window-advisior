import type { AdvisorState } from '@/hooks/useAdvisorState';
import { updateCO2 } from '@/lib/co2Model';

export default function EvidenceStrip({ state }: { state: AdvisorState }) {
  const { co2Estimated, outdoorAQI, modelParams } = state;
  const achOpenRange = modelParams.achOpenRange || [2, 6];
  const targetCO2 = modelParams.co2Threshold;

  function getMin(ach: number) {
    if (co2Estimated <= targetCO2) return 0;
    let c = co2Estimated;
    let t = 0;
    const dt = 10;
    const maxT = 180 * 60;
    while (t < maxT) {
      c = updateCO2(c, modelParams.occupants, modelParams.roomVolume, ach, dt);
      t += dt;
      if (c <= targetCO2) return Math.round(t / 60);
    }
    return null;
  }

  const tFast = getMin(achOpenRange[1]);
  const tSlow = getMin(achOpenRange[0]);

  let timeText = 'n/a';
  let accentColor = '#111';
  if (tFast !== null && tSlow !== null) {
    if (tFast === 0 && tSlow === 0) {
      timeText = 'below limit';
      accentColor = '#00d8a5';
    } else {
      timeText = `~${tFast}-${tSlow} min`;
      if (tSlow <= 20) accentColor = '#00d8a5';
      else if (tSlow <= 60) accentColor = '#eab308';
      else accentColor = '#ff5f1f';
    }
  }

  const indoorAccent = co2Estimated > targetCO2 ? (co2Estimated > targetCO2 + 200 ? '#ff5f1f' : '#eab308') : '#00d8a5';
  const outdoorAccent = outdoorAQI > modelParams.aqiThreshold ? '#ff5f1f' : '#00d8a5';

  return (
    <div 
      id="evidence-strip"
      className="w-full border-t border-[#111111]/15 flex flex-col md:flex-row pointer-events-auto text-[#111111] shrink-0"
      style={{ backgroundColor: 'rgba(244,240,234,0.92)' }}
    >
      {/* 1) INDOOR */}
      <div className="flex-1 border-b md:border-b-0 md:border-r border-[#111111]/15 px-4 lg:px-6 py-1.5 md:py-2.5 flex items-center">
        <div className="w-1.5 h-10 mr-3.5 shrink-0" style={{ backgroundColor: indoorAccent }} />
        <div className="min-w-0">
          <div className="text-sm font-mono uppercase tracking-wider text-[#111111]/70 mb-0.5">
            INDOOR (estimated)
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-sans font-bold text-[40px] lg:text-[44px] leading-none tracking-tight text-[#111111]">
              {Math.round(co2Estimated)}
            </span>
            <span className="font-mono text-[12px] text-[#111111]/80 whitespace-nowrap">
              ppm est. CO₂
            </span>
          </div>
          <div suppressHydrationWarning className="text-[12px] md:text-[11px] font-mono text-[#111111]/60 mt-0.5 flex items-center gap-1.5">
            <span>limit {targetCO2}</span>
            <span>•</span>
            <span>{state.systemStatus.status} ({state.systemStatus.ageText})</span>
          </div>
        </div>
      </div>
      
      {/* 2) OUTDOOR */}
      <div className="flex-1 border-b md:border-b-0 md:border-r border-[#111111]/15 px-4 lg:px-6 py-1.5 md:py-2.5 flex items-center">
        <div className="w-1.5 h-10 mr-3.5 shrink-0" style={{ backgroundColor: outdoorAccent }} />
        <div className="min-w-0">
          <div className="text-sm font-mono uppercase tracking-wider text-[#111111]/70 mb-0.5">
            OUTDOOR (modelled)
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-sans font-bold text-[40px] lg:text-[44px] leading-none tracking-tight text-[#111111]">
              {Math.round(outdoorAQI)}
            </span>
            <span className="font-mono text-[12px] text-[#111111]/80 whitespace-nowrap">
              modelled, Open-Meteo
            </span>
          </div>
          <div className="text-[12px] md:text-[11px] font-mono text-[#111111]/60 mt-0.5">
            limit {modelParams.aqiThreshold}
          </div>
        </div>
      </div>

      {/* 3) IF YOU OPEN NOW */}
      <div className="flex-1 px-4 lg:px-6 py-1.5 md:py-2.5 flex items-center">
        <div className="w-1.5 h-10 mr-3.5 shrink-0" style={{ backgroundColor: accentColor }} />
        <div className="min-w-0">
          <div className="text-sm font-mono uppercase tracking-wider text-[#111111]/70 mb-0.5">
            IF YOU OPEN NOW (predicted)
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-sans font-bold text-[40px] lg:text-[44px] leading-none tracking-tight text-[#111111]">
              {timeText}
            </span>
          </div>
          <div className="text-[12px] md:text-[11px] font-mono text-[#111111]/60 mt-0.5">
            assumed ACH {achOpenRange[0]}-{achOpenRange[1]}
          </div>
        </div>
      </div>
    </div>
  );
}
