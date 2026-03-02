'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Player } from '@/types';

interface StatsVisualizationProps {
  players: Player[];
  type: 'batting' | 'bowling';
  maxItems?: number;
  variant?: 'bar' | 'column' | 'donut';
}

export default function StatsVisualization({ players, type, maxItems = 10, variant = 'bar' }: StatsVisualizationProps) {
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

  // Donut chart variant (e.g. Purple Cap special view)
  if (variant === 'donut') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sortedPlayers.map((player, index) => {
          const value = type === 'batting' ? player.stats.runs : player.stats.wickets;
          const percentage = (value / maxValue) * 100;
          const barColor = type === 'batting' ? getBarColor(index) : getBarColorBowling(index);
          const gradient = barColor.includes('purple')
            ? 'rgba(168,85,247,1), rgba(244,114,182,1)'
            : 'rgba(249,115,22,1), rgba(234,179,8,1)';

          return (
            <motion.div
              key={player.id}
              className="flex items-center gap-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <div className="relative w-16 h-16 flex-shrink-0">
                <div
                  className="w-16 h-16 rounded-full bg-gray-900/80 flex items-center justify-center"
                  style={{
                    background: `conic-gradient(${gradient} ${percentage}%, rgba(31,41,55,1) ${percentage}%)`,
                  }}
                >
                  <div className="w-11 h-11 rounded-full bg-gray-950 flex items-center justify-center">
                    <span className="text-xs font-semibold text-gray-200">
                      #{index + 1}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-white truncate">
                    {player.name}
                  </p>
                  <span className={`text-sm font-bold ${type === 'bowling' ? 'text-purple-300' : 'text-amber-300'}`}>
                    {value}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Share of leader: {Math.round(percentage)}%
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  }

  // Column chart variant
  if (variant === 'column') {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-end gap-3 h-48">
          {sortedPlayers.map((player, index) => {
            const value = type === 'batting' ? player.stats.runs : player.stats.wickets;
            const percentage = (value / maxValue) * 100;
            const barColor = type === 'batting' ? getBarColor(index) : getBarColorBowling(index);

            return (
              <motion.div
                key={player.id}
                className="flex-1 flex flex-col items-center gap-2 min-w-[40px]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.06 }}
              >
                <span className="text-xs font-semibold text-gray-300">{value}</span>
                <div className="relative w-full h-full bg-gray-900/60 rounded-full overflow-hidden flex items-end">
                  <motion.div
                    className={`w-full bg-gradient-to-t ${barColor} rounded-full`}
                    initial={{ height: 0 }}
                    animate={{ height: `${percentage}%` }}
                    transition={{ duration: 0.8, delay: index * 0.08, ease: 'easeOut' }}
                  />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-400 font-bold">#{index + 1}</span>
                  <span className="text-[11px] text-gray-200 font-medium text-center line-clamp-2">
                    {player.name.split(' ').slice(-2).join(' ')}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  // Default variant: horizontal bar comparison
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
              <span className={`font-bold ${type === 'bowling' && index === 0 ? 'text-purple-400' : index === 0 ? 'text-orange-400' : 'text-gray-300'}`}>
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

