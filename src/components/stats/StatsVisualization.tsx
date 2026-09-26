'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Player } from '@/types';

type MetricKey = 'runs' | 'wickets' | 'strikeRate' | 'economy';

interface StatsVisualizationProps {
  players: Player[];
  type: 'batting' | 'bowling';
  metric?: MetricKey;
  maxItems?: number;
  variant?: 'bar' | 'column' | 'donut' | 'axis' | 'lollipop';
}

function getMetricValue(player: Player, metric: MetricKey): number {
  switch (metric) {
    case 'wickets':
      return Number(player.stats.wickets || 0);
    case 'strikeRate':
      return Number(player.stats.strikeRate || 0);
    case 'economy':
      return Number(player.stats.economy || 0);
    case 'runs':
    default:
      return Number(player.stats.runs || 0);
  }
}

function formatMetricValue(metric: MetricKey, value: number): string {
  if (metric === 'strikeRate') return value.toFixed(2);
  if (metric === 'economy') return value.toFixed(2);
  return Math.round(value).toLocaleString();
}

function normalizeScore(value: number, maxValue: number, minValue: number, metric: MetricKey): number {
  if (metric === 'economy') {
    if (maxValue <= minValue) return 100;
    return ((maxValue - value) / (maxValue - minValue)) * 100;
  }

  if (maxValue <= 0) return 0;
  return (value / maxValue) * 100;
}

export default function StatsVisualization({
  players,
  type,
  metric,
  maxItems = 10,
  variant = 'bar',
}: StatsVisualizationProps) {
  const metricKey: MetricKey = metric || (type === 'batting' ? 'runs' : 'wickets');

  const sortedPlayers = useMemo(() => {
    const sorted = [...players].sort((a, b) => {
      const valueA = getMetricValue(a, metricKey);
      const valueB = getMetricValue(b, metricKey);

      if (metricKey === 'economy') {
        return valueA - valueB;
      }

      return valueB - valueA;
    });

    return sorted.slice(0, maxItems);
  }, [players, metricKey, maxItems]);

  const { maxValue, minValue } = useMemo(() => {
    if (sortedPlayers.length === 0) {
      return { maxValue: 1, minValue: 0 };
    }

    const values = sortedPlayers.map((player) => getMetricValue(player, metricKey));
    return {
      maxValue: Math.max(...values),
      minValue: Math.min(...values),
    };
  }, [sortedPlayers, metricKey]);

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

  const valueLabel =
    metricKey === 'runs'
      ? 'Runs'
      : metricKey === 'wickets'
      ? 'Wickets'
      : metricKey === 'strikeRate'
      ? 'Strike Rate'
      : 'Economy';

  const resolvedVariant = variant === 'axis' ? 'lollipop' : variant;

  // Lollipop chart variant inspired by common ranked comparison patterns.
  if (resolvedVariant === 'lollipop') {
    return (
      <div className="space-y-3">
        {sortedPlayers.map((player, index) => {
            const value = getMetricValue(player, metricKey);
            const percentage = normalizeScore(value, maxValue, minValue, metricKey);
            const barColor = type === 'batting' ? getBarColor(index) : getBarColorBowling(index);

            return (
              <motion.div
                key={player.id}
                className="grid grid-cols-[30px_minmax(0,1fr)] gap-3"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
              >
                <div className="text-xs font-bold text-gray-400 pt-1">#{index + 1}</div>

                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className="text-sm font-semibold text-white truncate">{player.name}</span>
                    <span className={`text-sm font-bold whitespace-nowrap ${type === 'batting' ? 'text-amber-300' : 'text-purple-300'}`}>
                      {formatMetricValue(metricKey, value)}
                    </span>
                  </div>

                  <div className="relative h-7">
                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] rounded-full bg-gray-700/70" />

                    <motion.div
                      className={`absolute left-0 top-1/2 -translate-y-1/2 h-[2px] rounded-full bg-gradient-to-r ${barColor}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(6, percentage)}%` }}
                      transition={{ duration: 0.7, delay: index * 0.06, ease: 'easeOut' }}
                    />

                    <motion.div
                      className={`absolute top-1/2 -translate-y-1/2 -ml-2 w-4 h-4 rounded-full border border-white/60 shadow-lg bg-gradient-to-br ${barColor}`}
                      style={{ left: `${Math.max(6, percentage)}%` }}
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.2 + index * 0.06 }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}

        <div className="pt-1 text-[11px] text-gray-500">
          Ranked by {valueLabel.toLowerCase()}
          {metricKey === 'economy' ? ' (lower is better)' : ''}
        </div>
      </div>
    );
  }

  // Donut chart variant (e.g. Purple Cap special view)
  if (resolvedVariant === 'donut') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sortedPlayers.map((player, index) => {
          const value = getMetricValue(player, metricKey);
          const percentage = normalizeScore(value, maxValue, minValue, metricKey);
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
                    {formatMetricValue(metricKey, value)}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Comparison index: {Math.round(percentage)}%
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  }

  // Column chart variant
  if (resolvedVariant === 'column') {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-end gap-3 h-48">
          {sortedPlayers.map((player, index) => {
            const value = getMetricValue(player, metricKey);
            const percentage = normalizeScore(value, maxValue, minValue, metricKey);
            const barColor = type === 'batting' ? getBarColor(index) : getBarColorBowling(index);

            return (
              <motion.div
                key={player.id}
                className="flex-1 flex flex-col items-center gap-2 min-w-[40px]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.06 }}
              >
                <span className="text-xs font-semibold text-gray-300">{formatMetricValue(metricKey, value)}</span>
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
        const value = getMetricValue(player, metricKey);
        const percentage = normalizeScore(value, maxValue, minValue, metricKey);
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
                {formatMetricValue(metricKey, value)}
              </span>
            </div>
            <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className={`h-full bg-gradient-to-r ${barColor} rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(3, percentage)}%` }}
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
