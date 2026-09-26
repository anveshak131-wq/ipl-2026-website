'use client';

import { MapPin, BarChart3, Trophy } from 'lucide-react';
import { LiveScoreState } from '@/hooks/useLiveScore';

interface MatchContextPanelProps {
  team1Name: string;
  team2Name: string;
  venue?: string;
  toss?: {
    winner: 'team1' | 'team2';
    decision: 'bat' | 'bowl';
  };
  pitchReport?: string;
  headToHead?: {
    totalMatches: number;
    team1Wins: number;
    team2Wins: number;
    lastMeeting?: string;
  };
  currentOver?: number;
  league?: 'ipl' | 'wpl';
}

export default function MatchContextPanel({
  team1Name,
  team2Name,
  venue = 'Test Venue',
  toss,
  pitchReport,
  headToHead,
  currentOver = 0,
  league = 'ipl',
}: MatchContextPanelProps) {
  const leagueColors = {
    ipl: {
      bg: 'bg-slate-800/50',
      border: 'border-slate-700/30',
      accent: 'text-blue-400',
      icon: 'text-blue-300',
    },
    wpl: {
      bg: 'bg-purple-900/20',
      border: 'border-purple-700/30',
      accent: 'text-purple-400',
      icon: 'text-pink-300',
    },
  };

  const colors = leagueColors[league];

  return (
    <div className={`${colors.bg} rounded-xl p-5 border-2 ${colors.border} backdrop-blur-xl space-y-4`}>
      <h3 className="text-lg font-bold text-white mb-4">Match Context</h3>

      {/* Toss Information */}
      {toss && (
        <div className="pb-4 border-b border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className={`w-4 h-4 ${colors.icon}`} />
            <span className="text-sm font-semibold text-white">Toss</span>
          </div>
          <div className="text-sm text-gray-300">
            <span className="font-bold text-white">
              {toss.winner === 'team1' ? team1Name : team2Name}
            </span>
            {' won the toss and chose to '}
            <span className="font-bold text-white">{toss.decision}</span>
          </div>
        </div>
      )}

      {/* Venue */}
      <div className="pb-4 border-b border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className={`w-4 h-4 ${colors.icon}`} />
          <span className="text-sm font-semibold text-white">Venue</span>
        </div>
        <div className="text-sm text-gray-300">{venue}</div>
      </div>

      {/* Pitch Report */}
      {pitchReport && (
        <div className="pb-4 border-b border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className={`w-4 h-4 ${colors.icon}`} />
            <span className="text-sm font-semibold text-white">Pitch Report</span>
          </div>
          <div className="text-sm text-gray-300 leading-relaxed">{pitchReport}</div>
        </div>
      )}

      {/* Head-to-Head */}
      {headToHead && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Trophy className={`w-4 h-4 ${colors.icon}`} />
            <span className="text-sm font-semibold text-white">Head-to-Head</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">{team1Name}</span>
              <span className="text-white font-bold">{headToHead.team1Wins} wins</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">{team2Name}</span>
              <span className="text-white font-bold">{headToHead.team2Wins} wins</span>
            </div>
            <div className="pt-2 border-t border-white/10">
              <div className="text-xs text-gray-500">
                Total Matches: {headToHead.totalMatches}
              </div>
              {headToHead.lastMeeting && (
                <div className="text-xs text-gray-500 mt-1">
                  Last Meeting: {headToHead.lastMeeting}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fielding Restrictions */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-semibold text-white">Fielding Restrictions</span>
        </div>
        <div className="text-sm text-gray-300 space-y-1">
          {currentOver <= 6 ? (
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded p-2">
              <div className="font-bold text-yellow-300">Powerplay (Overs 1-6)</div>
              <div>Max 2 fielders outside 30-yard circle</div>
            </div>
          ) : currentOver <= 15 ? (
            <div className="bg-blue-500/20 border border-blue-500/30 rounded p-2">
              <div className="font-bold text-blue-300">Middle Overs (7-15)</div>
              <div>Max 4 fielders outside 30-yard circle</div>
            </div>
          ) : (
            <div className="bg-red-500/20 border border-red-500/30 rounded p-2">
              <div className="font-bold text-red-300">Death Overs (16-20)</div>
              <div>Max 5 fielders outside 30-yard circle</div>
            </div>
          )}
        </div>
      </div>

      {/* Default message if no data */}
      {!toss && !pitchReport && !headToHead && (
        <div className="text-center py-4 text-gray-400 text-sm">
          Match context information will appear here
        </div>
      )}
    </div>
  );
}
