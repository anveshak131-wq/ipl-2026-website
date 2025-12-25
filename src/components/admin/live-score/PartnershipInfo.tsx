'use client';

import { useMemo } from 'react';
import { Users, TrendingUp } from 'lucide-react';
import { LiveScoreState } from '@/hooks/useLiveScore';

interface PartnershipInfoProps {
  state: LiveScoreState;
  league?: 'ipl' | 'wpl';
}

export default function PartnershipInfo({ state, league = 'ipl' }: PartnershipInfoProps) {
  // Calculate partnership stats
  const partnership = useMemo(() => {
    const battingTeam = state.battingTeam === 'team1' ? state.team1 : state.team2;
    const currentBatter = state.currentBatter;
    
    // For simplicity, we'll use current batter's stats as partnership
    // In a real scenario, you'd track both batters separately
    const partnershipRuns = currentBatter.runs;
    const partnershipBalls = currentBatter.balls;
    const strikeRate = partnershipBalls > 0 
      ? ((partnershipRuns * 100) / partnershipBalls).toFixed(1)
      : '0.0';
    
    return {
      runs: partnershipRuns,
      balls: partnershipBalls,
      strikeRate: parseFloat(strikeRate),
      batter1: currentBatter.name,
      batter2: 'Partner', // Would be tracked separately in real implementation
    };
  }, [state]);

  const leagueColors = {
    ipl: {
      bg: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20',
      border: 'border-blue-400/30',
      text: 'text-blue-300',
      accent: 'text-cyan-400',
    },
    wpl: {
      bg: 'bg-gradient-to-br from-purple-500/20 to-pink-500/20',
      border: 'border-purple-400/30',
      text: 'text-purple-300',
      accent: 'text-pink-400',
    },
  };

  const colors = leagueColors[league];

  return (
    <div className={`${colors.bg} rounded-xl p-5 border-2 ${colors.border} backdrop-blur-xl`}>
      <div className="flex items-center gap-2 mb-4">
        <Users className={`w-5 h-5 ${colors.text}`} />
        <h3 className="text-lg font-bold text-white">Current Partnership</h3>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <div className="text-gray-400 text-xs mb-1">Runs</div>
          <div className={`text-3xl font-black ${colors.text}`}>
            {partnership.runs}
          </div>
        </div>
        <div>
          <div className="text-gray-400 text-xs mb-1">Balls</div>
          <div className={`text-3xl font-black ${colors.text}`}>
            {partnership.balls}
          </div>
        </div>
        <div>
          <div className="text-gray-400 text-xs mb-1">Strike Rate</div>
          <div className={`text-3xl font-black ${colors.accent}`}>
            {partnership.strikeRate}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400">Partnership Rate</span>
          </div>
          <span className="text-sm font-bold text-white">
            {(partnership.runs / (partnership.balls || 1) * 6).toFixed(2)} runs/over
          </span>
        </div>
      </div>

      {/* Partnership Timeline */}
      {partnership.balls > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="text-xs text-gray-400 mb-2">Partnership Progress</div>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(partnership.balls, 30) }).map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded ${
                  i < partnership.balls
                    ? i % 6 === 0
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                    : 'bg-gray-700'
                }`}
                title={`Ball ${i + 1}`}
              />
            ))}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {Math.floor(partnership.balls / 6)}.{partnership.balls % 6} overs
          </div>
        </div>
      )}
    </div>
  );
}

