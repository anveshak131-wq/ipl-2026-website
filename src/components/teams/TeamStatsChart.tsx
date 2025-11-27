'use client';

import React from 'react';

interface TeamStat {
  label: string;
  value: number;
  max?: number;
  color: string;
}

interface TeamStatsChartProps {
  stats: TeamStat[];
  teamName: string;
}

export default function TeamStatsChart({ stats, teamName }: TeamStatsChartProps) {
  return (
    <>
      <style>{`
        @keyframes barGrow {
          0% { width: 0%; }
          100% { width: var(--width); }
        }
        .stat-bar {
          animation: barGrow 1s ease-out forwards;
        }
        .stat-bar:nth-child(1) { animation-delay: 0s; }
        .stat-bar:nth-child(2) { animation-delay: 0.1s; }
        .stat-bar:nth-child(3) { animation-delay: 0.2s; }
        .stat-bar:nth-child(4) { animation-delay: 0.3s; }
        .stat-bar:nth-child(5) { animation-delay: 0.4s; }
      `}</style>
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-white/10">
      <h3 className="text-2xl font-bold text-white mb-8">{teamName} Stats</h3>

      <div className="space-y-6">
        {stats.map((stat, idx) => {
          const percentage = stat.max ? (stat.value / stat.max) * 100 : stat.value;

          return (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-300 font-semibold">{stat.label}</span>
                <span className="text-ipl-gold font-bold">{stat.value}</span>
              </div>

              <div className="h-3 bg-white/10 rounded-full overflow-hidden border border-white/5">
                <div
                  className={`stat-bar h-full bg-gradient-to-r ${stat.color} rounded-full shadow-lg`}
                  style={{
                    '--width': `${Math.min(percentage, 100)}%`,
                  } as React.CSSProperties}
                />
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </>
  );
}
