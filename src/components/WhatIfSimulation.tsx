'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEnvironmentStore } from '@/store/useEnvironmentStore';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function WhatIfSimulation() {
  const { simulationActive, simulatedCO2Trajectory, toggleSimulation, sensorData } = useEnvironmentStore();

  return (
    <div className="flex flex-col gap-6">
      
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-sans font-medium text-primary">What happens if you open it?</h2>
        
        <button 
          onClick={toggleSimulation}
          className="text-xs font-mono font-medium px-4 py-2 bg-surface border border-default hover:bg-panel transition-colors text-primary"
        >
          {simulationActive ? 'Hide Projection' : 'Simulate Projection'}
        </button>
      </div>

      <AnimatePresence>
        {simulationActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-6">
              
              {/* Stats Column */}
              <div className="col-span-1 flex flex-col gap-8">
                <div className="flex flex-col gap-1">
                  <span className="label-technical">Now</span>
                  <div className="text-3xl font-mono text-primary font-medium">{sensorData.co2Estimated} <span className="text-sm text-muted">ppm</span></div>
                </div>

                {simulatedCO2Trajectory.length > 0 && (
                  <>
                    <div className="flex flex-col gap-1">
                      <span className="label-technical">In 15 Min</span>
                      <div className="text-xl font-mono text-secondary">~{simulatedCO2Trajectory[14]?.co2} <span className="text-sm text-muted">ppm</span></div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="label-technical">In 60 Min</span>
                      <div className="text-xl font-mono text-status-safe font-medium">~{simulatedCO2Trajectory[simulatedCO2Trajectory.length - 1]?.co2} <span className="text-sm text-muted">ppm</span></div>
                    </div>
                  </>
                )}
              </div>

              {/* Chart Column */}
              <div className="col-span-3 h-64 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[{time: 0, co2: sensorData.co2Estimated}, ...simulatedCO2Trajectory]} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <XAxis 
                      dataKey="time" 
                      tickFormatter={(v) => v === 0 ? 'Now' : `${v / 60}m`}
                      tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={30}
                    />
                    <YAxis 
                      domain={[400, Math.max(1200, sensorData.co2Estimated + 100)]} 
                      tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <ReferenceLine y={420} stroke="var(--border-dark)" strokeDasharray="2 4" />
                    
                    <Area 
                      type="monotone" 
                      dataKey="co2" 
                      stroke="var(--status-info)" 
                      strokeWidth={2}
                      fill="transparent"
                      animationDuration={1500}
                      animationEasing="ease-out"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
