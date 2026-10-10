'use client';

import type { AdvisorState } from '@/hooks/useAdvisorState';
import { useRouter, usePathname } from 'next/navigation';

export default function SettingsSheet({ state }: { state: AdvisorState }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleDemoToggle = () => {
    if (state.isDemo) {
      router.push(pathname);
    } else {
      router.push(`${pathname}?demo=1`);
    }
  };

  return (
    <section className="w-full bg-[#111111] text-[#f8f9fc] p-6 lg:p-12 pb-24">
      <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-12">
        
        <div className="flex-shrink-0 w-64">
          <h2 className="font-serif italic text-3xl mb-2">Settings</h2>
          <p className="font-mono text-xs uppercase tracking-widest text-[#a0aec0]">Configuration</p>
        </div>

        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 font-mono text-sm">
          
          <div className="flex flex-col gap-4 border-t border-[#333333] pt-4">
            <span className="uppercase text-[#a0aec0] text-[10px] tracking-wider">Occupant Assist</span>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => state.setOccupants(Math.max(0, state.occupants - 1))}
                className="w-8 h-8 flex items-center justify-center border border-[#333333] hover:border-[#f8f9fc] transition-colors"
              >-</button>
              <span className="text-xl font-sans w-4 text-center">{state.occupants}</span>
              <button 
                onClick={() => state.setOccupants(state.occupants + 1)}
                className="w-8 h-8 flex items-center justify-center border border-[#333333] hover:border-[#f8f9fc] transition-colors"
              >+</button>
            </div>
            <p className="text-[10px] text-[#666666]">Base rate: 5 ppm/s per occupant.</p>
          </div>

          <div className="flex flex-col gap-4 border-t border-[#333333] pt-4">
            <span className="uppercase text-[#a0aec0] text-[10px] tracking-wider">Room Volume</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-sans">36</span>
              <span className="text-[#666666]">m³</span>
            </div>
            <p className="text-[10px] text-[#666666]">Fixed dimension for prototype.</p>
          </div>

          <div className="flex flex-col gap-4 border-t border-[#333333] pt-4">
            <span className="uppercase text-[#a0aec0] text-[10px] tracking-wider">Thresholds</span>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between border-b border-[#333333] pb-1">
                <span className="text-[#666666]">CO₂</span>
                <span>1000 ppm</span>
              </div>
              <div className="flex justify-between border-b border-[#333333] pb-1">
                <span className="text-[#666666]">AQI</span>
                <span>100</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-[#333333] pt-4">
            <span className="uppercase text-[#a0aec0] text-[10px] tracking-wider">Demo Mode</span>
            <button 
              onClick={handleDemoToggle}
              className={`py-3 px-6 text-xs uppercase tracking-widest transition-colors border ${state.isDemo ? 'bg-[#ff5f1f] border-[#ff5f1f] text-white' : 'bg-transparent border-[#333333] text-[#f8f9fc] hover:border-[#f8f9fc]'}`}
            >
              {state.isDemo ? 'Disable Demo' : 'Enable Demo (x60)'}
            </button>
            <p className="text-[10px] text-[#666666]">Compresses time to show full scenario.</p>
          </div>

        </div>

      </div>
    </section>
  );
}
