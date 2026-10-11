'use client';

import { Suspense, useState } from 'react';
import type { AdvisorState } from '@/hooks/useAdvisorState';
import { useAdvisorState } from '@/hooks/useAdvisorState';
import dynamic from 'next/dynamic';
const SceneRoot = dynamic(() => import('@/components/scene/SceneRoot'), { ssr: false });
import ForecastSkyline from '@/components/ForecastSkyline';
import EvidenceTraces from '@/components/EvidenceTraces';
import PlumbingLine from '@/components/PlumbingLine';
import ModelSection from '@/components/ModelSection';
import WindowDetailDrawer from '@/components/WindowDetailDrawer';
import TopRail from '@/components/TopRail';
import LeftOverlay from '@/components/LeftOverlay';
import BottomScrubStrip from '@/components/BottomScrubStrip';

import EvidenceStrip from '@/components/EvidenceStrip';

function DashboardContent() {
  const state = useAdvisorState();
  const [focus, setFocus] = useState<string | null>(null);

  return (
    <div className="relative min-h-screen bg-[#f8f9fc] font-sans text-[#111111] overflow-x-hidden selection:bg-[#ff5f1f] selection:text-[#000]">
      
      {/* 3D Scene Background */}
      <div className="relative h-[60svh] w-full md:fixed md:inset-0 md:h-full z-0 pointer-events-auto">
        <SceneRoot />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 pointer-events-none flex flex-col md:block">
        
        {/* Top Rail */}
        <TopRail state={state} />

        {/* Hero Left Overlay */}
        <section id="now" className="relative w-full min-h-[40svh] md:h-[100svh] flex flex-col justify-center px-4 lg:px-12 pointer-events-none bg-[#f8f9fc] md:bg-transparent border-b border-[#e2e8f0] md:border-none pb-24 md:pb-0">
          <LeftOverlay state={state} setFocus={setFocus} />
          <EvidenceStrip state={state} />
        </section>

        {/* Other sections with solid backgrounds to scroll over the 3D scene */}
        <div className="pointer-events-auto bg-[#f8f9fc] relative z-20">
          <section id="today">
             <ForecastSkyline state={state} />
          </section>

          <section id="evidence">
             <EvidenceTraces />
          </section>

          <section id="hardware">
             <PlumbingLine />
          </section>

          <section id="model">
             <ModelSection />
          </section>

          <footer className="p-6 text-center text-xs text-gray-400 font-mono border-t border-[#e2e8f0]">
            HDRI provided by <a href="https://polyhaven.com" target="_blank" rel="noreferrer" className="underline hover:text-[#111]">Poly Haven</a> (CC0).
          </footer>
        </div>

        {/* Overlays */}
        <div className="pointer-events-auto relative z-30">
           <WindowDetailDrawer state={state} />
           <BottomScrubStrip state={state} />
        </div>
      </div>
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
