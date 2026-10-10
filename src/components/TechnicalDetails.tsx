'use client';

import { useEnvironmentStore } from '@/store/useEnvironmentStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function TechnicalDetails() {
  const { esp32Connected, awsConnected, lastUpdated, events } = useEnvironmentStore();
  const [showEvents, setShowEvents] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-widest text-muted">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${esp32Connected ? 'bg-status-safe' : 'bg-status-danger'}`} />
          ESP32
        </div>
        
        <span>·</span>
        
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${awsConnected ? 'bg-status-safe' : 'bg-status-danger'}`} />
          AWS IoT Core
        </div>
        
        <span>·</span>
        
        <div suppressHydrationWarning>
          Updated {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
        
        <span>·</span>
        
        <button 
          onClick={() => setShowEvents(!showEvents)}
          className="hover:text-primary transition-colors underline decoration-border-dark underline-offset-4"
        >
          {showEvents ? 'Hide Event Log' : 'View Event Log'}
        </button>
      </div>

      <AnimatePresence>
        {showEvents && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-surface border border-subtle p-4 font-mono text-[10px] text-secondary flex flex-col gap-2 max-h-64 overflow-y-auto mt-4">
              {events.map(event => (
                <div key={event.id} className="flex gap-4">
                  <span className="text-muted w-12 shrink-0">{new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="text-primary">{event.message}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
