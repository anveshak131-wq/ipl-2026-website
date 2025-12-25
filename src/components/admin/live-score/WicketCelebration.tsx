'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface WicketCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  batterName: string;
  dismissalType: string;
  bowlerName?: string;
  fielderName?: string;
  league?: 'ipl' | 'wpl';
}

export default function WicketCelebration({
  isOpen,
  onClose,
  batterName,
  dismissalType,
  bowlerName,
  fielderName,
  league = 'ipl',
}: WicketCelebrationProps) {
  const leagueColors = {
    ipl: {
      bg: 'from-red-900/90 to-red-600/90',
      text: 'text-red-200',
      accent: 'text-red-400',
      border: 'border-red-500/50',
    },
    wpl: {
      bg: 'from-pink-900/90 to-purple-600/90',
      text: 'text-pink-200',
      accent: 'text-pink-400',
      border: 'border-pink-500/50',
    },
  };

  const colors = leagueColors[league];

  const getDismissalIcon = () => {
    switch (dismissalType.toLowerCase()) {
      case 'bowled':
        return '🎯';
      case 'caught':
        return '✋';
      case 'lbw':
        return '🦵';
      case 'stumped':
        return '🏃';
      case 'run out':
        return '🏃‍♂️';
      case 'hit wicket':
        return '⚡';
      default:
        return '🏏';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          {/* Celebration Card */}
          <motion.div
            initial={{ 
              scale: 0.5,
              opacity: 0,
              rotate: -10,
            }}
            animate={{ 
              scale: 1,
              opacity: 1,
              rotate: 0,
            }}
            exit={{ 
              scale: 0.5,
              opacity: 0,
              rotate: 10,
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 25,
            }}
            className={`fixed inset-0 z-50 flex items-center justify-center p-4`}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              className={`relative bg-gradient-to-br ${colors.bg} rounded-3xl p-8 md:p-12 max-w-md w-full border-2 ${colors.border} shadow-2xl`}
              animate={{
                boxShadow: [
                  '0 0 0px rgba(239, 68, 68, 0)',
                  '0 0 50px rgba(239, 68, 68, 0.5)',
                  '0 0 100px rgba(239, 68, 68, 0.3)',
                  '0 0 50px rgba(239, 68, 68, 0.5)',
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Wicket Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 15,
                  delay: 0.2,
                }}
                className="text-8xl mb-6 text-center"
              >
                {getDismissalIcon()}
              </motion.div>

              {/* WICKET Text */}
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className={`text-5xl md:text-6xl font-black ${colors.text} text-center mb-4 tracking-tight`}
              >
                WICKET!
              </motion.h2>

              {/* Batter Name */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center mb-6"
              >
                <p className={`text-2xl font-bold ${colors.text} mb-2`}>
                  {batterName}
                </p>
                <p className={`text-lg ${colors.accent} capitalize`}>
                  {dismissalType}
                </p>
              </motion.div>

              {/* Dismissal Details */}
              {(bowlerName || fielderName) && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className={`space-y-2 text-center ${colors.text}`}
                >
                  {bowlerName && (
                    <p className="text-sm">
                      Bowler: <span className="font-bold">{bowlerName}</span>
                    </p>
                  )}
                  {fielderName && (
                    <p className="text-sm">
                      Fielder: <span className="font-bold">{fielderName}</span>
                    </p>
                  )}
                </motion.div>
              )}

              {/* Shake Animation */}
              <motion.div
                animate={{
                  x: [0, -10, 10, -10, 10, 0],
                }}
                transition={{
                  duration: 0.5,
                  delay: 0.6,
                  repeat: 1,
                }}
                className="mt-6 text-center"
              >
                <motion.button
                  onClick={onClose}
                  className={`px-8 py-3 bg-white/20 hover:bg-white/30 ${colors.text} rounded-xl font-bold transition-colors border ${colors.border}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Continue
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

