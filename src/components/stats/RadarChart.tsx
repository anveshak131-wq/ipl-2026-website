'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { Player } from '@/types';

interface RadarChartProps {
  players: Player[];
  metric?: string;
  maxItems?: number;
  color?: string;
}

function getMetricValue(player: Player, metric: string): number {
  switch (metric) {
    case 'wickets':
      return Number(player.stats.wickets || 0);
    case 'strikeRate':
      return Number(player.stats.strikeRate || 0);
    case 'economy':
      return Number(player.stats.economy || 0);
    case 'average':
      return Number(player.stats.average || 0);
    case 'runs':
    default:
      return Number(player.stats.runs || 0);
  }
}

function normalizeValue(value: number, max: number, min: number): number {
  if (max === min) return 50;
  return ((value - min) / (max - min)) * 100;
}

export default function RadarChartVisualization({
  players,
  metric = 'runs',
  maxItems = 5,
  color = 'from-orange-500 to-amber-500',
}: RadarChartProps) {
  const chartData = useMemo(() => {
    const topPlayers = players.slice(0, maxItems);
    
    // Define metrics for radar chart (these will be the axes)
    const metrics = [
      { key: 'runs', label: 'Runs' },
      { key: 'strikeRate', label: 'Strike Rate' },
      { key: 'average', label: 'Average' },
      { key: 'wickets', label: 'Wickets' },
      { key: 'economy', label: 'Economy' }
    ];
    
    // Calculate min/max for each metric across all players
    const ranges = metrics.reduce((acc, m) => {
      const values = topPlayers.map(p => getMetricValue(p, m.key));
      acc[m.key] = {
        min: Math.min(...values),
        max: Math.max(...values)
      };
      return acc;
    }, {} as Record<string, { min: number; max: number }>);

    // Transform data for radar chart - each metric is a data point with player values
    return metrics.map(metric => {
      const data: any = {
        metric: metric.label,
      };

      topPlayers.forEach((player, index) => {
        const value = getMetricValue(player, metric.key);
        const normalized = normalizeValue(value, ranges[metric.key].max, ranges[metric.key].min);
        const playerName = player.name.split(' ').pop() || player.name;
        data[playerName] = Math.round(normalized);
      });

      return data;
    });
  }, [players, maxItems]);

  // Get player names for legend
  const playerNames = useMemo(() => {
    return players.slice(0, maxItems).map(p => p.name.split(' ').pop() || p.name);
  }, [players, maxItems]);

  // Generate colors for each player
  const playerColors = useMemo(() => {
    const colors = ['#f97316', '#a855f7', '#22c55e', '#3b82f6', '#ef4444'];
    return playerNames.map((_, index) => colors[index % colors.length]);
  }, [playerNames]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/95 border border-white/20 rounded-lg p-3 shadow-xl backdrop-blur-sm">
          <p className="text-white font-semibold mb-2">{payload[0].payload.metric}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-300">{entry.name}:</span>
              <span className="text-white font-semibold">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full h-80"
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData}>
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis 
            dataKey="metric" 
            tick={{ fill: '#9ca3af', fontSize: 11 }}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]}
            tick={{ fill: '#6b7280', fontSize: 10 }}
          />
          {playerNames.map((name, index) => (
            <Radar
              key={name}
              name={name}
              dataKey={name}
              stroke={playerColors[index]}
              fill={playerColors[index]}
              fillOpacity={0.3}
              strokeWidth={2}
            />
          ))}
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ 
              paddingTop: '20px',
              fontSize: '11px',
              color: '#9ca3af'
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}