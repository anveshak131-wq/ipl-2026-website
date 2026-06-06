import type { Player, Team } from '@/types';
import { computeRoleRawScore, applyReliability, gradeFromPercentile } from '@/lib/playerRanking';
import { formatDateMonthDDYYYY } from '@/lib/dateUtils';

export const NOT_SELECTED_SEASON_FILTER = '__not_selected_season__';

export interface PlayerPerformanceMeta {
  score: number;
  grade: string;
  label: string;
  color: string;
  textColor: string;
}

export interface RoleDisplay {
  label: string;
  badgeClass: string;
  accentClass: string;
}

export function isPlayerInactive(player: Player): boolean {
  return player.isActiveInSquad === false || player.squadStatus === 'inactive';
}

export function calculateBowlingAverage(economy: number, wickets: number, matches: number): number {
  if (wickets === 0) return 0;
  const estimatedOvers = matches * 4;
  const runsConceded = economy * estimatedOvers;
  return runsConceded / wickets;
}

export function getPlayerPerformanceMeta(
  player: Player,
  allPlayers: Player[],
  league: string,
): PlayerPerformanceMeta {
  const raw = computeRoleRawScore(player);
  const matches = Number(player.stats?.matches || 0);
  const score = Math.round(applyReliability(raw, matches));
  const playerLeague = player.league || league || 'ipl';
  const grade = gradeFromPercentile(score, player.role, playerLeague, allPlayers.length > 0 ? allPlayers : [player]);

  const label =
    grade === 'A' ? 'Excellent' : grade === 'B' ? 'Good' : grade === 'C' ? 'Average' : 'Poor';

  const color =
    grade === 'A' ? '#10B981' : grade === 'B' ? '#3B82F6' : grade === 'C' ? '#F59E0B' : '#EF4444';

  const textColor =
    grade === 'A'
      ? 'text-green-400'
      : grade === 'B'
        ? 'text-blue-400'
        : grade === 'C'
          ? 'text-yellow-400'
          : 'text-red-400';

  return { score, grade, label, color, textColor };
}

export function getRoleDisplay(player: Player): RoleDisplay {
  if (player.role === 'All-rounder') {
    if (player.allrounderType === 'Batting All-rounder') {
      return {
        label: 'Batting All-rounder',
        badgeClass:
          'bg-gradient-to-r from-emerald-500/30 to-green-500/30 text-emerald-200 border-emerald-400/50 shadow-lg shadow-emerald-500/20',
        accentClass: 'from-emerald-500 via-green-400 to-emerald-500',
      };
    }
    if (player.allrounderType === 'Bowling All-rounder') {
      return {
        label: 'Bowling All-rounder',
        badgeClass:
          'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-cyan-200 border-cyan-400/50 shadow-lg shadow-cyan-500/20',
        accentClass: 'from-cyan-500 via-blue-400 to-cyan-500',
      };
    }
    return {
      label: 'All-rounder',
      badgeClass: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      accentClass: 'from-purple-500 via-pink-400 to-purple-500',
    };
  }

  const map: Record<string, RoleDisplay> = {
    Batsman: {
      label: 'Batsman',
      badgeClass:
        'bg-gradient-to-r from-amber-500/40 to-yellow-500/40 text-amber-100 border-2 border-amber-300/60 shadow-xl shadow-amber-500/30',
      accentClass: 'from-amber-500 via-yellow-400 to-amber-500',
    },
    Bowler: {
      label: 'Bowler',
      badgeClass:
        'bg-gradient-to-r from-teal-500/40 to-cyan-500/40 text-teal-100 border-2 border-teal-300/60 shadow-xl shadow-teal-500/30',
      accentClass: 'from-teal-500 via-cyan-400 to-teal-500',
    },
    'Wicket-keeper': {
      label: 'Wicket-keeper',
      badgeClass:
        'bg-gradient-to-r from-rose-500/40 to-pink-500/40 text-rose-100 border-2 border-rose-300/60 shadow-xl shadow-rose-500/30',
      accentClass: 'from-rose-500 via-pink-400 to-rose-500',
    },
  };

  return (
    map[player.role] ?? {
      label: player.role,
      badgeClass: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      accentClass: 'from-gray-500 via-gray-400 to-gray-500',
    }
  );
}

export function formatPlayerDob(player: Player, league: string): string {
  if (!player.dateOfBirth) return '—';
  return formatDateMonthDDYYYY(player.dateOfBirth);
}

export function formatStatNumber(value: number | string | undefined, decimals = 0): string {
  if (value === undefined || value === null || value === '' || value === '-') return '—';
  const num = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(num) || num <= 0) return '—';
  return decimals > 0 ? num.toFixed(decimals) : String(num);
}

export function resolveTeam(player: Player, teams: Team[]): Team | undefined {
  return teams.find((t) => String(t.id) === String(player.teamId));
}

export function getBattingAverage(player: Player): string {
  const stats = player.stats;
  if (stats.battingAverage && stats.battingAverage !== '0' && stats.battingAverage !== '-') {
    return String(stats.battingAverage);
  }
  if (stats.average && stats.average > 0) return stats.average.toFixed(2);
  const runs = stats.runs || 0;
  const innings = stats.battingInnings || 0;
  const notOuts = stats.notOuts || 0;
  const dismissals = innings - notOuts;
  return dismissals > 0 && runs > 0 ? (runs / dismissals).toFixed(2) : '—';
}

export function getBattingStrikeRate(player: Player): string {
  const stats = player.stats;
  if (stats.battingStrikeRate && stats.battingStrikeRate !== '0' && stats.battingStrikeRate !== '-') {
    return String(stats.battingStrikeRate);
  }
  if (stats.strikeRate && stats.strikeRate > 0) return stats.strikeRate.toFixed(1);
  const runs = stats.runs || 0;
  const balls = stats.ballsFaced || 0;
  return balls > 0 && runs > 0 ? ((runs * 100) / balls).toFixed(1) : '—';
}

export function getBowlingAverageDisplay(player: Player): string {
  const stats = player.stats;
  if (stats.bowlingAverage && stats.bowlingAverage !== '0' && stats.bowlingAverage !== '-') {
    return String(stats.bowlingAverage);
  }
  if (stats.wickets > 0) {
    return calculateBowlingAverage(stats.economy, stats.wickets, stats.matches).toFixed(2);
  }
  return '—';
}
