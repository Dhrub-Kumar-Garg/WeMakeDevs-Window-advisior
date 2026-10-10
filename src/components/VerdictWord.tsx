'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '@/design/tokens';
import type { Verdict } from '@/hooks/useAdvisorState';

export default function VerdictWord({ verdict }: { verdict: Verdict }) {
  const getVerdictText = () => {
    switch (verdict) {
      case 'OPEN_WINDOW': return 'OPEN WINDOW';
      case 'KEEP_CLOSED': return 'KEEP WINDOW CLOSED';
      case 'WAIT': return 'WAIT';
    }
  };

  const getVerdictColor = () => {
    switch (verdict) {
      case 'OPEN_WINDOW': return tokens.colors.oxide;
      case 'KEEP_CLOSED': return tokens.colors.signal;
      case 'WAIT': return tokens.colors.ink;
    }
  };

  return (
    <div 
      className="relative w-full overflow-hidden" 
      aria-live="polite"
      style={{ height: '300px' }} // fixed height to prevent layout shift
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={verdict}
          initial={{ clipPath: 'inset(0 100% 0 0)' }} // Wipe from left to right
          animate={{ clipPath: 'inset(0 0 0 0)' }}
          exit={{ clipPath: 'inset(0 0 0 100%)', transition: { duration: 0.45, ease: [0.2, 0.7, 0.1, 1] } }}
          transition={{ duration: 0.45, ease: [0.2, 0.7, 0.1, 1] }}
          className="absolute inset-0 flex flex-col justify-end pb-8"
        >
          <h1 
            className="text-5xl md:text-7xl lg:text-8xl leading-none font-bold tracking-tighter break-words"
            style={{ color: getVerdictColor() }}
          >
            {getVerdictText()}
          </h1>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
