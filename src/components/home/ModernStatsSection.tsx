'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Users, Zap, Trophy } from 'lucide-react';
import { useLeague } from '@/contexts/LeagueContext';

interface StatItem {
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: string;
  color: string;
}

interface ModernStatsSectionProps {
  totalMatches?: number;
  totalTeams?: number;
  activePlayers?: string;
  fanEngagement?: string;
}

export default function ModernStatsSection({ 
  totalMatches, 
  totalTeams, 
  activePlayers, 
  fanEngagement 
}: ModernStatsSectionProps = {}) {
  const { currentLeague } = useLeague();
  const [stats, setStats] = useState<StatItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    
    // Default values based on league
    const isWPL = currentLeague === 'wpl';
    const defaultMatches = isWPL ? 22 : 74;
    const defaultTeams = isWPL ? 5 : 10;
    const defaultPlayers = isWPL ? '100+' : '500+';
    const defaultEngagement = isWPL ? '500K+' : '1M+';
    
    // Use props if provided, otherwise use defaults
    const matches = totalMatches ?? defaultMatches;
    const teams = totalTeams ?? defaultTeams;
    const players = activePlayers ?? defaultPlayers;
    const engagement = fanEngagement ?? defaultEngagement;
    
    if (isWPL) {
      // WPL-specific stats with purple/pink theme
      setStats([
        {
          icon: <Trophy className="w-6 h-6" />,
          label: 'Total Matches',
          value: matches.toString(),
          change: 'T20 format',
          color: 'from-purple-500 to-pink-500',
        },
        {
          icon: <Users className="w-6 h-6" />,
          label: 'Active Players',
          value: players,
          change: `Across ${teams} teams`,
          color: 'from-pink-500 to-rose-500',
        },
        {
          icon: <Zap className="w-6 h-6" />,
          label: 'Live Updates',
          value: 'Real-time',
          change: 'Every second',
          color: 'from-rose-500 to-purple-500',
        },
        {
          icon: <TrendingUp className="w-6 h-6" />,
          label: 'Fan Engagement',
          value: engagement,
          change: 'Growing daily',
          color: 'from-violet-500 to-fuchsia-500',
        },
      ]);
    } else {
      // IPL-specific stats
      setStats([
        {
          icon: <Trophy className="w-6 h-6" />,
          label: 'Total Matches',
          value: matches.toString(),
          change: '+12 this season',
          color: 'from-yellow-500 to-orange-500',
        },
        {
          icon: <Users className="w-6 h-6" />,
          label: 'Active Players',
          value: players,
          change: `Across ${teams} teams`,
          color: 'from-blue-500 to-cyan-500',
        },
        {
          icon: <Zap className="w-6 h-6" />,
          label: 'Live Updates',
          value: 'Real-time',
          change: 'Every second',
          color: 'from-purple-500 to-pink-500',
        },
        {
          icon: <TrendingUp className="w-6 h-6" />,
          label: 'Fan Engagement',
          value: engagement,
          change: 'Growing daily',
          color: 'from-green-500 to-emerald-500',
        },
      ]);
    }
  }, [currentLeague, totalMatches, totalTeams, activePlayers, fanEngagement]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className={`relative overflow-hidden rounded-xl p-6 transition-all duration-500 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: `${idx * 100}ms` }}
        >
          {/* Background gradient */}
          <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-10`} />

          {/* Border gradient */}
          <div className="absolute inset-0 rounded-xl border border-white/10 group-hover:border-white/20 transition-colors" />

          {/* Content */}
          <div className="relative z-10">
            <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${stat.color} text-white mb-4`}>
              {stat.icon}
            </div>

            <p className="text-gray-400 text-sm mb-2">{stat.label}</p>
            <p className="text-3xl font-bold text-white mb-2">{stat.value}</p>
            {stat.change && <p className="text-xs text-gray-500">{stat.change}</p>}
          </div>

          {/* Animated background */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        </div>
      ))}
    </div>
  );
}
