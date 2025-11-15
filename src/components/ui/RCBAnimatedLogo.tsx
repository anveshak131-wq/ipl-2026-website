"use client";

import { motion } from 'framer-motion';

export default function RCBAnimatedLogo({ className = 'w-full h-full' }: { className?: string }) {
  return (
    <motion.div className={className} aria-hidden="true">
      <svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="RCB animated lion logo">
        <defs>
          <linearGradient id="rcb-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EC1C24" />
            <stop offset="60%" stopColor="#DAA520" />
            <stop offset="100%" stopColor="#8B0000" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background shield */}
        <motion.g initial={{ scale: 0.98, opacity: 0.9 }} animate={{ scale: [0.98, 1.02, 0.98], opacity: [0.95, 1, 0.95] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
          <path d="M120 12 L198 44 L198 126 C198 166 162 196 120 204 C78 196 42 166 42 126 L42 44 Z" fill="url(#rcb-grad)" stroke="#C05" strokeWidth="2" />
        </motion.g>

        {/* Mane group - subtle rotating flow for life */}
        <motion.g transform="translate(120,84)" initial={{ rotate: -3 }} animate={{ rotate: [ -3, 3, -3 ] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Mane arcs (stylized, layered) */}
          <motion.path d="M-48,-6 C-72,-6 -84,-24 -84,-40 C-84,-68 -56,-72 -36,-60 C-24,-54 -8,-64 0,-58" fill="none" stroke="#DA3" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
          <motion.path d="M48,-6 C72,-6 84,-24 84,-40 C84,-68 56,-72 36,-60 C24,-54 8,-64 0,-58" fill="none" stroke="#EC1C24" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" opacity="0.95" />
          <motion.path d="M-60,6 C-84,10 -94,30 -86,48 C-74,78 -44,86 -20,76 C-6,70 4,84 0,76" fill="none" stroke="#E68E2B" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
        </motion.g>

        {/* Lion face silhouette (simple, original, non-copyrighted) */}
        <motion.g transform="translate(120,100)" initial={{ y: 6 }} animate={{ y: [6, 0, 6] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
          <path d="M-32,10 C-32,-18 -6,-34 0,-36 C6,-34 34,-18 34,10 C34,38 20,56 0,60 C-20,56 -32,38 -32,10 Z" fill="#111" opacity="0.95" />

          {/* Eyes (blink animation) */}
          <motion.ellipse cx="-10" cy="-2" rx="4" ry="3" fill="#FFF" initial={{ scaleY: 1 }} animate={{ scaleY: [1, 0.2, 1] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 6 }} />
          <motion.ellipse cx="10" cy="-2" rx="4" ry="3" fill="#FFF" initial={{ scaleY: 1 }} animate={{ scaleY: [1, 0.2, 1] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 6 }} />

          {/* Nose / muzzle shape */}
          <path d="M-4,8 C-2,12 2,12 4,8" stroke="#8B0000" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </motion.g>

        {/* Subtle outer glow */}
        <motion.circle cx="120" cy="110" r="72" fill="none" stroke="url(#rcb-grad)" strokeWidth="6" opacity="0.06" filter="url(#glow)" animate={{ opacity: [0.04, 0.09, 0.04] }} transition={{ duration: 6, repeat: Infinity }} />

      </svg>
    </motion.div>
  );
}
