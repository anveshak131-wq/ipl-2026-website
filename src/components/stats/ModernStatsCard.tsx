'use client';

import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Medal, Trophy } from 'lucide-react';
import type { Player } from '@/types';

type MetricKey = 'runs' | 'wickets' | 'strikeRate' | 'economy';

interface ModernStatsCardProps {
  player: Player;
  rank: number;
  isLeader?: boolean;
  type: 'batting' | 'bowling';
  metric?: MetricKey;
  teamName?: string;
  onExpand?: () => void;
  isExpanded?: boolean;
}

function toFiniteNumber(value: unknown, fallback: number = 0): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toOptionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '' || value === '-') {
    return null;
  }
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatValue(value: number, decimals = 0): string {
  return decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString();
}

export default function ModernStatsCard({
  player,
  rank,
  isLeader = false,
  type,
  metric,
  teamName,
  onExpand,
  isExpanded = false,
}: ModernStatsCardProps) {
  const stats = player.stats as any;
  const isBatting = type === 'batting';
  const resolvedMetric: MetricKey = metric || (isBatting ? 'runs' : 'wickets');
  const battingStrikeRate = toFiniteNumber(stats?.strikeRate);
  const battingAverage = toFiniteNumber(stats?.average);
  const bowlingEconomy = toFiniteNumber(stats?.economy);
  const bowlingAverage = toOptionalNumber(stats?.bowlingAverage);
  const bowlingStrikeRateNumber = toOptionalNumber(stats?.bowlingStrikeRate);
  const bowlingStrikeRateDisplay =
    bowlingStrikeRateNumber !== null
      ? bowlingStrikeRateNumber.toFixed(2)
      : (typeof stats?.bowlingStrikeRate === 'string' && stats.bowlingStrikeRate.trim()) || '-';

  const metricColor = isBatting ? 'text-amber-200' : 'text-violet-200';
  const borderColor = isBatting ? 'border-amber-300/[0.35]' : 'border-violet-300/[0.35]';
  const leaderSurface = isBatting
    ? 'bg-gradient-to-r from-amber-500/20 via-orange-500/[0.14] to-black/[0.35]'
    : 'bg-gradient-to-r from-violet-500/20 via-fuchsia-500/[0.12] to-black/[0.35]';

  const primary =
    resolvedMetric === 'strikeRate'
      ? { value: formatValue(battingStrikeRate, 2), label: 'strike rate' }
      : resolvedMetric === 'economy'
        ? { value: formatValue(bowlingEconomy, 2), label: 'economy' }
        : resolvedMetric === 'wickets'
          ? { value: formatValue(toFiniteNumber(stats?.wickets)), label: 'wickets' }
          : { value: formatValue(toFiniteNumber(stats?.runs)), label: 'runs' };

  const helper = isBatting
    ? resolvedMetric === 'strikeRate'
      ? `${formatValue(toFiniteNumber(stats?.runs))} runs - Avg ${battingAverage.toFixed(2)}`
      : `SR ${battingStrikeRate.toFixed(2)} - Avg ${battingAverage.toFixed(2)}`
    : resolvedMetric === 'economy'
      ? `${formatValue(toFiniteNumber(stats?.wickets))} wickets - Avg ${
          bowlingAverage !== null ? bowlingAverage.toFixed(2) : '-'
        }`
      : `Eco ${bowlingEconomy.toFixed(2)} - Avg ${bowlingAverage !== null ? bowlingAverage.toFixed(2) : '-'}`;

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: rank * 0.035 }}
      onClick={onExpand}
      aria-expanded={isExpanded}
      className={`
        group relative w-full overflow-hidden rounded-lg border text-left transition-all duration-300
        ${isLeader ? `${leaderSurface} ${borderColor} shadow-lg` : 'border-white/10 bg-black/[0.28] hover:border-white/25 hover:bg-black/[0.38]'}
      `}
      whileHover={{ y: -2 }}
    >
      {isLeader && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{ x: ['-120%', '120%'] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 1.5, ease: 'linear' }}
        />
      )}

      <div className="relative z-10 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div
              className={`
                flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md font-black text-white
                ${isLeader ? 'bg-gradient-to-br from-amber-300 to-orange-500 text-slate-950' : 'bg-white/10'}
              `}
            >
              {isLeader ? <Trophy className="h-5 w-5" /> : `#${rank}`}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className={`truncate font-bold text-white ${isLeader ? 'text-lg' : 'text-base'}`}>
                  {player.name}
                </h3>
                {rank <= 3 && (
                  <span className="hidden items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-[11px] font-semibold text-slate-200 sm:inline-flex">
                    <Medal className="h-3 w-3 text-amber-200" />
                    Top {rank}
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
                <span>{player.role}</span>
                <span className="text-slate-600">/</span>
                <span>{teamName || 'Team TBA'}</span>
                <span className="text-slate-600">/</span>
                <span>{toFiniteNumber(stats?.matches)} matches</span>
              </div>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-3 text-right">
            <div>
              <div className={`text-2xl font-black ${metricColor}`}>
                {primary.value}
              </div>
              <div className="text-xs font-semibold capitalize text-slate-300">
                {primary.label}
              </div>
              <div className="mt-1 hidden text-xs text-slate-500 sm:block">
                {helper}
              </div>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </div>
        </div>

        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 border-t border-white/10 pt-4"
          >
            <div className="grid grid-cols-2 gap-3 text-xs md:grid-cols-4">
              {isBatting ? (
                <>
                  <div>
                    <div className="mb-1 text-slate-400">Highest score</div>
                    <div className="font-semibold text-white">{player.stats.highest}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-slate-400">Fours</div>
                    <div className="font-semibold text-white">{player.stats.fours}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-slate-400">Sixes</div>
                    <div className="font-semibold text-white">{player.stats.sixes}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-slate-400">50s / 100s</div>
                    <div className="font-semibold text-white">
                      {player.stats.fifties}/{player.stats.hundreds}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <div className="mb-1 text-slate-400">Best bowling</div>
                    <div className="font-semibold text-white">{player.stats.bestBowling}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-slate-400">Economy rate</div>
                    <div className="font-semibold text-white">{bowlingEconomy.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-slate-400">Bowling strike rate</div>
                    <div className="font-semibold text-white">{bowlingStrikeRateDisplay}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-slate-400">Five-wicket hauls</div>
                    <div className="font-semibold text-white">{player.stats.fiveWickets || 0}</div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.button>
  );
}
