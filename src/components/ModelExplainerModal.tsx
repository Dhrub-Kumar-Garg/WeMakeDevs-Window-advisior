'use client';

import { motion } from 'framer-motion';
import { useEnvironmentStore } from '@/store/useEnvironmentStore';
import { X, Info, Settings2 } from 'lucide-react';
import type { ModelParams } from '@/lib/types';

export default function ModelExplainerModal() {
  const { setShowModelExplainer, modelParams, setModelParam } = useEnvironmentStore();

  const handleParamChange = (key: keyof ModelParams, value: number) => {
    setModelParam(key, value);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 pointer-events-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"
        onClick={() => setShowModelExplainer(false)}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.3, type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-2xl bg-surface border border-subtle shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-subtle flex items-center justify-between">
          <h2 className="text-lg font-sans font-medium flex items-center gap-2">
            <Info size={16} className="text-secondary" />
            Why is CO₂ estimated?
          </h2>
          <button 
            onClick={() => setShowModelExplainer(false)}
            className="w-8 h-8 hover:bg-panel flex items-center justify-center transition-colors text-secondary"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <p className="text-sm text-secondary mb-6 leading-relaxed">
            Real CO₂ sensors (like NDIR) are expensive. This product uses a <strong className="text-primary font-medium">physics-based ventilation model</strong> to accurately estimate CO₂ buildup based on room volume, occupancy, and window state.
          </p>

          {/* Equation Graphic */}
          <div className="bg-panel border border-subtle p-6 flex flex-col items-center justify-center mb-8">
            <div className="label-technical mb-4">Core Model Equation</div>
            <div className="font-mono text-lg md:text-xl text-primary">
              C += [(<span className="text-data-sensor">N</span> × 5 ÷ <span className="text-status-safe">V</span>) − (<span className="text-data-model">ACH</span> ÷ 3600) × (C − 420)] × Δt
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4 text-primary">
            <Settings2 size={16} />
            <h3 className="text-sm font-medium">Model Parameters</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-subtle p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-mono text-status-safe">V (Volume)</span>
                <span className="text-xs font-mono">{modelParams.roomVolume} m³</span>
              </div>
              <input 
                type="range" min="10" max="200" step="1" 
                value={modelParams.roomVolume} 
                onChange={(e) => handleParamChange('roomVolume', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="border border-subtle p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-mono text-data-model">ACH (Closed)</span>
                <span className="text-xs font-mono">{modelParams.achClosed.toFixed(2)} /hr</span>
              </div>
              <input 
                type="range" min="0.1" max="1.5" step="0.1" 
                value={modelParams.achClosed} 
                onChange={(e) => handleParamChange('achClosed', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div className="border border-subtle p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-mono text-data-sensor">N (Occupants)</span>
                <span className="text-xs font-mono">{modelParams.occupants}</span>
              </div>
              <input 
                type="range" min="0" max="10" step="1" 
                value={modelParams.occupants} 
                onChange={(e) => handleParamChange('occupants', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="border border-subtle p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-mono text-status-caution">Limit</span>
                <span className="text-xs font-mono">{modelParams.co2Threshold} ppm</span>
              </div>
              <input 
                type="range" min="800" max="1500" step="50" 
                value={modelParams.co2Threshold} 
                onChange={(e) => handleParamChange('co2Threshold', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
          
        </div>
      </motion.div>
    </div>
  );
}
