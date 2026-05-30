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
  id?: string;
  date: string;
  time?: string;
  venue?: string;
  league?: string;
  playoffType?: PlayoffType;
  team1Id?: string;
  team2Id?: string;
  team1?: { id?: string; name?: string; shortName?: string } | null;
  team2?: { id?: string; name?: string; shortName?: string } | null;
};

function normalizeDateSlotValue(value: string | undefined) {
  return String(value || '').trim().slice(0, 10);
}

function normalizeTimeSlotValue(value: string | undefined) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '');
}

function normalizeVenueSlotValue(value: string | undefined) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function isPlaceholderTeamValue(team: IplAdminMatchLike['team1'], teamId?: string) {
  const id = String(teamId || team?.id || '').toLowerCase();
  const name = String(team?.name || '').toLowerCase();
  const shortName = String(team?.shortName || '').toLowerCase();

  return (
    id.includes('tbd-') ||
    name.includes('tbd') ||
    name.includes('place team') ||
    name.includes('1st place') ||
    name.includes('2nd place') ||
    name.includes('3rd place') ||
    name.includes('4th place') ||
    shortName.includes('tbd')
  );
}

function matchHasPlaceholderTeams(match: IplAdminMatchLike) {
  return (
    isPlaceholderTeamValue(match.team1, match.team1Id) ||
    isPlaceholderTeamValue(match.team2, match.team2Id)
  );
}

function isSamePlayoffSlot(match: IplAdminMatchLike, details: { date: string; time: string; venue: string }) {
  const sameDate = normalizeDateSlotValue(match.date) === normalizeDateSlotValue(details.date);
  if (!sameDate) return false;

  const sameTime =
    normalizeTimeSlotValue(match.time) === normalizeTimeSlotValue(details.time);
  const matchVenue = normalizeVenueSlotValue(match.venue);
  const detailsVenue = normalizeVenueSlotValue(details.venue);
  const sameVenue =
    Boolean(matchVenue && detailsVenue) &&
    (matchVenue === detailsVenue || matchVenue.includes(detailsVenue) || detailsVenue.includes(matchVenue));

  return sameTime || sameVenue;
}

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

  let created = 0;

  for (const playoffType of IPL_PLAYOFF_TYPES) {
    const details = getPlayoffMatchDetails(playoffType, 'ipl', seasonYear);
    if (!details) continue;

    const slotMatches = seasonMatches.filter((match) => isSamePlayoffSlot(match, details));
    const exactMatch = slotMatches.find((match) => match.playoffType === playoffType) || null;
    const realSlotMatch =
      slotMatches.find((match) => !match.playoffType && !matchHasPlaceholderTeams(match)) || null;
    const placeholderSlotMatch =
      slotMatches.find((match) => !match.playoffType && matchHasPlaceholderTeams(match)) || null;

    const upgradeTarget =
      !exactMatch
        ? realSlotMatch || placeholderSlotMatch
        : matchHasPlaceholderTeams(exactMatch) && realSlotMatch
          ? realSlotMatch
          : null;

    if (exactMatch && !upgradeTarget) {
      continue;
    }

    if (upgradeTarget?.id) {
      try {
        await api.updateMatch(String(upgradeTarget.id), {
          playoffType,
          league: 'ipl',
        });
        created += 1;
        continue;
      } catch (error) {
        console.error(`[IPL Playoff Sync] Failed to tag existing ${playoffType} match for ${seasonYear}:`, error);
      }
    }

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
