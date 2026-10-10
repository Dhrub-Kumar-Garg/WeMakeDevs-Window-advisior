'use client';

import { tokens } from '@/design/tokens';

export default function PlumbingLine() {
  const steps = [
    { name: "ESP32", sub: "Sensors & Actuators" },
    { name: "IoT Core", sub: "MQTT" },
    { name: "Lambda", sub: "Data Processor" },
    { name: "DynamoDB", sub: "State Store" },
    { name: "API Gateway", sub: "REST API" },
    { name: "Amplify", sub: "Frontend Host" }
  ];

  return (
    <section className="w-full border-b border-[#e2e8f0] p-6 lg:p-12 pb-24">
      <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-12 md:items-end">
        
        <div className="flex-shrink-0">
          <h2 className="font-serif italic text-2xl text-[#111111] mb-2">Plumbing</h2>
          <p className="font-mono text-xs uppercase tracking-widest text-[#666666]">System Architecture</p>
        </div>

        <div className="w-full overflow-x-auto pb-4 pr-12">
          <div className="flex items-center min-w-max gap-8 font-mono text-[10px] uppercase">
            {steps.map((step, i) => (
              <div key={step.name} className="flex items-center gap-8">
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-[#111111] border-b border-[#111111] pb-1 inline-block">{step.name}</span>
                  <span className="text-[#666666]">{step.sub}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className="w-12 h-[1px] bg-[#e2e8f0] relative">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 border-t-[3px] border-b-[3px] border-l-[4px] border-y-transparent border-l-[#e2e8f0]" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-6 text-[#666666] font-mono text-[9px] uppercase tracking-wider max-w-lg">
            * EventBridge triggers Lambda every 1h to pull Open-Meteo AQI forecast.
          </div>
        </div>

      </div>
    </section>
  );
}
