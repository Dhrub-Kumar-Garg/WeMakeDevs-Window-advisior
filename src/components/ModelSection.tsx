'use client';

import { useEnvironmentStore } from '@/store/useEnvironmentStore';
import { tokens } from '@/design/tokens';

const EquationPart = ({ children }: { children: React.ReactNode }) => (
  <span className="font-mono text-sm tracking-tight text-[#111111]">{children}</span>
);

export default function ModelSection() {
  const store = useEnvironmentStore();

  const handleParamChange = (key: keyof typeof store.modelParams, value: number | [number, number]) => {
    store.setModelParam(key, value as never);
  };

  return (
    <section className="w-full border-b border-[#e2e8f0] p-6 lg:p-12 flex flex-col items-center">
      <div className="w-full max-w-7xl">
        <h2 className="font-serif italic text-3xl md:text-4xl text-[#111111] mb-2">Model Configuration</h2>
        <p className="font-mono text-xs uppercase tracking-widest text-[#666666] mb-8">Physics Assumptions & Live Controls</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Equation Column */}
          <div>
            <div className="mb-4 text-xs font-mono uppercase tracking-widest text-[#666666]">Mass-Balance Equation</div>
            <div className="p-4 bg-[#f8f9fc] border border-[#e2e8f0] overflow-x-auto">
              <div className="whitespace-nowrap flex items-center gap-2">
                <EquationPart>dC/dt</EquationPart>
                <EquationPart>=</EquationPart>
                <EquationPart>[(N &times; G) / V]</EquationPart>
                <EquationPart>-</EquationPart>
                <EquationPart>[(ACH / 3600) &times; (C - C_out)]</EquationPart>
              </div>
            </div>
            <div className="mt-4 font-mono text-[10px] text-[#666666] leading-relaxed">
              <p>Where:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><strong className="text-[#111111]">dC/dt</strong>: Change in CO₂ concentration</li>
                <li><strong className="text-[#111111]">N</strong>: Number of occupants</li>
                <li><strong className="text-[#111111]">G</strong>: Generation rate per person (ppm/s)</li>
                <li><strong className="text-[#111111]">V</strong>: Room volume (m³)</li>
                <li><strong className="text-[#111111]">ACH</strong>: Air Changes per Hour</li>
                <li><strong className="text-[#111111]">C</strong>: Current indoor CO₂</li>
                <li><strong className="text-[#111111]">C_out</strong>: Outdoor baseline CO₂</li>
              </ul>
            </div>
          </div>

          {/* Variables Column */}
          <div className="flex flex-col gap-4 font-mono text-xs">
            <div className="mb-2 text-xs font-mono uppercase tracking-widest text-[#666666]">Adjust Assumptions</div>
            
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-2">
              <span className="text-[#111111]">Room Volume (m³)</span>
              <input 
                type="number" 
                value={store.modelParams.roomVolume} 
                onChange={(e) => handleParamChange('roomVolume', Number(e.target.value))}
                className="w-20 text-right bg-transparent outline-none focus:border-b focus:border-[#ff5f1f]"
              />
            </div>

            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-2">
              <span className="text-[#111111]">Occupants</span>
              <input 
                type="number" 
                value={store.modelParams.occupants} 
                onChange={(e) => handleParamChange('occupants', Number(e.target.value))}
                className="w-20 text-right bg-transparent outline-none focus:border-b focus:border-[#ff5f1f]"
              />
            </div>

            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-2">
              <span className="text-[#111111]">ACH (Closed)</span>
              <input 
                type="number" 
                step="0.1"
                value={store.modelParams.achClosed} 
                onChange={(e) => handleParamChange('achClosed', Number(e.target.value))}
                className="w-20 text-right bg-transparent outline-none focus:border-b focus:border-[#ff5f1f]"
              />
            </div>

            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-2">
              <span className="text-[#111111]">ACH Range (Open) [low, high]</span>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  step="0.5"
                  value={store.modelParams.achOpenRange?.[0] ?? 2} 
                  onChange={(e) => handleParamChange('achOpenRange', [Number(e.target.value), store.modelParams.achOpenRange?.[1] ?? 6])}
                  className="w-12 text-right bg-transparent outline-none focus:border-b focus:border-[#ff5f1f]"
                />
                <span className="text-[#666666]">-</span>
                <input 
                  type="number" 
                  step="0.5"
                  value={store.modelParams.achOpenRange?.[1] ?? 6} 
                  onChange={(e) => handleParamChange('achOpenRange', [store.modelParams.achOpenRange?.[0] ?? 2, Number(e.target.value)])}
                  className="w-12 text-right bg-transparent outline-none focus:border-b focus:border-[#ff5f1f]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-2">
              <span className="text-[#111111]">Outdoor Baseline (ppm)</span>
              <input 
                type="number" 
                value={store.modelParams.outdoorBaseline} 
                onChange={(e) => handleParamChange('outdoorBaseline', Number(e.target.value))}
                className="w-20 text-right bg-transparent outline-none focus:border-b focus:border-[#ff5f1f]"
              />
            </div>

            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-2">
              <span className="text-[#111111]">CO₂ Threshold Limit (ppm)</span>
              <input 
                type="number" 
                value={store.modelParams.co2Threshold} 
                onChange={(e) => handleParamChange('co2Threshold', Number(e.target.value))}
                className="w-20 text-right bg-transparent outline-none focus:border-b focus:border-[#ff5f1f]"
              />
            </div>
            
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-2">
              <span className="text-[#111111]">AQI Threshold Limit</span>
              <input 
                type="number" 
                value={store.modelParams.aqiThreshold} 
                onChange={(e) => handleParamChange('aqiThreshold', Number(e.target.value))}
                className="w-20 text-right bg-transparent outline-none focus:border-b focus:border-[#ff5f1f]"
              />
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
