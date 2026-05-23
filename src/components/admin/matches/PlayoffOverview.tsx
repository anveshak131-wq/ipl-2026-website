'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Calendar, Clock, MapPin, Trophy } from 'lucide-react';
import { buildComputedIplRow, getIplSeasonTeamIds, readIplSavedRows } from '@/lib/iplPointsTable';
import { getPlayoffMatchDetails, isPlaceholderTeam } from '@/lib/playoffUtils';
import { League, Match, PlayoffType, Team } from '@/types';

type PlayoffKey = Exclude<PlayoffType, null>;

interface PlayoffOverviewProps {
  league: League;
  selectedSeason: number;
  seasonMatches: Match[];
  teams: Team[];
}

type RankedTeam = Team & {
  matchesPlayed: number;
  wins: number;
  losses: number;
  noResult: number;
  points: number;
  netRunRate: number;
  qualified: boolean;
};

type PlayoffCardData = {
  key: PlayoffKey;
  title: string;
  date: string;
  time: string;
  venue: string;
  team1: Team | null;
  team2: Team | null;
  team1Label: string;
  team2Label: string;
  hasMatch: boolean;
  status: Match['status'] | 'not-created';
};

const PLAYOFF_SEQUENCE: PlayoffKey[] = ['qualifier1', 'eliminator', 'qualifier2', 'final'];

function sortStandings(a: RankedTeam, b: RankedTeam) {
  if (b.points !== a.points) return b.points - a.points;
  if (b.wins !== a.wins) return b.wins - a.wins;
  if (b.netRunRate !== a.netRunRate) return b.netRunRate - a.netRunRate;
  return a.name.localeCompare(b.name);
}

function getWinningTeam(match: Match | null): Team | null {
  if (!match || match.status !== 'completed') return null;
  if (match.resultType === 'no-result' || match.resultType === 'abandoned') return null;

  const team1Runs = match.score?.team1?.runs;
  const team2Runs = match.score?.team2?.runs;
  if (typeof team1Runs === 'number' && typeof team2Runs === 'number' && team1Runs !== team2Runs) {
    return team1Runs > team2Runs ? match.team1 : match.team2;
  }

  const result = `${match.result || ''}`.toLowerCase();
  const team1Tokens = [match.team1.name, match.team1.shortName]
    .filter(Boolean)
    .map((value) => value.toLowerCase());
  const team2Tokens = [match.team2.name, match.team2.shortName]
    .filter(Boolean)
    .map((value) => value.toLowerCase());

  const team1Mentioned = team1Tokens.some((token) => result.includes(token));
  const team2Mentioned = team2Tokens.some((token) => result.includes(token));

  if (team1Mentioned && !team2Mentioned) return match.team1;
  if (team2Mentioned && !team1Mentioned) return match.team2;

  return null;
}

function getLosingTeam(match: Match | null): Team | null {
  if (!match) return null;
  const winner = getWinningTeam(match);
  if (!winner) return null;
  return winner.id === match.team1.id ? match.team2 : match.team1;
}

function resolveDisplayTeam(matchTeam: Team | undefined, derivedTeam: Team | null): Team | null {
  if (matchTeam && !isPlaceholderTeam(matchTeam)) {
    return matchTeam;
  }
  return derivedTeam;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'Date not set';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatTimeIST(timeStr: string): string {
  if (!timeStr) return 'Time not set';
  const [hh, mm] = timeStr.split(':').map(Number);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return timeStr;
  const ampm = hh >= 12 ? 'PM' : 'AM';
  const h12 = hh % 12 || 12;
  return `${h12}:${String(mm).padStart(2, '0')} ${ampm} IST`;
}

function getStatusBadge(status: Match['status'] | 'not-created') {
  switch (status) {
    case 'live':
      return {
        label: 'Live',
        className: 'border-red-500/35 bg-red-500/15 text-red-300',
      };
    case 'completed':
      return {
        label: 'Completed',
        className: 'border-emerald-500/35 bg-emerald-500/15 text-emerald-300',
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        className: 'border-slate-500/35 bg-slate-500/15 text-slate-300',
      };
    case 'upcoming':
      return {
        label: 'Scheduled',
        className: 'border-blue-500/35 bg-blue-500/15 text-blue-300',
      };
    default:
      return {
        label: 'Not created',
        className: 'border-amber-500/35 bg-amber-500/15 text-amber-300',
      };
  }
}

function renderTeamName(team: Team | null, fallbackLabel: string): string {
  if (!team) return fallbackLabel;
  return team.name || team.shortName || fallbackLabel;
}

function renderTeamCode(team: Team | null): string | null {
  if (!team) return null;
  return team.shortName && team.shortName !== team.name ? team.shortName : null;
}

export default function PlayoffOverview({
  league,
  selectedSeason,
  seasonMatches,
  teams,
}: PlayoffOverviewProps) {
  const standings = useMemo<RankedTeam[]>(() => {
    if (league !== 'ipl') return [];

    const seasonTeamIds = new Set(getIplSeasonTeamIds(selectedSeason));
    const savedStats = readIplSavedRows(selectedSeason);
    const activeTeams = teams.filter((team) => seasonTeamIds.has(team.id) && !isPlaceholderTeam(team));

    return activeTeams
      .map((team) => {
        const teamWithStats = team as Team & {
          stats?: Partial<{
            matchesPlayed: number | null;
            wins: number | null;
            losses: number | null;
            noResult: number | null;
            points: number | null;
            netRunRate: number | null;
          }>;
        };
        const computedRow = buildComputedIplRow(team, seasonMatches, selectedSeason);
        const persistedRow = teamWithStats.stats || {};
        const savedRow = savedStats[team.id] || {};
        const row = { ...computedRow, ...persistedRow, ...savedRow };

        return {
          ...team,
          matchesPlayed: row.matchesPlayed ?? 0,
          wins: row.wins ?? 0,
          losses: row.losses ?? 0,
          noResult: row.noResult ?? 0,
          points: row.points ?? 0,
          netRunRate: row.netRunRate ?? 0,
          qualified: row.qualified ?? false,
        };
      })
      .sort(sortStandings);
  }, [league, selectedSeason, seasonMatches, teams]);

  const qualifiedStandings = useMemo(
    () => standings.filter((team) => team.qualified).sort(sortStandings),
    [standings]
  );

  const hasExplicitQualifiedTeams = qualifiedStandings.length > 0;
  const seededStandings = hasExplicitQualifiedTeams ? qualifiedStandings : standings;

  const playoffCards = useMemo<PlayoffCardData[]>(() => {
    const playoffMatches = new Map<PlayoffKey, Match>();

    for (const match of seasonMatches) {
      if (!match.playoffType) continue;
      const playoffType = match.playoffType as PlayoffKey;
      if (!playoffMatches.has(playoffType)) {
        playoffMatches.set(playoffType, match);
      }
    }

    const qualifier1Match = playoffMatches.get('qualifier1') || null;
    const eliminatorMatch = playoffMatches.get('eliminator') || null;
    const qualifier2Match = playoffMatches.get('qualifier2') || null;

    const topOne = seededStandings[0] || null;
    const topTwo = seededStandings[1] || null;
    const topThree = seededStandings[2] || null;
    const topFour = seededStandings[3] || null;

    const qualifier1Winner = getWinningTeam(qualifier1Match);
    const qualifier1Loser = getLosingTeam(qualifier1Match);
    const eliminatorWinner = getWinningTeam(eliminatorMatch);
    const qualifier2Winner = getWinningTeam(qualifier2Match);

    return PLAYOFF_SEQUENCE.map((playoffType) => {
      const details = getPlayoffMatchDetails(playoffType, league, selectedSeason);
      const match = playoffMatches.get(playoffType) || null;

      let derivedTeam1: Team | null = null;
      let derivedTeam2: Team | null = null;

      if (playoffType === 'qualifier1') {
        derivedTeam1 = topOne;
        derivedTeam2 = topTwo;
      } else if (playoffType === 'eliminator') {
        derivedTeam1 = topThree;
        derivedTeam2 = topFour;
      } else if (playoffType === 'qualifier2') {
        derivedTeam1 = qualifier1Loser;
        derivedTeam2 = eliminatorWinner;
      } else if (playoffType === 'final') {
        derivedTeam1 = qualifier1Winner;
        derivedTeam2 = qualifier2Winner;
      }

      return {
        key: playoffType,
        title: details?.title || 'Playoff Match',
        date: match?.date || details?.date || '',
        time: match?.time || details?.time || '',
        venue: match?.venue || details?.venue || '',
        team1: resolveDisplayTeam(match?.team1, derivedTeam1),
        team2: resolveDisplayTeam(match?.team2, derivedTeam2),
        team1Label: details?.team1Label || 'TBD',
        team2Label: details?.team2Label || 'TBD',
        hasMatch: Boolean(match),
        status: match?.status || 'not-created',
      };
    });
  }, [league, seasonMatches, seededStandings, selectedSeason]);

  if (league !== 'ipl') {
    return null;
  }

  const standingsReady = seededStandings.length >= 4;

  return (
    <section
      className="mb-6 rounded-3xl border border-yellow-500/15 overflow-hidden"
      style={{ background: 'linear-gradient(145deg, rgba(33,24,12,0.92) 0%, rgba(14,16,26,0.96) 100%)' }}
    >
      <div className="h-1 w-full bg-gradient-to-r from-yellow-500 via-orange-400 to-amber-300" />

      <div className="p-6 lg:p-7">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl border border-yellow-500/25 bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
              <Trophy className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">IPL Playoff Tracker</h2>
              <p className="text-sm text-gray-400 mt-1">
                Admin can directly check who is in each playoff match, plus date, time, and venue.
              </p>
            </div>
          </div>

          <div className="text-right">
            {hasExplicitQualifiedTeams && (
              <div className="inline-flex items-center px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/12 text-emerald-300 text-xs font-semibold mb-2">
                {qualifiedStandings.length}/4 qualified
              </div>
            )}
            <div className="text-xs text-gray-400 max-w-md">
              Qualifier 1 and Eliminator use admin-qualified teams when available, otherwise current IPL standings.
              Qualifier 2 and Final auto-resolve once the earlier playoff results are completed.
            </div>
          </div>
        </div>

        {!standingsReady && (
          <div className="mb-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-300" />
            <span>
              {hasExplicitQualifiedTeams
                ? `Only ${qualifiedStandings.length} team${qualifiedStandings.length === 1 ? '' : 's'} qualified so far. Remaining playoff slots stay unresolved until admin marks more teams as qualified in the points table.`
                : 'Top four standings are not fully available yet. Placeholder labels will be shown where needed.'}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {playoffCards.map((card, index) => {
            const badge = getStatusBadge(card.status);
            return (
              <motion.div
                key={card.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
                className="rounded-2xl border border-white/10 p-4 lg:p-5"
                style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.02) 100%)' }}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.22em] text-yellow-300/85 font-semibold">
                      Playoff Match
                    </div>
                    <h3 className="text-lg font-bold text-white mt-1">{card.title}</h3>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badge.className}`}>
                    {badge.label}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-stretch mb-4">
                  <div className="rounded-xl border border-white/8 bg-black/20 px-4 py-3">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-gray-500 mb-1">{card.team1Label}</div>
                    <div className="text-sm font-semibold text-white">{renderTeamName(card.team1, card.team1Label)}</div>
                    {renderTeamCode(card.team1) && (
                      <div className="text-xs text-gray-400 mt-1">{renderTeamCode(card.team1)}</div>
                    )}
                  </div>

                  <div className="hidden md:flex items-center justify-center text-gray-500 text-xs font-semibold px-2">
                    VS
                  </div>

                  <div className="rounded-xl border border-white/8 bg-black/20 px-4 py-3">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-gray-500 mb-1">{card.team2Label}</div>
                    <div className="text-sm font-semibold text-white">{renderTeamName(card.team2, card.team2Label)}</div>
                    {renderTeamCode(card.team2) && (
                      <div className="text-xs text-gray-400 mt-1">{renderTeamCode(card.team2)}</div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="rounded-xl border border-white/8 bg-white/5 px-3 py-2.5">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs uppercase tracking-wider">Date</span>
                    </div>
                    <div className="text-white font-medium">{formatDate(card.date)}</div>
                  </div>

                  <div className="rounded-xl border border-white/8 bg-white/5 px-3 py-2.5">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs uppercase tracking-wider">Time</span>
                    </div>
                    <div className="text-white font-medium">{formatTimeIST(card.time)}</div>
                  </div>

                  <div className="rounded-xl border border-white/8 bg-white/5 px-3 py-2.5">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <MapPin className="w-4 h-4" />
                      <span className="text-xs uppercase tracking-wider">Venue</span>
                    </div>
                    <div className="text-white font-medium">{card.venue || 'Venue not set'}</div>
                  </div>
                </div>

                {!card.hasMatch && (
                  <div className="mt-4 text-xs text-amber-200/85">
                    No playoff fixture record exists yet for this slot. Admin still needs to create the actual playoff
                    match from the Matches page; the schedule shown here is the current preset.
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
