'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Radio, Clock } from 'lucide-react';
import Link from 'next/link';
import type { Match } from '@/types';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import CustomEmoji from '@/components/emoji/CustomEmoji';

interface QuickStatsWidgetProps {
  matches: Match[];
  isLoading?: boolean;
}

export default function QuickStatsWidget({ matches, isLoading = false }: QuickStatsWidgetProps) {
  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayMatches = matches.filter((match) => {
      const matchDate = new Date(match.date);
      return matchDate >= today && matchDate < tomorrow;
    });

    const liveMatches = matches.filter((match) => match.status === 'live');
    const upcomingMatches = matches.filter((match) => match.status === 'upcoming');

    return {
      today: todayMatches.length,
      live: liveMatches.length,
      upcoming: upcomingMatches.length,
    };
  }, [matches]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const statCards = [
    {
      label: "Today's Matches",
      value: stats.today,
      icon: Calendar,
      color: 'from-blue-500 to-cyan-500',
      href: '/matches?filter=today',
      emoji: 'calendar' as const,
    },
    {
      label: 'Live Now',
      value: stats.live,
      icon: Radio,
      color: 'from-red-500 to-orange-500',
      href: '/live-score',
      emoji: 'lightning' as const,
      pulse: stats.live > 0,
    },
    {
      label: 'Upcoming',
      value: stats.upcoming,
      icon: Clock,
      color: 'from-purple-500 to-pink-500',
      href: '/matches?filter=upcoming',
      emoji: 'clock' as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.4 }}
          whileHover={{ scale: 1.05, y: -5 }}
        >
          <Link
            href={stat.href}
            className="block p-6 rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/20 hover:border-white/40 transition-all duration-300 group relative overflow-hidden"
          >
            {/* Animated background gradient */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
            />
            
            {/* Pulse effect for live matches */}
            {stat.pulse && (
              <motion.div
                className="absolute inset-0 bg-red-500/20 rounded-xl"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-400 mb-2 font-medium">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <AnimatedCounter
                    value={stat.value}
                    className="text-3xl font-bold text-white"
                  />
                  {stat.pulse && (
                    <motion.span
                      className="text-xs text-red-400 font-bold"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      LIVE
                    </motion.span>
                  )}
                </div>
              </div>
              <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color} bg-opacity-20`}>
                <CustomEmoji type={stat.emoji} size={32} animate={true} />
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

