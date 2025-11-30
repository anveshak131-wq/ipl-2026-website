'use client';

import { motion } from 'framer-motion';
import { Clock, Radio, CheckCircle2, Calendar } from 'lucide-react';

interface MatchStatusBadgeProps {
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
  league?: 'ipl' | 'wpl';
  className?: string;
}

export default function MatchStatusBadge({ status, league = 'ipl', className = '' }: MatchStatusBadgeProps) {
  const statusConfig = {
    upcoming: {
      label: 'Pre-Match',
      icon: Calendar,
      colors: league === 'wpl' 
        ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
        : 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      pulse: false
    },
    live: {
      label: 'Live',
      icon: Radio,
      colors: 'bg-red-500/20 text-red-300 border-red-500/30',
      pulse: true
    },
    completed: {
      label: 'Completed',
      icon: CheckCircle2,
      colors: league === 'wpl'
        ? 'bg-green-500/20 text-green-300 border-green-500/30'
        : 'bg-green-500/20 text-green-300 border-green-500/30',
      pulse: false
    },
    cancelled: {
      label: 'Cancelled',
      icon: Clock,
      colors: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
      pulse: false
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-sm font-semibold text-sm ${config.colors} ${className}`}
    >
      {config.pulse && (
        <motion.div
          className="w-2 h-2 bg-red-400 rounded-full"
          animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
      <Icon className="w-4 h-4" />
      <span>{config.label}</span>
    </motion.div>
  );
}

