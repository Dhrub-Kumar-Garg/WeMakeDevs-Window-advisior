'use client';

import { useEnvironmentStore } from '@/store/useEnvironmentStore';
import type { AdvisorState } from '@/hooks/useAdvisorState';

export default function WindowDetailDrawer({ state }: { state: AdvisorState }) {
  const { setShowWindowDetail, showWindowDetail, sensorData, esp32Connected } = useEnvironmentStore();

  const isOpen = state.windowState !== 'closed';

  const toggleWindow = () => {
    state.setWindowState(isOpen ? 'closed' : 'open');
  };

  return (
    <>
      {showWindowDetail && (
        <div className="fixed inset-0 z-[100] flex justify-end pointer-events-auto">
          <div
            className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"
            onClick={() => setShowWindowDetail(false)}
          />

          <div
        className="relative w-full max-w-sm bg-surface border-l border-subtle h-full flex flex-col shadow-2xl"
      >
        <div className="p-6 border-b border-subtle flex items-center justify-between">
          <h2 className="text-lg font-sans font-medium">
            Smart Window Actuator
          </h2>
          <button 
            onClick={() => setShowWindowDetail(false)}
            className="w-8 h-8 rounded-full hover:bg-panel flex items-center justify-center text-secondary"
          >
            ✕
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-8">
          
          <div className="flex flex-col gap-4">
            <h3 className="label-technical">Device Control</h3>
            <div 
              className={`p-6 border flex flex-col items-center justify-center gap-4 cursor-pointer ${isOpen ? 'bg-panel border-default' : 'bg-surface border-subtle hover:border-default'}`}
              onClick={toggleWindow}
            >
              {isOpen ? (
                <div className="w-12 h-6 rounded-full bg-primary flex items-center p-1 justify-end">
                  <div className="w-4 h-4 rounded-full bg-white" />
                </div>
              ) : (
                <div className="w-12 h-6 rounded-full bg-muted flex items-center p-1 justify-start">
                  <div className="w-4 h-4 rounded-full bg-white" />
                </div>
              )}
              <div className="text-center">
                <div className={`text-sm font-medium ${isOpen ? 'text-primary' : 'text-secondary'}`}>
                  Window {isOpen ? 'Open' : 'Closed'}
                </div>
                <div className="text-xs text-muted mt-1">Tap to {isOpen ? 'close' : 'open'} manually</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="label-technical">Telemetry</h3>
            <div className="border border-subtle p-4 flex flex-col gap-2.5 font-mono text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-secondary">Connection</span>
                {esp32Connected ? (
                  <span className="text-status-safe">Online ({sensorData.deviceId || 'esp32'})</span>
                ) : (
                  <span className="text-status-danger">Offline</span>
                )}
              </div>
              <div className="h-px bg-subtle" />
              <div className="flex justify-between items-center">
                <span className="text-secondary">Window State</span>
                <span className="text-primary">{isOpen ? 'OPEN (HIGH)' : 'CLOSED (LOW)'}</span>
              </div>
              <div className="h-px bg-subtle" />
              <div className="flex justify-between items-center">
                <span className="text-secondary">PIR</span>
                <span className="text-primary">{sensorData.pirPresence ? 'presence' : 'idle'} (assumed occupants {sensorData.people ?? 1})</span>
              </div>
              <div className="h-px bg-subtle" />
              <div className="flex justify-between items-center">
                <span className="text-secondary">measured (DHT11)</span>
                <span className="text-primary">
                  {sensorData.tempC !== undefined ? `${sensorData.tempC.toFixed(1)}°C` : `${sensorData.temperature.toFixed(1)}°C`}
                  {sensorData.humidity !== undefined ? ` • ${sensorData.humidity.toFixed(0)}%` : ''}
                </span>
              </div>
              <div className="h-px bg-subtle" />
              <div className="flex justify-between items-center">
                <span className="text-secondary">MQ135 (relative trend, not ppm)</span>
                <span className="text-primary">{sensorData.mq135Idx ?? sensorData.mq135Raw} ({sensorData.mq135Mv} mV raw)</span>
              </div>
              {sensorData.distanceCm !== undefined && (
                <>
                  <div className="h-px bg-subtle" />
                  <div className="flex justify-between items-center">
                    <span className="text-secondary">distance (HC-SR04)</span>
                    <span className="text-primary">{sensorData.distanceCm.toFixed(1)} cm</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4 mt-auto">
            <h3 className="label-technical">MQTT Stream</h3>
            <div className="bg-[#1C1C1C] rounded-sm p-4 font-mono text-[10px] text-muted h-44 overflow-y-auto shadow-inner">
              <div className="mb-2 text-[#666666]">&gt; Connecting to AWS IoT Core...</div>
              <div className="mb-2 text-[#666666]">&gt; Subscribed to esp32/sensors</div>
              <div className="mb-2 text-[#EAEAEA]">&gt; Device Payload:</div>
              <pre className="text-[#A5A5A5] leading-relaxed whitespace-pre-wrap font-mono text-[9.5px]">
{JSON.stringify({
  deviceId: sensorData.deviceId || 'esp32-advisor',
  ts: Math.floor(sensorData.timestamp / 1000),
  tempC: sensorData.tempC ?? sensorData.temperature,
  humidity: sensorData.humidity ?? 52,
  pir: sensorData.pirPresence ? 1 : 0,
  windowOpen: isOpen,
  mq135Mv: sensorData.mq135Mv,
  mq135Idx: sensorData.mq135Idx ?? sensorData.mq135Raw,
  co2Est: sensorData.co2Estimated,
  people: sensorData.people ?? 1,
  ach: sensorData.ach ?? (isOpen ? 4.0 : 0.4),
  volumeM3: sensorData.volumeM3 ?? 36,
  aqiOut: sensorData.outdoorAQI,
  aqiSrc: sensorData.aqiSrc ?? 'Open-Meteo',
  led: sensorData.led ?? (isOpen ? 'green' : 'off'),
  timeScale: sensorData.timeScale ?? 1,
  ...(sensorData.distanceCm !== undefined ? { distanceCm: sensorData.distanceCm } : {})
}, null, 2)}
              </pre>
            </div>
          </div>

        </div>
      </div>
    </div>
      )}
    </>
  );
}
