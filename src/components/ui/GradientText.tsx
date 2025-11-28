'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface GradientTextProps {
  children: ReactNode;
  gradient?: string;
  className?: string;
  animate?: boolean;
}

export default function GradientText({
  children,
  gradient = 'from-blue-400 via-purple-400 to-pink-400',
  className = '',
  animate = false,
}: GradientTextProps) {
  return (
    <motion.span
      className={`bg-gradient-to-r ${gradient} bg-clip-text text-transparent ${className}`}
      animate={animate ? {
        backgroundPosition: ['0%', '100%', '0%'],
      } : {}}
      transition={animate ? {
        duration: 3,
        repeat: Infinity,
        ease: 'linear',
      } : {}}
      style={animate ? {
        backgroundSize: '200% auto',
      } : {}}
    >
      {children}
    </motion.span>
  );
}

