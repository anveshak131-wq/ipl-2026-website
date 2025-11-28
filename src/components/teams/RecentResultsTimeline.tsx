'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Trophy, TrendingDown, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Match, Team } from '@/types';
import { api } from '@/lib/data';
import CustomEmoji from '@/components/emoji/CustomEmoji';

interface RecentResultsTimelineProps {
  team: Team;
  matches?: Match[];
  maxItems?: number;
}

export default function RecentResultsTimeline({ team, matches: providedMatches, maxItems = 10 }: RecentResultsTimelineProps) {
  const [matches, setMatches] = useState<Match[]>(providedMatches || []);
  const [isLoading, setIsLoading] = useState(!providedMatches);

  useEffect(() => {
    if (!providedMatches) {
      const fetchMatches = async () => {
        try {
          const allMatches = await api.getMatches();
          const teamMatches = allMatches
            .filter((m) => (m.team1.id === team.id || m.team2.id === team.id) && m.status === 'completed')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, maxItems);
          setMatches(teamMatches);
        } catch (error) {
          console.error('Error fetching matches:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchMatches();
    }
  }, [team.id, providedMatches, maxItems]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No recent results available</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500/50 via-purple-500/50 to-pink-500/50" />

      <div className="space-y-6">
        {matches.map((match, index) => {
          const opponent = match.team1.id === team.id ? match.team2 : match.team1;
          const isWin = match.result?.includes(team.shortName) || match.result?.includes(team.name);
          const isLoss = match.result && !isWin && !match.result.toLowerCase().includes('no result');

          return (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative flex items-start gap-6"
            >
              {/* Timeline dot */}
              <div className="relative z-10 flex-shrink-0">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center border-4 border-slate-900 shadow-lg ${
                    isWin ? 'bg-green-500' : isLoss ? 'bg-red-500' : 'bg-gray-500'
                  }`}
                  style={{
                    boxShadow: `0 0 20px ${isWin ? '#10B981' : isLoss ? '#EF4444' : '#6B7280'}40`,
                  }}
                >
                  {isWin ? (
                    <Trophy className="w-6 h-6 text-white" />
                  ) : isLoss ? (
                    <TrendingDown className="w-6 h-6 text-white" />
                  ) : (
                    <Calendar className="w-6 h-6 text-white" />
                  )}
                </div>
              </div>

              {/* Content */}
              <Link
                href={`/matches#${match.id}`}
                className="flex-1 pt-2 group"
              >
                <div
                  className={`p-4 rounded-xl border-2 transition-all duration-300 group-hover:scale-105 ${
                    isWin
                      ? 'bg-green-500/10 border-green-500/30'
                      : isLoss
                      ? 'bg-red-500/10 border-red-500/30'
                      : 'bg-gray-500/10 border-gray-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-lg font-bold ${
                          isWin ? 'text-green-400' : isLoss ? 'text-red-400' : 'text-gray-400'
                        }`}
                      >
                        {team.shortName}
                      </span>
                      <span className="text-gray-400">vs</span>
                      <span className="text-lg font-bold text-white">{opponent.shortName}</span>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        isWin
                          ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                          : isLoss
                          ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                          : 'bg-gray-500/20 text-gray-400 border border-gray-500/50'
                      }`}
                    >
                      {isWin ? 'WON' : isLoss ? 'LOST' : 'NR'}
                    </span>
                  </div>

                  {match.score && (
                    <div className="flex items-center gap-4 text-sm text-gray-300 mb-2">
                      <span>
                        {team.shortName}: {match.score.team1.runs}/{match.score.team1.wickets} ({match.score.team1.overs} ov)
                      </span>
                      <span>|</span>
                      <span>
                        {opponent.shortName}: {match.score.team2.runs}/{match.score.team2.wickets} ({match.score.team2.overs} ov)
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>{new Date(match.date).toLocaleDateString()}</span>
                    {match.venue && (
                      <>
                        <span>•</span>
                        <span>{match.venue}</span>
                      </>
                    )}
                  </div>

                  {match.result && (
                    <p className="text-sm text-gray-300 mt-2">{match.result}</p>
                  )}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

