'use client';
import { useEffect, useRef } from 'react';

const mulberry32 = (a: number) => () => {
  a |= 0; a = (a + 0x6D2B79F5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Each dot has a fixed position and a fixed threshold; it shows when density > threshold.
// Density changes therefore add/remove dots smoothly instead of reshuffling them.
export function Stipple({ density, seed = 1, count = 1400, color = '#111111', className }:
  { density: number; seed?: number; count?: number; color?: string; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const cur = useRef(density);

  useEffect(() => {
    const c = ref.current!, ctx = c.getContext('2d')!;
    const rnd = mulberry32(seed);
    const dots = Array.from({ length: count }, () => ({ x: rnd(), y: rnd(), t: rnd(), r: 0.6 + rnd() * 0.9 }));
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;

    const size = () => {
      const d = devicePixelRatio || 1, { width, height } = c.getBoundingClientRect();
      c.width = width * d; c.height = height * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    };
    const draw = () => {
      cur.current += (density - cur.current) * (reduce ? 1 : 0.06);
      const { width, height } = c.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = color;
      for (const p of dots) {
        const a = Math.min(1, Math.max(0, (cur.current - p.t) * 12));
        if (a <= 0) continue;
        ctx.globalAlpha = a * 0.85;
        ctx.beginPath(); ctx.arc(p.x * width, p.y * height, p.r, 0, 6.2832); ctx.fill();
      }
      if (Math.abs(density - cur.current) > 0.001) raf = requestAnimationFrame(draw);
    };
    size(); draw();
    const onResize = () => { size(); draw(); };
    addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', onResize); };
  }, [density, seed, count, color]);

  return <canvas ref={ref} className={className} style={{ width: '100%', height: '100%' }} />;
}
