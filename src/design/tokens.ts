export const tokens = {
  fonts: {
    sans: '"Space Grotesk", sans-serif',
    mono: '"Space Mono", monospace',
    serif: '"Instrument Serif", serif',
  },
  colors: {
    paper: '#f8f9fc',
    ink: '#111111',
    inkDim: '#666666',
    inkLighter: '#e2e8f0', // borders
    signal: '#ff5f1f', // harm / HOLD
    oxide: '#00d4aa', // OPEN
    wait: '#E8A200', // WAIT
  },
  motion: {
    easing: 'cubic-bezier(0.2, 0.7, 0.1, 1)',
    duration: {
      sash: '900ms',
      wipe: '450ms',
      sheet: '600ms',
    }
  },
  spacing: {
    base: '8px',
    hairline: '1px',
    // ... we can define more if needed, standard scale
  }
}
