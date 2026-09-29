'use client';

import { motion } from 'framer-motion';
import { Bookmark, X } from 'lucide-react';
import { useBookmarks } from '@/contexts/BookmarkContext';
import type { Player, Team } from '@/types';
import ModernStatsCard from './ModernStatsCard';

interface BookmarkedPlayersSectionProps {
  players: Player[];
  teams: Team[];
  type: 'batting' | 'bowling';
}

export default function BookmarkedPlayersSection({ players, teams, type }: BookmarkedPlayersSectionProps) {
  const { bookmarkedPlayers, toggleBookmark } = useBookmarks();
  
  const bookmarkedPlayersList = players.filter(player => bookmarkedPlayers.has(player.id));

  if (bookmarkedPlayersList.length === 0) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      <div className="relative z-10 overflow-hidden rounded-lg border border-white/[0.15] bg-black/[0.42] shadow-2xl backdrop-blur-xl">
        <div className="h-1 bg-gradient-to-r from-amber-500 to-yellow-400" />
        <div className="p-5 md:p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-gradient-to-br from-amber-500 to-yellow-400 p-3 shadow-lg">
                <Bookmark className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white md:text-2xl">
                  Bookmarked Players
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-300">
                  Your favorite players ({bookmarkedPlayersList.length})
                </p>
              </div>
            </div>
          </div>

          <div className="mb-7 space-y-3">
            {bookmarkedPlayersList.map((player) => {
              const team = teams.find((t) => t.id === player.teamId);
              return (
                <div key={player.id} className="relative">
                  <ModernStatsCard
                    player={player}
                    rank={players.findIndex(p => p.id === player.id) + 1}
                    isLeader={false}
                    type={type}
                    metric={type === 'batting' ? 'runs' : 'wickets'}
                    teamName={team?.shortName}
                    onExpand={() => {}}
                    isExpanded={false}
                  />
                  <button
                    onClick={() => toggleBookmark(player.id)}
                    className="absolute top-4 right-4 p-2 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.section>
  );
}