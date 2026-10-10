import type { Metadata } from 'next';
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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
