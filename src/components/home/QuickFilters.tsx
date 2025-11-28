'use client';

import { motion } from 'framer-motion';
import { Calendar, Radio, Clock, Filter } from 'lucide-react';
import Link from 'next/link';
import type { Match } from '@/types';
import CustomEmoji from '@/components/emoji/CustomEmoji';

interface QuickFiltersProps {
  matches: Match[];
  onFilterChange?: (filter: 'today' | 'live' | 'upcoming') => void;
}

export default function QuickFilters({ matches, onFilterChange }: QuickFiltersProps) {
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

  const filters = [
    {
      id: 'today' as const,
      label: "Today's Matches",
      count: todayMatches.length,
      icon: Calendar,
      emoji: 'calendar' as const,
      color: 'from-blue-500 to-cyan-500',
      href: '/matches?filter=today',
    },
    {
      id: 'live' as const,
      label: 'Live Now',
      count: liveMatches.length,
      icon: Radio,
      emoji: 'lightning' as const,
      color: 'from-red-500 to-orange-500',
      href: '/live-score',
      pulse: liveMatches.length > 0,
    },
    {
      id: 'upcoming' as const,
      label: 'Upcoming',
      count: upcomingMatches.length,
      icon: Clock,
      emoji: 'clock' as const,
      color: 'from-purple-500 to-pink-500',
      href: '/matches?filter=upcoming',
    },
  ];

  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {filters.map((filter, index) => (
        <motion.div
          key={filter.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.3 }}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link
            href={filter.href}
            onClick={() => onFilterChange?.(filter.id)}
            className={`
              relative px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2
              bg-gradient-to-r ${filter.color} bg-opacity-20 hover:bg-opacity-30 border border-white/20 hover:border-white/40
              ${filter.pulse ? 'shadow-lg shadow-red-500/50' : ''}
            `}
          >
            {filter.pulse && (
              <motion.span
                className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
            <CustomEmoji type={filter.emoji} size={20} animate={true} />
            <span className="text-white">{filter.label}</span>
            {filter.count > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-sm font-bold">
                {filter.count}
              </span>
            )}
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

