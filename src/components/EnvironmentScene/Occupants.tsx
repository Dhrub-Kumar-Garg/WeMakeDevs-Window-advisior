'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEnvironmentStore } from '@/store/useEnvironmentStore';
import { Minus, Plus } from 'lucide-react';

interface OccupantsProps {
  count: number;
}

export default function Occupants({ count }: OccupantsProps) {
  const { setOccupants } = useEnvironmentStore();

  const handleMinus = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (count > 0) setOccupants(count - 1);
  };

  const handlePlus = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (count < 4) setOccupants(count + 1);
  };

  return (
    <div className="absolute left-[35%] bottom-[15%] pointer-events-auto">
      <div className="relative flex items-end justify-center h-48 w-48">
        <AnimatePresence>
          {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
            <motion.div
              key={`occupant-${i}`}
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute bottom-0"
              style={{
                left: `${(i * 30) + 10}px`,
                zIndex: 10 - i,
              }}
            >
              {/* Clean architectural human figure */}
              <svg width="24" height="60" viewBox="0 0 24 60" className="opacity-90">
                <circle cx="12" cy="10" r="8" fill="var(--text-muted)" />
                <path d="M 4 22 C 4 18, 20 18, 20 22 L 20 45 L 14 45 L 14 60 L 10 60 L 10 45 L 4 45 Z" fill="var(--text-muted)" />
              </svg>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Stepper Control */}
        <div className="absolute -top-10 bg-[#FFFFFF] border border-[#E0E0E0] shadow-sm rounded-full px-2 py-1 flex items-center gap-2 opacity-0 hover:opacity-100 transition-opacity">
          <button onClick={handleMinus} className="p-1 hover:bg-[#F2F2F2] rounded-full text-[#666666] transition-colors"><Minus size={12} /></button>
          <span className="text-xs font-mono font-medium w-3 text-center text-[#1C1C1C]">{count}</span>
          <button onClick={handlePlus} className="p-1 hover:bg-[#F2F2F2] rounded-full text-[#666666] transition-colors"><Plus size={12} /></button>
        </div>
      </div>
    </div>
  );
}
