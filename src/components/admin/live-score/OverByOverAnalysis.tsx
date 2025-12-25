'use client';

import { useMemo } from 'react';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { LiveScoreState, BallEvent } from '@/hooks/useLiveScore';

interface OverByOverAnalysisProps {
  state: LiveScoreState;
  league?: 'ipl' | 'wpl';
}

interface OverData {
  over: number;
  runs: number;
  wickets: number;
  boundaries: number;
  dotBalls: number;
  runRate: number;
}

export default function OverByOverAnalysis({ state, league = 'ipl' }: OverByOverAnalysisProps) {
  const overData = useMemo(() => {
    const battingTeam = state.battingTeam === 'team1' ? state.team1 : state.team2;
    const overs: OverData[] = [];
    const overMap = new Map<number, { runs: number; wickets: number; boundaries: number; dotBalls: number; balls: number }>();

    // Process ball history to group by over
    let ballCount = 0;
    state.ballHistory.forEach((ball) => {
      // Count legal deliveries to determine which over we're in
      if (!['WD', 'NB'].includes(ball.type as string)) {
        ballCount++;
      }
      
      const over = Math.floor((ballCount - 1) / 6);
      
      if (!overMap.has(over)) {
        overMap.set(over, { runs: 0, wickets: 0, boundaries: 0, dotBalls: 0, balls: 0 });
      }
      
      const overStats = overMap.get(over)!;
      
      if (ball.type === 'W') {
        overStats.wickets += 1;
      } else if (typeof ball.type === 'number') {
        overStats.runs += ball.type;
        if (ball.type === 4 || ball.type === 6) {
          overStats.boundaries += 1;
        }
        if (ball.type === 0) {
          overStats.dotBalls += 1;
        }
      } else if (ball.type === 'WD' || ball.type === 'NB') {
        overStats.runs += 1;
      }
      
      if (!['WD', 'NB'].includes(ball.type as string)) {
        overStats.balls += 1;
      }
    });

    // Convert to array and calculate run rates
    overMap.forEach((stats, over) => {
      const runRate = stats.balls > 0 ? (stats.runs / stats.balls) * 6 : 0;
      overs.push({
        over,
        runs: stats.runs,
        wickets: stats.wickets,
        boundaries: stats.boundaries,
        dotBalls: stats.dotBalls,
        runRate: parseFloat(runRate.toFixed(2)),
      });
    });

    // Sort by over number and get last 10
    return overs.sort((a, b) => a.over - b.over).slice(-10);
  }, [state]);

  const leagueColors = {
    ipl: {
      bg: 'bg-slate-800/50',
      border: 'border-slate-700/30',
      bar: 'bg-blue-500',
      barHigh: 'bg-green-500',
      barLow: 'bg-red-500',
      text: 'text-blue-300',
    },
    wpl: {
      bg: 'bg-purple-900/20',
      border: 'border-purple-700/30',
      bar: 'bg-purple-500',
      barHigh: 'bg-pink-500',
      barLow: 'bg-red-500',
      text: 'text-purple-300',
    },
  };

  const colors = leagueColors[league];
  const maxRuns = Math.max(...overData.map(o => o.runs), 1);
  const avgRunRate = overData.length > 0
    ? overData.reduce((sum, o) => sum + o.runRate, 0) / overData.length
    : 0;

  return (
    <div className={`${colors.bg} rounded-xl p-5 border-2 ${colors.border} backdrop-blur-xl`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className={`w-5 h-5 ${colors.text}`} />
          <h3 className="text-lg font-bold text-white">Over-by-Over Analysis</h3>
        </div>
        {overData.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Avg RR:</span>
            <span className="text-sm font-bold text-white">{avgRunRate.toFixed(2)}</span>
          </div>
        )}
      </div>

      {overData.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">No over data yet</p>
          <p className="text-xs mt-1">Start recording balls to see over-by-over analysis</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Bar Chart */}
          <div className="space-y-2">
            {overData.map((over) => {
              const barHeight = (over.runs / maxRuns) * 100;
              const isHigh = over.runRate >= 8;
              const isLow = over.runRate < 4;
              
              return (
                <div key={over.over} className="flex items-end gap-2">
                  <div className="w-12 text-xs text-gray-400 font-semibold">
                    {over.over}.0
                  </div>
                  <div className="flex-1 relative">
                    <div className="flex items-end gap-1">
                      <div
                        className={`flex-1 rounded-t transition-all ${
                          isHigh ? colors.barHigh : isLow ? colors.barLow : colors.bar
                        }`}
                        style={{ height: `${Math.max(barHeight, 5)}%`, minHeight: '4px' }}
                        title={`Over ${over.over}: ${over.runs} runs, ${over.wickets} wicket(s)`}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1 text-center">
                      {over.runs}/{over.wickets}
                    </div>
                  </div>
                  <div className="w-16 text-xs text-right">
                    <div className="text-white font-bold">{over.runs}</div>
                    <div className="text-gray-500">RR: {over.runRate}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary Stats */}
          <div className="pt-4 border-t border-white/10 grid grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-gray-400 mb-1">Total Runs</div>
              <div className="text-lg font-bold text-white">
                {overData.reduce((sum, o) => sum + o.runs, 0)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Boundaries</div>
              <div className="text-lg font-bold text-green-400">
                {overData.reduce((sum, o) => sum + o.boundaries, 0)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Dot Balls</div>
              <div className="text-lg font-bold text-gray-400">
                {overData.reduce((sum, o) => sum + o.dotBalls, 0)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Wickets</div>
              <div className="text-lg font-bold text-red-400">
                {overData.reduce((sum, o) => sum + o.wickets, 0)}
              </div>
            </div>
          </div>

          {/* Trend Indicator */}
          {overData.length >= 2 && (
            <div className="pt-4 border-t border-white/10 flex items-center gap-2">
              {avgRunRate > 7 ? (
                <>
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-green-400">High scoring rate</span>
                </>
              ) : avgRunRate < 5 ? (
                <>
                  <TrendingDown className="w-4 h-4 text-red-400" />
                  <span className="text-xs text-red-400">Low scoring rate</span>
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-400">Steady scoring</span>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

