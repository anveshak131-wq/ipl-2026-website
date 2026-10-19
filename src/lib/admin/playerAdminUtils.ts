import type { Player, Team } from '@/types';
import {
  getBattingAverageDisplayFromStats,
  getBattingStrikeRateDisplayFromStats,
} from '@/lib/admin/battingStatsUtils';
import {
  getBowlingAverageDisplayFromStats,
  getBowlingEconomyDisplayFromStats,
  getBowlingStrikeRateDisplayFromStats,
} from '@/lib/admin/bowlingStatsUtils';
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
  const display = getBattingAverageDisplayFromStats(player.stats || {});
  return display === '-' ? '—' : display;
}

export function getBattingStrikeRate(player: Player): string {
  const display = getBattingStrikeRateDisplayFromStats(player.stats || {});
  return display === '-' ? '—' : display;
}

export function getBowlingAverageDisplay(player: Player): string {
  const display = getBowlingAverageDisplayFromStats(player.stats || {});
  return display === '-' ? '—' : display;
}

export function getBowlingEconomyDisplay(player: Player): string {
  const display = getBowlingEconomyDisplayFromStats(player.stats || {});
  return display === '-' ? '—' : display;
}

export function getBowlingStrikeRateDisplay(player: Player): string {
  const display = getBowlingStrikeRateDisplayFromStats(player.stats || {});
  return display === '-' ? '—' : display;
}


// Role-Weighted IPL Performance Rating System
export function calculatePlayerRating(player: any): { score: number; grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D'; formStatus: 'Poor' | 'Average' | 'Good' | 'Excellent' } {
  const stats = player.stats || {};
  const iplBat = player.careerStats?.batting?.IPL || {};
  const iplBowl = player.careerStats?.bowling?.IPL || {};

  // Resolve Batting metrics
  const runs = Number(iplBat.Runs || iplBat.runs || stats.runs || 0);
  const avg = Number(iplBat.Avg || iplBat.Average || stats.average || stats.battingAverage || 0);
  const sr = Number(iplBat.SR || stats.strikeRate || stats.battingStrikeRate || 0);
  const inn = Number(iplBat.Inn || iplBat.Innings || stats.battingInnings || (runs > 0 ? 1 : 0));
  const fifties = Number(iplBat['50'] || iplBat['50s'] || stats.fifties || 0);
  const hundreds = Number(iplBat['100'] || iplBat['100s'] || stats.hundreds || 0);

  // Resolve Bowling metrics
  const wkts = Number(iplBowl.Wkts || iplBowl.Wickets || stats.wickets || 0);
  const econ = Number(iplBowl.Econ || iplBowl.Eco || stats.economy || 0);
  const bowlSR = Number(iplBowl.SR || stats.bowlingStrikeRate || 0);

  // 1. Calculate Batting Score (0 - 100)
  let batScore = 30;
  if (runs > 0) {
    const volume = Math.min(100, (runs / 4500) * 100);
    const consistency = Math.min(100, (avg / 40) * 100);
    const speed = Math.min(100, Math.max(0, ((sr - 105) / 55) * 100));
    const milestones = Math.min(100, ((hundreds * 5 + fifties * 2) / Math.max(inn, 1)) * 200);
    batScore = (volume * 0.35) + (consistency * 0.25) + (speed * 0.30) + (milestones * 0.10);
  }

  // 2. Calculate Bowling Score (0 - 100)
  let bowlScore = 30;
  if (wkts > 0 || econ > 0) {
    const volume = Math.min(100, (wkts / 120) * 100);
    const economyScore = econ > 0 ? Math.min(100, Math.max(0, ((10.5 - econ) / 4.0) * 100)) : 50;
    const strikeRateScore = bowlSR > 0 ? Math.min(100, Math.max(0, ((30.0 - bowlSR) / 15.0) * 100)) : 50;
    bowlScore = (volume * 0.40) + (economyScore * 0.40) + (strikeRateScore * 0.20);
  }

  // 3. Apply Strict Role Weighting
  const role = (player.role || '').toLowerCase();
  const subType = (player.allrounderType || '').toLowerCase();

  let finalRaw = 50;
  if (role.includes('batsman') || role.includes('batter') || role.includes('keeper')) {
    // 100% Batting, 0% Bowling
    finalRaw = batScore;
  } else if (role.includes('bowler')) {
    // 0% Batting, 100% Bowling
    finalRaw = bowlScore;
  } else if (subType.includes('batting')) {
    // Batting All-rounder: 75% Batting, 25% Bowling
    finalRaw = (batScore * 0.75) + (bowlScore * 0.25);
  } else if (subType.includes('bowling')) {
    // Bowling All-rounder: 25% Batting, 75% Bowling
    finalRaw = (batScore * 0.25) + (bowlScore * 0.75);
  } else {
    // General All-rounder: 50% Batting, 50% Bowling
    finalRaw = (batScore * 0.50) + (bowlScore * 0.50);
  }

  const score = Math.round(Math.min(99, Math.max(25, finalRaw)));

  // Tier Grading
  let grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' = 'C';
  if (score >= 90) grade = 'A+';
  else if (score >= 80) grade = 'A';
  else if (score >= 70) grade = 'B+';
  else if (score >= 55) grade = 'B';
  else if (score >= 40) grade = 'C';
  else grade = 'D';

  let formStatus: 'Poor' | 'Average' | 'Good' | 'Excellent' = 'Average';
  if (score >= 85) formStatus = 'Excellent';
  else if (score >= 70) formStatus = 'Good';
  else if (score >= 50) formStatus = 'Average';
  else formStatus = 'Poor';

  return { score, grade, formStatus };
}
