'use client';

import { motion } from 'framer-motion';
import { useEnvironmentStore } from '@/store/useEnvironmentStore';
import { Thermometer, Wind, Activity } from 'lucide-react';

export default function EnvironmentComparison() {
  const { sensorData } = useEnvironmentStore();

  const indoorRatio = Math.min(100, Math.max(0, ((sensorData.co2Estimated - 400) / 1000) * 100));
  const outdoorRatio = Math.min(100, Math.max(0, (sensorData.outdoorAQI / 200) * 100));

  return (
    <div className="surface rounded-2xl p-6 relative overflow-hidden">
      <h3 className="text-sm font-semibold mb-6 flex items-center gap-2">
        <Activity size={16} className="text-secondary" />
        Environment Comparison
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-0 relative">
        {/* Center divider (desktop) */}
        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-white/10 -translate-x-1/2" />
        
        {/* INDOOR */}
        <div className="flex flex-col gap-5 md:pr-12">
          <div className="flex justify-between items-baseline">
            <h4 className="text-sm font-mono text-muted uppercase tracking-widest">Indoor</h4>
            <span className="text-xs text-amber-400 font-medium bg-amber-400/10 px-2 py-0.5 rounded-sm">Stuffy</span>
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-secondary">Estimated CO₂</span>
              <span className="font-mono">{sensorData.co2Estimated} ppm</span>
            </div>
            
            {/* Visual Bar */}
            <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden flex justify-end">
              <motion.div 
                className="h-full bg-gradient-to-l from-amber-500 to-amber-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${indoorRatio}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="flex items-center gap-2 text-sm text-secondary">
              <Thermometer size={14} className="opacity-70" />
              <span className="font-mono">{sensorData.temperature.toFixed(1)}°C</span>
            </div>
          </div>
        </div>

        {/* OUTDOOR */}
        <div className="flex flex-col gap-5 md:pl-12">
          <div className="flex justify-between items-baseline flex-row-reverse">
            <h4 className="text-sm font-mono text-muted uppercase tracking-widest">Outdoor</h4>
            <span className="text-xs text-emerald-400 font-medium bg-emerald-400/10 px-2 py-0.5 rounded-sm">Clean</span>
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm flex-row-reverse">
              <span className="text-secondary">AQI</span>
              <span className="font-mono">{sensorData.outdoorAQI}</span>
            </div>
            
            {/* Visual Bar */}
            <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${outdoorRatio}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-2 justify-end text-right">
            <div className="flex items-center justify-end gap-2 text-sm text-secondary">
              <span className="font-mono">{sensorData.outdoorTemp.toFixed(1)}°C</span>
              <Thermometer size={14} className="opacity-70" />
            </div>
            <div className="flex items-center justify-end gap-2 text-sm text-secondary">
              <span className="font-mono">PM2.5: {sensorData.outdoorPM25}</span>
              <Wind size={14} className="opacity-70" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
