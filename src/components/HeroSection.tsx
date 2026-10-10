'use client';

import { motion } from 'framer-motion';
import { useEnvironmentStore } from '@/store/useEnvironmentStore';
import { co2StatusLabel } from '@/lib/co2Model';
import EnvironmentScene from './EnvironmentScene';
import { ArrowUp, ArrowDown } from 'lucide-react';

export default function HeroSection() {
  const { recommendation, sensorData } = useEnvironmentStore();
  const co2Status = co2StatusLabel(sensorData.co2Estimated);

  const getRecommendationText = () => {
    switch (recommendation) {
      case 'OPEN_WINDOW': return 'Open Window';
      case 'KEEP_CLOSED': return 'Keep Closed';
      case 'WAIT': return 'Wait to Open';
      case 'OPTIMAL': return 'Optimal State';
    }
  };

  const getSubtext = () => {
    switch (recommendation) {
      case 'OPEN_WINDOW': return 'Indoor air is becoming stale. Outdoor air is currently cleaner.';
      case 'KEEP_CLOSED': return 'Current conditions are acceptable. No ventilation needed.';
      case 'WAIT': return 'Indoor air is stale, but outdoor pollution is too high right now.';
      case 'OPTIMAL': return 'The room is currently well ventilated.';
    }
  };

  return (
    <div className="flex flex-col gap-12">
      {/* Editorial Headline Decision */}
      <div className="flex flex-col gap-4 max-w-2xl">
        <h1 className="text-5xl md:text-7xl font-sans font-semibold tracking-tight text-primary">
          {getRecommendationText()}
        </h1>
        <p className="text-lg text-secondary">
          {getSubtext()}
        </p>
      </div>

      {/* Large Architectural Room */}
      <div className="w-full relative">
        <EnvironmentScene />
      </div>

      {/* Editorial Stats Below Room */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-4 border-t border-subtle">
        
        <div className="flex flex-col gap-1">
          <span className="label-technical">Indoor CO₂</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono text-primary font-medium">{sensorData.co2Estimated}</span>
            <span className="text-sm text-muted">ppm</span>
          </div>
          <span className="text-xs text-secondary">{co2Status.label}</span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="label-technical">Outdoor AQI</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono text-primary font-medium">{sensorData.outdoorAQI}</span>
          </div>
          <span className="text-xs text-secondary">
            {sensorData.outdoorAQI < 50 ? 'Good' : sensorData.outdoorAQI < 100 ? 'Moderate' : 'Poor'}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="label-technical">Indoor Temp</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono text-primary font-medium">{sensorData.temperature.toFixed(1)}</span>
            <span className="text-sm text-muted">°C</span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="label-technical">Outdoor Temp</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono text-primary font-medium">{sensorData.outdoorTemp.toFixed(1)}</span>
            <span className="text-sm text-muted">°C</span>
          </div>
        </div>

      </div>
    </div>
  );
}
