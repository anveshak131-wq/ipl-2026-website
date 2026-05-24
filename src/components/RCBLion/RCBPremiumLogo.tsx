'use client';
/* eslint-disable @next/next/no-img-element */

import { motion } from 'framer-motion';

interface RCBPremiumLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  showParticles?: boolean;
}

const sizeClasses = {
  sm: 'h-40 w-40',
  md: 'h-64 w-64',
  lg: 'h-80 w-80',
  xl: 'h-[26rem] w-[26rem]',
} as const;

const particles = [
  { left: '14%', top: '18%', delay: 0 },
  { left: '82%', top: '20%', delay: 0.35 },
  { left: '22%', top: '70%', delay: 0.65 },
  { left: '74%', top: '72%', delay: 0.95 },
  { left: '48%', top: '8%', delay: 1.2 },
];

export default function RCBPremiumLogo({
  className = '',
  size = 'md',
  animated = true,
  showParticles = true,
}: RCBPremiumLogoProps) {
  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <motion.div
        className="absolute inset-6 rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(200,16,46,0.55) 0%, rgba(246,198,91,0.3) 38%, rgba(0,0,0,0) 72%)',
        }}
        animate={animated ? { scale: [1, 1.08, 1], opacity: [0.45, 0.72, 0.45] } : { scale: 1, opacity: 0.55 }}
        transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="absolute inset-2 rounded-[2rem] border border-[#f6c65b]/25"
        animate={animated ? { opacity: [0.35, 0.7, 0.35] } : { opacity: 0.5 }}
        transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {showParticles &&
        particles.map((particle, index) => (
          <motion.span
            key={`${particle.left}-${particle.top}`}
            className="absolute h-2.5 w-2.5 rounded-full bg-[#f6c65b] shadow-[0_0_16px_rgba(246,198,91,0.8)]"
            style={{ left: particle.left, top: particle.top }}
            animate={animated ? { y: [0, -10, 0], opacity: [0.3, 0.9, 0.3], scale: [0.9, 1.25, 0.9] } : { opacity: 0.5 }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              delay: particle.delay + index * 0.08,
              ease: 'easeInOut',
            }}
          />
        ))}

      <motion.div
        className="relative z-10 flex h-full w-full items-center justify-center"
        whileHover={animated ? { scale: 1.03, y: -4 } : undefined}
        transition={{ duration: 0.28, ease: 'easeOut' }}
      >
        <motion.img
          src="/logos/rcb_logo_premium.svg"
          alt="Original RCB-inspired premium logo"
          className="h-full w-full object-contain drop-shadow-[0_20px_50px_rgba(200,16,46,0.42)]"
          animate={
            animated
              ? {
                  y: [0, -4, 0],
                  rotate: [0, -1, 0, 1, 0],
                }
              : { y: 0, rotate: 0 }
          }
          transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </div>
  );
}
