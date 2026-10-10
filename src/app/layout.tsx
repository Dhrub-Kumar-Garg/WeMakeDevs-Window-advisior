import type { Metadata } from 'next';
import { spaceGrotesk, spaceMono, instrumentSerif } from '@/lib/fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'Window-Open Advisor — Intelligent Ventilation',
  description: 'Real-time intelligent ventilation advisor. Combines indoor CO₂ estimation, outdoor air quality, and occupancy to tell you exactly when to open your window.',
  keywords: ['air quality', 'ventilation', 'CO2', 'smart home', 'IoT', 'indoor air'],
  openGraph: {
    title: 'Window-Open Advisor',
    description: 'Should I open my window right now? Intelligent ventilation for real-world rooms.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${spaceMono.variable} ${instrumentSerif.variable}`}>
      <head>
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
