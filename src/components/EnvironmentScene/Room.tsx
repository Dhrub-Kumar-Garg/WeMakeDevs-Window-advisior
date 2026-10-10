'use client';

export default function Room() {
  return (
    <svg viewBox="0 0 1000 400" className="w-full h-full max-w-[1000px]" preserveAspectRatio="xMidYMid meet">
      {/* Floor */}
      <line x1="100" y1="350" x2="900" y2="350" stroke="var(--border-dark)" strokeWidth="1.5" />
      <line x1="100" y1="354" x2="900" y2="354" stroke="var(--border-subtle)" strokeWidth="1" />
      
      {/* Left Wall */}
      <line x1="200" y1="50" x2="200" y2="350" stroke="var(--border-dark)" strokeWidth="1.5" />
      
      {/* Right Wall */}
      <line x1="800" y1="50" x2="800" y2="350" stroke="var(--border-dark)" strokeWidth="1.5" />
      
      {/* Ceiling (dotted cutaway) */}
      <line x1="200" y1="50" x2="800" y2="50" stroke="var(--border-dark)" strokeWidth="1" strokeDasharray="4 4" />
      
      {/* Subtle desk/workspace outline (architectural style) */}
      <g transform="translate(300, 250)" stroke="var(--border-dark)" fill="none" strokeWidth="1">
        {/* Desk top */}
        <line x1="0" y1="40" x2="160" y2="40" strokeWidth="1.5" />
        {/* Desk legs */}
        <line x1="10" y1="40" x2="10" y2="100" />
        <line x1="150" y1="40" x2="150" y2="100" />
        {/* Monitor */}
        <rect x="40" y="0" width="80" height="50" rx="2" />
        <line x1="80" y1="50" x2="80" y2="80" />
        <line x1="60" y1="80" x2="100" y2="80" />
      </g>
    </svg>
  );
}
