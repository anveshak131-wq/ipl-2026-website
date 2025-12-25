'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles } from 'lucide-react';

interface MilestoneCelebrationProps {
  isVisible: boolean;
  runs: number;
  batterName: string;
  league?: 'ipl' | 'wpl';
}

export default function MilestoneCelebration({
  isVisible,
  runs,
  batterName,
  league = 'ipl',
}: MilestoneCelebrationProps) {
  const milestone = runs >= 150 ? 150 : runs >= 100 ? 100 : 50;
  const isHalfCentury = milestone === 50;
  const isCentury = milestone === 100;
  const isDoubleCentury = milestone === 150;

  const leagueColors = {
    ipl: {
      bg: 'from-yellow-900/90 via-amber-800/90 to-orange-700/90',
      text: 'text-yellow-200',
      accent: 'text-yellow-400',
      border: 'border-yellow-500/50',
      glow: 'shadow-yellow-500/50',
    },
    wpl: {
      bg: 'from-pink-900/90 via-purple-800/90 to-pink-700/90',
      text: 'text-pink-200',
      accent: 'text-pink-400',
      border: 'border-pink-500/50',
      glow: 'shadow-pink-500/50',
    },
  };

  const colors = leagueColors[league];

  const getMilestoneLabel = () => {
    if (isDoubleCentury) return '150 RUNS!';
    if (isCentury) return 'CENTURY!';
    return 'HALF CENTURY!';
  };

  const getMilestoneEmoji = () => {
    if (isDoubleCentury) return '🏆';
    if (isCentury) return '💯';
    return '🎯';
  };

  // Confetti particles
  const confetti = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1 + Math.random(),
  }));

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Confetti */}
          <div className="fixed inset-0 z-50 pointer-events-none">
            {confetti.map((particle) => (
              <motion.div
                key={particle.id}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  left: `${particle.x}%`,
                  top: `${particle.y}%`,
                  background: ['#FBBF24', '#F59E0B', '#EF4444', '#10B981', '#3B82F6'][
                    Math.floor(Math.random() * 5)
                  ],
                }}
                initial={{ opacity: 0, y: -20, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  y: [0, 100],
                  x: [0, (Math.random() - 0.5) * 100],
                  scale: [0, 1, 0],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: particle.duration,
                  delay: particle.delay,
                  ease: 'easeOut',
                }}
              />
            ))}
          </div>

          {/* Celebration Card */}
          <motion.div
            initial={{ 
              scale: 0.3,
              opacity: 0,
              rotate: -20,
            }}
            animate={{ 
              scale: 1,
              opacity: 1,
              rotate: 0,
            }}
            exit={{ 
              scale: 0.3,
              opacity: 0,
              rotate: 20,
            }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 20,
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <motion.div
              className={`relative bg-gradient-to-br ${colors.bg} rounded-3xl p-8 md:p-12 max-w-lg w-full border-2 ${colors.border} shadow-2xl ${colors.glow} backdrop-blur-xl pointer-events-auto`}
              animate={{
                boxShadow: [
                  `0 0 0px rgba(251, 191, 36, 0)`,
                  `0 0 80px rgba(251, 191, 36, 0.6)`,
                  `0 0 120px rgba(251, 191, 36, 0.4)`,
                  `0 0 80px rgba(251, 191, 36, 0.6)`,
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              {/* Trophy Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180, y: -50 }}
                animate={{ scale: 1, rotate: 0, y: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 15,
                  delay: 0.2,
                }}
                className="text-8xl mb-6 text-center"
              >
                {getMilestoneEmoji()}
              </motion.div>

              {/* Milestone Text */}
              <motion.h2
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
                className={`text-4xl md:text-5xl font-black ${colors.text} text-center mb-2 tracking-tight`}
              >
                {getMilestoneLabel()}
              </motion.h2>

              {/* Runs Display */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 15,
                  delay: 0.4,
                }}
                className={`text-6xl md:text-7xl font-black ${colors.accent} text-center mb-4`}
              >
                {runs}
              </motion.div>

              {/* Batter Name */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center"
              >
                <p className={`text-xl font-bold ${colors.text}`}>
                  {batterName}
                </p>
                <p className={`text-sm ${colors.accent} mt-2`}>
                  {isDoubleCentury && 'Outstanding achievement!'}
                  {isCentury && 'Magnificent century!'}
                  {isHalfCentury && 'Well played!'}
                </p>
              </motion.div>

              {/* Sparkles Animation */}
              <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                {Array.from({ length: 10 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      scale: [0, 1, 0],
                      opacity: [0, 1, 0],
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                  >
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

