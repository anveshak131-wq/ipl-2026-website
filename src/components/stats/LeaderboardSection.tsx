'use client';

import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Award, Zap } from 'lucide-react';
import ModernStatsCard from './ModernStatsCard';
import StatsVisualization from './StatsVisualization';
import type { Player, Team } from '@/types';

interface LeaderboardSectionProps {
  title: string;
  icon: typeof Trophy;
  players: Player[];
  teams: Team[];
  type: 'batting' | 'bowling';
  qualificationText?: string;
  color: string;
  expandedPlayerId: string | null;
  onPlayerExpand: (playerId: string | null) => void;
  leadersLimit: 10 | 50;
  visualizationVariant?: 'bar' | 'column';
}

export default function LeaderboardSection({
  title,
  icon: Icon,
  players,
  teams,
  type,
  qualificationText,
  color,
  expandedPlayerId,
  onPlayerExpand,
  leadersLimit,
  visualizationVariant = 'bar',
}: LeaderboardSectionProps) {
  const displayPlayers = players.slice(0, leadersLimit);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative"
    >
      {/* Background glow */}
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-10 blur-3xl rounded-3xl`} />
      
      <div className="relative z-10 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6 md:p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
              className={`p-4 rounded-2xl bg-gradient-to-br ${color} shadow-lg`}
            >
              <Icon className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-1">
                {title}
              </h2>
              {qualificationText && (
                <p className="text-xs text-gray-400 italic">
                  {qualificationText}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="space-y-3 mb-8">
          {displayPlayers.map((player, index) => {
            const team = teams.find((t) => t.id === player.teamId);
            return (
              <ModernStatsCard
                key={player.id}
                player={player}
                rank={index + 1}
                isLeader={index === 0}
                type={type}
                teamName={team?.shortName}
                onExpand={() => onPlayerExpand(expandedPlayerId === player.id ? null : player.id)}
                isExpanded={expandedPlayerId === player.id}
              />
            );
          })}
        </div>

        {/* Visualization */}
        {displayPlayers.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-2xl bg-black/30 border border-white/10"
          >
            <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Visual Comparison
            </h3>
            <StatsVisualization 
              players={displayPlayers} 
              type={type}
              maxItems={leadersLimit}
              variant={visualizationVariant}
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

