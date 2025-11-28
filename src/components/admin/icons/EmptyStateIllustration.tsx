'use client';

import { motion } from 'framer-motion';
import {
  FileText,
  Users,
  Calendar,
  Image,
  Search,
  Database,
  Settings,
  Bell,
  TrendingUp,
  BarChart3,
} from 'lucide-react';

interface EmptyStateIllustrationProps {
  type?: 'default' | 'teams' | 'matches' | 'players' | 'news' | 'search' | 'data' | 'settings' | 'notifications' | 'analytics';
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const iconMap = {
  default: FileText,
  teams: Users,
  matches: Calendar,
  players: Users,
  news: FileText,
  search: Search,
  data: Database,
  settings: Settings,
  notifications: Bell,
  analytics: BarChart3,
};

export default function EmptyStateIllustration({
  type = 'default',
  title,
  description,
  action,
  className = '',
}: EmptyStateIllustrationProps) {
  const Icon = iconMap[type];
  const defaultTitle = {
    default: 'No items found',
    teams: 'No teams yet',
    matches: 'No matches scheduled',
    players: 'No players added',
    news: 'No news articles',
    search: 'No results found',
    data: 'No data available',
    settings: 'No settings configured',
    notifications: 'No notifications',
    analytics: 'No analytics data',
  }[type];

  const defaultDescription = {
    default: 'Get started by creating your first item.',
    teams: 'Create your first team to get started.',
    matches: 'Schedule a match to begin.',
    players: 'Add players to your teams.',
    news: 'Create your first news article.',
    search: 'Try adjusting your search terms.',
    data: 'Data will appear here once available.',
    settings: 'Configure your settings to get started.',
    notifications: 'You\'re all caught up!',
    analytics: 'Analytics will appear here once data is available.',
  }[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
    >
      {/* Animated Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 15,
          delay: 0.1,
        }}
        className="mb-6"
      >
        <div className="relative">
          {/* Background circle */}
          <motion.div
            className="absolute inset-0 rounded-full bg-[#2F6FED]/10"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.3, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          
          {/* Icon */}
          <div className="relative p-6 rounded-full bg-[#1A2332] border border-[#2A3440]">
            <Icon className="w-12 h-12 text-[#AEBAC7]" />
          </div>
        </div>
      </motion.div>

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xl font-semibold text-[#E6EDF3] mb-2"
      >
        {title || defaultTitle}
      </motion.h3>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-[#AEBAC7] mb-6 max-w-md"
      >
        {description || defaultDescription}
      </motion.p>

      {/* Action Button */}
      {action && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onClick={action.onClick}
          className="px-6 py-3 bg-[#2F6FED] text-white rounded-lg font-medium hover:bg-[#2563EB] transition-colors"
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}

/**
 * Custom illustration for specific use cases
 */
export function CustomEmptyState({
  illustration,
  title,
  description,
  action,
  className = '',
}: {
  illustration: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        {illustration}
      </motion.div>

      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xl font-semibold text-[#E6EDF3] mb-2"
      >
        {title}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-[#AEBAC7] mb-6 max-w-md"
      >
        {description}
      </motion.p>

      {action && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onClick={action.onClick}
          className="px-6 py-3 bg-[#2F6FED] text-white rounded-lg font-medium hover:bg-[#2563EB] transition-colors"
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}

