'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '@/design/tokens';
import type { AdvisorState } from '@/hooks/useAdvisorState';

export default function VerdictWord({ state }: { state: AdvisorState }) {
  const getVerdictText = () => {
    switch (state.verdict) {
      case 'OPEN_WINDOW': return 'OPEN WINDOW';
      case 'KEEP_CLOSED': return 'KEEP WINDOW CLOSED';
      case 'WAIT': return state.waitUntil ? `WAIT UNTIL ${state.waitUntil}` : 'WAIT';
    }
  };

  const getVerdictColor = () => {
    switch (state.verdict) {
      case 'OPEN_WINDOW': return tokens.colors.oxide;
      case 'KEEP_CLOSED': return tokens.colors.signal;
      case 'WAIT': return tokens.colors.wait || tokens.colors.ink;
    }
  };

  return (
    <div 
      className="relative w-full overflow-hidden flex-1 min-h-[150px]" 
      aria-live="polite"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={state.verdict}
          initial={{ clipPath: 'inset(0 100% 0 0)' }} // Wipe from left to right
          animate={{ clipPath: 'inset(0 0 0 0)' }}
          exit={{ clipPath: 'inset(0 0 0 100%)', transition: { duration: 0.45, ease: [0.2, 0.7, 0.1, 1] } }}
          transition={{ duration: 0.45, ease: [0.2, 0.7, 0.1, 1] }}
          className="absolute inset-0 flex flex-col justify-end pb-8"
        >
          <h1 
            className="leading-none font-bold tracking-tighter uppercase whitespace-pre-wrap"
            style={{ 
              color: getVerdictColor(),
              fontSize: 'clamp(3rem, 7vw, 7rem)', // Fluid typography
              wordBreak: 'keep-all'
            }}
          >
            {getVerdictText()}
          </h1>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
