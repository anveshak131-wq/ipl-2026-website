'use client';

import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface TrophyCounterProps {
  trophyCount: number;
  trophyYears?: number[];
  primaryColor: string;
  teamName: string;
}

function AnimatedCounter({ value, duration = 2 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    const startTime = Date.now();
    const startValue = 0;
    const endValue = value;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(startValue + (endValue - startValue) * easeOutQuart);
      
      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(endValue);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, value, duration]);

  return <span ref={ref}>{count}</span>;
}

export default function TrophyCounter({
  trophyCount,
  trophyYears = [],
  primaryColor,
  teamName,
}: TrophyCounterProps) {
  if (trophyCount === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4 }}
      className="group relative"
    >
      <div
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-500/20 via-amber-500/20 to-orange-500/20 border-2 border-yellow-500/30 p-6 backdrop-blur-sm"
        style={{
          boxShadow: '0 8px 32px rgba(234, 179, 8, 0.2)',
        }}
      >
        {/* Animated shine effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 5,
          }}
        />

        <div className="relative flex items-center gap-6">
          {/* Trophy icon with animation */}
          <motion.div
            animate={{
              rotate: [0, -10, 10, -10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
            }}
            className="flex-shrink-0"
          >
            <div
              className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-2xl"
              style={{
                boxShadow: '0 0 30px rgba(251, 191, 36, 0.6)',
              }}
            >
              <Trophy className="w-10 h-10 text-white" />
            </div>
          </motion.div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-baseline gap-2 mb-1">
              <motion.span
                className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400"
                style={{ textShadow: '0 2px 20px rgba(251, 191, 36, 0.3)' }}
              >
                <AnimatedCounter value={trophyCount} duration={2} />
              </motion.span>
              <span className="text-xl font-bold text-yellow-400/80">
                {trophyCount === 1 ? 'Title' : 'Titles'}
              </span>
            </div>
            <p className="text-sm text-gray-300 font-medium">
              {teamName} Championships
            </p>

            {/* Trophy years on hover */}
            {trophyYears.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                whileHover={{ opacity: 1, height: 'auto' }}
                className="mt-3 pt-3 border-t border-yellow-500/20 overflow-hidden"
              >
                <div className="flex flex-wrap gap-2">
                  {trophyYears.map((year, index) => (
                    <motion.span
                      key={year}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="px-2 py-1 rounded-md bg-yellow-500/20 border border-yellow-500/30 text-xs font-bold text-yellow-400"
                    >
                      {year}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Trophy icons decoration */}
          <div className="hidden md:flex gap-2">
            {[...Array(Math.min(trophyCount, 5))].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                whileHover={{ scale: 1.2, rotate: 10 }}
              >
                <Trophy className="w-5 h-5 text-yellow-500/60" />
              </motion.div>
            ))}
            {trophyCount > 5 && (
              <span className="text-yellow-500/60 text-sm font-bold self-center">
                +{trophyCount - 5}
              </span>
            )}
          </div>
        </div>

        {/* Particles effect */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-yellow-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
