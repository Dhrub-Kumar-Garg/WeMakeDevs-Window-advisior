import { motion } from 'framer-motion';
import { useSceneInputs } from './scene/useSceneInputs';
import * as SunCalc from 'suncalc';
import type { AdvisorState } from '@/hooks/useAdvisorState';
import { useState, useEffect } from 'react';

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

function AnimatedVerdict({ text, reducedMotion, accentColor, textColor }: { text: string, reducedMotion: boolean, accentColor: string, textColor: string }) {
  const letters = text.replace('_', ' ').split('');
  return (
    <div className="relative font-serif leading-[0.8] tracking-tight uppercase py-2 flex items-center" aria-live="polite" style={{ fontSize: 'clamp(56px, 10vw, 200px)', color: textColor }}>
      {/* Accent marker (not color-only for state) */}
      <div 
        className="absolute -left-6 lg:-left-12 flex items-center justify-center w-2 h-full" 
        style={{ color: accentColor }}
        aria-hidden="true"
      >
        <div className="w-2 h-3/4 rounded-full" style={{ backgroundColor: accentColor }} />
        <span className="absolute top-1/2 -left-4 -translate-y-1/2 text-sm font-sans font-bold">
          {text === 'WAIT' ? '!' : text === 'OPEN WINDOW' ? '✓' : '•'}
        </span>
      </div>

      <div className="flex flex-wrap" key={text}>
        {letters.map((char, i) => (
          <motion.span
            key={`${char}-${i}`}
            initial={reducedMotion ? false : { y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={reducedMotion ? { duration: 0 } : { type: 'spring', damping: 12, stiffness: 100, delay: i * 0.03 }}
            className={char === ' ' ? 'w-[0.3em]' : ''}
          >
            {char}
          </motion.span>
        ))}
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
    <div className={`relative w-full ${isMobile ? 'max-w-full py-8' : 'max-w-[46vw] h-full'} flex flex-col justify-center pointer-events-auto`}>
      {/* Soft radial scrim for readability on desktop */}
      {!isMobile && (
        <div 
          className="absolute inset-0 -inset-x-[20vw] -inset-y-[20vh] pointer-events-none -z-10"
          style={{
            background: `radial-gradient(ellipse at 30% 50%, ${scrimFade} 0%, transparent 60%)`
          }}
        />
      )}
      
      <div className="pl-8 lg:pl-16">
        <h2 className="font-serif italic text-xl lg:text-3xl mb-2 lg:mb-4" style={{ color: textColor }}>
          {headingText}
        </h2>

        <AnimatedVerdict 
          text={activeVerdict} 
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

        <p className="mt-6 lg:mt-12 font-mono text-[10px] lg:text-xs opacity-60" style={{ color: textColor }}>
          Estimates only: CO₂ is modelled, forecast is modelled.
        </p>
      </div>
    </div>
  );
}
