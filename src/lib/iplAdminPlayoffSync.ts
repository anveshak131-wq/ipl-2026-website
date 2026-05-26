import { Match, PlayoffType } from '@/types';
import { getMatchSeasonYear } from '@/lib/adminMatchSeason';
import { api } from '@/lib/data';
import { getPlayoffMatchDetails, getTBDTeam } from '@/lib/playoffUtils';

const IPL_PLAYOFF_TYPES: Array<Exclude<PlayoffType, null>> = [
  'qualifier1',
  'eliminator',
  'qualifier2',
  'final',
];

const LOCK_TTL_MS = 15_000;

type IplAdminMatchLike = {
  date: string;
  league?: string;
  playoffType?: PlayoffType;
};

function getLockKey(seasonYear: number) {
  return `ipl_admin_playoff_sync_${seasonYear}`;
}

function acquireSeasonLock(seasonYear: number) {
  if (typeof window === 'undefined') return true;

  try {
    const key = getLockKey(seasonYear);
    const now = Date.now();
    const existing = Number(window.localStorage.getItem(key) || '0');
    if (Number.isFinite(existing) && now - existing < LOCK_TTL_MS) {
      return false;
    }
    window.localStorage.setItem(key, String(now));
    return true;
  } catch {
    return true;
  }
}

export async function ensureIplPlayoffMatchesForSeason(
  seasonYear: number,
  matches: IplAdminMatchLike[]
): Promise<{ created: number; matches: Match[] }> {
  if (!Number.isFinite(seasonYear) || seasonYear <= 0) {
    return { created: 0, matches: matches as Match[] };
  }

  const seasonMatches = matches.filter(
    (match) => (match.league || 'ipl') === 'ipl' && getMatchSeasonYear(match) === seasonYear
  );

  if (!seasonMatches.length) {
    return { created: 0, matches: matches as Match[] };
  }

  const hasRegularSeasonMatch = seasonMatches.some((match) => !match.playoffType);
  if (!hasRegularSeasonMatch) {
    return { created: 0, matches: matches as Match[] };
  }

  if (!acquireSeasonLock(seasonYear)) {
    return { created: 0, matches: matches as Match[] };
  }

  const existingTypes = new Set(
    seasonMatches
      .map((match) => match.playoffType)
      .filter((value): value is Exclude<PlayoffType, null> => Boolean(value))
  );

  const missingTypes = IPL_PLAYOFF_TYPES.filter((playoffType) => !existingTypes.has(playoffType));
  if (!missingTypes.length) {
    return { created: 0, matches: matches as Match[] };
  }

  let created = 0;

  for (const playoffType of missingTypes) {
    const details = getPlayoffMatchDetails(playoffType, 'ipl', seasonYear);
    if (!details) continue;

    try {
      await api.createMatch({
        date: details.date,
        time: details.time,
        venue: details.venue,
        team1Id: getTBDTeam('ipl', details.team1Label).id,
        team2Id: getTBDTeam('ipl', details.team2Label).id,
        status: 'upcoming',
        league: 'ipl',
        playoffType,
      });
      created += 1;
    } catch (error) {
      console.error(`[IPL Playoff Sync] Failed to create ${playoffType} for ${seasonYear}:`, error);
    }
  }

  if (!created) {
    return { created: 0, matches: matches as Match[] };
  }

  const refreshedMatches = await api.getMatches('ipl', { includeAll: true });
  return { created, matches: refreshedMatches };
}
