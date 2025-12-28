'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, Trophy, Target, TrendingUp } from 'lucide-react';
import type { Player, Team } from '@/types';

interface QuickStatsGridProps {
  players: Player[];
  teams: Team[];
}

export default function QuickStatsGrid({ players, teams }: QuickStatsGridProps) {
  const stats = useMemo(() => {
    const totalRuns = players.reduce((sum, p) => sum + p.stats.runs, 0);
    const totalWickets = players.reduce((sum, p) => sum + p.stats.wickets, 0);
    const totalMatches = players.reduce((sum, p) => sum + p.stats.matches, 0);
    const avgRunsPerMatch = totalMatches > 0 ? totalRuns / totalMatches : 0;

    return {
      totalPlayers: players.length,
      totalTeams: teams.length,
      totalRuns,
      totalWickets,
      totalMatches,
      avgRunsPerMatch,
    };
  }, [players, teams]);

  const statCards = [
    {
      icon: Users,
      label: 'Total Players',
      value: stats.totalPlayers.toLocaleString(),
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
    },
    {
      icon: Trophy,
      label: 'Total Teams',
      value: stats.totalTeams.toString(),
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
    },
    {
      icon: Target,
      label: 'Total Runs',
      value: stats.totalRuns.toLocaleString(),
      color: 'from-orange-500 to-amber-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/30',
    },
    {
      icon: TrendingUp,
      label: 'Total Wickets',
      value: stats.totalWickets.toLocaleString(),
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
          whileHover={{ scale: 1.05, y: -4 }}
          className={`
            relative overflow-hidden rounded-2xl border backdrop-blur-xl
            ${stat.bgColor} ${stat.borderColor}
            transition-all duration-300
          `}
        >
          {/* Animated gradient background */}
          <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
          
          <div className="relative z-10 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wider font-semibold text-gray-400">
                {stat.label}
              </p>
              <p className="text-3xl font-black text-white">
                {stat.value}
              </p>
            </div>
          </div>

          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatDelay: 2,
              ease: 'linear',
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}

