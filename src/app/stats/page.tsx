'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { api } from '@/lib/data';
import { useLeague } from '@/contexts/LeagueContext';
import type { Player, Team } from '@/types';
import { getQualificationCriteria, qualifiesForStat, getQualificationDescription } from '@/lib/statsQualifications';
import StatsHeroSection from '@/components/stats/StatsHeroSection';
import StatsTabs from '@/components/stats/StatsTabs';
import LeaderboardSection from '@/components/stats/LeaderboardSection';
import QuickStatsGrid from '@/components/stats/QuickStatsGrid';
import TeamStatsSection from '@/components/stats/TeamStatsSection';
import { Trophy, Award, TrendingUp, Target, Sparkles, Filter } from 'lucide-react';
import IplStatusPill from '@/components/points-table/IplStatusPill';
import {
  formatNetRunRate,
  getIplAvailableYears,
  getIplSeasonTeamIds,
  readIplSavedRows,
  type IplSavedRow,
} from '@/lib/iplPointsTable';

interface TeamAggregate {
  team: Team | null;
  totalRuns: number;
  totalWickets: number;
  totalMatches: number;
  avgRunsPerMatch: number;
  avgStrikeRate: number;
}

interface TeamStatsApiRow {
  teamId?: string | number;
  teamName?: string;
  matches?: number;
  runsScored?: number;
  wicketsTaken?: number;
}

interface TeamStatsApiResponse {
  teamStats?: TeamStatsApiRow[];
}

interface PublishedStats {
  description?: string;
  leaders?: {
    topRunScorers?: Player[];
    topWicketTakers?: Player[];
    bestStrikeRates?: Player[];
    bestEconomyRates?: Player[];
  };
  teamAggregates?: TeamAggregate[];
  defaultTeams?: {
    team1Id?: string;
    team2Id?: string;
  };
  insights?: string[];
  lastUpdated?: string;
}

type StatsTabKey = 'overview' | 'batting' | 'bowling' | 'teams';

function sortByRunsDesc(players: Player[]): Player[] {
  return [...players].sort((a, b) => b.stats.runs - a.stats.runs);
}

function sortByWicketsDesc(players: Player[]): Player[] {
  return [...players].sort((a, b) => b.stats.wickets - a.stats.wickets);
}

function sortByStrikeRateDesc(players: Player[]): Player[] {
  return [...players].sort((a, b) => b.stats.strikeRate - a.stats.strikeRate);
}

function sortByEconomyAsc(players: Player[]): Player[] {
  return [...players].sort((a, b) => a.stats.economy - b.stats.economy);
}

function mergeLeadersWithComputed(
  published: Player[] | undefined,
  computed: Player[],
  sorter: (players: Player[]) => Player[]
): Player[] {
  const merged: Player[] = [];
  const seen = new Set<string>();

  const addPlayers = (list: Player[] | undefined) => {
    if (!list || list.length === 0) return;
    list.forEach((player) => {
      if (!player?.id || seen.has(player.id)) return;
      seen.add(player.id);
      merged.push(player);
    });
  };

  // Keep published leaders first, then fill remaining slots from computed values.
  addPlayers(published);
  addPlayers(computed);

  return sorter(merged).slice(0, 50);
}

function safeNumber(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeTeamToken(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .toLowerCase()
    .replace(/\(wpl\)/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

export default function StatsPage() {
  const { currentLeague, setCurrentLeague } = useLeague();
  const router = useRouter();

  // Default to IPL for stats page
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/wpl/')) {
      setCurrentLeague('ipl');
    }
  }, [setCurrentLeague]);
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishedStats, setPublishedStats] = useState<PublishedStats | null>(null);
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<StatsTabKey>('overview');
  const [leadersLimit, setLeadersLimit] = useState<10 | 50>(10);
  const [pointsYear, setPointsYear] = useState<number>(2026);
  const [availablePointsYears, setAvailablePointsYears] = useState<number[]>([]);
  const [kvTeamAggregates, setKvTeamAggregates] = useState<TeamAggregate[] | null>(null);
  
  // Redirect WPL users away from stats page
  useEffect(() => {
    if (currentLeague === 'wpl') {
      router.push('/');
    }
  }, [currentLeague, router]);

  useEffect(() => {
    if (currentLeague === 'wpl') return;
    
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [playersData, teamsData, settingsData, teamStatsResponse] = await Promise.all([
          api.getPlayers(undefined, currentLeague),
          api.getTeams(currentLeague),
          api.getSettings().catch(() => null),
          fetch(`/api/stats?league=${currentLeague}&type=teams`)
            .then(async (response) => {
              if (!response.ok) {
                return null;
              }
              return response.json() as Promise<TeamStatsApiResponse>;
            })
            .catch(() => null),
        ]);

        const finalPlayers = playersData || [];
        const finalTeams = teamsData || [];

        setPlayers(finalPlayers);
        setTeams(finalTeams);

        const playerTeamMap = new Map<string, {
          runs: number;
          wickets: number;
          matches: number;
          strikeRateSum: number;
          strikeRateCount: number;
        }>();
        finalPlayers.forEach((player) => {
          const key = String(player.teamId || '').trim();
          if (!key) return;

          const existing = playerTeamMap.get(key) || {
            runs: 0,
            wickets: 0,
            matches: 0,
            strikeRateSum: 0,
            strikeRateCount: 0,
          };

          existing.runs += safeNumber(player.stats?.runs);
          existing.wickets += safeNumber(player.stats?.wickets);
          existing.matches += safeNumber(player.stats?.matches);
          const strikeRate = safeNumber(player.stats?.strikeRate);
          if (strikeRate > 0) {
            existing.strikeRateSum += strikeRate;
            existing.strikeRateCount += 1;
          }

          playerTeamMap.set(key, existing);
        });

        const teamStats = Array.isArray(teamStatsResponse?.teamStats)
          ? teamStatsResponse.teamStats
          : [];

        const findTeamByStatRow = (teamStat: TeamStatsApiRow): Team | null => {
          const rawTeamId = teamStat.teamId !== undefined && teamStat.teamId !== null
            ? String(teamStat.teamId)
            : '';
          const teamNameToken = normalizeTeamToken(teamStat.teamName);

          return (
            finalTeams.find((team) => String(team.id) === rawTeamId) ||
            finalTeams.find((team) => {
              const teamName = normalizeTeamToken(team.name);
              const shortName = normalizeTeamToken(team.shortName);
              return teamNameToken.length > 0 && (
                teamName === teamNameToken ||
                shortName === teamNameToken ||
                teamName.includes(teamNameToken) ||
                teamNameToken.includes(teamName)
              );
            }) ||
            null
          );
        };

        const scorecardStatsByTeamId = new Map<string, TeamStatsApiRow>();
        teamStats.forEach((teamStat) => {
          const resolvedTeam = findTeamByStatRow(teamStat);
          if (resolvedTeam?.id) {
            scorecardStatsByTeamId.set(resolvedTeam.id, teamStat);
            return;
          }

          const rawTeamId = teamStat.teamId !== undefined && teamStat.teamId !== null
            ? String(teamStat.teamId)
            : '';
          if (rawTeamId) {
            scorecardStatsByTeamId.set(rawTeamId, teamStat);
          }
        });

        const mappedTeamAggregates: TeamAggregate[] = finalTeams
          .map((team) => {
            const scorecardStats = scorecardStatsByTeamId.get(team.id);
            const playerFallback = playerTeamMap.get(team.id);

            const scoreRuns = safeNumber(scorecardStats?.runsScored);
            const scoreWickets = safeNumber(scorecardStats?.wicketsTaken);
            const scoreMatches = safeNumber(scorecardStats?.matches);

            // Use scorecard performance when innings totals exist; otherwise use player aggregates.
            const hasScorePerformance = scoreRuns > 0 || scoreWickets > 0;

            const totalRuns = hasScorePerformance ? scoreRuns : (playerFallback?.runs || 0);
            const totalWickets = hasScorePerformance ? scoreWickets : (playerFallback?.wickets || 0);
            const totalMatches = hasScorePerformance
              ? scoreMatches
              : (playerFallback?.matches || scoreMatches || 0);
            const avgStrikeRate = playerFallback && playerFallback.strikeRateCount > 0
              ? playerFallback.strikeRateSum / playerFallback.strikeRateCount
              : 0;

            return {
              team,
              totalRuns,
              totalWickets,
              totalMatches,
              avgRunsPerMatch: totalMatches > 0 ? totalRuns / totalMatches : 0,
              avgStrikeRate,
            };
          })
          .sort((a, b) => b.totalRuns - a.totalRuns || b.totalWickets - a.totalWickets);

        setKvTeamAggregates(mappedTeamAggregates.length > 0 ? mappedTeamAggregates : null);

        if (settingsData && (settingsData as any).publishedStats) {
          setPublishedStats((settingsData as any).publishedStats);
        }
      } catch (err) {
        console.error('Failed to load stats data:', err);
        setError('Failed to load stats. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentLeague]);

  const kvDefaultTeams = useMemo(() => {
    if (!kvTeamAggregates || kvTeamAggregates.length === 0) {
      return undefined;
    }

    const firstTeamId = kvTeamAggregates[0]?.team?.id;
    const secondTeamId = kvTeamAggregates[1]?.team?.id || firstTeamId;

    return {
      team1Id: firstTeamId,
      team2Id: secondTeamId,
    };
  }, [kvTeamAggregates]);

  // Available years for end-user IPL points table (mirror admin UX)
  useEffect(() => {
    const years = getIplAvailableYears();
    setAvailablePointsYears(years);
    setPointsYear(years[years.length - 1] || new Date().getFullYear());
  }, []);

  const computedTopRunScorers = useMemo(() => {
    const criteria = getQualificationCriteria('orangeCap', currentLeague);
    return [...players]
      .filter((p) => qualifiesForStat(p, criteria, currentLeague))
      .sort((a, b) => b.stats.runs - a.stats.runs)
      .slice(0, 50);
  }, [players, currentLeague]);

  const computedTopWicketTakers = useMemo(() => {
    const criteria = getQualificationCriteria('purpleCap', currentLeague);
    return [...players]
      .filter((p) => qualifiesForStat(p, criteria, currentLeague))
      .sort((a, b) => b.stats.wickets - a.stats.wickets)
      .slice(0, 50);
  }, [players, currentLeague]);

  const computedBestStrikeRates = useMemo(() => {
    const criteria = getQualificationCriteria('bestStrikeRate', currentLeague);
    return [...players]
      .filter((p) => qualifiesForStat(p, criteria, currentLeague))
      .sort((a, b) => b.stats.strikeRate - a.stats.strikeRate)
      .slice(0, 50);
  }, [players, currentLeague]);

  const computedBestEconomyRates = useMemo(() => {
    const criteria = getQualificationCriteria('bestEconomy', currentLeague);
    return [...players]
      .filter((p) => qualifiesForStat(p, criteria, currentLeague) && p.stats.economy > 0)
      .sort((a, b) => a.stats.economy - b.stats.economy)
      .slice(0, 50);
  }, [players, currentLeague]);

  const topRunScorers = useMemo(() => {
    return mergeLeadersWithComputed(
      publishedStats?.leaders?.topRunScorers,
      computedTopRunScorers,
      sortByRunsDesc
    );
  }, [publishedStats?.leaders?.topRunScorers, computedTopRunScorers]);

  const topWicketTakers = useMemo(() => {
    return mergeLeadersWithComputed(
      publishedStats?.leaders?.topWicketTakers,
      computedTopWicketTakers,
      sortByWicketsDesc
    );
  }, [publishedStats?.leaders?.topWicketTakers, computedTopWicketTakers]);

  const bestStrikeRates = useMemo(() => {
    return mergeLeadersWithComputed(
      publishedStats?.leaders?.bestStrikeRates,
      computedBestStrikeRates,
      sortByStrikeRateDesc
    );
  }, [publishedStats?.leaders?.bestStrikeRates, computedBestStrikeRates]);

  const bestEconomyRates = useMemo(() => {
    return mergeLeadersWithComputed(
      publishedStats?.leaders?.bestEconomyRates,
      computedBestEconomyRates,
      sortByEconomyAsc
    );
  }, [publishedStats?.leaders?.bestEconomyRates, computedBestEconomyRates]);

  // Calculate totals for hero section
  const totalRuns = useMemo(() => {
    return players.reduce((sum, p) => sum + p.stats.runs, 0);
  }, [players]);

  const totalWickets = useMemo(() => {
    return players.reduce((sum, p) => sum + p.stats.wickets, 0);
  }, [players]);

  // IPL points table for end-user stats page (read-only)
  const pointsTable = useMemo(() => {
    const savedStats = readIplSavedRows(pointsYear);
    const seasonTeamIds = new Set(getIplSeasonTeamIds(pointsYear));
    const currentYear = new Date().getFullYear();

    return teams
      .filter((team) => team.league === 'ipl' && seasonTeamIds.has(team.id))
      .map((team) => {
        const displayShortName = team.shortName || team.name.split(' ').map((w) => w[0]).join('');
        const displayName = team.name || '';
        const persistedStats = ((team as Team & { stats?: IplSavedRow }).stats ?? {}) as IplSavedRow;
        const apiSeasonRow = pointsYear === currentYear ? persistedStats : {};
        const row = { ...apiSeasonRow, ...(savedStats[team.id] || {}) };

        return {
          ...team,
          shortName: displayShortName,
          name: displayName,
          matchesPlayed: row.matchesPlayed ?? 0,
          wins: row.wins ?? 0,
          losses: row.losses ?? 0,
          noResult: row.noResult ?? 0,
          points: row.points ?? 0,
          netRunRate: row.netRunRate ?? 0,
          qualified: Boolean(row.qualified),
          eliminated: Boolean(row.eliminated),
        };
      });
  }, [teams, pointsYear]);

  const sortedPointsTable = useMemo(() => {
    const copy = [...pointsTable];
    copy.sort((a, b) => {
      if ((b as any).points !== (a as any).points) {
        return ((b as any).points ?? 0) - ((a as any).points ?? 0);
      }
      return ((b as any).netRunRate ?? 0) - ((a as any).netRunRate ?? 0);
    });
    // Show top 10 teams on stats page
    return copy.slice(0, 10);
  }, [pointsTable]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-ipl-dark">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-ipl-dark">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 text-lg mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-ipl-gold to-ipl-purple text-white font-semibold"
            >
              Retry
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-[#070a12]">
      <div className="fixed inset-0 z-0 bg-[#070a12]" aria-hidden="true" />
      <div className="relative z-20">
        <Navbar />
      </div>

      <main className="relative z-10 flex-1 overflow-hidden bg-[#070a12]">
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/images/cricket-oil-stadium-hero.png')" }}
            animate={{ scale: [1, 1.025, 1], opacity: [0.36, 0.44, 0.36] }}
            transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,10,18,0.62)_0%,rgba(7,10,18,0.88)_44%,rgba(7,10,18,0.96)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(245,158,11,0.12),transparent_28%,rgba(16,185,129,0.10)_54%,transparent_75%,rgba(168,85,247,0.12))]" />
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)',
              backgroundSize: '72px 72px',
            }}
          />
        </div>

        <div className="relative z-10">
          {/* Hero Section */}
          <StatsHeroSection
            totalPlayers={players.length}
            totalTeams={teams.length}
            totalRuns={totalRuns}
            totalWickets={totalWickets}
          />

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
            {/* Tabs Navigation */}
              <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-8"
            >
              <StatsTabs activeTab={activeTab} onTabChange={setActiveTab} />
            </motion.div>

            {/* View Controls */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap items-center justify-between gap-4 mb-8"
            >
              {activeTab !== 'teams' && (
                <div className="flex items-center gap-2 rounded-lg border border-white/[0.12] bg-black/[0.38] px-3 py-2 backdrop-blur-xl">
                  <Filter className="w-4 h-4 text-amber-200" />
                  <span className="mr-1 text-sm text-slate-300">Leaderboard size</span>
                  <button
                      onClick={() => setLeadersLimit(10)}
                    className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-all ${
                        leadersLimit === 10
                        ? 'bg-amber-300 text-slate-950 shadow-lg shadow-amber-500/20'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      Top 10
                    </button>
                  <button
                      onClick={() => setLeadersLimit(50)}
                    className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-all ${
                        leadersLimit === 50
                        ? 'bg-amber-300 text-slate-950 shadow-lg shadow-amber-500/20'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      Top 50
                    </button>
                  </div>
              )}

              {publishedStats?.lastUpdated && (
                <div className="flex items-center gap-2 rounded-lg border border-white/[0.12] bg-black/[0.38] px-3 py-2 backdrop-blur-xl">
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span className="text-xs text-slate-400">
                    Stats refreshed {new Date(publishedStats.lastUpdated).toLocaleDateString()}
                  </span>
              </div>
              )}
            </motion.div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8"
                >
                  {/* IPL Points Table Snapshot */}
                  {sortedPointsTable.length > 0 && (
                    <motion.section
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="rounded-lg border border-white/[0.15] bg-black/[0.42] p-5 shadow-2xl backdrop-blur-xl md:p-6"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                        <div>
                          <h2 className="flex items-center gap-2 text-xl font-black text-white md:text-2xl">
                            <Trophy className="w-5 h-5 text-ipl-gold" />
                            IPL {pointsYear} Points Table
                          </h2>
                          <p className="text-xs text-gray-400 mt-1">
                            Standings snapshot sorted by points and net run rate.
                          </p>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <IplStatusPill status="qualified" compact />
                            <IplStatusPill status="eliminated" compact />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Season
                          </span>
                          <select
                            value={pointsYear}
                            onChange={(e) => setPointsYear(parseInt(e.target.value, 10))}
                            className="rounded-md border border-white/20 bg-black/60 px-3 py-1.5 text-xs text-gray-100 focus:outline-none focus:ring-2 focus:ring-ipl-gold/40"
                          >
                            {availablePointsYears.map((year) => (
                              <option key={year} value={year}>
                                {year}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left">
                          <thead className="text-xs uppercase tracking-wider text-gray-400 border-b border-white/10">
                            <tr>
                              <th className="py-2 pr-4">Pos</th>
                              <th className="py-2 pr-4">Team</th>
                              <th className="py-2 pr-4 text-center">M</th>
                              <th className="py-2 pr-4 text-center">W</th>
                              <th className="py-2 pr-4 text-center">L</th>
                              <th className="py-2 pr-4 text-center">NR</th>
                              <th className="py-2 pr-4 text-center">Pts</th>
                              <th className="py-2 pr-4 text-right">NRR</th>
                              <th className="py-2 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortedPointsTable.map((team, index) => {
                              const nrr = (team as any).netRunRate ?? 0;
                              const isTop4 = index < 4;
                              const isQualified = Boolean((team as any).qualified);
                              const isEliminated = Boolean((team as any).eliminated);
                              return (
                                <tr
                                  key={team.id}
                                  className={`border-b border-white/5 last:border-0 ${
                                    isQualified
                                      ? 'bg-emerald-500/[0.06]'
                                      : isEliminated
                                        ? 'bg-rose-500/[0.06]'
                                        : isTop4
                                          ? 'bg-white/5'
                                          : ''
                                  }`}
                                >
                                  <td className="py-2 pr-4 font-bold text-gray-200">
                                    {index + 1}
                                  </td>
                                  <td className="py-2 pr-4">
                                    <div className="flex items-center gap-2">
                                      <div className="relative inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-ipl-gold/40 to-ipl-purple/40 text-xs font-black text-white">
                                        <img 
                                          src={team.logo} 
                                          alt={team.shortName || team.name}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            // Fallback to text if logo fails to load
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            target.nextElementSibling?.classList.remove('hidden');
                                          }}
                                        />
                                        <div className="hidden absolute inset-0 flex items-center justify-center text-white">
                                          {(team.shortName || '').slice(0, 2)}
                                        </div>
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-white">
                                          {team.shortName}
                                        </span>
                                        <span className="text-[10px] text-gray-400">
                                          {team.name}
                                        </span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-2 pr-4 text-center text-gray-100">
                                    {(team as any).matchesPlayed ?? 0}
                                  </td>
                                  <td className="py-2 pr-4 text-center text-emerald-300 font-semibold">
                                    {(team as any).wins ?? 0}
                                  </td>
                                  <td className="py-2 pr-4 text-center text-red-300 font-semibold">
                                    {(team as any).losses ?? 0}
                                  </td>
                                  <td className="py-2 pr-4 text-center text-sky-300 font-semibold">
                                    {(team as any).noResult ?? 0}
                                  </td>
                                  <td className="py-2 pr-4 text-center font-black text-ipl-gold">
                                    {(team as any).points ?? 0}
                                  </td>
                                  <td
                                    className={`py-2 pr-4 text-right font-semibold ${
                                      nrr > 0
                                        ? 'text-emerald-300'
                                        : nrr < 0
                                        ? 'text-red-300'
                                        : 'text-gray-200'
                                    }`}
                                  >
                                    {formatNetRunRate(nrr)}
                                  </td>
                                  <td className="py-2 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      {isQualified && <IplStatusPill status="qualified" compact />}
                                      {isEliminated && <IplStatusPill status="eliminated" compact />}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </motion.section>
                  )}

                  {/* Quick Stats */}
                  <QuickStatsGrid players={players} teams={teams} />

                  {/* Top Performers Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {topRunScorers.length > 0 && (
                      <LeaderboardSection
                        title="Orange Cap Race"
                        icon={Trophy}
                        players={topRunScorers}
                        teams={teams}
                        type="batting"
                        metric="runs"
                        qualificationText={getQualificationDescription('orangeCap', currentLeague)}
                        color="from-orange-500 to-yellow-400"
                        expandedPlayerId={expandedPlayerId}
                        onPlayerExpand={setExpandedPlayerId}
                        leadersLimit={leadersLimit}
                        visualizationVariant="bubble"
                      />
                    )}

                    {topWicketTakers.length > 0 && (
                      <LeaderboardSection
                        title="Purple Cap Race"
                        icon={Award}
                        players={topWicketTakers}
                        teams={teams}
                        type="bowling"
                        metric="wickets"
                        qualificationText={getQualificationDescription('purpleCap', currentLeague)}
                        color="from-violet-500 to-fuchsia-500"
                        expandedPlayerId={expandedPlayerId}
                        onPlayerExpand={setExpandedPlayerId}
                        leadersLimit={leadersLimit}
                        visualizationVariant="scatter"
                      />
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'batting' && (
                <motion.div
                  key="batting"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8"
                >
                  {/* Orange Cap */}
                  {topRunScorers.length > 0 && (
                    <LeaderboardSection
                      title="Orange Cap - Top Run Scorers"
                      icon={Trophy}
                      players={topRunScorers}
                      teams={teams}
                      type="batting"
                      metric="runs"
                      qualificationText={getQualificationDescription('orangeCap', currentLeague)}
                      color="from-orange-500 to-yellow-400"
                      expandedPlayerId={expandedPlayerId}
                      onPlayerExpand={setExpandedPlayerId}
                      leadersLimit={leadersLimit}
                      visualizationVariant="lollipop"
                    />
                  )}

                  {/* Best Strike Rates */}
                  {bestStrikeRates.length > 0 && (
                    <LeaderboardSection
                      title="Best Strike Rates"
                      icon={TrendingUp}
                      players={bestStrikeRates}
                      teams={teams}
                      type="batting"
                      metric="strikeRate"
                      qualificationText={getQualificationDescription('bestStrikeRate', currentLeague)}
                      color="from-cyan-400 to-sky-500"
                      expandedPlayerId={expandedPlayerId}
                      onPlayerExpand={setExpandedPlayerId}
                      leadersLimit={leadersLimit}
                      visualizationVariant="radar"
                    />
                  )}
                </motion.div>
              )}

              {activeTab === 'bowling' && (
                <motion.div
                  key="bowling"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8"
                >
                  {/* Purple Cap */}
                  {topWicketTakers.length > 0 && (
                    <LeaderboardSection
                      title="Purple Cap - Top Wicket Takers"
                      icon={Award}
                      players={topWicketTakers}
                      teams={teams}
                      type="bowling"
                      metric="wickets"
                      qualificationText={getQualificationDescription('purpleCap', currentLeague)}
                      color="from-violet-500 to-fuchsia-500"
                      expandedPlayerId={expandedPlayerId}
                      onPlayerExpand={setExpandedPlayerId}
                      leadersLimit={leadersLimit}
                      visualizationVariant="donut"
                    />
                  )}

                  {/* Best Economy */}
                  {bestEconomyRates.length > 0 && (
                    <LeaderboardSection
                      title="Best Economy Rates"
                      icon={Target}
                      players={bestEconomyRates}
                      teams={teams}
                      type="bowling"
                      metric="economy"
                      qualificationText={getQualificationDescription('bestEconomy', currentLeague)}
                      color="from-emerald-400 to-teal-500"
                      expandedPlayerId={expandedPlayerId}
                      onPlayerExpand={setExpandedPlayerId}
                      leadersLimit={leadersLimit}
                      visualizationVariant="lollipop"
                    />
                  )}
                </motion.div>
              )}

              {activeTab === 'teams' && (
                <motion.div
                  key="teams"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8"
                >
                  <TeamStatsSection
                    players={players}
                    teams={teams}
                    publishedTeamAggregates={kvTeamAggregates || publishedStats?.teamAggregates}
                    defaultTeams={publishedStats?.defaultTeams || kvDefaultTeams}
                  />
                </motion.div>
              )}
            </AnimatePresence>
              </div>
        </div>
      </main>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
