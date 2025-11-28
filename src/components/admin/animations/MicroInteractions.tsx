'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

/**
 * Ripple effect on click
 */
export function RippleButton({
  children,
  onClick,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`relative overflow-hidden ${className}`}
    >
      {children}
      <motion.span
        className="absolute inset-0 rounded-full bg-white/20"
        initial={{ scale: 0, opacity: 1 }}
        whileTap={{
          scale: 4,
          opacity: 0,
          transition: { duration: 0.6 },
        }}
      />
    </motion.button>
  );
}

/**
 * Shake animation for errors
 */
export function ShakeAnimation({
  children,
  trigger,
  className = '',
}: {
  children: ReactNode;
  trigger: boolean;
  className?: string;
}) {
  return (
    <motion.div
      animate={trigger ? {
        x: [0, -10, 10, -10, 10, 0],
      } : {}}
      transition={{ duration: 0.5 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Bounce animation
 */
export function BounceAnimation({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      animate={{
        y: [0, -10, 0],
      }}
      transition={{
        duration: 0.6,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Pulse animation
 */
export function PulseAnimation({
  children,
  className = '',
  intensity = 1.1,
}: {
  children: ReactNode;
  className?: string;
  intensity?: number;
}) {
  return (
    <motion.div
      animate={{
        scale: [1, intensity, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Flip animation
 */
export function FlipAnimation({
  children,
  trigger,
  className = '',
}: {
  children: ReactNode;
  trigger: boolean;
  className?: string;
}) {
  return (
    <motion.div
      animate={trigger ? {
        rotateY: [0, 180, 360],
      } : {}}
      transition={{ duration: 0.6 }}
      className={className}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Magnetic hover effect (simplified)
 */
export function MagneticHover({
  children,
  className = '',
  strength = 5,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
}) {
  return (
    <motion.div
      className={className}
      whileHover={{
        scale: 1.05,
        transition: { type: 'spring', stiffness: 300, damping: 20 },
      }}
    >
      {children}
    </motion.div>
  );
}

