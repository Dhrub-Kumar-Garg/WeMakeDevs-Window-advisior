'use client';

import { motion } from 'framer-motion';
import type { EnvironmentState } from '@/lib/types';

interface AtmosphereProps {
  state: EnvironmentState;
  density: number;
}

export default function Atmosphere({ state, density }: AtmosphereProps) {
  // Map density to a very subtle tint. 400ppm = clean, 1000ppm = slightly amber/dirty.
  const isStale = density > 800;
  
  return (
    <div className="absolute inset-0 flex items-end justify-center pointer-events-none">
      <div className="w-[600px] h-[300px] relative">
        <motion.div 
          className="absolute inset-0"
          animate={{ 
            backgroundColor: isStale ? 'rgba(212, 140, 41, 0.05)' : 'rgba(74, 122, 150, 0.02)',
          }}
          transition={{ duration: 2, ease: 'linear' }}
        />
        {/* Subtle gradient to simulate stale air pooling or clearing */}
        <motion.div 
          className="absolute inset-0"
          animate={{ 
            opacity: isStale ? 1 : 0,
            background: 'linear-gradient(to top, rgba(212, 140, 41, 0.08) 0%, transparent 100%)'
          }}
          transition={{ duration: 2, ease: 'linear' }}
        />
      </div>
    </div>
  );
}
