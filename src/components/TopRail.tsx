import { useEffect, useState } from 'react';
import { useEnvironmentStore } from '@/store/useEnvironmentStore';
import type { AdvisorState } from '@/hooks/useAdvisorState';

export default function TopRail({ state }: { state: AdvisorState }) {
  const { status, ageText } = state.systemStatus;

  const badgeColor = status === 'LIVE' ? 'bg-[#00d8a5] text-black' : 
                     status === 'STALE' ? 'bg-[#eab308] text-black' : 
                     'bg-[#ff5f1f] text-white';

  return (
    <header className="fixed top-0 left-0 right-0 h-[40px] z-50 flex justify-between items-center px-4 lg:px-12 font-mono text-[10px] uppercase tracking-widest pointer-events-auto text-[#111] mix-blend-difference invert-0">
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none -z-10" />
      
      <div className="flex-1 flex justify-start text-white overflow-hidden whitespace-nowrap text-ellipsis mr-4">
        WINDOW-OPEN ADVISOR
      </div>
      
      <div className="flex justify-center items-center gap-2 text-white shrink-0" suppressHydrationWarning>
        <div className="hidden sm:flex items-center gap-1.5 mr-2" suppressHydrationWarning>
          <div className={`w-2 h-2 rounded-full ${state.verdict === 'OPEN_WINDOW' ? 'bg-[#00d8a5]' : 'bg-[#333]'}`} />
          <div className={`w-2 h-2 rounded-full ${state.verdict === 'WAIT' ? 'bg-[#eab308]' : 'bg-[#333]'}`} />
          <div className={`w-2 h-2 rounded-full ${state.verdict === 'KEEP_CLOSED' ? 'bg-[#ff5f1f]' : 'bg-[#333]'}`} />
          <span className="ml-1 opacity-90" style={{ color: state.verdict === 'WAIT' ? '#eab308' : state.verdict === 'OPEN_WINDOW' ? '#00d8a5' : '#ff5f1f' }}>
            {state.verdict === 'WAIT' ? 'WAIT' : state.verdict === 'OPEN_WINDOW' ? 'OPEN' : 'CLOSED'}
          </span>
        </div>
        <span suppressHydrationWarning className={`px-2 py-0.5 font-bold ${badgeColor}`}>
          {status}
        </span>
        <span suppressHydrationWarning className="opacity-70 whitespace-nowrap hidden md:inline">last reading {ageText}</span>
      </div>
      
      <div className="flex-1 flex justify-end gap-3 lg:gap-6 text-white ml-4">
        <a href="#now" className="hover:opacity-70 transition-opacity">Now</a>
        <a href="#today" className="hover:opacity-70 transition-opacity hidden sm:inline">Today</a>
        <a href="#evidence" className="hover:opacity-70 transition-opacity hidden md:inline">Evidence</a>
        <a href="#model" className="hover:opacity-70 transition-opacity hidden md:inline">Model</a>
        <a href="#hardware" className="hover:opacity-70 transition-opacity hidden md:inline">Hardware</a>
      </div>
    </header>
  );
}
