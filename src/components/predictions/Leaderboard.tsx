'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/data';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';

interface LeaderboardEntry {
  userId: string;
  totalPredictions: number;
  completedPredictions: number;
  totalPoints: number;
  averagePoints: number;
  overallAccuracy: number;
  wins: number;
  rank: number;
}

interface LeaderboardProps {
  matchId?: string;
  currentUserId?: string;
}

export default function Leaderboard({ matchId, currentUserId }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await api.getLeaderboard(matchId);
        setLeaderboard(data);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [matchId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ipl-gold"></div>
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-600" />
        <p>No leaderboard data available yet</p>
        <p className="text-sm mt-2">Make predictions to see rankings!</p>
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return <span className="text-gray-400 font-semibold">#{rank}</span>;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-ipl-gold" />
          {matchId ? 'Match Leaderboard' : 'Global Leaderboard'}
        </h3>
        <div className="text-sm text-gray-400">
          Top {leaderboard.length}
        </div>
      </div>

      <div className="space-y-2">
        {leaderboard.map((entry, index) => {
          const isCurrentUser = currentUserId && entry.userId === currentUserId;
          
          return (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 rounded-lg border-2 transition-all ${
                isCurrentUser
                  ? 'border-ipl-gold bg-ipl-gold/10 shadow-lg shadow-ipl-gold/20'
                  : entry.rank <= 3
                  ? 'border-gray-600 bg-gray-800/50'
                  : 'border-gray-700 bg-gray-800/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10">
                    {getRankIcon(entry.rank)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">
                        User {entry.userId.slice(0, 8)}
                      </span>
                      {isCurrentUser && (
                        <span className="text-xs px-2 py-1 bg-ipl-gold/20 text-ipl-gold rounded">
                          You
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                      <span>{entry.completedPredictions} predictions</span>
                      {entry.wins > 0 && (
                        <span className="flex items-center gap-1">
                          <Trophy className="w-3 h-3" />
                          {entry.wins} perfect
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-ipl-gold" />
                    <span className="font-bold text-white">{entry.totalPoints}</span>
                    <span className="text-sm text-gray-400">pts</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    {entry.overallAccuracy.toFixed(1)}% accuracy
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {leaderboard.length >= 10 && (
        <div className="text-center text-sm text-gray-400 mt-4">
          Showing top {leaderboard.length} predictors
        </div>
      )}
    </div>
  );
}

