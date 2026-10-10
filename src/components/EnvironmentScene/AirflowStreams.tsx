'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AirflowStreamsProps {
  active: boolean;
}

export default function AirflowStreams({ active }: AirflowStreamsProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {active && (
        <motion.svg 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 1000 400"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Stream 1 - High */}
          <path 
            d="M 850 150 C 700 130 600 180 400 200 C 300 210 200 190 50 220" 
            stroke="var(--data-model)" 
            strokeWidth="1.5" 
            fill="none" 
            strokeDasharray="10 5 2 5"
            strokeDashoffset="400"
            style={{ animation: 'airflow-light 4s linear infinite' }}
          />
          
          {/* Stream 2 - Mid */}
          <path 
            d="M 850 250 C 700 270 500 240 400 280 C 250 320 150 300 50 320" 
            stroke="var(--status-safe)" 
            strokeWidth="1.5" 
            fill="none" 
            strokeDasharray="15 8"
            strokeDashoffset="400"
            style={{ animation: 'airflow-light 3s linear infinite 0.5s' }}
          />
        </motion.svg>
      )}
    </AnimatePresence>
  );
}
