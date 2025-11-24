'use client';

import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
}

export default function AnimatedCounter({ value, duration = 2, className = '' }: AnimatedCounterProps) {
  const spring = useSpring(0, { 
    stiffness: 50, 
    damping: 30,
    duration: duration * 1000 
  });
  
  const display = useTransform(spring, (current) => Math.round(current));

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return (
    <motion.span className={className}>
      <motion.span>{display}</motion.span>
    </motion.span>
  );
}
