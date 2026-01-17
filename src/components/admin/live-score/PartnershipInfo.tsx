'use client';

import { useMemo } from 'react';
import { Users, TrendingUp } from 'lucide-react';
import { LiveScoreState } from '@/hooks/useLiveScore';

interface PartnershipInfoProps {
  state: LiveScoreState;
  league?: 'ipl' | 'wpl';
}

export default function PartnershipInfo({ state, league = 'ipl' }: PartnershipInfoProps) {
  // Calculate partnership stats - use new partnership tracking if available
  const partnership = useMemo(() => {
    // Use the new currentPartnership if available
    if (state.currentPartnership) {
      const cp = state.currentPartnership;
      return {
        runs: cp.totalRuns,
        balls: cp.totalBalls,
        strikeRate: cp.runRate || (cp.totalBalls > 0 ? ((cp.totalRuns / cp.totalBalls) * 100) : 0),
        batter1: {
          name: cp.batter1.name,
          runs: cp.batter1.runs,
          balls: cp.batter1.balls,
        },
        batter2: {
          name: cp.batter2.name,
          runs: cp.batter2.runs,
          balls: cp.batter2.balls,
        },
      };
    }
    
    // Fallback to old method using striker/nonStriker
    if (state.striker && state.nonStriker) {
      const partnershipRuns = state.striker.runs + state.nonStriker.runs;
      const partnershipBalls = state.striker.balls + state.nonStriker.balls;
      const strikeRate = partnershipBalls > 0 
        ? ((partnershipRuns * 100) / partnershipBalls)
        : 0;
      
      return {
        runs: partnershipRuns,
        balls: partnershipBalls,
        strikeRate: strikeRate,
        batter1: {
          name: state.striker.name,
          runs: state.striker.runs,
          balls: state.striker.balls,
        },
        batter2: {
          name: state.nonStriker.name,
          runs: state.nonStriker.runs,
          balls: state.nonStriker.balls,
        },
      };
    }
    
    // Legacy fallback
    const currentBatter = state.currentBatter;
    const partnershipRuns = currentBatter.runs;
    const partnershipBalls = currentBatter.balls;
    const strikeRate = partnershipBalls > 0 
      ? ((partnershipRuns * 100) / partnershipBalls)
      : 0;
    
    return {
      runs: partnershipRuns,
      balls: partnershipBalls,
      strikeRate: strikeRate,
      batter1: {
        name: currentBatter.name,
        runs: currentBatter.runs,
        balls: currentBatter.balls,
      },
      batter2: {
        name: 'Partner',
        runs: 0,
        balls: 0,
      },
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
      
      {/* Main Partnership Stats */}
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
          <div className="text-gray-400 text-xs mb-1">Run Rate</div>
          <div className={`text-3xl font-black ${colors.accent}`}>
            {partnership.balls > 0 ? (partnership.runs / (partnership.balls / 6)).toFixed(2) : '0.00'}
          </div>
        </div>
      </div>

      {/* Individual Batter Contributions */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
        <div className="bg-black/20 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1 truncate">{partnership.batter1.name}</div>
          <div className="text-white font-bold">
            {partnership.batter1.runs}<span className="text-gray-400 text-sm">({partnership.batter1.balls})</span>
          </div>
        </div>
        <div className="bg-black/20 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1 truncate">{partnership.batter2.name}</div>
          <div className="text-white font-bold">
            {partnership.batter2.runs}<span className="text-gray-400 text-sm">({partnership.batter2.balls})</span>
          </div>
        </div>
      </div>

      <div className="pt-4 mt-4 border-t border-white/10">
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

