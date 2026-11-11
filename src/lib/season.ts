import type { League, Match, News, Team } from '@/types';

export const SEASON_YEAR = 2026 as const;
export const NEWS_SEASON_YEAR = 2027 as const;
export const NEWS_2027_CYCLE_START_MS = Date.parse('2026-10-01T00:00:00.000Z');

const ACTIVE_IPL_TEAM_IDS_2026 = new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
const ACTIVE_WPL_TEAM_IDS_2026 = new Set(['11', '12', '13', '14', '15']);

export function normalizeTeamId(value: unknown): string {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  if (raw.startsWith('tbd-')) return raw;
  return raw.replace(/^team/i, '');
}

function isPlaceholderTeamId(value: unknown): boolean {
  return normalizeTeamId(value).startsWith('tbd-');
}

export function getSeasonActiveTeamIds(league: League, year: number = SEASON_YEAR): ReadonlySet<string> {
  void year;
  return league === 'wpl' ? ACTIVE_WPL_TEAM_IDS_2026 : ACTIVE_IPL_TEAM_IDS_2026;
}

export function getYearFromDateLike(value: string | undefined | null): number | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  // Fast-path for "YYYY-MM-DD" and ISO timestamps.
  const yearPrefix = trimmed.slice(0, 4);
  if (/^\d{4}$/.test(yearPrefix)) {
    const parsed = Number(yearPrefix);
    return Number.isFinite(parsed) ? parsed : null;
  }

  const ms = Date.parse(trimmed);
  if (Number.isNaN(ms)) return null;
  return new Date(ms).getUTCFullYear();
}

export function isSeasonYear(value: string | undefined | null, year: number = SEASON_YEAR): boolean {
  return getYearFromDateLike(value) === year;
}

export function isActiveTeamForSeason(team: Pick<Team, 'id' | 'league'>, year: number = SEASON_YEAR): boolean {
  void year;
  const activeIds = getSeasonActiveTeamIds(team.league, year);
  const normalized = normalizeTeamId(team.id);
  if (!normalized || normalized.startsWith('tbd-')) return false;
  return activeIds.has(normalized);
}

export function filterTeamsForSeason(teams: Team[], year: number = SEASON_YEAR): Team[] {
  return teams.filter((team) => isActiveTeamForSeason(team, year));
}

export function isActiveMatchForSeason(
  match: Pick<Match, 'league' | 'date' | 'team1' | 'team2' | 'playoffType'>,
  year: number = SEASON_YEAR
): boolean {
  if (!isSeasonYear(match.date, year)) return false;

  const league = match.league === 'wpl' ? 'wpl' : 'ipl';
  const activeIds = getSeasonActiveTeamIds(league, year);
  const allowsPlaceholders = Boolean(match.playoffType);

  const isEligibleTeamId = (teamId: unknown) => {
    const normalized = normalizeTeamId(teamId);
    if (!normalized) return false;
    if (activeIds.has(normalized)) return true;
    return allowsPlaceholders && isPlaceholderTeamId(normalized);
  };

  return isEligibleTeamId(match.team1?.id) && isEligibleTeamId(match.team2?.id);
}

export function filterMatchesForSeason(matches: Match[], year: number = SEASON_YEAR): Match[] {
  return matches.filter((match) => isActiveMatchForSeason(match, year));
}

export function isNewsForSeason(item: News, year: number = NEWS_SEASON_YEAR): boolean {
  if (year >= 2027) {
    if (typeof item.season === 'number') {
      return item.season >= 2027;
    }
    const stamp = item.publishedAt || item.createdAt;
    if (!stamp) return false;
    const ms = Date.parse(stamp);
    if (Number.isNaN(ms)) return false;
    return ms >= NEWS_2027_CYCLE_START_MS;
  }

  const stamp = item.publishedAt || item.createdAt;
  return isSeasonYear(stamp, year);
}

export function filterNewsForSeason(items: News[], year: number = NEWS_SEASON_YEAR): News[] {
  return items.filter((item) => isNewsForSeason(item, year));
}
