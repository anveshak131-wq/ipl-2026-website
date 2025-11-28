'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Player } from '@/types';
import { BarChart3, TrendingUp } from 'lucide-react';

interface PlayerPerformanceChartProps {
  players: Player[];
  metric: 'runs' | 'wickets' | 'average' | 'strikeRate';
  title: string;
  color: string;
  maxItems?: number;
}

export default function PlayerPerformanceChart({
  players,
  metric,
  title,
  color,
  maxItems = 5,
}: PlayerPerformanceChartProps) {
  const sortedPlayers = useMemo(() => {
    return [...players]
      .sort((a, b) => {
        if (metric === 'runs') return b.stats.runs - a.stats.runs;
        if (metric === 'wickets') return b.stats.wickets - a.stats.wickets;
        if (metric === 'average') return b.stats.average - a.stats.average;
        if (metric === 'strikeRate') return b.stats.strikeRate - a.stats.strikeRate;
        return 0;
      })
      .slice(0, maxItems)
      .filter((p) => {
        if (metric === 'runs' || metric === 'average' || metric === 'strikeRate') {
          // Include batsmen, all-rounders, and wicket-keepers (exclude pure bowlers)
          return p.role === 'Batsman' || p.role === 'All-rounder' || p.role === 'Wicket-keeper';
        }
        if (metric === 'wickets') {
          // Include bowlers and all-rounders (exclude pure batsmen and wicket-keepers)
          return p.role === 'Bowler' || p.role === 'All-rounder';
        }
        return true;
      });
  }, [players, metric, maxItems]);

  const maxValue = useMemo(() => {
    if (sortedPlayers.length === 0) return 1;
    return Math.max(
      ...sortedPlayers.map((p) => {
        if (metric === 'runs') return p.stats.runs;
        if (metric === 'wickets') return p.stats.wickets;
        if (metric === 'average') return p.stats.average;
        if (metric === 'strikeRate') return p.stats.strikeRate;
        return 0;
      })
    );
  }, [sortedPlayers, metric]);

  const getValue = (player: Player) => {
    if (metric === 'runs') return player.stats.runs;
    if (metric === 'wickets') return player.stats.wickets;
    if (metric === 'average') return player.stats.average;
    if (metric === 'strikeRate') return player.stats.strikeRate;
    return 0;
  };

  const formatValue = (value: number) => {
    if (metric === 'strikeRate' || metric === 'average') {
      return value.toFixed(2);
    }
    return value.toString();
  };

  if (sortedPlayers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5" style={{ color }} />
          {title}
        </h3>
      </div>

      <div className="space-y-3">
        {sortedPlayers.map((player, index) => {
          const value = getValue(player);
          const percentage = (value / maxValue) * 100;

          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-1"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-white">{player.name}</span>
                <span className="font-bold" style={{ color }}>
                  {formatValue(value)}
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${color}, ${color}dd)`,
                    boxShadow: `0 0 10px ${color}40`,
                  }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

