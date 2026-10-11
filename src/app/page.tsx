'use client';

import { Suspense, useState, useRef, useEffect } from 'react';
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
import ProjectionRibbon from '@/components/ProjectionRibbon';

function DashboardContent() {
  const state = useAdvisorState();
  const [focus, setFocus] = useState<string | null>(null);

  // Performance: observe hero to pause Canvas when scrolled out of view
  const heroRef = useRef<HTMLElement>(null);
  const [isHeroIntersecting, setIsHeroIntersecting] = useState(true);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsHeroIntersecting(entry.isIntersecting);
      },
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative min-h-screen bg-[#f4f0ea] font-sans text-[#111111] overflow-x-hidden selection:bg-[#ff5f1f] selection:text-[#000]">
      
      {/* Top Rail - Only element that stays fixed */}
      <TopRail state={state} />

      {/* 1. Hero Container: relative h-[100svh] overflow-hidden */}
      <section 
        id="now" 
        ref={heroRef}
        className="relative h-[100svh] overflow-hidden w-full scroll-mt-[40px]"
      >
        {/* Layer 1: 3D Canvas (z-0) */}
        <div className="absolute inset-0 z-0 pointer-events-auto">
          <SceneRoot isIntersecting={isHeroIntersecting} />
        </div>

        {/* Layer 2: Scrim (z-10) */}
        <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-r from-black/5 via-transparent to-transparent" />

        {/* Layer 3: Overlay Text (z-20) */}
        <div className="absolute inset-0 z-20 flex flex-col justify-start md:justify-center px-4 lg:px-12 pointer-events-none pt-[45px] md:pt-0 pb-[230px] md:pb-[145px]">
          <LeftOverlay state={state} setFocus={setFocus} />
        </div>

        {/* Layer 4: Projection Ribbon (z-30) - desktop bottom-right above evidence strip */}
        <div className="hidden md:block absolute bottom-[145px] right-6 z-30 w-[clamp(260px,24vw,360px)] pr-6 pointer-events-none">
          <ProjectionRibbon state={state} />
        </div>

        {/* Layers 5 & 6: Anchored Bottom Strips (Evidence Strip z-40, Time Strip z-50) */}
        <div className="absolute bottom-0 left-0 right-0 z-40 flex flex-col pointer-events-auto">
          <EvidenceStrip state={state} />
          <div className="z-50 relative">
            <BottomScrubStrip state={state} />
          </div>
        </div>
      </section>

      {/* 2. Everything below the hero: normal document flow with SOLID paper background */}
      <div className="relative z-20 bg-[#f4f0ea] text-[#111111] pointer-events-auto">
        <section id="today" className="scroll-mt-[40px] bg-[#f4f0ea]">
          <ForecastSkyline state={state} />
        </section>

        <section id="evidence" className="scroll-mt-[40px] bg-[#f4f0ea]">
          <EvidenceTraces />
        </section>

        <section id="model" className="scroll-mt-[40px] bg-[#f4f0ea]">
          <ModelSection />
        </section>

        <section id="hardware" className="scroll-mt-[40px] bg-[#f4f0ea]">
          <PlumbingLine />
        </section>

        <footer className="p-6 text-center text-xs text-[#8c8273] font-mono border-t border-[#111111]/15 bg-[#f4f0ea]">
          HDRI provided by <a href="https://polyhaven.com" target="_blank" rel="noreferrer" className="underline hover:text-[#111]">Poly Haven</a> (CC0).
        </footer>
      </div>

      {/* Overlays / Drawers */}
      <WindowDetailDrawer state={state} />
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f4f0ea]" />}>
      <DashboardContent />
    </Suspense>
  );
}
