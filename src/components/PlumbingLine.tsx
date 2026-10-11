'use client';

import { useState, useEffect } from 'react';

export default function PlumbingLine() {
  const [photoExists, setPhotoExists] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setPhotoExists(true);
    img.onerror = () => setPhotoExists(false);
    img.src = '/hardware.jpg';
  }, []);

  const hardware = [
    { name: "ESP32", role: "Main microcontroller handling sensors and WiFi/MQTT telemetry.", status: "LIVE" },
    { name: "DHT11", role: "Measures indoor temperature (about ±2 °C) and humidity (±5%).", status: "LIVE" },
    { name: "MQ135 (via voltage divider)", role: "Analog VOC/gas reading for relative trend (not ppm).", status: "LIVE" },
    { name: "PIR HC-SR501", role: "Detects human presence (assumed occupants, never headcount).", status: "LIVE" },
    { name: "HC-SR04 ultrasonic", role: "Measures distance (HC-SR04).", status: "LIVE" },
    { name: "Push Button", role: "Physical toggle for window state.", status: "LIVE" },
    { name: "LEDs", role: "Physical state indicators (Green, Amber, Red).", status: "LIVE" },
    { name: "AWS IoT Core / Cloud API", role: "Ingests sensor payload and serves latest readings.", status: "LIVE" },
    { name: "Open-Meteo API", role: "Provides hourly outdoor AQI, PM2.5, and wind speed forecasts.", status: "LIVE" },
    { name: "Next.js Frontend", role: "Runs physics mass-balance model and renders real-time advice.", status: "LIVE" }
  ];

  return (
    <div className="w-full bg-[#f4f0ea] text-[#2c2825] border-t border-[#111111]/15 p-6 lg:p-12 flex flex-col items-center">
      <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-12 md:items-start">
        
        <div className="flex-shrink-0 md:w-1/3">
          <h2 className="font-serif italic text-3xl md:text-4xl text-[#2c2825] mb-2">Hardware & Data</h2>
          <p className="font-mono text-xs uppercase tracking-widest text-[#8c8273] mb-8">System Plumbing</p>
          
          {/* Breadboard Photo: only rendered if public/hardware.jpg exists */}
          {photoExists && (
            <div className="mb-4">
              <div className="w-full aspect-video border border-[#111111]/20 relative overflow-hidden mb-2">
                <img src="/hardware.jpg" alt="Hardware prototype" className="w-full h-full object-cover" />
              </div>
              <p className="font-mono text-[10px] text-[#8c8273] italic">Physical prototype running the ESP32 and sensors.</p>
            </div>
          )}
        </div>

        <div className="w-full font-mono text-xs text-[#2c2825] uppercase tracking-wide flex flex-col gap-4">
           {hardware.map(item => (
              <div key={item.name} className="flex flex-col sm:flex-row sm:justify-between border-b border-[#111111]/15 pb-2">
                 <div className="flex flex-col gap-1 max-w-sm">
                    <span className="font-bold">{item.name}</span>
                    <span className="text-[#8c8273] normal-case tracking-normal">{item.role}</span>
                 </div>
                 <div className="mt-2 sm:mt-0 flex items-start">
                    <span className={`px-2 py-0.5 text-[10px] ${item.status === 'LIVE' ? 'bg-[#00d4aa] text-[#111111] font-bold' : 'bg-[#d5ccba] text-[#8c8273]'}`}>
                      {item.status}
                    </span>
                 </div>
              </div>
           ))}
        </div>

      </div>
    </div>
  );
}
