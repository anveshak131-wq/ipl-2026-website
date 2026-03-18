'use client';

import { motion } from 'framer-motion';
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { Player } from '@/types';

interface ModernStatsCardProps {
  player: Player;
  rank: number;
  isLeader?: boolean;
  type: 'batting' | 'bowling';
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

export default function ModernStatsCard({
  player,
  rank,
  isLeader = false,
  type,
  teamName,
  onExpand,
  isExpanded = false,
}: ModernStatsCardProps) {
  const stats = player.stats as any;
  const isBatting = type === 'batting';
  const primaryColor = isBatting ? 'from-orange-500/20 via-amber-500/20' : 'from-purple-500/20 via-violet-500/20';
  const accentColor = isBatting ? 'text-orange-400' : 'text-purple-400';
  const borderColor = isBatting ? 'border-orange-500/40' : 'border-purple-500/40';
  const glowColor = isBatting ? 'shadow-orange-500/20' : 'shadow-purple-500/20';

  const battingStrikeRate = toFiniteNumber(stats?.strikeRate);
  const battingAverage = toFiniteNumber(stats?.average);
  const bowlingEconomy = toFiniteNumber(stats?.economy);
  const bowlingAverage = toOptionalNumber(stats?.bowlingAverage);
  const bowlingStrikeRateNumber = toOptionalNumber(stats?.bowlingStrikeRate);
  const bowlingStrikeRateDisplay =
    bowlingStrikeRateNumber !== null
      ? bowlingStrikeRateNumber.toFixed(1)
      : (typeof stats?.bowlingStrikeRate === 'string' && stats.bowlingStrikeRate.trim()) || '-';

  const getTrendIcon = (rank: number) => {
    if (rank <= 3) return <TrendingUp className="w-3 h-3 text-emerald-400" />;
    if (rank >= 8) return <TrendingDown className="w-3 h-3 text-red-400" />;
    return <Minus className="w-3 h-3 text-gray-400" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: rank * 0.05 }}
      onClick={onExpand}
      className={`
        group relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer
        ${isLeader 
          ? `bg-gradient-to-r ${primaryColor} to-black/40 ${borderColor} shadow-lg ${glowColor}` 
          : 'bg-black/20 border-white/10 hover:border-white/30 hover:bg-black/30'
        }
      `}
      whileHover={{ scale: isLeader ? 1.02 : 1.01, y: -2 }}
    >
      {/* Animated background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-r ${primaryColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      
      {/* Shimmer effect for leader */}
      {isLeader && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{
            x: ['-100%', '200%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}

      <div className="relative z-10 p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Rank and Player Info */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Rank Badge */}
            <motion.div
              className={`
                flex-shrink-0 rounded-full flex items-center justify-center font-bold text-white
                ${isLeader 
                  ? 'w-12 h-12 bg-gradient-to-br from-ipl-gold to-ipl-purple shadow-lg' 
                  : 'w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-800'
                }
              `}
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              {isLeader ? <Trophy className="w-5 h-5" /> : `#${rank}`}
            </motion.div>

            {/* Player Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`font-bold text-white truncate ${isLeader ? 'text-lg' : 'text-base'}`}>
                  {player.name}
                </h3>
                {getTrendIcon(rank)}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>{player.role}</span>
                <span>•</span>
                <span className="truncate">{teamName || 'Unknown'}</span>
                <span>•</span>
                <span>{player.stats.matches} matches</span>
              </div>
            </div>
          </div>

          {/* Right: Stats */}
          <div className="flex-shrink-0 text-right">
            {isBatting ? (
              <>
                <div className={`font-black ${accentColor} ${isLeader ? 'text-2xl' : 'text-xl'}`}>
                  {player.stats.runs}
                </div>
                <div className="text-xs text-gray-400 font-semibold">
                  runs
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  SR {battingStrikeRate.toFixed(1)} • Avg {battingAverage.toFixed(1)}
                </div>
              </>
            ) : (
              <>
                <div className={`font-black ${accentColor} ${isLeader ? 'text-2xl' : 'text-xl'}`}>
                  {player.stats.wickets}
                </div>
                <div className="text-xs text-gray-400 font-semibold">
                  wickets
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Eco {bowlingEconomy.toFixed(2)} • Avg {bowlingAverage !== null ? bowlingAverage.toFixed(1) : '-'}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-white/10"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {isBatting ? (
                <>
                  <div>
                    <div className="text-gray-400 mb-1">Highest</div>
                    <div className="text-white font-semibold">{player.stats.highest}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 mb-1">4s</div>
                    <div className="text-white font-semibold">{player.stats.fours}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 mb-1">6s</div>
                    <div className="text-white font-semibold">{player.stats.sixes}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 mb-1">50s/100s</div>
                    <div className="text-white font-semibold">{player.stats.fifties}/{player.stats.hundreds}</div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <div className="text-gray-400 mb-1">Best</div>
                    <div className="text-white font-semibold">{player.stats.bestBowling}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 mb-1">Economy</div>
                    <div className="text-white font-semibold">{bowlingEconomy.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 mb-1">Strike Rate</div>
                    <div className="text-white font-semibold">
                      {bowlingStrikeRateDisplay}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 mb-1">5-Wicket Hauls</div>
                    <div className="text-white font-semibold">{player.stats.fiveWickets || 0}</div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

