'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Sparkles, Trophy } from 'lucide-react';
import IplChampionHighlight from '@/components/champions/IplChampionHighlight';
import { getIplSeasonTeamIds, buildComputedIplRow } from '@/lib/iplPointsTable';
import { getPlayoffMatchDetails, isPlaceholderTeam } from '@/lib/playoffUtils';
import { League, Match, PlayoffType, Team } from '@/types';

type PlayoffKey = Exclude<PlayoffType, null>;

type RankedTeam = Team & {
  matchesPlayed: number;
  wins: number;
  losses: number;
  noResult: number;
  points: number;
  netRunRate: number;
  qualified: boolean;
};

type TeamWithStats = Team & {
  stats?: Partial<{
    matchesPlayed: number | null;
    wins: number | null;
    losses: number | null;
    noResult: number | null;
    points: number | null;
    netRunRate: number | null;
    qualified: boolean;
  }>;
};

type PlayoffCard = {
  key: PlayoffKey;
  title: string;
  date: string;
  time: string;
  venue: string;
  team1: Team | null;
  team2: Team | null;
  team1Hint: string;
  team2Hint: string;
  stateLabel: string;
  stateTone: string;
};

const PLAYOFF_ORDER: PlayoffKey[] = ['qualifier1', 'eliminator', 'qualifier2', 'final'];

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
  const team1Tokens = [match.team1.name, match.team1.shortName].filter(Boolean).map((value) => value.toLowerCase());
  const team2Tokens = [match.team2.name, match.team2.shortName].filter(Boolean).map((value) => value.toLowerCase());

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
  if (matchTeam && !isPlaceholderTeam(matchTeam)) return matchTeam;
  return derivedTeam;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'Date TBA';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTimeIST(timeStr: string): string {
  if (!timeStr) return 'Time TBA';
  const [hh, mm] = timeStr.split(':').map(Number);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return timeStr;
  const ampm = hh >= 12 ? 'PM' : 'AM';
  const h12 = hh % 12 || 12;
  return `${h12}:${String(mm).padStart(2, '0')} ${ampm} IST`;
}

function getTeamName(team: Team | null): string {
  if (!team) return 'TBD';
  return team.shortName || team.name || 'TBD';
}

interface PublicPlayoffOverviewProps {
  league: League;
  season: number;
  matches: Match[];
  teams: Team[];
}

export default function PublicPlayoffOverview({
  league,
  season,
  matches,
  teams,
}: PublicPlayoffOverviewProps) {
  const standings = useMemo<RankedTeam[]>(() => {
    if (league !== 'ipl') return [];

    const seasonTeamIds = new Set(getIplSeasonTeamIds(season));
    const activeTeams = teams.filter((team) => seasonTeamIds.has(team.id) && !isPlaceholderTeam(team));

    return activeTeams
      .map((team) => {
        const typedTeam = team as TeamWithStats;
        const computed = buildComputedIplRow(team, matches, season);
        const persisted = typedTeam.stats || {};
        const row = { ...computed, ...persisted };

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
  }, [league, matches, season, teams]);

  const qualifiedStandings = useMemo(
    () => standings.filter((team) => team.qualified).sort(sortStandings),
    [standings]
  );

  const hasExplicitQualifiedTeams = qualifiedStandings.length > 0;
  const seededStandings = hasExplicitQualifiedTeams ? qualifiedStandings : standings;

  const playoffCards = useMemo<PlayoffCard[]>(() => {
    const playoffMatches = new Map<PlayoffKey, Match>();
    for (const match of matches) {
      if (!match.playoffType) continue;
      const playoffType = match.playoffType as PlayoffKey;
      if (!playoffMatches.has(playoffType)) playoffMatches.set(playoffType, match);
    }

    const qualifier1Match = playoffMatches.get('qualifier1') || null;
    const eliminatorMatch = playoffMatches.get('eliminator') || null;
    const qualifier2Match = playoffMatches.get('qualifier2') || null;

    const qualifier1Winner = getWinningTeam(qualifier1Match);
    const qualifier1Loser = getLosingTeam(qualifier1Match);
    const eliminatorWinner = getWinningTeam(eliminatorMatch);
    const qualifier2Winner = getWinningTeam(qualifier2Match);

    return PLAYOFF_ORDER.map((playoffType) => {
      const preset = getPlayoffMatchDetails(playoffType, 'ipl', season);
      const match = playoffMatches.get(playoffType) || null;

      let team1: Team | null = null;
      let team2: Team | null = null;
      let team1Hint = 'TBD';
      let team2Hint = 'TBD';
      let stateLabel = 'Awaiting confirmation';
      let stateTone = 'text-amber-200 bg-amber-500/12 border-amber-500/30';

      if (playoffType === 'qualifier1') {
        team1 = resolveDisplayTeam(match?.team1, seededStandings[0] || null);
        team2 = resolveDisplayTeam(match?.team2, seededStandings[1] || null);
        team1Hint = '1st place';
        team2Hint = '2nd place';
        if (team1 && team2) {
          stateLabel = 'Confirmed matchup';
          stateTone = 'text-emerald-200 bg-emerald-500/12 border-emerald-500/30';
        }
      } else if (playoffType === 'eliminator') {
        team1 = resolveDisplayTeam(match?.team1, seededStandings[2] || null);
        team2 = resolveDisplayTeam(match?.team2, seededStandings[3] || null);
        team1Hint = '3rd place';
        team2Hint = team2 ? '4th place' : '4th place not confirmed';
        if (team1 && team2) {
          stateLabel = 'Confirmed matchup';
          stateTone = 'text-emerald-200 bg-emerald-500/12 border-emerald-500/30';
        } else if (team1) {
          stateLabel = 'Awaiting 4th team';
        }
      } else if (playoffType === 'qualifier2') {
        team1 = resolveDisplayTeam(match?.team1, qualifier1Loser);
        team2 = resolveDisplayTeam(match?.team2, eliminatorWinner);
        team1Hint = 'Loser of Qualifier 1';
        team2Hint = 'Winner of Eliminator';
        if (team1 && team2) {
          stateLabel = 'Ready after earlier results';
          stateTone = 'text-sky-200 bg-sky-500/12 border-sky-500/30';
        } else {
          stateLabel = 'Awaiting playoff results';
        }
      } else if (playoffType === 'final') {
        team1 = resolveDisplayTeam(match?.team1, qualifier1Winner);
        team2 = resolveDisplayTeam(match?.team2, qualifier2Winner);
        team1Hint = 'Winner of Qualifier 1';
        team2Hint = 'Winner of Qualifier 2';
        if (team1 && team2) {
          stateLabel = 'Finalists confirmed';
          stateTone = 'text-fuchsia-200 bg-fuchsia-500/12 border-fuchsia-500/30';
        } else {
          stateLabel = 'Awaiting finalists';
        }
      }

      return {
        key: playoffType,
        title: preset?.title || 'Playoff',
        date: match?.date || preset?.date || '',
        time: match?.time || preset?.time || '',
        venue: match?.venue || preset?.venue || '',
        team1,
        team2,
        team1Hint,
        team2Hint,
        stateLabel,
        stateTone,
      };
    });
  }, [matches, seededStandings, season]);

  if (league !== 'ipl') return null;

  return (
    <section className="mb-10 rounded-[28px] border border-white/12 bg-black/25 backdrop-blur-xl overflow-hidden shadow-[0_18px_50px_rgba(0,0,0,0.32)]">
      <div
        className="h-1.5 w-full"
        style={{ background: 'linear-gradient(90deg, rgba(251,191,36,0.95), rgba(249,115,22,0.82), rgba(244,63,94,0.82))' }}
      />

      <div className="p-5 md:p-7">
        <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-200 text-xs font-bold tracking-[0.22em] uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              Playoffs
            </div>

            <h2 className="mt-4 text-2xl md:text-3xl font-black text-white tracking-tight">
              IPL 2026 Playoff Picture
            </h2>
            <p className="mt-2 text-slate-300 max-w-3xl leading-relaxed">
              Built around the official IPL playoff schedule format: stage cards first, then confirmed teams where known,
              with unresolved slots kept as TBD.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {hasExplicitQualifiedTeams && (
              <div className="inline-flex items-center px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/12 text-emerald-200 text-xs font-semibold">
                {qualifiedStandings.length}/4 teams confirmed
              </div>
            )}
            <div className="inline-flex items-center px-3 py-1.5 rounded-full border border-white/12 bg-white/5 text-slate-200 text-xs font-semibold">
              Official venues and dates included
            </div>
          </div>
        </div>

        <IplChampionHighlight
          variant="compact"
          showLinks={false}
          className="mb-6"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {playoffCards.map((card, index) => (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.38, delay: index * 0.05 }}
              className="rounded-3xl border border-white/12 p-4 md:p-5"
              style={{ background: 'linear-gradient(155deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.025) 100%)' }}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-amber-200/80 font-bold">
                    Knockout
                  </div>
                  <h3 className="text-lg font-black text-white mt-1">{card.title}</h3>
                </div>
                <span className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold ${card.stateTone}`}>
                  {card.stateLabel}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                  <div className="text-white font-black text-lg">{getTeamName(card.team1)}</div>
                  <div className="text-xs text-slate-400 mt-1">{card.team1Hint}</div>
                </div>

                <div className="flex items-center justify-center text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">
                  vs
                </div>

                <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                  <div className="text-white font-black text-lg">{getTeamName(card.team2)}</div>
                  <div className="text-xs text-slate-400 mt-1">{card.team2Hint}</div>
                </div>
              </div>

              <div className="space-y-2.5 text-sm">
                <div className="flex items-start gap-2 text-slate-200">
                  <Calendar className="w-4 h-4 mt-0.5 text-amber-300" />
                  <span>{formatDate(card.date)}</span>
                </div>
                <div className="flex items-start gap-2 text-slate-200">
                  <Clock className="w-4 h-4 mt-0.5 text-amber-300" />
                  <span>{formatTimeIST(card.time)}</span>
                </div>
                <div className="flex items-start gap-2 text-slate-200">
                  <MapPin className="w-4 h-4 mt-0.5 text-amber-300" />
                  <span>{card.venue || 'Venue TBA'}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <Trophy className="w-4 h-4 mt-0.5 text-amber-300 flex-shrink-0" />
          <p className="text-sm text-slate-300 leading-relaxed">
            Current public state: Qualifier 1 is locked as the top-two clash, the Eliminator shows the confirmed 3rd-place
            team plus a TBD slot until 4th place is sealed, and later rounds remain TBD until earlier results are known.
          </p>
        </div>
      </div>
    </section>
  );
}
