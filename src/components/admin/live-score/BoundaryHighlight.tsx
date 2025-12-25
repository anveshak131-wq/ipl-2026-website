'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';

interface BoundaryHighlightProps {
  isVisible: boolean;
  runs: 4 | 6;
  batterName: string;
  league?: 'ipl' | 'wpl';
}

export default function BoundaryHighlight({
  isVisible,
  runs,
  batterName,
  league = 'ipl',
}: BoundaryHighlightProps) {
  const isSix = runs === 6;

  const leagueColors = {
    ipl: {
      four: {
        bg: 'from-green-500/20 to-emerald-500/20',
        border: 'border-green-400/50',
        text: 'text-green-300',
        glow: 'shadow-green-500/50',
      },
      six: {
        bg: 'from-yellow-500/20 to-orange-500/20',
        border: 'border-yellow-400/50',
        text: 'text-yellow-300',
        glow: 'shadow-yellow-500/50',
      },
    },
    wpl: {
      four: {
        bg: 'from-green-500/20 to-emerald-500/20',
        border: 'border-green-400/50',
        text: 'text-green-300',
        glow: 'shadow-green-500/50',
      },
      six: {
        bg: 'from-pink-500/20 to-purple-500/20',
        border: 'border-pink-400/50',
        text: 'text-pink-300',
        glow: 'shadow-pink-500/50',
      },
    },
  };

  const colors = leagueColors[league][isSix ? 'six' : 'four'];
  const label = isSix ? 'SIX' : 'FOUR';
  const emoji = isSix ? '🚀' : '⚡';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 50 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            y: 0,
          }}
          exit={{ 
            opacity: 0, 
            scale: 0.5, 
            y: -50,
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 20,
          }}
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none"
        >
          <motion.div
            className={`bg-gradient-to-r ${colors.bg} border-2 ${colors.border} rounded-2xl px-8 py-6 shadow-2xl ${colors.glow} backdrop-blur-xl`}
            animate={{
              boxShadow: [
                `0 0 20px ${isSix ? 'rgba(251, 191, 36, 0.5)' : 'rgba(34, 197, 94, 0.5)'}`,
                `0 0 40px ${isSix ? 'rgba(251, 191, 36, 0.8)' : 'rgba(34, 197, 94, 0.8)'}`,
                `0 0 20px ${isSix ? 'rgba(251, 191, 36, 0.5)' : 'rgba(34, 197, 94, 0.5)'}`,
              ],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <div className="flex items-center gap-4">
              {/* Icon */}
              <motion.div
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 0.6,
                  ease: 'easeOut',
                }}
                className="text-4xl"
              >
                {emoji}
              </motion.div>

              {/* Text */}
              <div>
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className={`text-3xl font-black ${colors.text} mb-1`}
                >
                  {label}!
                </motion.div>
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm text-white/80"
                >
                  {batterName}
                </motion.div>
              </div>

              {/* Runs Badge */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 15,
                  delay: 0.3,
                }}
                className={`text-4xl font-black ${colors.text}`}
              >
                {runs}
              </motion.div>
            </div>

            {/* Pulse Rings */}
            {isSix && (
              <>
                <motion.div
                  className={`absolute inset-0 rounded-2xl border-2 ${colors.border}`}
                  animate={{
                    scale: [1, 1.5, 1.5],
                    opacity: [0.8, 0, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                />
                <motion.div
                  className={`absolute inset-0 rounded-2xl border-2 ${colors.border}`}
                  animate={{
                    scale: [1, 1.8, 1.8],
                    opacity: [0.6, 0, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: 0.3,
                    ease: 'easeOut',
                  }}
                />
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

