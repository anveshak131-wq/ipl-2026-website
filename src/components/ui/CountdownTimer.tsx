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
      <motion.div 
        className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 shadow-xl ${className}`}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0]
          }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
        >
          <span className="text-2xl">🏏</span>
        </motion.div>
        <span className="text-white font-black text-lg tracking-wide drop-shadow-lg">Match Started!</span>
      </motion.div>
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
      <motion.div 
        className="flex flex-col items-center justify-center gap-2"
        whileHover={{ scale: 1.05, y: -2 }}
        transition={{ duration: 0.2 }}
      >
        <div className="relative group">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity" />
          
          {/* Main card */}
          <motion.div
            className="relative rounded-2xl overflow-hidden shadow-2xl"
            style={{
              minWidth: '64px',
              minHeight: '72px',
            }}
            animate={isFlipping && isSeconds ? {
              rotateX: [0, 90, 0],
            } : {}}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-black" />
            
            {/* Top shine */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent" />
            
            {/* Border glow */}
            <motion.div 
              className="absolute inset-0 rounded-2xl"
              style={{
                border: '2px solid transparent',
                backgroundImage: 'linear-gradient(135deg, rgba(59, 130, 246, 0.5), rgba(147, 51, 234, 0.5))',
                backgroundOrigin: 'border-box',
                backgroundClip: 'border-box',
                WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
              }}
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            
            {/* Center divider line */}
            <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
            
            {/* Number display */}
            <div className="relative flex items-center justify-center h-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${label}-${value}-${flipKey}`}
                  className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 tabular-nums drop-shadow-2xl"
                  initial={{ 
                    y: isSeconds ? -20 : 0, 
                    opacity: 0,
                    rotateX: isSeconds ? 90 : 0,
                  }}
                  animate={{ 
                    y: 0, 
                    opacity: 1,
                    rotateX: 0,
                  }}
                  exit={{ 
                    y: isSeconds ? 20 : 0, 
                    opacity: 0,
                    rotateX: isSeconds ? -90 : 0,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {displayValue}
                </motion.div>
              </AnimatePresence>
            </div>
            
            {/* Bottom reflection */}
            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />
          </motion.div>
        </div>
        
        {/* Label */}
        <motion.span 
          className="text-[11px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 uppercase tracking-[0.2em]"
          animate={{
            opacity: [0.7, 1, 0.7],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {label}
        </motion.span>
      </motion.div>
    );
  };

  return (
    <div className={`relative inline-flex items-center justify-center gap-3 ${className}`}>
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-2xl -z-10" />
      
      <TimeUnit value={timeLeft.days} label="DAYS" />
      
      <motion.div
        className="flex flex-col items-center gap-1 pb-8"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <div className="w-2 h-2 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 shadow-lg" />
        <div className="w-2 h-2 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 shadow-lg" />
      </motion.div>
      
      <TimeUnit value={timeLeft.hours} label="HOURS" />
      
      <motion.div
        className="flex flex-col items-center gap-1 pb-8"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
      >
        <div className="w-2 h-2 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 shadow-lg" />
        <div className="w-2 h-2 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 shadow-lg" />
      </motion.div>
      
      <TimeUnit value={timeLeft.minutes} label="MIN" />
      
      <motion.div
        className="flex flex-col items-center gap-1 pb-8"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
      >
        <div className="w-2 h-2 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 shadow-lg" />
        <div className="w-2 h-2 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 shadow-lg" />
      </motion.div>
      
      <TimeUnit value={timeLeft.seconds} label="SEC" isSeconds={true} />
    </div>
  );
}

