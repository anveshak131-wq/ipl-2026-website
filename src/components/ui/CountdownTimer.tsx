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
        className={`inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 shadow-2xl ${className}`}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 150, damping: 12 }}
      >
        <motion.div
          animate={{ 
            rotate: [0, -10, 10, -10, 10, 0],
          }}
          transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
        >
          <span className="text-3xl">⚡</span>
        </motion.div>
        <span className="text-white font-black text-xl tracking-tight">LIVE NOW</span>
      </motion.div>
    );
  }

  const TimeUnit = ({ value, label, isSeconds = false }: { value: number; label: string; isSeconds?: boolean }) => {
    const displayValue = String(value).padStart(2, '0');
    const digits = displayValue.split('');

    return (
      <div className="flex flex-col items-center gap-3">
        {/* Digits container */}
        <div className="flex gap-2">
          {digits.map((digit, idx) => (
            <motion.div
              key={`${label}-${idx}`}
              className="relative"
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
            >
              {/* Glow background */}
              <motion.div 
                className="absolute -inset-2 bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-2xl blur-xl"
                animate={{
                  opacity: isSeconds ? [0.3, 0.7, 0.3] : 0.3,
                  scale: isSeconds ? [1, 1.1, 1] : 1,
                }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              
              {/* Digit card */}
              <div className="relative w-14 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-black shadow-2xl border border-white/10">
                {/* Top highlight */}
                <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />
                
                {/* Number */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={`${label}-${digit}-${value}`}
                      className="text-5xl font-black tabular-nums"
                      style={{
                        background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.5))',
                      }}
                      initial={{ 
                        y: isSeconds ? 20 : 0,
                        opacity: 0,
                        scale: 0.5,
                      }}
                      animate={{ 
                        y: 0,
                        opacity: 1,
                        scale: 1,
                      }}
                      exit={{ 
                        y: isSeconds ? -20 : 0,
                        opacity: 0,
                        scale: 0.5,
                      }}
                      transition={{ 
                        duration: 0.3,
                        ease: "easeOut"
                      }}
                    >
                      {digit}
                    </motion.span>
                  </AnimatePresence>
                </div>
                
                {/* Bottom shadow */}
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Label */}
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          {label}
        </span>
      </div>
    );
  };

  return (
    <div className={`relative inline-flex items-center justify-center gap-4 p-6 rounded-3xl bg-gradient-to-br from-slate-900/50 via-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/5 ${className}`}>
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5 rounded-3xl" 
           style={{
             backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
             backgroundSize: '32px 32px'
           }} 
      />
      
      <TimeUnit value={timeLeft.days} label="DAYS" />
      
      <motion.div 
        className="text-3xl font-thin text-cyan-400/50"
        animate={{ opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        :
      </motion.div>
      
      <TimeUnit value={timeLeft.hours} label="HOURS" />
      
      <motion.div 
        className="text-3xl font-thin text-blue-400/50"
        animate={{ opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
      >
        :
      </motion.div>
      
      <TimeUnit value={timeLeft.minutes} label="MINUTES" />
      
      <motion.div 
        className="text-3xl font-thin text-purple-400/50"
        animate={{ opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, delay: 1 }}
      >
        :
      </motion.div>
      
      <TimeUnit value={timeLeft.seconds} label="SECONDS" isSeconds={true} />
    </div>
  );
}

