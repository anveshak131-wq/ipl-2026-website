'use client';

import { useMemo } from 'react';
import { TrendingUp, Target, Zap } from 'lucide-react';
import { LiveScoreState, BallEvent } from '@/hooks/useLiveScore';

interface EnhancedPlayerStatsProps {
  player: {
    name: string;
    runs: number;
    balls: number;
    isBatter: boolean;
    // Enhanced batter stats
    fours?: number;
    sixes?: number;
    strikeRate?: number;
    // Enhanced bowler stats
    overs?: number;
    maidens?: number;
    wickets?: number;
    economy?: number;
    wides?: number;
    noBalls?: number;
  };
  ballHistory: BallEvent[];
  league?: 'ipl' | 'wpl';
}

export default function EnhancedPlayerStats({ 
  player, 
  ballHistory,
  league = 'ipl' 
}: EnhancedPlayerStatsProps) {
  // Calculate recent scoring pattern (last 10 balls)
  const recentPattern = useMemo(() => {
    // Get balls where this player was batting/bowling
    // For simplicity, we'll use recent balls from history
    const recentBalls = ballHistory && Array.isArray(ballHistory) ? ballHistory.slice(-10) : [];
    const pattern = recentBalls.map(ball => {
      if (typeof ball.type === 'number') {
        return ball.type;
      }
      return 0; // Wickets/extras don't count for batter pattern
    });
    
    return pattern;
  }, [ballHistory]);

  // Calculate statistics - use passed values if available
  const strikeRate = player.strikeRate !== undefined 
    ? player.strikeRate.toFixed(1) 
    : player.balls > 0 
      ? ((player.runs * 100) / player.balls).toFixed(1)
      : '0.0';
  
  const economy = player.economy !== undefined 
    ? player.economy.toFixed(2)
    : player.balls > 0 && !player.isBatter
      ? ((player.runs * 6) / player.balls).toFixed(2)
      : null;

  const boundaries = useMemo(() => {
    // Use passed fours/sixes if available
    if (player.fours !== undefined && player.sixes !== undefined) {
      return player.fours + player.sixes;
    }
    return ballHistory && Array.isArray(ballHistory) ? ballHistory.filter(ball => ball.type === 4 || ball.type === 6).length : 0;
  }, [ballHistory, player.fours, player.sixes]);

  const fours = player.fours ?? 0;
  const sixes = player.sixes ?? 0;

  const dotBalls = useMemo(() => {
    return ballHistory && Array.isArray(ballHistory) ? ballHistory.filter(ball => ball.type === 0).length : 0;
  }, [ballHistory]);

  const runsPerBall = player.balls > 0 
    ? (player.runs / player.balls).toFixed(2)
    : '0.00';

  const leagueColors = {
    ipl: {
      bg: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20',
      border: 'border-blue-400/30',
      badge: 'bg-blue-500/20 text-blue-400',
      accent: 'text-blue-400',
      pattern: 'bg-blue-500',
      patternHigh: 'bg-green-500',
    },
    wpl: {
      bg: 'bg-gradient-to-br from-purple-500/20 to-pink-500/20',
      border: 'border-purple-400/30',
      badge: 'bg-purple-500/20 text-pink-400',
      accent: 'text-pink-400',
      pattern: 'bg-purple-500',
      patternHigh: 'bg-pink-500',
    },
  };

  const colors = leagueColors[league];

  return (
    <div className={`${colors.bg} rounded-xl p-5 border-2 ${colors.border} backdrop-blur-xl`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-bold text-white text-lg mb-1">{player.name}</h4>
          <span className={`text-xs px-2.5 py-1 rounded ${colors.badge} font-bold uppercase`}>
            {player.isBatter ? 'BATTER' : 'BOWLER'}
          </span>
        </div>
        {player.isBatter && player.runs >= 50 && (
          <div className="flex items-center gap-1 text-yellow-400">
            <Target className="w-4 h-4" />
            <span className="text-xs font-bold">
              {player.runs >= 100 ? '100+' : player.runs >= 50 ? '50+' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <div className="text-gray-400 text-xs mb-1">Runs</div>
          <div className="text-white font-black text-2xl">{player.runs}</div>
        </div>
        <div>
          <div className="text-gray-400 text-xs mb-1">Balls</div>
          <div className="text-white font-black text-2xl">{player.balls}</div>
        </div>
        <div>
          <div className="text-gray-400 text-xs mb-1">
            {player.isBatter ? 'SR' : 'Econ'}
          </div>
          <div className={`font-black text-2xl ${colors.accent}`}>
            {player.isBatter ? strikeRate : economy || '0.00'}
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4 pt-4 border-t border-white/10">
        {player.isBatter ? (
          <>
            <div>
              <div className="text-gray-400 text-xs mb-1">4s / 6s</div>
              <div className="text-white font-bold flex items-center gap-2">
                <span className="text-green-400">{fours}</span>
                <span className="text-gray-500">/</span>
                <span className="text-purple-400">{sixes}</span>
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-xs mb-1">Boundaries</div>
              <div className="text-green-400 font-bold flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {boundaries}
              </div>
            </div>
          </>
        ) : (
          <>
            <div>
              <div className="text-gray-400 text-xs mb-1">Overs</div>
              <div className="text-white font-bold">
                {player.overs !== undefined ? `${player.overs}.${player.balls % 6}` : `${Math.floor(player.balls / 6)}.${player.balls % 6}`}
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-xs mb-1">Wickets</div>
              <div className="text-red-400 font-bold">{player.wickets ?? 0}</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs mb-1">Maidens</div>
              <div className="text-green-400 font-bold">{player.maidens ?? 0}</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs mb-1">Extras</div>
              <div className="text-yellow-400 font-bold text-xs">
                WD: {player.wides ?? 0} | NB: {player.noBalls ?? 0}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Recent Scoring Pattern */}
      {player.isBatter && recentPattern.length > 0 && (
        <div className="pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400 font-semibold">Recent Pattern (Last {recentPattern.length} balls)</span>
          </div>
          <div className="flex gap-1">
            {recentPattern.map((runs, index) => (
              <div
                key={index}
                className={`flex-1 h-8 rounded flex items-center justify-center text-xs font-bold transition-all ${
                  runs === 0
                    ? 'bg-gray-700 text-gray-400'
                    : runs >= 4
                    ? colors.patternHigh
                    : colors.pattern
                } text-white`}
                title={`Ball ${index + 1}: ${runs} run${runs === 1 ? '' : 's'}`}
              >
                {runs > 0 ? runs : '•'}
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Total: {recentPattern.reduce((sum, r) => sum + r, 0)} runs
          </div>
        </div>
      )}

      {/* Milestone Progress */}
      {player.isBatter && player.runs > 0 && (
        <div className="pt-4 border-t border-white/10">
          <div className="text-xs text-gray-400 mb-2">Milestone Progress</div>
          <div className="space-y-2">
            {[50, 100, 150].map((milestone) => {
              const progress = Math.min((player.runs / milestone) * 100, 100);
              const isReached = player.runs >= milestone;
              
              return (
                <div key={milestone}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">{milestone} runs</span>
                    <span className={`text-xs font-bold ${isReached ? 'text-yellow-400' : 'text-gray-500'}`}>
                      {isReached ? '✓' : `${player.runs}/${milestone}`}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        isReached ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

