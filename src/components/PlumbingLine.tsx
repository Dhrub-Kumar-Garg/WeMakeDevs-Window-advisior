'use client';

export default function PlumbingLine() {
  const hardware = [
    { name: "ESP32 + PIR Sensor", role: "Detects occupancy to scale CO2 assumption.", status: "PLANNED" },
    { name: "ESP32 + Servo", role: "Physically actuates the window sash.", status: "PLANNED" },
    { name: "Open-Meteo API", role: "Provides hourly AQI, PM2.5, and wind speed forecasts.", status: "LIVE" },
    { name: "Cloud API / Backend", role: "Serves the latest sensor readings to the frontend.", status: "PLANNED" },
    { name: "Next.js Frontend", role: "Runs the mass-balance simulation and renders the UI.", status: "LIVE" }
  ];

  return (
    <section className="w-full border-b border-[#e2e8f0] p-6 lg:p-12 pb-24">
      <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-12 md:items-start">
        
        <div className="flex-shrink-0 md:w-1/4">
          <h2 className="font-serif italic text-2xl text-[#111111] mb-2">Hardware & Data</h2>
          <p className="font-mono text-xs uppercase tracking-widest text-[#666666]">System Plumbing</p>
        </div>

        <div className="w-full font-mono text-xs text-[#111111] uppercase tracking-wide flex flex-col gap-4">
           {hardware.map(item => (
              <div key={item.name} className="flex flex-col sm:flex-row sm:justify-between border-b border-[#e2e8f0] pb-2">
                 <div className="flex flex-col gap-1">
                    <span className="font-bold">{item.name}</span>
                    <span className="text-[#666666] normal-case tracking-normal">{item.role}</span>
                 </div>
                 <div className="mt-2 sm:mt-0 flex items-start">
                    <span className={`px-2 py-0.5 text-[10px] text-white ${item.status === 'LIVE' ? 'bg-[#111111]' : 'bg-[#e2e8f0] text-[#666666]'}`}>
                      {item.status}
                    </span>
                 </div>
              </div>
           ))}
        </div>

      </div>
    </section>
  );
}
