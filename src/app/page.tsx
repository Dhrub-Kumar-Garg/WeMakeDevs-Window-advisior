'use client';

import { Suspense, useState } from 'react';
import type { AdvisorState } from '@/hooks/useAdvisorState';
import { useAdvisorState } from '@/hooks/useAdvisorState';
import SectionDrawing from '@/components/SectionDrawing';
import VerdictWord from '@/components/VerdictWord';
import ForecastSkyline from '@/components/ForecastSkyline';
import EvidenceTraces from '@/components/EvidenceTraces';
import PlumbingLine from '@/components/PlumbingLine';
import ModelSection from '@/components/ModelSection';
import WindowDetailDrawer from '@/components/WindowDetailDrawer';

function ReasonSentence({ state, setFocus }: { state: AdvisorState, setFocus: (v: string | null) => void }) {
  const indoor = <span className="underline decoration-[#e2e8f0] hover:decoration-[#111111] cursor-crosshair" onMouseEnter={() => setFocus('indoor')} onMouseLeave={() => setFocus(null)}>est. CO₂ is {state.co2Estimated} ppm</span>;
  const outdoor = <span className="underline decoration-[#e2e8f0] hover:decoration-[#111111] cursor-crosshair" onMouseEnter={() => setFocus('outdoor')} onMouseLeave={() => setFocus(null)}>Outdoor AQI {state.outdoorAQI}</span>;

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

function DashboardContent() {
  const state = useAdvisorState();
  const [focus, setFocus] = useState<string | null>(null);

  return (
    <div 
      className="min-h-screen bg-[#f8f9fc] font-sans text-[#111111] overflow-x-hidden selection:bg-[#ff5f1f] selection:text-[#000]"
      data-state={state.verdict.toLowerCase()}
    >
      {/* Sheet 01: VERDICT & DRAWING */}
      <section className="relative w-full h-[100svh] flex flex-col border-b border-[#e2e8f0]">
        
        {/* Top area: Verdict + Drawing */}
        <div className="flex-1 flex flex-col md:flex-row-reverse min-h-0">
          
          {/* Right ~1/3: Verdict Column */}
          <div className="relative w-full md:w-[33.333%] h-auto md:h-full flex flex-col p-6 lg:p-12 justify-center border-b md:border-b-0 md:border-l border-[#e2e8f0] bg-[#f8f9fc]">
            
            <div className="font-mono text-[10px] uppercase tracking-widest text-[#666666] mb-4 flex items-center justify-between">
              <span>RECOMMENDATION &middot; {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span className={`px-2 py-0.5 text-white ${state.sourceStatus === 'LIVE' ? 'bg-[#111111]' : state.sourceStatus === 'STALE' ? 'bg-[#E8A200]' : 'bg-[#ff5f1f]'}`}>
                {state.sourceStatus}
              </span>
            </div>
            
            <VerdictWord state={state} />

            <div className="mt-8 font-serif italic text-2xl md:text-3xl text-[#111111] leading-tight">
              <ReasonSentence state={state} setFocus={setFocus} />
            </div>

          </div>

          {/* Left ~2/3: Drawing edge to edge */}
          <div className="relative w-full md:w-[66.666%] h-[60vh] md:h-full">
            <SectionDrawing state={state} focus={focus} />
          </div>

        </div>

      </section>

      {/* Sheet 02: FORECAST */}
      <ForecastSkyline state={state} />

      {/* Sheet 03: EVIDENCE */}
      <EvidenceTraces />

      {/* Sheet 04: PLUMBING */}
      <PlumbingLine />

      {/* Sheet 05: MODEL PARAMS */}
      <ModelSection />

      {/* Overlays */}
      <WindowDetailDrawer state={state} />

    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8f9fc]" />}>
      <DashboardContent />
    </Suspense>
  );
}
