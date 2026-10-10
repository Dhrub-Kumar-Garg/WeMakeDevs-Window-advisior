'use client';

export default function TopBar() {
  return (
    <header className="px-6 lg:px-12 py-6 flex items-center justify-between bg-base">
      <div className="flex items-center gap-3">
        <div className="font-sans font-medium text-primary tracking-tight text-lg">
          Window-Open Advisor
        </div>
        <div className="w-1 h-1 bg-border-dark rounded-full hidden sm:block" />
        <div className="text-secondary font-sans text-sm hidden sm:block">
          Intelligent Ventilation
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-safe opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-status-safe"></span>
        </span>
        <span className="label-technical text-status-safe">Active Monitoring</span>
      </div>
    </header>
  );
}
