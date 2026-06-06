'use client';

import { motion } from 'framer-motion';
import { BarChart3, Target, Users, Zap } from 'lucide-react';

type TabKey = 'overview' | 'batting' | 'bowling' | 'teams';

interface StatsTabsProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

const tabs: { key: TabKey; label: string; helper: string; icon: typeof BarChart3 }[] = [
  { key: 'overview', label: 'Overview', helper: 'Caps, points and form', icon: BarChart3 },
  { key: 'batting', label: 'Batting', helper: 'Runs and strike rate', icon: Target },
  { key: 'bowling', label: 'Bowling', helper: 'Wickets and economy', icon: Zap },
  { key: 'teams', label: 'Teams', helper: 'Runs, wickets and matchups', icon: Users },
];

export default function StatsTabs({ activeTab, onTabChange }: StatsTabsProps) {
  return (
    <div className="relative">
      <div className="relative z-10 grid gap-2 rounded-lg border border-white/[0.12] bg-black/[0.35] p-2 backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;

          return (
            <motion.button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`
                relative min-h-[64px] overflow-hidden rounded-md px-4 py-3 text-left transition-colors duration-300
                ${isActive ? 'text-white' : 'text-slate-300 hover:bg-white/[0.07] hover:text-white'}
              `}
              aria-pressed={isActive}
            >
              {isActive && (
                <motion.div
                  layoutId="activeStatsTab"
                  className="absolute inset-0 rounded-md bg-gradient-to-br from-amber-500/[0.28] via-emerald-500/[0.18] to-cyan-500/20"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 520, damping: 36 }}
                />
              )}
              <div className="relative z-10 flex items-start gap-3">
                <span
                  className={`rounded-md p-2 ${
                    isActive ? 'bg-amber-300 text-slate-950' : 'bg-white/10 text-slate-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold">{tab.label}</span>
                  <span className="mt-0.5 block text-xs text-slate-400">{tab.helper}</span>
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
