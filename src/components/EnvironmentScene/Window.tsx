'use client';

import { motion } from 'framer-motion';
import type { WindowState } from '@/lib/types';
import { useEnvironmentStore } from '@/store/useEnvironmentStore';

interface WindowProps {
  state: WindowState;
  onClick: () => void;
}

export default function Window({ state, onClick }: WindowProps) {
  const { setShowWindowDetail } = useEnvironmentStore();
  const isOpen = state === 'open' || state === 'ajar';

  return (
    <div className="relative w-full h-full cursor-pointer pointer-events-auto" onClick={() => setShowWindowDetail(true)}>
      {/* Outer frame */}
      <div className="absolute inset-0 border-[3px] border-[#8E8E8E] bg-[#FAFAFA] rounded-sm" />
      
      {/* Inner glass pane (animates opening) */}
      <motion.div
        className="absolute inset-[3px] border border-[#CCCCCC] bg-[rgba(74,122,150,0.05)] origin-left flex items-center justify-end"
        initial={false}
        animate={{
          rotateY: isOpen ? -65 : 0,
          background: isOpen ? 'rgba(74,122,150,0.01)' : 'rgba(74,122,150,0.1)'
        }}
        transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
        style={{ perspective: 1000 }}
      >
        {/* Latch handle */}
        <motion.div 
          className="w-1.5 h-6 bg-[#666666] rounded-sm mr-1 z-10"
          animate={{
            rotateZ: isOpen ? 0 : 90,
          }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>
      
      {/* Interactive overlay for toggling */}
      <div 
        className="absolute bottom-2 right-2 p-1.5 bg-[#F2F2F2] border border-[#E0E0E0] rounded text-[9px] text-[#666666] uppercase tracking-wider font-mono hover:bg-[#EBEBEB] z-20 transition-colors shadow-sm"
        onClick={(e) => { e.stopPropagation(); onClick(); }}
      >
        Toggle
      </div>
    </div>
  );
}
