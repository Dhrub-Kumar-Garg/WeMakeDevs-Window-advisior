'use client';

import { useEnvironmentStore } from '@/store/useEnvironmentStore';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

export default function ValidationPanel() {
  const { historicalCO2 } = useEnvironmentStore();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface border border-default p-2 text-[10px] font-mono shadow-sm">
          <div className="text-secondary mb-1">{label}</div>
          <div className="text-data-model font-bold">Model: {payload[0]?.value} ppm</div>
          <div className="text-data-sensor font-bold">MQ135: {payload[1]?.value} rel</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-secondary">
          The system uses a physics-based ventilation model instead of an expensive CO₂ sensor. 
          An MQ135 sensor is used exclusively to validate that the <span className="text-primary font-medium">trend direction</span> matches our model.
        </p>
        <span className="label-technical mt-2 text-status-info">MQ135 is used for relative trend only — not ppm measurement.</span>
      </div>

      <div className="flex-1 w-full h-[200px] mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={historicalCO2} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <XAxis 
              dataKey="time" 
              tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
              axisLine={{ stroke: 'var(--border-dark)' }}
              tickLine={false}
              minTickGap={40}
            />
            <YAxis yAxisId="left" domain={['auto', 'auto']} hide />
            <YAxis yAxisId="right" orientation="right" domain={['auto', 'auto']} hide />
            
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-dark)', strokeDasharray: '2 2' }} />
            
            {/* Model Line */}
            <Line 
              yAxisId="left"
              type="step" 
              dataKey="estimated" 
              stroke="var(--data-model)" 
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
            {/* Sensor Line */}
            <Line 
              yAxisId="right"
              type="step" 
              dataKey="mq135" 
              stroke="var(--data-sensor)" 
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex gap-6 mt-2">
        <div className="flex items-center gap-2 text-[10px] text-muted font-mono uppercase tracking-wider">
          <div className="w-3 h-0.5 bg-data-model" /> Model (ppm)
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted font-mono uppercase tracking-wider">
          <div className="w-3 h-0.5 bg-data-sensor border-t border-dashed" /> MQ135 (relative)
        </div>
      </div>
    </div>
  );
}
