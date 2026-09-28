'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';
import type { Player } from '@/types';

interface BubbleChartProps {
  players: Player[];
  xMetric?: string;
  yMetric?: string;
  sizeMetric?: string;
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
    case 'matches':
      return Number(player.stats.matches || 0);
    case 'runs':
    default:
      return Number(player.stats.runs || 0);
  }
}

function formatMetricValue(metric: string, value: number): string {
  if (metric === 'strikeRate' || metric === 'economy' || metric === 'average') {
    return value.toFixed(2);
  }
  return Math.round(value).toLocaleString();
}

const metricLabels: Record<string, string> = {
  runs: 'Runs',
  wickets: 'Wickets',
  strikeRate: 'Strike Rate',
  economy: 'Economy',
  average: 'Average',
  matches: 'Matches'
};

export default function BubbleChartVisualization({
  players,
  xMetric = 'strikeRate',
  yMetric = 'average',
  sizeMetric = 'runs',
  maxItems = 15,
  color = 'from-orange-500 to-amber-500',
}: BubbleChartProps) {
  const chartData = useMemo(() => {
    const topPlayers = players.slice(0, maxItems);
    
    return topPlayers.map((player, index) => {
      const xValue = getMetricValue(player, xMetric);
      const yValue = getMetricValue(player, yMetric);
      const sizeValue = getMetricValue(player, sizeMetric);
      
      return {
        x: xValue,
        y: yValue,
        z: sizeValue,
        name: player.name,
        fill: index === 0 ? '#f97316' : index === 1 ? '#a855f7' : index === 2 ? '#22c55e' : index === 3 ? '#3b82f6' : '#6b7280'
      };
    });
  }, [players, maxItems, xMetric, yMetric, sizeMetric]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900/95 border border-white/20 rounded-lg p-3 shadow-xl backdrop-blur-sm">
          <p className="text-white font-semibold mb-2">{data.name}</p>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">{metricLabels[xMetric]}:</span>
              <span className="text-white font-semibold">{formatMetricValue(xMetric, data.x)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">{metricLabels[yMetric]}:</span>
              <span className="text-white font-semibold">{formatMetricValue(yMetric, data.y)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">{metricLabels[sizeMetric]}:</span>
              <span className="text-white font-semibold">{formatMetricValue(sizeMetric, data.z)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const { xDomain, yDomain, zDomain } = useMemo(() => {
    if (chartData.length === 0) {
      return { xDomain: [0, 100], yDomain: [0, 100], zDomain: [0, 100] };
    }
    
    const xValues = chartData.map(d => d.x);
    const yValues = chartData.map(d => d.y);
    const zValues = chartData.map(d => d.z);
    
    // Add some padding to domains
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);
    const zMin = Math.min(...zValues);
    const zMax = Math.max(...zValues);
    
    return {
      xDomain: [xMin * 0.95, xMax * 1.05],
      yDomain: [yMin * 0.95, yMax * 1.05],
      zDomain: [zMin, zMax]
    };
  }, [chartData]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full h-80"
    >
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart data={chartData}>
          <CartesianGrid stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="x" 
            type="number" 
            domain={xDomain}
            name={metricLabels[xMetric]}
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            label={{ 
              value: metricLabels[xMetric], 
              position: 'insideBottom', 
              offset: -5,
              fill: '#9ca3af',
              fontSize: 12
            }}
          />
          <YAxis 
            dataKey="y" 
            type="number" 
            domain={yDomain}
            name={metricLabels[yMetric]}
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            label={{ 
              value: metricLabels[yMetric], 
              angle: -90, 
              position: 'insideLeft',
              fill: '#9ca3af',
              fontSize: 12
            }}
          />
          <ZAxis 
            dataKey="z" 
            range={[8, 30]} 
            domain={zDomain}
            name={metricLabels[sizeMetric]}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <Scatter>
            {chartData.map((entry, index) => (
              <circle 
                key={index} 
                cx={entry.x} 
                cy={entry.y} 
                r={entry.z} 
                fill={entry.fill}
                fillOpacity={0.6}
                stroke="white"
                strokeWidth={1.5}
                className="hover:fill-opacity-100 transition-all"
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-4 mt-2 text-xs text-gray-500">
        <span>X-axis: {metricLabels[xMetric]}</span>
        <span>•</span>
        <span>Y-axis: {metricLabels[yMetric]}</span>
        <span>•</span>
        <span>Bubble size: {metricLabels[sizeMetric]}</span>
      </div>
    </motion.div>
  );
}