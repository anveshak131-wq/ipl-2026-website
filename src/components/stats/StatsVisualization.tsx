'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Player } from '@/types';

interface StatsVisualizationProps {
  players: Player[];
  type: 'batting' | 'bowling';
  maxItems?: number;
}

export default function StatsVisualization({ players, type, maxItems = 10 }: StatsVisualizationProps) {
  const sortedPlayers = useMemo(() => {
    const sorted = [...players].sort((a, b) => {
      if (type === 'batting') {
        return b.stats.runs - a.stats.runs;
      } else {
        return b.stats.wickets - a.stats.wickets;
      }
    });
    return sorted.slice(0, maxItems);
  }, [players, type, maxItems]);

  const maxValue = useMemo(() => {
    if (sortedPlayers.length === 0) return 1;
    if (type === 'batting') {
      return Math.max(...sortedPlayers.map(p => p.stats.runs));
    } else {
      return Math.max(...sortedPlayers.map(p => p.stats.wickets));
    }
  }, [sortedPlayers, type]);

  const getBarColor = (index: number) => {
    if (index === 0) return 'from-orange-500 to-amber-500';
    if (index === 1) return 'from-orange-400 to-amber-400';
    if (index === 2) return 'from-orange-300 to-amber-300';
    return 'from-gray-600 to-gray-700';
  };

  const getBarColorBowling = (index: number) => {
    if (index === 0) return 'from-purple-500 to-violet-500';
    if (index === 1) return 'from-purple-400 to-violet-400';
    if (index === 2) return 'from-purple-300 to-violet-300';
    return 'from-gray-600 to-gray-700';
  };

  return (
    <div className="space-y-3">
      {sortedPlayers.map((player, index) => {
        const value = type === 'batting' ? player.stats.runs : player.stats.wickets;
        const percentage = (value / maxValue) * 100;
        const barColor = type === 'batting' ? getBarColor(index) : getBarColorBowling(index);

        return (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-gray-400 font-bold w-6">#{index + 1}</span>
                <span className="text-white font-semibold truncate">{player.name}</span>
              </div>
              <span className={`font-bold ${index === 0 ? 'text-orange-400' : index === 0 && type === 'bowling' ? 'text-purple-400' : 'text-gray-300'}`}>
                {value}
              </span>
            </div>
            <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className={`h-full bg-gradient-to-r ${barColor} rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.8, delay: index * 0.1, ease: 'easeOut' }}
              />
              {/* Animated shine effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{
                  x: ['-100%', '200%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1,
                  ease: 'linear',
                }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

