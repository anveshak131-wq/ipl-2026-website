'use client';

import { motion } from 'framer-motion';
import { BarChart3, Users, Target, Zap } from 'lucide-react';

type TabKey = 'overview' | 'batting' | 'bowling' | 'teams';

interface StatsTabsProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

const tabs: { key: TabKey; label: string; icon: typeof BarChart3 }[] = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'batting', label: 'Batting', icon: Target },
  { key: 'bowling', label: 'Bowling', icon: Zap },
  { key: 'teams', label: 'Teams', icon: Users },
];

export default function StatsTabs({ activeTab, onTabChange }: StatsTabsProps) {
  return (
    <div className="relative">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 blur-3xl" />
      
      <div className="relative z-10 flex flex-wrap gap-2 p-2 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          
          return (
            <motion.button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                relative flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300
                ${isActive 
                  ? 'text-white bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/50' 
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
                }
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <Icon className={`relative z-10 w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
              <span className="relative z-10">{tab.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

