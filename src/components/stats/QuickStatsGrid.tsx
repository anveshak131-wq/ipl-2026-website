'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Award, Flame, Gauge, Swords } from 'lucide-react';
import type { Player, Team } from '@/types';

interface QuickStatsGridProps {
  players: Player[];
  teams: Team[];
}

function safeNumber(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function QuickStatsGrid({ players }: QuickStatsGridProps) {
  const stats = useMemo(() => {
    const totalFours = players.reduce((sum, p) => sum + safeNumber(p.stats?.fours), 0);
    const totalSixes = players.reduce((sum, p) => sum + safeNumber(p.stats?.sixes), 0);
    const strikeRatePlayers = players.filter((p) => safeNumber(p.stats?.strikeRate) > 0);
    const averageStrikeRate =
      strikeRatePlayers.length > 0
        ? strikeRatePlayers.reduce((sum, p) => sum + safeNumber(p.stats?.strikeRate), 0) / strikeRatePlayers.length
        : 0;
    const fiveWicketHauls = players.reduce((sum, p) => sum + safeNumber(p.stats?.fiveWickets), 0);

    return {
      totalFours,
      totalSixes,
      averageStrikeRate,
      fiveWicketHauls,
    };
  }, [players]);

  const statCards = [
    {
      icon: Swords,
      label: 'Fours hit',
      value: stats.totalFours.toLocaleString(),
      helper: 'Boundaries along the ground',
      color: 'from-amber-400 to-orange-500',
    },
    {
      icon: Flame,
      label: 'Sixes hit',
      value: stats.totalSixes.toLocaleString(),
      helper: 'Maximums cleared',
      color: 'from-rose-400 to-fuchsia-500',
    },
    {
      icon: Gauge,
      label: 'Average strike rate',
      value: stats.averageStrikeRate.toFixed(2),
      helper: 'Qualified batting tempo',
      color: 'from-cyan-300 to-sky-500',
    },
    {
      icon: Award,
      label: 'Five-wicket hauls',
      value: stats.fiveWicketHauls.toLocaleString(),
      helper: 'Big bowling spells',
      color: 'from-emerald-300 to-lime-500',
    },
  ];

  return (
    <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: index * 0.07 }}
          whileHover={{ y: -3 }}
          className="group relative overflow-hidden rounded-lg border border-white/[0.12] bg-black/[0.38] backdrop-blur-xl transition-colors duration-300 hover:border-white/[0.28]"
        >
          <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.color}`} />
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100"
            animate={{ x: ['-120%', '120%'] }}
            transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 1.8, ease: 'linear' }}
          />

          <div className="relative z-10 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className={`rounded-md bg-gradient-to-br ${stat.color} p-2.5 shadow-lg`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-xs font-semibold uppercase text-slate-400 tracking-[0]">
              {stat.label}
            </p>
            <p className="mt-1 text-3xl font-black text-white">
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-slate-500">{stat.helper}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
