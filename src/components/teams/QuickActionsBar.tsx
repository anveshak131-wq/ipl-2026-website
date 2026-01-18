'use client';

import { motion } from 'framer-motion';
import { Users, Calendar, Newspaper, ShoppingBag, X } from 'lucide-react';

interface QuickActionsBarProps {
  primaryColor: string;
  onSquadClick: () => void;
  onFixturesClick: () => void;
  onNewsClick: () => void;
  league?: 'ipl' | 'wpl';
  showPlayerCards?: boolean;
}

export default function QuickActionsBar({
  primaryColor,
  onSquadClick,
  onFixturesClick,
  onNewsClick,
  league = 'ipl',
  showPlayerCards = false,
}: QuickActionsBarProps) {
  const actions = [
    {
      icon: showPlayerCards ? X : Users,
      label: showPlayerCards ? 'Hide Squad' : 'View Squad',
      onClick: onSquadClick,
      gradient: showPlayerCards ? 'from-red-500 to-orange-500' : 'from-blue-500 to-cyan-500',
      isActive: showPlayerCards,
    },
    {
      icon: Calendar,
      label: 'Fixtures',
      onClick: onFixturesClick,
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: Newspaper,
      label: 'Latest News',
      onClick: onNewsClick,
      gradient: 'from-orange-500 to-red-500',
    },
    {
      icon: ShoppingBag,
      label: 'Merchandise',
      onClick: () => window.open(league === 'wpl' ? 'https://www.wplt20.com/shop' : 'https://www.iplt20.com/shop', '_blank'),
      gradient: 'from-green-500 to-emerald-500',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="flex flex-wrap gap-3"
    >
      {actions.map((action, index) => {
        const Icon = action.icon;
        const isActive = 'isActive' in action && action.isActive;
        return (
          <motion.button
            key={index}
            onClick={action.onClick}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className={`group relative overflow-hidden rounded-xl backdrop-blur-sm px-6 py-3 transition-all ${
              isActive 
                ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-2 border-blue-500/50' 
                : 'bg-gray-900/50 border border-gray-700/50 hover:border-gray-600'
            }`}
          >
            {/* Gradient overlay on hover */}
            <div
              className={`absolute inset-0 bg-gradient-to-r ${action.gradient} ${isActive ? 'opacity-10' : 'opacity-0 group-hover:opacity-10'} transition-opacity`}
            />
            
            {/* Content */}
            <div className="relative flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-lg`}
                style={{
                  boxShadow: `0 4px 20px ${primaryColor}30`,
                }}
              >
                <Icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-white group-hover:text-white transition-colors">
                {action.label}
              </span>
            </div>

            {/* Shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              initial={{ x: '-100%' }}
              whileHover={{ x: '100%' }}
              transition={{ duration: 0.6 }}
            />
          </motion.button>
        );
      })}
    </motion.div>
  );
}
