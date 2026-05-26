'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp } from 'lucide-react';
import { PlayerPerformanceMetric, TeamPlayerStatRow } from '@/types/components';

interface PlayerPerformanceChartProps {
  rows: TeamPlayerStatRow[];
  metric: PlayerPerformanceMetric;
  title: string;
  color: string;
  maxItems?: number;
  scopeLabel?: string;
  sourceLabel?: string;
}

const metricConfig: Record<
  PlayerPerformanceMetric,
  {
    getValue: (row: TeamPlayerStatRow) => number;
    formatValue: (value: number) => string;
    metricLabel: string;
    sortDirection: 'asc' | 'desc';
    primaryFilter: (row: TeamPlayerStatRow) => boolean;
    fallbackFilter: (row: TeamPlayerStatRow) => boolean;
    qualifier?: string;
  }
> = {
  runs: {
    getValue: (row) => row.runs,
    formatValue: (value) => value.toString(),
    metricLabel: 'Runs',
    sortDirection: 'desc',
    primaryFilter: (row) => row.runs > 0,
    fallbackFilter: (row) => row.matches > 0,
  },
  wickets: {
    getValue: (row) => row.wickets,
    formatValue: (value) => value.toString(),
    metricLabel: 'Wickets',
    sortDirection: 'desc',
    primaryFilter: (row) => row.wickets > 0,
    fallbackFilter: (row) => row.matches > 0,
  },
  strikeRate: {
    getValue: (row) => row.strikeRate,
    formatValue: (value) => value.toFixed(2),
    metricLabel: 'Strike rate',
    sortDirection: 'desc',
    primaryFilter: (row) => row.ballsFaced >= 20 && row.runs > 0,
    fallbackFilter: (row) => row.ballsFaced > 0 && row.runs > 0,
    qualifier: 'Minimum 20 balls faced',
  },
  economy: {
    getValue: (row) => row.economy,
    formatValue: (value) => value.toFixed(2),
    metricLabel: 'Economy',
    sortDirection: 'asc',
    primaryFilter: (row) => row.ballsBowled >= 24,
    fallbackFilter: (row) => row.ballsBowled > 0,
    qualifier: 'Minimum 4 overs bowled',
  },
  sixes: {
    getValue: (row) => row.sixes,
    formatValue: (value) => value.toString(),
    metricLabel: 'Sixes',
    sortDirection: 'desc',
    primaryFilter: (row) => row.sixes > 0,
    fallbackFilter: (row) => row.matches > 0,
  },
  bowlingStrikeRate: {
    getValue: (row) => row.bowlingStrikeRate,
    formatValue: (value) => value.toFixed(2),
    metricLabel: 'Bowl SR',
    sortDirection: 'asc',
    primaryFilter: (row) => row.wickets > 0 && row.ballsBowled >= 24,
    fallbackFilter: (row) => row.wickets > 0,
    qualifier: 'Minimum 4 overs and 1 wicket',
  },
};

export default function PlayerPerformanceChart({
  rows,
  metric,
  title,
  color,
  maxItems = 5,
  scopeLabel,
  sourceLabel,
}: PlayerPerformanceChartProps) {
  const config = metricConfig[metric];
  const subtitleParts = [scopeLabel, sourceLabel, config.qualifier].filter(Boolean);

  const sortedRows = useMemo(() => {
    const qualified = rows.filter(config.primaryFilter);
    const filteredRows = qualified.length >= 3 ? qualified : rows.filter(config.fallbackFilter);

    return [...filteredRows]
      .sort((a, b) => {
        const aValue = config.getValue(a);
        const bValue = config.getValue(b);
        return config.sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      })
      .slice(0, maxItems);
  }, [config, maxItems, rows]);

  const [minValue, maxValue] = useMemo(() => {
    if (sortedRows.length === 0) return [0, 1];
    const values = sortedRows.map((row) => config.getValue(row));
    return [Math.min(...values), Math.max(...values)];
  }, [config, sortedRows]);

  const getBarWidth = (value: number) => {
    if (config.sortDirection === 'desc') {
      const ratio = maxValue > 0 ? value / maxValue : 0;
      return Math.max(12, ratio * 100);
    }

    if (maxValue === minValue) return 100;
    const ratio = (maxValue - value) / (maxValue - minValue);
    return Math.max(12, ratio * 100);
  };

  if (sortedRows.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No leaderboard data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5" style={{ color }} />
            {title}
          </h3>
          {subtitleParts.length > 0 && (
            <p className="text-xs text-gray-300 mt-1">{subtitleParts.join(' · ')}</p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {sortedRows.map((row, index) => {
          const value = config.getValue(row);
          const percentage = getBarWidth(value);

          return (
            <motion.div
              key={`${metric}-${row.playerId || row.playerName}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
              className="space-y-2"
            >
              <div className="flex items-start justify-between gap-3 text-sm">
                <div>
                  <p className="font-semibold text-white">{row.playerName}</p>
                  <p className="text-[11px] text-gray-300">
                    {row.role} · {row.matches} matches
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-bold" style={{ color }}>
                    {config.formatValue(value)}
                  </span>
                  <p className="text-[11px] text-gray-300">{config.metricLabel}</p>
                </div>
              </div>

              <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.9, delay: index * 0.08 }}
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
