'use client';

import { motion } from 'framer-motion';

interface StadiumNightCanvasProps {
  glowColor?: 'gold' | 'cobalt' | 'dual';
  variant?: 'teams' | 'matches' | 'full';
}

export default function StadiumNightCanvas({
  glowColor = 'dual',
  variant = 'full',
}: StadiumNightCanvasProps) {
  return (
    <div className="absolute inset-0 pointer-events-none -z-20 overflow-hidden select-none">
      {/* 1. Deep Midnight Base Foundation */}
      <div className="absolute inset-0 bg-[#070b18]" />

      {/* 2. Photorealistic Stadium Arena Imagery with Deep Navy & Gold Grade */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity scale-105"
        style={{
          backgroundImage: `url('/images/wpl-oil-stadium-hero.webp')`,
          filter: 'hue-rotate(220deg) saturate(1.4) contrast(1.15) brightness(0.65)',
        }}
      />

      {/* 3. Deep Vignette & Broadcast Scrim Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#070b18]/90 via-[#060914]/75 to-[#05070f]/95" />

      {/* 4. Sweeping Stadium Spotlight Beams */}
      <motion.div
        animate={{ 
          x: ['-20%', '20%', '-20%'],
          opacity: [0.25, 0.45, 0.25]
        }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-32 left-1/4 w-[850px] h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.22)_0%,rgba(245,158,11,0.12)_45%,transparent_75%)] blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ 
          x: ['20%', '-20%', '20%'],
          opacity: [0.20, 0.40, 0.20]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-32 right-1/4 w-[750px] h-[480px] bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.18)_0%,rgba(37,99,235,0.15)_45%,transparent_75%)] blur-3xl pointer-events-none"
      />

      {/* 5. 3D Perspective Cricket Pitch Grid & Crease Lines */}
      <div 
        className="absolute inset-x-0 bottom-0 h-[80%] opacity-[0.08] origin-bottom pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 15%, transparent 85%)',
          WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 15%, transparent 85%)',
          transform: 'perspective(700px) rotateX(28deg)',
        }}
      />

      {/* 6. Ground Telemetry & Boundary Coordinates Watermark */}
      <div className="absolute inset-0 flex flex-col justify-between p-8 opacity-[0.04] text-[10px] font-mono tracking-widest text-white uppercase pointer-events-none">
        <div className="flex justify-between">
          <span>LAT 12.9788° N • LON 77.5996° E</span>
          <span>WPL BROADCAST ARENA MATRIX</span>
          <span>ELEVATION: 920M</span>
        </div>
        <div className="flex justify-between">
          <span>PITCH AXIS: 0° NORTH-SOUTH</span>
          <span>FLOODLIGHT CANOPY: 2000 LUX</span>
          <span>INNER RING: 30 YARDS</span>
        </div>
      </div>

      {/* 7. Stadium Boundary Arc Rings */}
      <div className="absolute left-1/2 bottom-[-180px] -translate-x-1/2 w-[1300px] h-[400px] rounded-[100%] border border-sky-400/[0.12] opacity-60 pointer-events-none" />
      <div className="absolute left-1/2 bottom-[-260px] -translate-x-1/2 w-[1650px] h-[500px] rounded-[100%] border border-amber-400/[0.10] opacity-50 pointer-events-none" />

      {/* 8. Floating Arena Dust Particles */}
      <div className="absolute inset-0">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-amber-300/40 blur-[0.5px]"
            style={{
              width: i % 2 === 0 ? '3px' : '2px',
              height: i % 2 === 0 ? '3px' : '2px',
              left: `${10 + i * 11}%`,
              top: `${30 + (i % 4) * 16}%`,
            }}
            animate={{
              y: [0, -45, 0],
              x: [0, (i % 2 === 0 ? 12 : -12), 0],
              opacity: [0.1, 0.65, 0.1],
              scale: [0.8, 1.3, 0.8],
            }}
            transition={{
              duration: 6 + i * 1.2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.6,
            }}
          />
        ))}
      </div>
    </div>
  );
}
