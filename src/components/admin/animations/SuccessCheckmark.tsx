'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface SuccessCheckmarkProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: string;
}

/**
 * Animated success checkmark
 */
export default function SuccessCheckmark({
  size = 'md',
  className = '',
  color = '#10B981',
}: SuccessCheckmarkProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const checkmarkVariants = {
    initial: {
      scale: 0,
      opacity: 0,
    },
    animate: {
      scale: [0, 1.2, 1],
      opacity: [0, 1, 1],
      transition: {
        duration: 0.5,
        times: [0, 0.6, 1],
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  const circleVariants = {
    initial: {
      scale: 0,
      opacity: 0,
    },
    animate: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <div className={`relative ${sizes[size]} ${className}`}>
      {/* Background circle */}
      <motion.div
        variants={circleVariants}
        initial="initial"
        animate="animate"
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: `${color}20` }}
      />
      
      {/* Checkmark */}
      <motion.div
        variants={checkmarkVariants}
        initial="initial"
        animate="animate"
        className="absolute inset-0 flex items-center justify-center"
      >
        <Check
          className={`${sizes[size]}`}
          style={{ color }}
          strokeWidth={3}
        />
      </motion.div>
    </div>
  );
}

/**
 * Success checkmark with text
 */
export function SuccessMessage({
  message,
  className = '',
}: {
  message: string;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex items-center gap-2 ${className}`}
    >
      <SuccessCheckmark size="sm" />
      <span className="text-sm text-[#10B981] font-medium">{message}</span>
    </motion.div>
  );
}

