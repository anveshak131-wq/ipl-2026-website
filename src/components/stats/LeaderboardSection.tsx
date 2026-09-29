'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Trophy } from 'lucide-react';
import ModernStatsCard from './ModernStatsCard';
import StatsVisualization from './StatsVisualization';
import StatsExport from './StatsExport';
import type { Player, Team } from '@/types';

type MetricKey = 'runs' | 'wickets' | 'strikeRate' | 'economy';

interface LeaderboardSectionProps {
  title: string;
  icon: typeof Trophy;
  players: Player[];
  teams: Team[];
  type: 'batting' | 'bowling';
  metric?: MetricKey;
  qualificationText?: string;
  color: string;
  expandedPlayerId: string | null;
  onPlayerExpand: (playerId: string | null) => void;
  leadersLimit: 10 | 50;
  visualizationVariant?: 'bar' | 'column' | 'donut' | 'axis' | 'lollipop' | 'radar' | 'scatter' | 'bubble';
}

const metricHelp: Record<MetricKey, string> = {
  runs: 'Most runs scored in the tournament.',
  wickets: 'Most wickets taken by qualified bowlers.',
  strikeRate: 'Fastest scoring rate among qualified batters.',
  economy: 'Lowest economy rate among qualified bowlers. Lower is better.',
};

const metricLabel: Record<MetricKey, string> = {
  runs: 'runs',
  wickets: 'wickets',
  strikeRate: 'strike rate',
  economy: 'economy rate',
};

export default function LeaderboardSection({
  title,
  icon: Icon,
  players,
  teams,
  type,
  metric,
  qualificationText,
  color,
  expandedPlayerId,
  onPlayerExpand,
  leadersLimit,
  visualizationVariant = 'bar',
}: LeaderboardSectionProps) {
  const resolvedMetric = metric || (type === 'batting' ? 'runs' : 'wickets');
  const displayPlayers = players.slice(0, leadersLimit);
  const visualLimit = Math.min(leadersLimit, 10);
  const visualPlayers = displayPlayers.slice(0, visualLimit);

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      <div className="relative z-10 overflow-hidden rounded-lg border border-white/[0.15] bg-black/[0.42] shadow-2xl backdrop-blur-xl">
        <div className={`h-1 bg-gradient-to-r ${color}`} />
        <div className="p-5 md:p-6">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <div className={`rounded-md bg-gradient-to-br ${color} p-3 shadow-lg`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white md:text-2xl">
                  {title}
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">
                  {metricHelp[resolvedMetric]}
                </p>
                {qualificationText && (
                  <p className="mt-1 text-xs text-slate-500">
                    Qualification: {qualificationText}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-md border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-slate-300">
                Showing top {leadersLimit}
              </div>
              <StatsExport players={players} title={title} type={type} />
            </div>
          </div>

          <div className="mb-7 space-y-3">
            {displayPlayers.map((player, index) => {
              const team = teams.find((t) => t.id === player.teamId);
              return (
                <ModernStatsCard
                  key={player.id}
                  player={player}
                  rank={index + 1}
                  isLeader={index === 0}
                  type={type}
                  metric={resolvedMetric}
                  teamName={team?.shortName}
                  onExpand={() => onPlayerExpand(expandedPlayerId === player.id ? null : player.id)}
                  isExpanded={expandedPlayerId === player.id}
                />
              );
            })}
          </div>

          {visualPlayers.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="rounded-lg border border-white/10 bg-black/[0.35] p-4 md:p-5"
            >
              <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase text-slate-300 tracking-[0]">
                  <TrendingUp className="h-4 w-4 text-amber-200" />
                  Top {visualLimit} comparison
                </h3>
                <span className="text-xs text-slate-500">
                  Ranked by {metricLabel[resolvedMetric]}
                  {resolvedMetric === 'economy' ? ' (lower is better)' : ''}
                </span>
              </div>
              <StatsVisualization
                players={visualPlayers}
                type={type}
                metric={resolvedMetric}
                maxItems={visualLimit}
                variant={visualizationVariant}
              />
            </motion.div>
          )}
        </div>
      </div>
    </motion.section>
  );
}
