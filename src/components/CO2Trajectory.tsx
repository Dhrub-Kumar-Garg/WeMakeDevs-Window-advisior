'use client';

import { useEnvironmentStore } from '@/store/useEnvironmentStore';
import { LineChart, Line, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Tooltip } from 'recharts';

export default function CO2Trajectory() {
  const { historicalCO2, modelParams } = useEnvironmentStore();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-surface border border-default p-2 text-[10px] font-mono shadow-sm">
          <div className="text-secondary mb-1">{label}</div>
          <div className="text-primary font-bold">Est: {data.estimated} ppm</div>
          {data.event && (
            <div className="mt-1 pt-1 border-t border-subtle text-status-caution">
              {data.event}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-[300px]">
      <div className="flex-1 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={historicalCO2} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
            <XAxis 
              dataKey="time" 
              tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
              axisLine={{ stroke: 'var(--border-dark)' }}
              tickLine={false}
              minTickGap={30}
            />
            <YAxis 
              domain={[400, 1300]} 
              tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
              axisLine={false}
              tickLine={false}
            />
            
            {/* Threshold Line */}
            <ReferenceLine 
              y={modelParams.co2Threshold} 
              stroke="var(--status-caution)" 
              strokeDasharray="2 4"
              label={{ position: 'top', value: 'VENTILATION THRESHOLD', fill: 'var(--status-caution)', fontSize: 10, fontFamily: 'var(--font-mono)' }} 
            />

            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-dark)', strokeWidth: 1, strokeDasharray: '2 2' }} />
            
            {/* Main Estimate Line */}
            <Line 
              type="step" 
              dataKey="estimated" 
              stroke="var(--text-primary)" 
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, fill: 'var(--text-primary)' }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-2 text-[10px] text-muted font-mono uppercase tracking-wider">
        Estimated using physics model. ±120 ppm uncertainty margin not shown.
      </div>
    </div>
  );
}
