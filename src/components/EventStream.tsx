'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEnvironmentStore } from '@/store/useEnvironmentStore';
import { ListFilter, Bell, Wind, AlertCircle, RefreshCw, Users } from 'lucide-react';

export default function EventStream() {
  const { events } = useEnvironmentStore();

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'recommendation_change': return <Bell size={12} className="text-blue-400" />;
      case 'window_open': return <Wind size={12} className="text-emerald-400" />;
      case 'window_close': return <Wind size={12} className="text-secondary" />;
      case 'occupancy_change': return <Users size={12} className="text-purple-400" />;
      case 'threshold_crossed': return <AlertCircle size={12} className="text-amber-400" />;
      case 'model_reset': return <RefreshCw size={12} className="text-emerald-400" />;
      default: return <Bell size={12} className="text-muted" />;
    }
  };

  return (
    <div className="surface rounded-2xl p-6 flex flex-col h-full min-h-[300px]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <ListFilter size={16} className="text-secondary" />
          Event Stream
        </h3>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 overflow-y-auto pr-2 pb-4 no-scrollbar">
          <div className="flex flex-col gap-4">
            <AnimatePresence initial={false}>
              {events.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -10, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, scale: 0.9, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex gap-4 relative"
                >
                  {/* Timeline connector */}
                  {i !== events.length - 1 && (
                    <div className="absolute left-[13px] top-6 bottom-[-16px] w-px bg-white/5" />
                  )}
                  
                  {/* Icon */}
                  <div className="w-7 h-7 rounded-full bg-black/40 border border-white/5 flex items-center justify-center shrink-0 z-10 mt-0.5">
                    {getEventIcon(event.type)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex flex-col gap-1 pb-2">
                    <span className="text-xs font-mono text-muted">
                      {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-sm text-primary leading-tight">
                      {event.message}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {events.length === 0 && (
              <div className="text-sm text-muted text-center mt-10">No recent events</div>
            )}
          </div>
        </div>
        
        {/* Fade out at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[var(--bg-panel)] to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
