import type { Match, Team } from '@/types';

export const IPL_STORAGE_KEY = 'iplPointsTableStats';

// Team IDs returned by `/api/teams` for active IPL franchises.
export const IPL_TEAMS_BY_SEASON: Record<number, string[]> = {
  2008: ['1', '2', '3', '5', '6', '8', '9', '10'],
  2009: ['1', '2', '3', '5', '6', '8', '9', '10'],
  2010: ['1', '2', '3', '5', '6', '8', '9', '10'],
  2011: ['1', '2', '3', '5', '6', '8', '9', '10'],
  2012: ['1', '2', '3', '5', '6', '8', '9', '10'],
  2013: ['1', '2', '3', '5', '6', '8', '9', '10'],
  2014: ['1', '2', '3', '5', '6', '8', '9', '10'],
  2015: ['1', '2', '3', '5', '6', '8', '9', '10'],
  2016: ['1', '2', '3', '5', '6', '8', '9', '10'],
  2017: ['1', '2', '3', '5', '6', '8', '9', '10'],
  2018: ['1', '2', '3', '5', '6', '8', '9', '10'],
  2019: ['1', '2', '3', '5', '6', '8', '9', '10'],
  2020: ['1', '2', '3', '5', '6', '8', '9', '10'],
  2021: ['1', '2', '3', '5', '6', '8', '9', '10'],
  2022: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
  2023: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
  2024: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
  2025: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
  2026: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
};

export type IplStandingsStatus = 'qualified' | 'eliminated';

export type IplSavedRow = {
  matchesPlayed?: number | null;
  wins?: number | null;
  losses?: number | null;
  noResult?: number | null;
  points?: number | null;
  netRunRate?: number | null;
  qualified?: boolean;
  eliminated?: boolean;
};

export type IplPointsTableRow = Team & {
  matchesPlayed: number | null;
  wins: number | null;
  losses: number | null;
  noResult: number | null;
  points: number | null;
  netRunRate: number | null;
  qualified: boolean;
  eliminated: boolean;
};

export function getIplSeasonTeamIds(year: number): string[] {
  return IPL_TEAMS_BY_SEASON[year] || IPL_TEAMS_BY_SEASON[2026] || [];
}

export function getIplAvailableYears(currentYear = new Date().getFullYear()): number[] {
  const years: number[] = [];
  for (let year = 2008; year <= currentYear; year += 1) {
    years.push(year);
  }
  return years;
}

export function getStatusPatch(status: IplStandingsStatus, value: boolean) {
  if (status === 'qualified') {
    return value
      ? { qualified: true, eliminated: false }
      : { qualified: false };
  }

  return value
    ? { qualified: false, eliminated: true }
    : { eliminated: false };
}

export function readIplSavedRows(selectedYear: number): Record<string, IplSavedRow> {
  if (typeof window === 'undefined') return {};

  try {
    const allStats = JSON.parse(window.localStorage.getItem(IPL_STORAGE_KEY) || '{}') || {};
    const yearStats = allStats[selectedYear];
    return yearStats && typeof yearStats === 'object' ? yearStats : {};
  } catch {
    return {};
  }
}

export function extractRunsFromScore(score: unknown): number {
  if (typeof score === 'number' && Number.isFinite(score)) return score;
  if (typeof score !== 'string') return 0;

  const match = score.trim().match(/^(\d+)/);
  if (!match) return 0;

  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isNoResultMatch(match: Match): boolean {
  const haystack = `${match.resultType || ''} ${match.resultReason || ''} ${match.result || ''}`.toLowerCase();
  return haystack.includes('no result') || haystack.includes('abandoned') || haystack.includes('washout');
}

function didTeamWin(match: Match, team: Team): boolean {
  if (!match.result || isNoResultMatch(match)) return false;

  const result = match.result.toLowerCase();
  const shortName = String(team.shortName || '').toLowerCase();
  const fullName = String(team.name || '').toLowerCase();

  return Boolean(shortName && result.includes(shortName)) || Boolean(fullName && result.includes(fullName));
}

export function buildComputedIplRow(team: Team, matches: Match[], selectedYear: number): IplSavedRow {
  const completedMatches = matches.filter((match) => {
    const isTeamMatch = match.team1.id === team.id || match.team2.id === team.id;
    return (
      isTeamMatch &&
      !match.playoffType &&
      match.status === 'completed' &&
      new Date(match.date).getFullYear() === selectedYear
    );
  });

  const wins = completedMatches.filter((match) => didTeamWin(match, team)).length;
  const noResult = completedMatches.filter(isNoResultMatch).length;
  const losses = Math.max(completedMatches.length - wins - noResult, 0);
  const points = wins * 2 + noResult;

  let totalRunsScored = 0;
  let totalRunsConceded = 0;
  let nrrMatches = 0;

  completedMatches.forEach((match) => {
    const teamRuns = extractRunsFromScore(match.team1.id === team.id ? match.team1Score : match.team2Score);
    const opponentRuns = extractRunsFromScore(match.team1.id === team.id ? match.team2Score : match.team1Score);

    if (teamRuns > 0 || opponentRuns > 0) {
      totalRunsScored += teamRuns;
      totalRunsConceded += opponentRuns;
      nrrMatches += 1;
    }
  });

  const netRunRate = nrrMatches > 0
    ? Number(((totalRunsScored - totalRunsConceded) / (nrrMatches * 20)).toFixed(2))
    : 0;

  return {
    matchesPlayed: completedMatches.length,
    wins,
    losses,
    noResult,
    points,
    netRunRate,
  };
}

export function formatNetRunRate(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '-';
  return value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
}
