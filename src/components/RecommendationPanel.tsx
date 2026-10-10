'use client';

import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, HelpCircle, Wind } from 'lucide-react';
import { useEnvironmentStore } from '@/store/useEnvironmentStore';
import { co2StatusLabel } from '@/lib/co2Model';

export default function RecommendationPanel() {
  const { recommendation, sensorData, confidence, setShowModelExplainer } = useEnvironmentStore();

  const isRecommendOpen = recommendation === 'OPEN_WINDOW';
  const isOptimal = recommendation === 'OPTIMAL';
  
  const panelClass = isRecommendOpen 
    ? 'rec-panel-open' 
    : isOptimal 
      ? 'rec-panel-optimal' 
      : recommendation === 'WAIT' 
        ? 'rec-panel-wait' 
        : 'rec-panel-closed';

  const co2Status = co2StatusLabel(sensorData.co2Estimated);

  return (
    <div className={`h-full rounded-2xl flex flex-col overflow-hidden transition-all duration-700 ease-out ${panelClass}`}>
      
      {/* HEADER SECTION */}
      <div className="p-6 pb-4 border-b border-white/5 relative overflow-hidden">
        {/* Animated background glow for OPEN state */}
        {isRecommendOpen && (
          <motion.div 
            className="absolute inset-0 bg-emerald-500/10"
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-current opacity-80" />
            <span className="text-xs font-semibold tracking-wider uppercase opacity-80">Recommendation</span>
          </div>
          
          <motion.div 
            key={recommendation}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-1"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold leading-tight" style={{ letterSpacing: '-0.02em' }}>
              {recommendation === 'OPEN_WINDOW' && 'OPEN WINDOW'}
              {recommendation === 'KEEP_CLOSED' && 'KEEP CLOSED'}
              {recommendation === 'WAIT' && 'WAIT TO OPEN'}
              {recommendation === 'OPTIMAL' && 'OPTIMAL'}
            </h2>
            <p className="text-sm opacity-80 mt-1">
              {recommendation === 'OPEN_WINDOW' && 'Indoor air quality needs ventilation.'}
              {recommendation === 'KEEP_CLOSED' && 'Current conditions are acceptable.'}
              {recommendation === 'WAIT' && 'Outdoor pollution is too high right now.'}
              {recommendation === 'OPTIMAL' && 'Room is well ventilated.'}
            </p>
          </motion.div>
        </div>
      </div>

      {/* EVIDENCE SECTION */}
      <div className="flex-1 p-6 flex flex-col gap-5">
        <h3 className="text-xs font-mono text-muted uppercase tracking-wider mb-[-4px]">Because</h3>
        
        {/* Indoor Metric */}
        <div className="glass-sm rounded-xl p-4 flex flex-col gap-2">
          <div className="flex justify-between items-end">
            <span className="text-sm font-medium text-secondary">Indoor CO₂</span>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full ${
                co2Status.level === 'danger' ? 'bg-red-500/20 text-red-400' :
                co2Status.level === 'caution' ? 'bg-amber-500/20 text-amber-400' :
                'bg-emerald-500/20 text-emerald-400'
              }`}>
                {co2Status.label}
              </span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold">~{sensorData.co2Estimated}</span>
            <span className="text-xs text-muted">ppm</span>
            {sensorData.co2Estimated > 800 && <ArrowUp size={16} className={co2Status.level === 'danger' ? 'text-red-400' : 'text-amber-400'} />}
          </div>
        </div>

        {/* Outdoor Metric */}
        <div className="glass-sm rounded-xl p-4 flex flex-col gap-2">
          <div className="flex justify-between items-end">
            <span className="text-sm font-medium text-secondary">Outdoor AQI</span>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full ${
                sensorData.outdoorAQI < 50 ? 'bg-emerald-500/20 text-emerald-400' :
                sensorData.outdoorAQI < 100 ? 'bg-amber-500/20 text-amber-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {sensorData.outdoorAQI < 50 ? 'Good' : sensorData.outdoorAQI < 100 ? 'Moderate' : 'Poor'}
              </span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold">{sensorData.outdoorAQI}</span>
          </div>
        </div>
        
        {/* What if prediction (only show if open recommended) */}
        {isRecommendOpen && (
          <div className="mt-auto">
            <h3 className="text-xs font-mono text-muted uppercase tracking-wider mb-2">If you open it</h3>
            <div className="flex items-center gap-3">
              <Wind className="text-blue-400 opacity-70" size={18} />
              <p className="text-sm">CO₂ expected to fall to <span className="font-mono font-semibold text-blue-400">~500 ppm</span> in ~18 min.</p>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER: Confidence */}
      <div className="p-4 bg-black/20 border-t border-white/5 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-secondary">Model confidence:</span>
            <span className="text-xs font-mono font-semibold">{confidence}%</span>
          </div>
          <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500/60 rounded-full" style={{ width: `${confidence}%` }} />
          </div>
        </div>
        
        <button 
          onClick={() => setShowModelExplainer(true)}
          className="flex items-center gap-1.5 text-xs text-interactive hover:text-blue-300 transition-colors bg-blue-500/10 px-2 py-1 rounded-md"
        >
          <HelpCircle size={12} />
          <span>Why estimated?</span>
        </button>
      </div>

    </div>
  );
}
