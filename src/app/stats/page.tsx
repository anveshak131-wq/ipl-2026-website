'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AuroraBackground from '@/components/ui/AuroraBackground';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { api } from '@/lib/data';
import { useLeague } from '@/contexts/LeagueContext';
import type { Player, Team } from '@/types';
import { getQualificationCriteria, qualifiesForStat, getQualificationDescription } from '@/lib/statsQualifications';
import StatsHeroSection from '@/components/stats/StatsHeroSection';
import StatsTabs from '@/components/stats/StatsTabs';
import LeaderboardSection from '@/components/stats/LeaderboardSection';
import QuickStatsGrid from '@/components/stats/QuickStatsGrid';
import { Trophy, Award, TrendingUp, Target, Users, Sparkles, Filter } from 'lucide-react';

interface TeamAggregate {
  team: Team | null;
  totalRuns: number;
  totalWickets: number;
  totalMatches: number;
  avgRunsPerMatch: number;
  avgStrikeRate: number;
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
        const [playersData, teamsData, settingsData] = await Promise.all([
          api.getPlayers(undefined, currentLeague),
          api.getTeams(currentLeague),
          api.getSettings().catch(() => null),
        ]);
        setPlayers(playersData || []);
        setTeams(teamsData || []);

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

  // Available years for end-user IPL points table (mirror admin UX)
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let year = 2008; year <= currentYear; year++) {
      years.push(year);
    }
    setAvailablePointsYears(years);
    setPointsYear(currentYear);
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
    const base = publishedStats?.leaders?.topRunScorers?.length
      ? publishedStats.leaders.topRunScorers
      : computedTopRunScorers;
    return sortByRunsDesc(base);
  }, [publishedStats?.leaders?.topRunScorers, computedTopRunScorers]);

  const topWicketTakers = useMemo(() => {
    const base = publishedStats?.leaders?.topWicketTakers?.length
      ? publishedStats.leaders.topWicketTakers
      : computedTopWicketTakers;
    return sortByWicketsDesc(base);
  }, [publishedStats?.leaders?.topWicketTakers, computedTopWicketTakers]);

  const bestStrikeRates = useMemo(() => {
    const base = publishedStats?.leaders?.bestStrikeRates?.length
      ? publishedStats.leaders.bestStrikeRates
      : computedBestStrikeRates;
    return sortByStrikeRateDesc(base);
  }, [publishedStats?.leaders?.bestStrikeRates, computedBestStrikeRates]);

  const bestEconomyRates = useMemo(() => {
    const base = publishedStats?.leaders?.bestEconomyRates?.length
      ? publishedStats.leaders.bestEconomyRates
      : computedBestEconomyRates;
    return sortByEconomyAsc(base);
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
    // Mirror admin logic: prefer locally saved stats (year -> teamId -> stats), then team.stats, then zeros
    let savedStats: Record<string, { matchesPlayed?: number; wins?: number; losses?: number; noResult?: number; points?: number; netRunRate?: number }> = {};
    if (typeof window !== 'undefined') {
      try {
        const allStats = JSON.parse(window.localStorage.getItem('iplPointsTableStats') || '{}') || {};
        if (allStats[pointsYear] && typeof allStats[pointsYear] === 'object') {
          savedStats = allStats[pointsYear];
        } else {
          savedStats = {};
        }
      } catch {
        // ignore parse errors and fall back to team.stats
      }
    }

    return teams
      .filter((team) => team.league === 'ipl')
      .map((team) => {
        const displayShortName = team.shortName || team.name.split(' ').map((w) => w[0]).join('');
        const displayName = team.name || '';

        const row = savedStats[team.id] || {};

        return {
          ...team,
          shortName: displayShortName,
          name: displayName,
          matchesPlayed: row.matchesPlayed ?? 0,
          wins: row.wins ?? 0,
          losses: row.losses ?? 0,
          points: row.points ?? 0,
          netRunRate: row.netRunRate ?? 0,
        };
      });
  }, [teams, pointsYear]);

  const sortedPointsTable = useMemo(() => {
    // Season-specific team visibility (can be extended with historical franchises)
    const filterTeamBySeason = (team: Team, year: number) => {
      const short = (team.shortName || '').toUpperCase();

      // Hide new expansion teams before they existed
      if (year < 2022 && (short === 'GT' || short === 'LSG')) {
        return false;
      }

      // Default: show team
      return true;
    };

    const filtered = pointsTable.filter((team) => filterTeamBySeason(team, pointsYear));

    const copy = [...filtered];
    copy.sort((a, b) => {
      if ((b as any).points !== (a as any).points) {
        return ((b as any).points ?? 0) - ((a as any).points ?? 0);
      }
      return ((b as any).netRunRate ?? 0) - ((a as any).netRunRate ?? 0);
    });
    // Show top 10 teams on stats page
    return copy.slice(0, 10);
  }, [pointsTable, pointsYear]);

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
    <div className="min-h-screen flex flex-col bg-ipl-dark">
      <Navbar />

      <main className="relative flex-1 overflow-hidden">
        <AuroraBackground />
        
        {/* Animated background orbs */}
        <motion.div 
          className="fixed top-20 right-10 w-96 h-96 rounded-full blur-3xl pointer-events-none"
          style={{ 
            background: 'radial-gradient(circle, rgba(251, 191, 36, 0.15), rgba(139, 92, 246, 0.1), transparent)',
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="fixed bottom-20 left-10 w-80 h-80 rounded-full blur-3xl pointer-events-none"
          style={{ 
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.15), rgba(99, 102, 241, 0.1), transparent)',
          }}
          animate={{
            y: [0, 30, 0],
            x: [0, -20, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />

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
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400 mr-2">Show:</span>
                <button
                    onClick={() => setLeadersLimit(10)}
                  className={`px-4 py-1.5 rounded-lg font-semibold text-sm transition-all ${
                      leadersLimit === 10
                      ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Top 10
                  </button>
                  <button
                    onClick={() => setLeadersLimit(50)}
                  className={`px-4 py-1.5 rounded-lg font-semibold text-sm transition-all ${
                      leadersLimit === 50
                      ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Top 50
                  </button>
                </div>

              {publishedStats?.lastUpdated && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs text-gray-400">
                    Updated {new Date(publishedStats.lastUpdated).toLocaleDateString()}
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
                      className="rounded-3xl bg-black/40 border border-white/15 backdrop-blur-xl p-6 md:p-8"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                        <div>
                          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-ipl-gold" />
                            IPL {pointsYear} Points Table
                          </h2>
                          <p className="text-xs text-gray-400 mt-1">
                            Read-only snapshot using the same admin points data (including any manual edits).
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Season
                          </span>
                          <select
                            value={pointsYear}
                            onChange={(e) => setPointsYear(parseInt(e.target.value, 10))}
                            className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/20 text-xs text-gray-100 focus:outline-none focus:ring-2 focus:ring-ipl-gold/40"
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
                              <th className="py-2 pr-4 text-center">Pts</th>
                              <th className="py-2 pr-4 text-right">NRR</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortedPointsTable.map((team, index) => {
                              const nrr = (team as any).netRunRate ?? 0;
                              const isTop4 = index < 4;
                              return (
                                <tr
                                  key={team.id}
                                  className={`border-b border-white/5 last:border-0 ${
                                    isTop4 ? 'bg-white/5' : ''
                                  }`}
                                >
                                  <td className="py-2 pr-4 font-bold text-gray-200">
                                    {index + 1}
                                  </td>
                                  <td className="py-2 pr-4">
                                    <div className="flex items-center gap-2">
                                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-ipl-gold/40 to-ipl-purple/40 text-xs font-black text-white">
                                        {(team.shortName || '').slice(0, 2)}
                                      </span>
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
                                    {nrr > 0 ? `+${nrr.toFixed(2)}` : nrr.toFixed(2)}
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
                        qualificationText={getQualificationDescription('orangeCap', currentLeague)}
                        color="from-orange-500/20 to-yellow-500/20"
                        expandedPlayerId={expandedPlayerId}
                        onPlayerExpand={setExpandedPlayerId}
                        leadersLimit={leadersLimit}
                        visualizationVariant="axis"
                      />
                    )}

                    {topWicketTakers.length > 0 && (
                      <LeaderboardSection
                        title="Purple Cap Race"
                        icon={Award}
                        players={topWicketTakers}
                        teams={teams}
                        type="bowling"
                        qualificationText={getQualificationDescription('purpleCap', currentLeague)}
                        color="from-purple-500/20 to-pink-500/20"
                        expandedPlayerId={expandedPlayerId}
                        onPlayerExpand={setExpandedPlayerId}
                        leadersLimit={leadersLimit}
                        visualizationVariant="donut"
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
                      qualificationText={getQualificationDescription('orangeCap', currentLeague)}
                      color="from-orange-500/20 to-yellow-500/20"
                      expandedPlayerId={expandedPlayerId}
                      onPlayerExpand={setExpandedPlayerId}
                      leadersLimit={leadersLimit}
                      visualizationVariant="axis"
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
                      qualificationText={getQualificationDescription('bestStrikeRate', currentLeague)}
                      color="from-blue-500/20 to-cyan-500/20"
                      expandedPlayerId={expandedPlayerId}
                      onPlayerExpand={setExpandedPlayerId}
                      leadersLimit={leadersLimit}
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
                      qualificationText={getQualificationDescription('purpleCap', currentLeague)}
                      color="from-purple-500/20 to-pink-500/20"
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
                      qualificationText={getQualificationDescription('bestEconomy', currentLeague)}
                      color="from-emerald-500/20 to-teal-500/20"
                      expandedPlayerId={expandedPlayerId}
                      onPlayerExpand={setExpandedPlayerId}
                      leadersLimit={leadersLimit}
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
                  <div className="rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
                        <Users className="w-8 h-8 text-white" />
                      </div>
                      <h2 className="text-3xl font-black text-white">Team Statistics</h2>
                    </div>
                    <p className="text-gray-400">
                      Team comparison and aggregate statistics coming soon.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
              </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
