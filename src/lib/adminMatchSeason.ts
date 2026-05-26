import type { Match } from '@/types';

type MatchWithDate = { date: string };
type MatchWithSeasonFields = MatchWithDate & { time?: string; status?: Match['status'] | string };

export function getMatchSeasonYear(matchOrDate: MatchWithDate | string | undefined | null): number | null {
  const dateString =
    typeof matchOrDate === 'string' || matchOrDate == null ? matchOrDate : matchOrDate.date;

  if (!dateString) return null;
  const parsed = new Date(dateString);
  if (!Number.isNaN(parsed.getTime())) return parsed.getFullYear();

  const match = String(dateString).match(/(19|20)\d{2}/);
  return match ? Number.parseInt(match[0], 10) : null;
}

function getMatchTimestamp(match: MatchWithSeasonFields): number {
  const datePart = String(match.date || '').trim();
  const timePart = String(match.time || '').trim() || '00:00';
  if (!datePart) return 0;

  const normalized = datePart.includes('T') ? datePart : `${datePart}T${timePart}`;
  const ts = Date.parse(normalized);
  if (!Number.isNaN(ts)) return ts;

  const fallback = Date.parse(datePart);
  return Number.isNaN(fallback) ? 0 : fallback;
}

export function getAvailableSeasonYears(matches: MatchWithDate[], extraYears: number[] = []): number[] {
  const years = new Set<number>();

  for (const year of extraYears) {
    if (Number.isFinite(year)) years.add(year);
  }

  for (const match of matches) {
    const year = getMatchSeasonYear(match);
    if (year) years.add(year);
  }

  return Array.from(years).sort((a, b) => b - a);
}

export function filterMatchesBySeason<T extends MatchWithDate>(matches: T[], seasonYear: number | null): T[] {
  if (seasonYear === null) return matches;
  return matches.filter((match) => getMatchSeasonYear(match) === seasonYear);
}

export function sortMatchesForAdmin<T extends MatchWithSeasonFields>(matches: T[]): T[] {
  const statusRank = (status: Match['status'] | string | undefined) => {
    if (status === 'live') return 0;
    if (status === 'upcoming') return 1;
    if (status === 'completed') return 2;
    return 3;
  };

  return [...matches].sort((a, b) => {
    const rankDiff = statusRank(a.status) - statusRank(b.status);
    if (rankDiff !== 0) return rankDiff;

    const aTs = getMatchTimestamp(a);
    const bTs = getMatchTimestamp(b);
    if (a.status === 'upcoming' && b.status === 'upcoming') return aTs - bTs;
    return bTs - aTs;
  });
}

export function getPreferredMatch<T extends MatchWithSeasonFields>(matches: T[]): T | null {
  const sorted = sortMatchesForAdmin(matches);
  return sorted[0] || null;
}

export function getPreferredSeasonYear<T extends MatchWithSeasonFields>(matches: T[]): number | null {
  const preferredMatch = getPreferredMatch(matches);
  if (preferredMatch) return getMatchSeasonYear(preferredMatch);

  const years = getAvailableSeasonYears(matches);
  return years[0] ?? null;
}
