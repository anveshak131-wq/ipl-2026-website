import type { Match } from '@/types';

export const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export function getISTDateString(timestampMs: number = Date.now()): string {
  const ist = new Date(timestampMs + IST_OFFSET_MS);
  const year = ist.getUTCFullYear();
  const month = String(ist.getUTCMonth() + 1).padStart(2, '0');
  const day = String(ist.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatISTTodayLabel(timestampMs: number = Date.now()): string {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(timestampMs));
}

export function parseTimeTo24Hour(timeString: string): { hours: number; minutes: number } | null {
  const clean = String(timeString || '').trim();
  if (!clean) return null;

  const hhmmMatch = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (hhmmMatch) {
    const hours = Number.parseInt(hhmmMatch[1], 10);
    const minutes = Number.parseInt(hhmmMatch[2], 10);
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return { hours, minutes };
    }
  }

  const ampmMatch = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hours = Number.parseInt(ampmMatch[1], 10);
    const minutes = Number.parseInt(ampmMatch[2], 10);
    const meridiem = ampmMatch[3].toUpperCase();

    if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null;
    if (meridiem === 'PM' && hours !== 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;

    return { hours, minutes };
  }

  return null;
}

export function getMatchStartDate(match: Match): Date | null {
  const parsedTime = parseTimeTo24Hour(match.time);
  if (!parsedTime) {
    const fallback = new Date(match.date);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }

  const hh = String(parsedTime.hours).padStart(2, '0');
  const mm = String(parsedTime.minutes).padStart(2, '0');
  const dt = new Date(`${match.date}T${hh}:${mm}:00+05:30`);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

/**
 * Prevents stale multi-month historical records left at status === 'live'
 * from hijacking the public Live Score center.
 */
export function isActivelyLiveMatch(match: Match, nowMs: number = Date.now()): boolean {
  if (match.status !== 'live') return false;
  const todayIST = getISTDateString(nowMs);
  if (match.date === todayIST) return true;

  const yesterdayIST = getISTDateString(nowMs - 24 * 60 * 60 * 1000);
  if (match.date === yesterdayIST) {
    const startMs = getMatchStartDate(match)?.getTime() ?? 0;
    return startMs > 0 && nowMs - startMs <= 20 * 60 * 60 * 1000;
  }

  return false;
}

export function isMatchDay(match: Match, nowMs: number = Date.now()): boolean {
  const todayIST = getISTDateString(nowMs);
  return match.date === todayIST || isActivelyLiveMatch(match, nowMs);
}

/**
 * Returns only matches happening today (IST) or actively live right now.
 * Sorted with active live matches first, then chronological start time.
 */
export function getMatchDayCenterMatches(matches: Match[], nowMs: number = Date.now()): Match[] {
  const eligible = matches.filter((m) => isMatchDay(m, nowMs));
  return eligible.sort((a, b) => {
    const aLive = isActivelyLiveMatch(a, nowMs) ? 0 : 1;
    const bLive = isActivelyLiveMatch(b, nowMs) ? 0 : 1;
    if (aLive !== bLive) return aLive - bLive;
    const ta = getMatchStartDate(a)?.getTime() ?? 0;
    const tb = getMatchStartDate(b)?.getTime() ?? 0;
    return ta - tb;
  });
}

export function getNextScheduledMatch(matches: Match[], nowMs: number = Date.now()): Match | null {
  const todayIST = getISTDateString(nowMs);
  const future = matches
    .filter((m) => m.status === 'upcoming' && (m.date > todayIST || (getMatchStartDate(m)?.getTime() ?? 0) > nowMs))
    .sort((a, b) => {
      const ta = getMatchStartDate(a)?.getTime() ?? 0;
      const tb = getMatchStartDate(b)?.getTime() ?? 0;
      return ta - tb;
    });
  return future[0] || null;
}

export function getCountdownSegments(
  targetIsoOrMs: string | number,
  nowMs: number | null
): { days: string; hours: string; minutes: string; seconds: string; finished: boolean } {
  if (!nowMs) {
    return { days: '--', hours: '--', minutes: '--', seconds: '--', finished: false };
  }
  const targetMs = typeof targetIsoOrMs === 'number' ? targetIsoOrMs : Date.parse(targetIsoOrMs);
  const diff = targetMs - nowMs;
  if (Number.isNaN(targetMs) || diff <= 0) {
    return { days: '00', hours: '00', minutes: '00', seconds: '00', finished: true };
  }
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return {
    days: String(days).padStart(2, '0'),
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
    finished: false,
  };
}
