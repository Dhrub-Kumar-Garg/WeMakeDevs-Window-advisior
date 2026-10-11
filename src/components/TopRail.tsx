import { useEffect, useState } from 'react';
import type { AdvisorState } from '@/hooks/useAdvisorState';

export default function TopRail({ state }: { state: AdvisorState }) {
  const { status, ageText } = state.systemStatus;
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const badgeStyle = 
    status === 'LIVE' ? 'bg-[#00d4aa] text-[#111111] font-bold' : 
    status === 'STALE' ? 'bg-[#eab308] text-[#111111] font-bold' : 
    'border border-[#111111] text-[#111111] bg-transparent font-bold';

  const rawLed = state.led !== undefined && state.led !== null ? String(state.led).toUpperCase() : null;
  const hasLed = rawLed !== null;
  const isGreen = hasLed ? (rawLed === 'GREEN' || rawLed === '1' || rawLed === 'OPEN') : state.verdict === 'OPEN_WINDOW';
  const isAmber = hasLed ? (rawLed === 'AMBER' || rawLed === 'YELLOW' || rawLed === '2' || rawLed === 'WAIT') : state.verdict === 'WAIT';
  const isRed = hasLed ? (rawLed === 'RED' || rawLed === '3' || rawLed === '0' || rawLed === 'CLOSED') : state.verdict === 'KEEP_CLOSED';

  return (
    <header 
      className={`fixed top-0 left-0 right-0 h-[40px] z-50 flex justify-between items-center px-4 lg:px-12 font-mono text-[10px] uppercase tracking-widest pointer-events-auto transition-colors duration-200 text-[#111111] ${
        isScrolled 
          ? 'bg-[#f4f0ea] border-b border-[#111111]/15 shadow-xs' 
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="flex-1 flex justify-start overflow-hidden whitespace-nowrap text-ellipsis mr-4 font-semibold tracking-wider">
        WINDOW-OPEN ADVISOR
      </div>
      
      <div className="flex justify-center items-center gap-2 shrink-0" suppressHydrationWarning>
        <div className="hidden sm:flex items-center gap-1.5 mr-2" suppressHydrationWarning>
          <div className={`w-2 h-2 rounded-full ${isGreen ? 'bg-[#00d4aa]' : 'bg-[#111111]/20'}`} title="LED Green (Open)" />
          <div className={`w-2 h-2 rounded-full ${isAmber ? 'bg-[#eab308]' : 'bg-[#111111]/20'}`} title="LED Amber (Wait)" />
          <div className={`w-2 h-2 rounded-full ${isRed ? 'bg-[#ff5f1f]' : 'bg-[#111111]/20'}`} title="LED Red (Closed)" />
          <span className="ml-1 font-semibold" style={{ color: state.verdict === 'WAIT' ? '#eab308' : state.verdict === 'OPEN_WINDOW' ? '#00a880' : '#ff5f1f' }}>
            {state.verdict === 'WAIT' ? 'WAIT' : state.verdict === 'OPEN_WINDOW' ? 'OPEN' : 'CLOSED'}
          </span>
        </div>
        <span suppressHydrationWarning className={`px-2 py-0.5 ${badgeStyle}`}>
          {status}
        </span>
        {state.timeScale > 1 && (
          <span suppressHydrationWarning className="px-2 py-0.5 bg-[#ff5f1f] text-[#111111] font-bold">
            ACCELERATED DEMO x{state.timeScale}
          </span>
        )}
        <span suppressHydrationWarning className="opacity-70 whitespace-nowrap hidden md:inline">last reading {ageText}</span>
      </div>
      
      <div className="flex-1 flex justify-end gap-3 lg:gap-6 ml-4">
        <a href="#now" className="hover:opacity-60 transition-opacity">Now</a>
        <a href="#today" className="hover:opacity-60 transition-opacity hidden sm:inline">Today</a>
        <a href="#evidence" className="hover:opacity-60 transition-opacity hidden md:inline">Evidence</a>
        <a href="#model" className="hover:opacity-60 transition-opacity hidden md:inline">Model</a>
        <a href="#hardware" className="hover:opacity-60 transition-opacity hidden md:inline">Hardware</a>
      </div>
    </header>
  );
}
