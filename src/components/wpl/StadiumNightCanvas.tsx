'use client';

import { motion } from 'framer-motion';

interface StadiumNightCanvasProps {
  glowColor?: 'gold' | 'cobalt' | 'dual';
  showPitchGrid?: boolean;
}

export default function StadiumNightCanvas({ 
  glowColor = 'dual',
  showPitchGrid = true 
}: StadiumNightCanvasProps) {
  return (
    <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden select-none">
      {/* 1. Deep Midnight Stadium Turf Base (Not flat black) */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050814] via-[#070b18] to-[#04060d]" />

      {/* 2. Volumetric Overhead Stadium Floodlight Cones */}
      <motion.div
        animate={{ opacity: [0.35, 0.55, 0.35], scale: [1, 1.05, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1200px] h-[550px] bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.18)_0%,rgba(245,158,11,0.08)_40%,transparent_75%)] blur-3xl"
      />

      {/* 3. Left & Right Stadium Floodlight Flares */}
      <div className="absolute top-10 left-[-10%] w-[500px] h-[450px] bg-blue-600/[0.12] rounded-full blur-[140px]" />
      <div className="absolute top-10 right-[-10%] w-[500px] h-[450px] bg-amber-500/[0.10] rounded-full blur-[140px]" />

      {/* 4. Perspective 3D Pitch Turf Crease Grid */}
      {showPitchGrid && (
        <div 
          className="absolute inset-x-0 bottom-0 h-[85%] opacity-[0.06] origin-bottom"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
            maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 15%, transparent 90%)',
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 15%, transparent 90%)',
            transform: 'perspective(750px) rotateX(32deg)',
          }}
        />
      )}

      {/* 5. Stadium Boundary Concentric Arcs */}
      <div className="absolute left-1/2 bottom-[-160px] -translate-x-1/2 w-[1300px] h-[380px] rounded-[100%] border border-sky-400/[0.10] opacity-70 pointer-events-none" />
      <div className="absolute left-1/2 bottom-[-240px] -translate-x-1/2 w-[1650px] h-[480px] rounded-[100%] border border-amber-400/[0.08] opacity-50 pointer-events-none" />

      {/* 6. Dynamic Floating Stadium Light Motes */}
      <div className="absolute inset-0">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-amber-300/40 blur-[0.5px]"
            style={{
              left: `${15 + i * 15}%`,
              top: `${40 + (i % 3) * 20}%`,
            }}
            animate={{
              y: [0, -35, 0],
              opacity: [0.15, 0.7, 0.15],
              scale: [1, 1.4, 1],
            }}
            transition={{
              duration: 5 + i * 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.8,
            }}
          />
        ))}
      </div>
    </div>
  );
}
