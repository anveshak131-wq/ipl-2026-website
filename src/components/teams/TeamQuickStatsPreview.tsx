'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Team, Match } from '@/types';
import { api } from '@/lib/data';
import CustomEmoji from '@/components/emoji/CustomEmoji';

interface TeamQuickStatsPreviewProps {
  team: Team;
  matches?: Match[];
}

export default function TeamQuickStatsPreview({ team, matches: providedMatches }: TeamQuickStatsPreviewProps) {
  const [matches, setMatches] = useState<Match[]>(providedMatches || []);
  const [isLoading, setIsLoading] = useState(!providedMatches);

  useEffect(() => {
    if (!providedMatches) {
      const fetchMatches = async () => {
        try {
          const allMatches = await api.getMatches();
          const teamMatches = allMatches.filter(
            (m) => m.team1.id === team.id || m.team2.id === team.id
          );
          setMatches(teamMatches);
        } catch (error) {
          console.error('Error fetching matches:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchMatches();
    }
  }, [team.id, providedMatches]);

  if (isLoading) {
    return (
      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-white/10 rounded w-3/4" />
          <div className="h-4 bg-white/10 rounded w-1/2" />
        </div>
      </div>
    );
  }

  const recentMatches = matches
    .filter((m) => m.status === 'completed')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const wins = recentMatches.filter((m) => {
    if (!m.result) return false;
    return m.result.includes(team.shortName) || m.result.includes(team.name);
  }).length;

  const losses = recentMatches.length - wins;
  const winRate = recentMatches.length > 0 ? ((wins / recentMatches.length) * 100).toFixed(0) : 0;

  const upcomingMatches = matches
    .filter((m) => m.status === 'upcoming')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute top-full left-0 mt-2 w-80 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-white/20 shadow-2xl z-50 p-4 backdrop-blur-xl"
    >
      <div className="space-y-4">
        {/* Recent Performance */}
        <div>
          <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
            <CustomEmoji type="target" size={16} />
            Recent Performance
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-lg bg-green-500/20 border border-green-500/30">
              <div className="text-lg font-bold text-green-400">{wins}</div>
              <div className="text-xs text-gray-300">Wins</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-red-500/20 border border-red-500/30">
              <div className="text-lg font-bold text-red-400">{losses}</div>
              <div className="text-xs text-gray-300">Losses</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
              <div className="text-lg font-bold text-blue-400">{winRate}%</div>
              <div className="text-xs text-gray-300">Win Rate</div>
            </div>
          </div>
        </div>

        {/* Recent Results */}
        {recentMatches.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <CustomEmoji type="calendar" size={16} />
              Recent Results
            </h4>
            <div className="space-y-1">
              {recentMatches.slice(0, 3).map((match) => {
                const isWin = match.result?.includes(team.shortName) || match.result?.includes(team.name);
                const opponent = match.team1.id === team.id ? match.team2 : match.team1;
                return (
                  <div
                    key={match.id}
                    className={`p-2 rounded-lg text-xs ${
                      isWin ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">vs {opponent.shortName}</span>
                      <span className={`font-bold ${isWin ? 'text-green-400' : 'text-red-400'}`}>
                        {isWin ? 'W' : 'L'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Upcoming Matches */}
        {upcomingMatches.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <CustomEmoji type="clock" size={16} />
              Upcoming
            </h4>
            <div className="space-y-1">
              {upcomingMatches.map((match) => {
                const opponent = match.team1.id === team.id ? match.team2 : match.team1;
                return (
                  <div key={match.id} className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs">
                    <div className="text-gray-300">vs {opponent.shortName}</div>
                    <div className="text-gray-400 text-[10px]">{new Date(match.date).toLocaleDateString()}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Squad Info */}
        <div className="pt-2 border-t border-white/10">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Squad Size</span>
            <span className="font-bold text-white">{team.players?.length || 0} players</span>
          </div>
          {team.trophies && team.trophies.length > 0 && (
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="text-gray-400">Trophies</span>
              <span className="font-bold text-white flex items-center gap-1">
                {team.trophies.length} <CustomEmoji type="trophy" size={12} />
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

