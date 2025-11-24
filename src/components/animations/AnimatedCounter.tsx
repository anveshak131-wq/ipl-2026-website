'use client';

import { useSpring, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
}

export default function AnimatedCounter({ value, duration = 2, className = '' }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  
  const spring = useSpring(0, { 
    stiffness: 50, 
    damping: 30,
    duration: duration * 1000 
  });

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useEffect(() => {
    const unsubscribe = spring.on('change', (latest) => {
      setDisplayValue(Math.round(latest));
    });
    return unsubscribe;
  }, [spring]);

  return <span className={className}>{displayValue}</span>;
}
