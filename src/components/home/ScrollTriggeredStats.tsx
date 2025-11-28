'use client';

import React from 'react';
import { useScrollTrigger } from '@/hooks/useScrollTrigger';
import AnimatedCard from '@/components/ui/AnimatedCard';
import CustomEmoji, { EmojiType } from '@/components/emoji/CustomEmoji';

interface Stat {
  label: string;
  value: string;
  icon: string | EmojiType;
  color: string;
}

interface ScrollTriggeredStatsProps {
  stats: Stat[];
  isLoading?: boolean;
}

export default function ScrollTriggeredStats({
  stats,
  isLoading = false,
}: ScrollTriggeredStatsProps) {
  const { ref, isVisible } = useScrollTrigger({ threshold: 0.2 });

  return (
    <div ref={ref} className="space-y-8">
      <style>{`
        @keyframes countUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .stat-item {
          animation: countUp 0.8s ease-out forwards;
        }
        .stat-item:nth-child(1) { animation-delay: 0s; }
        .stat-item:nth-child(2) { animation-delay: 0.1s; }
        .stat-item:nth-child(3) { animation-delay: 0.2s; }
        .stat-item:nth-child(4) { animation-delay: 0.3s; }
      `}</style>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className={`stat-item ${isVisible ? '' : 'opacity-0'}`}
          >
            <AnimatedCard
              delay={idx}
              hover="lift"
              className="p-6 text-center h-full"
            >
              <div className="text-4xl mb-3 flex items-center justify-center">
                {typeof stat.icon === 'string' && (stat.icon === '🏏' || stat.icon === '🎯' || stat.icon === '👥' || stat.icon === '🏟️') ? (
                  <CustomEmoji 
                    type={stat.icon === '🏏' ? 'cricket-bat' : stat.icon === '🎯' ? 'target' : stat.icon === '👥' ? 'people' : 'venue'} 
                    size={48}
                    animate={true}
                  />
                ) : typeof stat.icon === 'string' ? (
                  <span>{stat.icon}</span>
                ) : (
                  <CustomEmoji type={stat.icon} size={48} animate={true} />
                )}
              </div>
              <div className={`text-3xl font-black mb-2 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.value}
              </div>
              <div className="text-gray-400 text-sm font-semibold">
                {stat.label}
              </div>
            </AnimatedCard>
          </div>
        ))}
      </div>
    </div>
  );
}
