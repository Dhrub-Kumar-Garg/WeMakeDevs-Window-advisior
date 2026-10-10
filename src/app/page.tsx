'use client';

import { useAdvisorState } from '@/hooks/useAdvisorState';
import SectionDrawing from '@/components/SectionDrawing';
import VerdictWord from '@/components/VerdictWord';
import TitleBlock from '@/components/TitleBlock';
import ForecastSkyline from '@/components/ForecastSkyline';
import EvidenceTraces from '@/components/EvidenceTraces';
import PlumbingLine from '@/components/PlumbingLine';
import SettingsSheet from '@/components/SettingsSheet';
import WindowDetailDrawer from '@/components/WindowDetailDrawer';

export default function Dashboard() {
  const state = useAdvisorState();

  return (
    <div className="min-h-screen bg-[#f8f9fc] font-sans text-[#111111] overflow-x-hidden selection:bg-[#ff5f1f] selection:text-[#000]">
      {state.isDemo && (
        <div className="fixed top-0 left-0 w-full bg-[#ff5f1f] text-white text-[10px] font-mono text-center py-1 z-50 uppercase tracking-widest font-bold">
          SIMULATED x60
        </div>
      )}

      {/* Sheet 01: VERDICT */}
      <section className="relative w-full h-[100svh] flex flex-col md:flex-row border-b border-[#e2e8f0]">
        {/* Left ~2/3: Drawing edge to edge */}
        <div className="relative w-full md:w-[66.666%] h-[50vh] md:h-full border-b md:border-b-0 md:border-r border-[#e2e8f0]">
          
          <div className="absolute top-6 left-6 z-10 font-serif italic text-2xl md:text-3xl text-[#666666] max-w-[50%]">
            Should this room breathe right now?
          </div>
          
          <SectionDrawing state={state} />
        </div>

        {/* Right ~1/3: Title Block & Verdict Word */}
        <div className="relative w-full md:w-[33.333%] h-[50vh] md:h-full flex flex-col p-6 lg:p-12">
          
          <div className="mt-auto md:mt-0 md:mb-auto">
            <TitleBlock state={state} />
          </div>

          <div className="mt-auto">
            <VerdictWord verdict={state.verdict} />
          </div>

        </div>
      </section>

      {/* Sheet 02: FORECAST */}
      <ForecastSkyline state={state} />

      {/* Sheet 03: EVIDENCE */}
      <EvidenceTraces />

      {/* Sheet 04: PLUMBING */}
      <PlumbingLine />

      {/* Sheet 05: SETTINGS */}
      <SettingsSheet state={state} />

      {/* Overlays */}
      <WindowDetailDrawer state={state} />

    </div>
  );
}
