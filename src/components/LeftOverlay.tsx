import { motion } from 'framer-motion';
import { useSceneInputs } from './scene/useSceneInputs';
import * as SunCalc from 'suncalc';
import type { AdvisorState } from '@/hooks/useAdvisorState';
import { useState, useEffect } from 'react';
import { updateCO2 } from '@/lib/co2Model';
import ProjectionRibbon from './ProjectionRibbon';

function ReasonSentence({ state, setFocus, textColor }: { state: AdvisorState, setFocus: (v: string | null) => void, textColor: string }) {
  const indoor = (
    <span 
      className="underline decoration-current hover:opacity-70 cursor-crosshair transition-opacity" 
      onMouseEnter={() => setFocus('indoor')} 
      onMouseLeave={() => setFocus(null)}
    >
      est. CO₂ is {state.co2Estimated} ppm
    </span>
  );
  
  const outdoor = (
    <span 
      className="underline decoration-current hover:opacity-70 cursor-crosshair transition-opacity" 
      onMouseEnter={() => setFocus('outdoor')} 
      onMouseLeave={() => setFocus(null)}
    >
      Outdoor AQI {state.outdoorAQI}
    </span>
  );

  if (state.verdict === 'WAIT') {
    return <>Outdoor air is above your limit now; best time is {state.waitUntil || 'later'}.</>;
  }
  if (state.verdict === 'OPEN_WINDOW') {
    return <>{outdoor} is under your {state.modelParams.aqiThreshold} limit; {indoor} and the best window lasts ~50 min.</>;
  }
  
  if (state.co2Estimated <= state.modelParams.co2Threshold) {
    return <>{indoor}, which is under your {state.modelParams.co2Threshold} limit.</>;
  } else {
    return <>{outdoor} is above your {state.modelParams.aqiThreshold} limit.</>;
  }
}

function AnimatedVerdict({ verdictId, reducedMotion, accentColor, textColor }: { verdictId: string, reducedMotion: boolean, accentColor: string, textColor: string }) {
  const verdictLines: Record<string, string[]> = {
    'OPEN_WINDOW': ['OPEN', 'WINDOW'],
    'KEEP_CLOSED': ['KEEP', 'WINDOW', 'CLOSED'],
    'WAIT': ['WAIT FOR', 'BETTER AIR'],
    'OPTIMAL': ['AIR IS', 'OPTIMAL']
  };

  const lines = verdictLines[verdictId] || [verdictId.replace('_', ' ')];
  const longestLineLen = Math.max(...lines.map(l => l.length));

  return (
    <div className="relative font-serif leading-[0.9] tracking-tight uppercase py-2 flex flex-col @container w-full" aria-live="polite" style={{ color: textColor }}>
      {/* Accent marker (not color-only for state) */}
      <div 
        className="absolute -left-4 lg:-left-8 flex items-center justify-center w-2 h-full" 
        style={{ color: accentColor }}
        aria-hidden="true"
      >
        <div className="w-2 h-3/4 rounded-full" style={{ backgroundColor: accentColor }} />
        <span className="absolute top-1/2 -left-3 -translate-y-1/2 text-sm font-sans font-bold">
          {verdictId === 'WAIT' ? '!' : verdictId === 'OPEN_WINDOW' ? '✓' : '•'}
        </span>
      </div>

      <div 
        className="flex flex-col" 
        key={verdictId}
        style={{ fontSize: `clamp(48px, 100cqw / ${longestLineLen * 0.55}, 200px)` }}
      >
        {lines.map((line, li) => {
          const words = line.split(' ');
          return (
            <div key={li} className="block whitespace-nowrap break-keep" style={{ hyphens: 'none' }}>
              {words.map((word, wi) => (
                <span key={wi} className="inline-block whitespace-nowrap break-keep" style={{ hyphens: 'none' }}>
                  {word.split('').map((char, ci) => {
                    const delayIndex = li * 10 + wi * 5 + ci;
                    return (
                      <motion.span
                        key={ci}
                        className="inline-block"
                        initial={reducedMotion ? false : { y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={reducedMotion ? { duration: 0 } : { type: 'spring', damping: 12, stiffness: 100, delay: delayIndex * 0.03 }}
                      >
                        {char}
                      </motion.span>
                    );
                  })}
                  {wi < words.length - 1 && <span className="inline-block w-[0.3em]">&nbsp;</span>}
                </span>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WhatIfControl({ state, textColor }: { state: AdvisorState; textColor: string }) {
  const currentPreview = state.previewOpen;
  const realWindowOpen = state.windowState === 'open';
  const isClosedActive = currentPreview === false;
  const isOpenActive = currentPreview === true;
  const isPreviewDiff = currentPreview !== null && currentPreview !== realWindowOpen;

  const { co2Estimated, outdoorAQI, modelParams } = state;
  const targetCO2 = modelParams.co2Threshold;
  const [achLow, achHigh] = modelParams.achOpenRange || [2, 6];
  const occupants = modelParams.occupants;

  let resultLine: string | null = null;

  if (currentPreview === true) {
    const timeToLimit = (ach: number): number | null => {
      if (co2Estimated <= targetCO2) return 0;
      let c = co2Estimated;
      let t = 0;
      const dt = 10;
      const maxT = 180 * 60;
      while (t < maxT) {
        c = updateCO2(c, occupants, modelParams.roomVolume, ach, dt);
        t += dt;
        if (c <= targetCO2) return Math.round(t / 60);
      }
      return null;
    };

    const tFast = timeToLimit(achHigh);
    const tSlow = timeToLimit(achLow);

    let timeText = 'n/a';
    if (tFast !== null && tSlow !== null) {
      if (tFast === 0 && tSlow === 0) {
        timeText = '0 min (already below limit)';
      } else {
        timeText = `~${tFast}-${tSlow} min`;
      }
    }

    resultLine = `est. CO₂ could fall below ${targetCO2} ppm in ${timeText} (assumed ACH ${achLow}-${achHigh})`;
    if (outdoorAQI > modelParams.aqiThreshold) {
      resultLine += `, but outdoor AQI is ${Math.round(outdoorAQI)} (modelled), above your limit of ${modelParams.aqiThreshold}`;
    }
  } else if (currentPreview === false) {
    if (co2Estimated >= targetCO2) {
      resultLine = `est. CO₂ is currently at ${Math.round(co2Estimated)} ppm, above your ${targetCO2} ppm limit`;
    } else {
      let c = co2Estimated;
      let reachesZ: number | null = null;
      const dt = 10;
      const maxT = 60 * 60;
      let t = 0;
      while (t < maxT) {
        c = updateCO2(c, occupants, modelParams.roomVolume, modelParams.achClosed, dt);
        t += dt;
        if (c >= targetCO2) {
          reachesZ = Math.round(t / 60);
          break;
        }
      }
      if (reachesZ !== null) {
        resultLine = `est. CO₂ reaches ${targetCO2} ppm in ~${reachesZ} min`;
      } else {
        resultLine = `stays below the limit for the next 60 min`;
      }
    }
  }

  return (
    <div className="mt-4 lg:mt-6 font-mono text-xs">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-[11px] uppercase tracking-wider opacity-75 font-semibold mr-1" style={{ color: textColor }}>
          WHAT IF I...
        </span>

        <button
          type="button"
          onClick={() => state.setPreviewOpen(false)}
          aria-pressed={isClosedActive}
          className={`min-h-[44px] px-3.5 py-1 text-xs uppercase tracking-wider border border-[#111111]/25 hover:border-[#111111]/70 transition-colors focus-visible:outline-2 focus-visible:outline-black relative ${
            isClosedActive
              ? 'font-bold border-b-2 border-b-[#111111] bg-black/5'
              : 'opacity-80'
          }`}
          style={{ color: textColor }}
        >
          KEEP CLOSED
        </button>

        <button
          type="button"
          onClick={() => state.setPreviewOpen(true)}
          aria-pressed={isOpenActive}
          className={`min-h-[44px] px-3.5 py-1 text-xs uppercase tracking-wider border border-[#111111]/25 hover:border-[#111111]/70 transition-colors focus-visible:outline-2 focus-visible:outline-black relative ${
            isOpenActive
              ? 'font-bold border-b-2 border-b-[#111111] bg-black/5'
              : 'opacity-80'
          }`}
          style={{ color: textColor }}
        >
          OPEN NOW
        </button>

        {isPreviewDiff && (
          <div className="flex items-center gap-2 ml-1">
            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-[#111111] text-[#f4f0ea]">
              PREVIEW
            </span>
            <button
              type="button"
              onClick={() => state.setPreviewOpen(null)}
              className="text-[11px] underline opacity-75 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-black transition-opacity"
              style={{ color: textColor }}
            >
              back to real state
            </button>
          </div>
        )}
      </div>

      {resultLine && (
        <div 
          className="text-[12px] md:text-[11px] py-1.5 px-2.5 border-l-2 border-[#111111] mt-2.5 max-w-xl"
          style={{ backgroundColor: 'rgba(244,240,234,0.85)', color: '#111111' }}
        >
          {resultLine}
        </div>
      )}

      {/* On mobile: ribbon moves below the buttons */}
      <div className="block md:hidden mt-3 max-w-xs">
        <ProjectionRibbon state={state} />
      </div>
    </div>
  );
}

export default function LeftOverlay({ state, setFocus }: { state: AdvisorState, setFocus: (v: string | null) => void }) {
  const { sceneTime, reducedMotion, isMobile } = useSceneInputs();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const lat = parseFloat(process.env.NEXT_PUBLIC_LAT || '12.9692');
  const lon = parseFloat(process.env.NEXT_PUBLIC_LON || '79.1559');
  
  const sunPos = SunCalc.getPosition(sceneTime, lat, lon);
  const altitude = sunPos.altitude;
  
  const isNight = isMounted ? (altitude < -0.05) : false;

  const textColor = (isNight && !isMobile) ? '#f8fafc' : '#111111';
  const scrimFade = (isNight && !isMobile) ? 'rgba(0,0,0,0.6)' : (isMobile ? 'transparent' : 'rgba(255,255,255,0.7)');

  const activeVerdict = state.scrubHour !== null && state.predictedVerdict ? state.predictedVerdict : state.verdict;
  const accentColor = activeVerdict === 'WAIT' ? '#eab308' : 
                      activeVerdict === 'OPEN_WINDOW' ? '#00d8a5' : 
                      '#ff5f1f';

  const headingText = state.scrubHour !== null 
    ? `At ${String(state.scrubHour).padStart(2, '0')}:00 \u2192 (PREDICTED)`
    : 'Should I open the window?';

  return (
    <div className={`relative w-full ${isMobile ? 'max-w-full pt-6 pb-6' : 'max-w-[46vw] h-full'} flex flex-col justify-center pointer-events-auto`}>
      {/* Scrim removed to prevent washing out the 3D scene */}
      
      <div className="pl-8 lg:pl-16">
        <h2 className="font-serif italic text-xl lg:text-3xl mb-2 lg:mb-4" style={{ color: textColor }}>
          {headingText}
        </h2>

        <AnimatedVerdict 
          verdictId={activeVerdict} 
          reducedMotion={reducedMotion} 
          accentColor={accentColor} 
          textColor={textColor}
        />

        <div className="mt-4 lg:mt-8 font-serif italic text-xl md:text-3xl leading-tight max-w-xl" style={{ color: textColor }}>
          {state.scrubHour !== null ? (
            <>Projected CO₂ {state.predictedCO2} ppm; assumes current occupancy, window closed.</>
          ) : (
            <ReasonSentence state={state} setFocus={setFocus} textColor={textColor} />
          )}
        </div>

        {/* What if I... control */}
        <WhatIfControl state={state} textColor={textColor} />

        <p suppressHydrationWarning className="mt-6 lg:mt-12 font-mono text-[10px] lg:text-xs opacity-60" style={{ color: textColor }}>
          Estimates only: CO₂ is modelled, forecast is modelled. • {state.systemStatus.status} (last reading {state.systemStatus.ageText})
        </p>
      </div>
    </div>
  );
}
