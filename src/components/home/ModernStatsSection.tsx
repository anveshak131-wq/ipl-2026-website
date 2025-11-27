'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Users, Zap, Trophy } from 'lucide-react';

interface StatItem {
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: string;
  color: string;
}

export default function ModernStatsSection() {
  const [stats, setStats] = useState<StatItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    setStats([
      {
        icon: <Trophy className="w-6 h-6" />,
        label: 'Total Matches',
        value: '74',
        change: '+12 this season',
        color: 'from-yellow-500 to-orange-500',
      },
      {
        icon: <Users className="w-6 h-6" />,
        label: 'Active Players',
        value: '500+',
        change: 'Across 10 teams',
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
        value: '1M+',
        change: 'Growing daily',
        color: 'from-green-500 to-emerald-500',
      },
    ]);
  }, []);

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
