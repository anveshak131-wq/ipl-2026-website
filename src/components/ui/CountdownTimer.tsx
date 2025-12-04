'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CountdownTimerProps {
  targetDate: string | Date;
  onComplete?: () => void;
  className?: string;
  matchTime?: string; // Optional match time to combine with date
}

export default function CountdownTimer({ targetDate, onComplete, className = '', matchTime }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isExpired, setIsExpired] = useState(false);
  const [flipKey, setFlipKey] = useState(0);
  const prevSecondsRef = useRef(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      let target: Date;
      
      if (matchTime && typeof targetDate === 'string') {
        // Combine date and time (assume IST timezone)
        const dateTimeString = `${targetDate}T${matchTime}:00+05:30`;
        target = new Date(dateTimeString);
      } else {
        target = new Date(targetDate);
      }
      
      const now = new Date().getTime();
      const targetTime = target.getTime();
      const difference = targetTime - now;

      if (difference <= 0) {
        setIsExpired(true);
        if (onComplete) onComplete();
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      };
    };

    const updateTime = () => {
      const newTime = calculateTimeLeft();
      setTimeLeft(newTime);
      
      // Trigger flip animation when seconds change
      if (newTime.seconds !== prevSecondsRef.current) {
        setFlipKey(prev => prev + 1);
        prevSecondsRef.current = newTime.seconds;
      }
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);

    return () => clearInterval(timer);
  }, [targetDate, matchTime, onComplete]);

  if (isExpired) {
    return (
      <div className={`flex items-center justify-center gap-2 text-red-400 font-bold text-sm ${className}`}>
        <span>Match Started!</span>
      </div>
    );
  }

  const TimeUnit = ({ value, label, isSeconds = false }: { value: number; label: string; isSeconds?: boolean }) => {
    const displayValue = String(value).padStart(2, '0');
    const [isFlipping, setIsFlipping] = useState(false);

    useEffect(() => {
      if (isSeconds) {
        setIsFlipping(true);
        const timer = setTimeout(() => setIsFlipping(false), 300);
        return () => clearTimeout(timer);
      }
      return undefined;
    }, [value, isSeconds]);

    return (
      <div className="flex flex-col items-center justify-center">
        <div className="relative">
          <motion.div
            className="rounded-lg px-3 py-2 bg-gradient-to-br from-purple-900/80 to-purple-950/90 border border-purple-700/30 shadow-lg"
            style={{
              minWidth: '48px',
              textAlign: 'center',
            }}
            animate={isFlipping && isSeconds ? {
              opacity: [1, 0.5, 1],
              scale: [1, 0.95, 1],
            } : {}}
            transition={{ duration: 0.3 }}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={`${label}-${value}-${flipKey}`}
                className="text-xl font-bold text-white tabular-nums block"
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 10, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {displayValue}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        </div>
        <span className="text-[10px] text-gray-400 uppercase tracking-wider mt-1.5 font-semibold">
          {label}
        </span>
      </div>
    );
  };

  return (
    <div className={`flex items-center justify-center gap-1.5 ${className}`}>
      <TimeUnit value={timeLeft.days} label="DAYS" />
      <span className="text-lg font-bold text-white/40 pb-4">:</span>
      <TimeUnit value={timeLeft.hours} label="HOURS" />
      <span className="text-lg font-bold text-white/40 pb-4">:</span>
      <TimeUnit value={timeLeft.minutes} label="MIN" />
      <span className="text-lg font-bold text-white/40 pb-4">:</span>
      <TimeUnit value={timeLeft.seconds} label="SEC" isSeconds={true} />
    </div>
  );
}

