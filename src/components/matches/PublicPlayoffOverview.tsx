'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Sparkles, Trophy, Shield } from 'lucide-react';
import IplChampionHighlight from '@/components/champions/IplChampionHighlight';
import { getIplSeasonTeamIds, buildComputedIplRow } from '@/lib/iplPointsTable';
import { getPlayoffMatchDetails, isPlaceholderTeam } from '@/lib/playoffUtils';
import { League, Match, PlayoffType, Team } from '@/types';
import MatchTeamCrest from './MatchTeamCrest';

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
  stageBadge: string;
  date: string;
  time: string;
  venue: string;
  team1: Team | null;
  team2: Team | null;
  team1Hint: string;
  team2Hint: string;
  stateLabel: string;
  stateTone: string;
  isFinal: boolean;
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
      let stateTone = 'text-amber-200 bg-amber-500/15 border-amber-500/35';
      const isFinal = playoffType === 'final';

      if (playoffType === 'qualifier1') {
        team1 = resolveDisplayTeam(match?.team1, seededStandings[0] || null);
        team2 = resolveDisplayTeam(match?.team2, seededStandings[1] || null);
        team1Hint = '1st in Standings';
        team2Hint = '2nd in Standings';
        if (team1 && team2) {
          stateLabel = 'Confirmed Clash';
          stateTone = 'text-emerald-200 bg-emerald-500/15 border-emerald-500/35';
        }
      } else if (playoffType === 'eliminator') {
        team1 = resolveDisplayTeam(match?.team1, seededStandings[2] || null);
        team2 = resolveDisplayTeam(match?.team2, seededStandings[3] || null);
        team1Hint = '3rd in Standings';
        team2Hint = team2 ? '4th in Standings' : '4th slot unconfirmed';
        if (team1 && team2) {
          stateLabel = 'Confirmed Clash';
          stateTone = 'text-emerald-200 bg-emerald-500/15 border-emerald-500/35';
        } else if (team1) {
          stateLabel = 'Awaiting 4th team';
        }
      } else if (playoffType === 'qualifier2') {
        team1 = resolveDisplayTeam(match?.team1, qualifier1Loser);
        team2 = resolveDisplayTeam(match?.team2, eliminatorWinner);
        team1Hint = 'Loser of Qualifier 1';
        team2Hint = 'Winner of Eliminator';
        if (team1 && team2) {
          stateLabel = 'Matchup Confirmed';
          stateTone = 'text-sky-200 bg-sky-500/15 border-sky-500/35';
        } else {
          stateLabel = 'Awaiting prior rounds';
        }
      } else if (playoffType === 'final') {
        team1 = resolveDisplayTeam(match?.team1, qualifier1Winner);
        team2 = resolveDisplayTeam(match?.team2, qualifier2Winner);
        team1Hint = 'Winner of Qualifier 1';
        team2Hint = 'Winner of Qualifier 2';
        if (team1 && team2) {
          stateLabel = 'Championship Finalists';
          stateTone = 'text-amber-200 bg-amber-500/20 border-amber-500/40 shadow-sm';
        } else {
          stateLabel = 'Grand Final';
        }
      }

      return {
        key: playoffType,
        title: preset?.title || 'Playoff',
        stageBadge: playoffType === 'final' ? 'Championship' : 'Knockout Stage',
        date: match?.date || preset?.date || '',
        time: match?.time || preset?.time || '',
        venue: match?.venue || preset?.venue || '',
        team1,
        team2,
        team1Hint,
        team2Hint,
        stateLabel,
        stateTone,
        isFinal,
      };
    });
  }, [matches, seededStandings, season]);

  if (league !== 'ipl') return null;

  return (
    <section className="mb-10 rounded-[32px] border border-white/12 bg-black/40 backdrop-blur-2xl overflow-hidden shadow-[0_24px_70px_rgba(2,6,23,0.55)]">
      {/* Top Gold Gradient Accent */}
      <div
        className="h-1.5 w-full"
        style={{
          background: 'linear-gradient(90deg, #f59e0b, #ef4444, #8b5cf6, #3b82f6)',
        }}
      />

      <div className="p-6 md:p-8 space-y-6">
        {/* Playoff Section Header */}
        <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-400/35 bg-amber-400/10 text-amber-300 text-xs font-black tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Championship Playoffs</span>
            </div>

            <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">
              IPL {season} Playoff Picture & Finals
            </h2>
            <p className="text-slate-300 text-sm md:text-base max-w-3xl leading-relaxed">
              Official 4-match playoff bracket: Qualifier 1 and Eliminator feed into Qualifier 2, culminating in the Grand Championship Final.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {hasExplicitQualifiedTeams && (
              <div className="inline-flex items-center px-3.5 py-1.5 rounded-full border border-emerald-500/35 bg-emerald-500/15 text-emerald-200 text-xs font-bold">
                {qualifiedStandings.length}/4 teams locked
              </div>
            )}
            <div className="inline-flex items-center px-3.5 py-1.5 rounded-full border border-white/15 bg-white/5 text-slate-200 text-xs font-semibold">
              Official BCCI Knockout Venues
            </div>
          </div>
        </div>

        {/* Reigning Champion Highlight Banner */}
        <IplChampionHighlight variant="compact" showLinks={false} />

        {/* 4 Playoff Bracket Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {playoffCards.map((card, index) => (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className={`rounded-3xl border p-5 flex flex-col justify-between transition-all duration-300 ${
                card.isFinal
                  ? 'border-amber-500/40 bg-gradient-to-b from-amber-500/[0.08] via-black/40 to-black/60 shadow-[0_12px_36px_rgba(245,158,11,0.12)]'
                  : 'border-white/12 bg-gradient-to-b from-white/[0.05] to-black/40 shadow-lg'
              }`}
            >
              <div>
                {/* Stage & Status Tag */}
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-amber-300/80 font-black">
                      {card.stageBadge}
                    </span>
                    <h3 className="text-base font-black text-white mt-0.5">{card.title}</h3>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${card.stateTone}`}>
                    {card.stateLabel}
                  </span>
                </div>

                {/* Team 1 vs Team 2 Clash Pods */}
                <div className="space-y-2.5 mb-5">
                  {/* Team 1 */}
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/40 border border-white/10 hover:border-white/20 transition-colors">
                    <MatchTeamCrest team={card.team1} size={42} glow={false} />
                    <div className="min-w-0">
                      <div className="text-white font-black text-sm sm:text-base leading-tight truncate">
                        {getTeamName(card.team1)}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                        {card.team1Hint}
                      </div>
                    </div>
                  </div>

                  {/* VS Divider */}
                  <div className="flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-slate-500 py-0.5">
                    VS
                  </div>

                  {/* Team 2 */}
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/40 border border-white/10 hover:border-white/20 transition-colors">
                    <MatchTeamCrest team={card.team2} size={42} glow={false} />
                    <div className="min-w-0">
                      <div className="text-white font-black text-sm sm:text-base leading-tight truncate">
                        {getTeamName(card.team2)}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                        {card.team2Hint}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Match Venue & Time Metadata */}
              <div className="space-y-2 pt-3 border-t border-white/10 text-xs">
                <div className="flex items-center gap-2 text-slate-200">
                  <Calendar className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span className="font-semibold">{formatDate(card.date)}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>{formatTimeIST(card.time)}</span>
                </div>
                <div className="flex items-start gap-2 text-slate-300">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 text-amber-300 shrink-0" />
                  <span className="line-clamp-1">{card.venue || 'Venue TBA'}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs text-slate-300 leading-relaxed">
          <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Playoff Format: Winner of Qualifier 1 advances directly to the Grand Final. Loser of Qualifier 1 battles Winner of Eliminator in Qualifier 2 for the remaining Final berth.
          </span>
        </div>
      </div>
    </section>
  );
}
