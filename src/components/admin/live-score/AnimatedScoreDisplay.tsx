'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedScoreDisplayProps {
  teamName: string;
  runs: number;
  wickets: number;
  overs: number;
  isBatting: boolean;
  league?: 'ipl' | 'wpl';
  previousRuns?: number;
  previousWickets?: number;
}

export default function AnimatedScoreDisplay({
  teamName,
  runs,
  wickets,
  overs,
  isBatting,
  league = 'ipl',
  previousRuns = 0,
  previousWickets = 0,
}: AnimatedScoreDisplayProps) {
  const runsChanged = runs !== previousRuns;
  const wicketsChanged = wickets !== previousWickets;
  const runsIncreased = runs > previousRuns;
  const wicketsIncreased = wickets > previousWickets;

  const leagueColors = {
    ipl: {
      bg: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20',
      border: 'border-blue-400/30',
      badge: 'bg-blue-500/20 text-blue-400',
      increase: 'text-green-400',
      decrease: 'text-red-400',
      pulse: 'shadow-blue-500/50',
    },
    wpl: {
      bg: 'bg-gradient-to-br from-purple-500/20 to-pink-500/20',
      border: 'border-purple-400/30',
      badge: 'bg-purple-500/20 text-pink-400',
      increase: 'text-green-400',
      decrease: 'text-red-400',
      pulse: 'shadow-purple-500/50',
    }
  };

  const colors = leagueColors[league];

  return (
    <motion.div
      className={`
        p-6 rounded-2xl backdrop-blur-xl border-2 transition-all duration-300
        ${isBatting 
          ? `${colors.bg} ${colors.border} shadow-lg ${colors.pulse}` 
          : 'bg-slate-800/50 border-slate-700/30'
        }
      `}
      animate={{
        scale: runsChanged || wicketsChanged ? [1, 1.05, 1] : 1,
        boxShadow: runsChanged || wicketsChanged 
          ? `0 0 30px ${league === 'ipl' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(168, 85, 247, 0.5)'}`
          : '0 0 0px rgba(0,0,0,0)',
      }}
      transition={{
        duration: 0.5,
        ease: 'easeOut',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xl font-bold text-white">{teamName}</h3>
        {isBatting && (
          <motion.span
            className={`px-3 py-1.5 rounded-full ${colors.badge} text-xs font-bold uppercase tracking-wider`}
            animate={{
              opacity: [1, 0.7, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            BATTING
          </motion.span>
        )}
      </div>
      
      {/* Animated Runs Display */}
      <div className="text-5xl font-black mb-2 leading-none relative">
        <AnimatePresence mode="wait">
          <motion.span
            key={runs}
            initial={{ 
              y: runsIncreased ? -20 : 20, 
              opacity: 0,
              scale: 0.8,
              color: runsIncreased ? '#10B981' : '#EF4444',
            }}
            animate={{ 
              y: 0, 
              opacity: 1,
              scale: 1,
              color: '#FFFFFF',
            }}
            exit={{ 
              y: runsIncreased ? 20 : -20, 
              opacity: 0,
              scale: 0.8,
            }}
            transition={{
              duration: 0.4,
              ease: 'easeOut',
            }}
            className="inline-block"
          >
            {runs}
          </motion.span>
        </AnimatePresence>
        
        {/* Wickets Display */}
        <span className="text-3xl text-gray-400">/</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={wickets}
            initial={{ 
              scale: wicketsIncreased ? 1.5 : 1,
              color: wicketsIncreased ? '#EF4444' : '#9CA3AF',
            }}
            animate={{ 
              scale: 1,
              color: '#9CA3AF',
            }}
            transition={{
              duration: 0.3,
              ease: 'easeOut',
            }}
            className="inline-block text-3xl"
          >
            {wickets}
          </motion.span>
        </AnimatePresence>
      </div>
      
      {/* Overs Display */}
      <div className="text-sm text-gray-400 font-semibold">
        ({overs.toFixed(1)} overs)
      </div>
      
      {isBatting && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="text-xs text-gray-400">
            Run Rate: <span className="text-white font-bold">{(runs / (overs || 0.1)).toFixed(2)}</span>
          </div>
        </div>
      )}
      
      {/* Score Change Indicator */}
      <AnimatePresence>
        {runsChanged && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className={`absolute top-2 right-2 text-xs font-bold ${
              runsIncreased ? colors.increase : colors.decrease
            }`}
          >
            {runsIncreased ? '+' : ''}{runs - previousRuns}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

