'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface HoverCardProps {
  children: ReactNode;
  className?: string;
  scale?: number;
  glow?: boolean;
}

/**
 * Card with smooth hover effects
 */
export function HoverCard({
  children,
  className = '',
  scale = 1.02,
  glow = false,
}: HoverCardProps) {
  return (
    <motion.div
      whileHover={{
        scale,
        transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
      }}
      whileTap={{ scale: 0.98 }}
      className={`${className} ${glow ? 'hover:shadow-lg hover:shadow-[#2F6FED]/20' : ''}`}
    >
      {children}
    </motion.div>
  );
}

/**
 * Button with hover effects
 */
export function HoverButton({
  children,
  className = '',
  onClick,
  disabled = false,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </motion.button>
  );
}

/**
 * Icon with hover rotation
 */
export function HoverIcon({
  children,
  className = '',
  rotation = 15,
}: {
  children: ReactNode;
  className?: string;
  rotation?: number;
}) {
  return (
    <motion.div
      whileHover={{ rotate: rotation, scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Glow effect on hover
 */
export function GlowOnHover({
  children,
  className = '',
  color = '#2F6FED',
}: {
  children: ReactNode;
  className?: string;
  color?: string;
}) {
  return (
    <motion.div
      whileHover={{
        boxShadow: `0 0 20px ${color}40, 0 0 40px ${color}20`,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Lift effect on hover
 */
export function LiftOnHover({
  children,
  className = '',
  lift = 4,
}: {
  children: ReactNode;
  className?: string;
  lift?: number;
}) {
  return (
    <motion.div
      whileHover={{
        y: -lift,
        transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

