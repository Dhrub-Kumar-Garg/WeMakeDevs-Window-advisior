'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CO2ParticlesProps {
  density: number; // e.g. CO2 ppm
  windowOpen: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  drift: number;
  color: string;
}

export default function CO2Particles({ density, windowOpen }: CO2ParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  
  // Clean dots. 400ppm = 0 particles
  // 1000ppm = 20 particles (max)
  const targetParticleCount = Math.min(20, Math.max(0, Math.floor((density - 450) / 30)));

  useEffect(() => {
    // Spawn interval
    const intervalId = setInterval(() => {
      setParticles(current => {
        let next = current.filter(p => p.id > Date.now() - p.duration * 1000);
        
        const effectiveTarget = windowOpen ? Math.max(0, targetParticleCount - 15) : targetParticleCount;
        
        if (next.length < effectiveTarget && Math.random() > 0.3) {
          const isStale = density > 800;
          next.push({
            id: Date.now(),
            x: 30 + Math.random() * 40, 
            y: 70 + Math.random() * 20, 
            size: 2 + Math.random() * 2, // Tiny dots
            duration: 5 + Math.random() * 3, 
            drift: windowOpen ? 150 : (Math.random() - 0.5) * 40,
            color: isStale ? 'rgba(212, 140, 41, 0.6)' : 'rgba(142, 142, 142, 0.4)'
          });
        }
        
        return next;
      });
    }, 500);

    return () => clearInterval(intervalId);
  }, [targetParticleCount, windowOpen, density]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <AnimatePresence>
        {particles.map(p => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, x: `${p.x}%`, y: `${p.y}%`, scale: 0 }}
            animate={{ 
              opacity: [0, 0.8, 0],
              x: `calc(${p.x}% + ${p.drift}px)`,
              y: `calc(${p.y}% - 120px)`, 
              scale: 1 
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: p.duration, ease: 'easeOut' }}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: p.color
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
