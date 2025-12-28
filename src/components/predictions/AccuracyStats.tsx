'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/data';
import type { PredictionStats } from '@/types';
import { Target, Trophy, TrendingUp, Award } from 'lucide-react';

interface AccuracyStatsProps {
  userId: string;
}

export default function AccuracyStats({ userId }: AccuracyStatsProps) {
  const [stats, setStats] = useState<PredictionStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getPredictionStats(userId);
        setStats(data);
      } catch (error) {
        console.error('Error fetching prediction stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ipl-gold"></div>
      </div>
    );
  }

  if (!stats || stats.totalPredictions === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Target className="w-12 h-12 mx-auto mb-3 text-gray-600" />
        <p>No prediction statistics yet</p>
        <p className="text-sm mt-2">Make predictions to see your accuracy!</p>
      </div>
    );
  }

  const statsItems = [
    {
      label: 'Overall Accuracy',
      value: `${stats.accuracy.overall.toFixed(1)}%`,
      icon: Target,
      color: 'text-ipl-gold',
      bgColor: 'bg-ipl-gold/20',
    },
    {
      label: 'Match Winner',
      value: `${stats.accuracy.matchWinner.toFixed(1)}%`,
      icon: Trophy,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
    },
    {
      label: 'Top Scorer',
      value: `${stats.accuracy.topScorer.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
    },
    {
      label: 'Most Wickets',
      value: `${stats.accuracy.mostWickets.toFixed(1)}%`,
      icon: Award,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
    },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <Target className="w-5 h-5 text-ipl-gold" />
        Your Prediction Stats
      </h3>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">Total Predictions</div>
          <div className="text-2xl font-bold text-white">{stats.totalPredictions}</div>
        </div>
        <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">Completed</div>
          <div className="text-2xl font-bold text-white">{stats.completedPredictions}</div>
        </div>
        <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">Total Points</div>
          <div className="text-2xl font-bold text-ipl-gold">{stats.totalPoints}</div>
        </div>
        <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">Perfect Predictions</div>
          <div className="text-2xl font-bold text-green-400">{stats.wins}</div>
        </div>
      </div>

      {/* Accuracy Breakdown */}
      <div className="space-y-3">
        {statsItems.map((item, index) => {
          const Icon = item.icon;
          const percentage = parseFloat(item.value.replace('%', ''));
          
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${item.bgColor}`}>
                    <Icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <span className="text-white font-medium">{item.label}</span>
                </div>
                <span className={`text-lg font-bold ${item.color}`}>{item.value}</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className={`h-full ${item.bgColor.replace('/20', '')}`}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Rank */}
      {stats.rank && (
        <div className="p-4 bg-gradient-to-r from-ipl-gold/20 to-ipl-purple/20 border border-ipl-gold/50 rounded-lg text-center">
          <div className="text-sm text-gray-400 mb-1">Global Rank</div>
          <div className="text-3xl font-bold text-ipl-gold">#{stats.rank}</div>
        </div>
      )}
    </div>
  );
}

