'use client';

import type { AdvisorState } from '@/hooks/useAdvisorState';
import { tokens } from '@/design/tokens';
import { useEnvironmentStore } from '@/store/useEnvironmentStore';

export default function TitleBlock({ state }: { state: AdvisorState }) {
  return (
    <div className="flex flex-col border border-[#111111] bg-transparent">
      
      {/* Header */}
      <div className="border-b border-[#111111] p-3 md:p-4 flex items-center justify-between bg-[#111111] text-[#f8f9fc]">
        <div className="font-mono text-xs tracking-widest uppercase font-bold">
          Window-Open Advisor
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => useEnvironmentStore.getState().setShowWindowDetail(true)}
            className="font-mono text-[10px] tracking-widest uppercase hover:text-[#ff5f1f] transition-colors"
          >
            Details
          </button>
          <div className="flex items-center gap-2">
            {/* LED Mirrors */}
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: state.verdict === 'OPEN_WINDOW' ? tokens.colors.oxide : tokens.colors.inkDim }} />
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: state.verdict === 'KEEP_CLOSED' ? tokens.colors.signal : tokens.colors.inkDim }} />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 divide-x divide-[#111111]">
        
        <div className="p-3 md:p-4 flex flex-col gap-1 border-b border-[#111111]">
          <span className="font-mono text-[10px] uppercase text-[#666666]">Volume (V)</span>
          <span className="font-sans font-medium text-lg">36 m³</span>
        </div>

        <div className="p-3 md:p-4 flex flex-col gap-1 border-b border-[#111111]">
          <span className="font-mono text-[10px] uppercase text-[#666666]">Occupants (N)</span>
          <span className="font-sans font-medium text-lg">{state.occupants}</span>
        </div>

        <div className="p-3 md:p-4 flex flex-col gap-1 border-b border-[#111111]">
          <span className="font-mono text-[10px] uppercase text-[#666666]">Window State</span>
          <span className="font-mono text-sm">{state.windowState.toUpperCase()}</span>
        </div>

        <div className="p-3 md:p-4 flex flex-col gap-1 border-b border-[#111111]">
          <span className="font-mono text-[10px] uppercase text-[#666666]">Target Limit</span>
          <span className="font-mono text-sm">1000 ppm</span>
        </div>
        
        {/* Full width row */}
        <div className="col-span-2 p-3 md:p-4 flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase text-[#666666]">System</span>
          <span className="font-sans text-sm text-[#111111]">ESP32 / Physics Extrapolation Model</span>
        </div>

      </div>

    </div>
  );
}
