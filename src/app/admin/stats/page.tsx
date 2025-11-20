'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { api } from '@/lib/data';
import type { Player, Team } from '@/types';

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

function getSnapshotFreshness(
  timestamp?: string
): { label: string; variant: 'fresh' | 'recent' | 'stale' } | null {
  if (!timestamp) return null;

  const updated = new Date(timestamp);
  if (Number.isNaN(updated.getTime())) return null;

  const now = new Date();
  const diffMs = now.getTime() - updated.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 1) {
    return { label: 'Fresh (last 24 hours)', variant: 'fresh' };
  }

  if (diffDays < 7) {
    return { label: 'Recent (last 7 days)', variant: 'recent' };
  }

  return { label: 'Stale (over 7 days old)', variant: 'stale' };
}

export default function AdminStatsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [publishedStats, setPublishedStats] = useState<PublishedStats | null>(null);

  const [topRunScorers, setTopRunScorers] = useState<Player[]>([]);
  const [topWicketTakers, setTopWicketTakers] = useState<Player[]>([]);
  const [bestStrikeRates, setBestStrikeRates] = useState<Player[]>([]);
  const [bestEconomyRates, setBestEconomyRates] = useState<Player[]>([]);
  const [hasInitializedLeaders, setHasInitializedLeaders] = useState(false);

  const [description, setDescription] = useState('');
  const [selectedTeam1Id, setSelectedTeam1Id] = useState('');
  const [selectedTeam2Id, setSelectedTeam2Id] = useState('');

  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  const snapshotFreshness = useMemo(
    () =>
      publishedStats?.lastUpdated
        ? getSnapshotFreshness(publishedStats.lastUpdated)
        : null,
    [publishedStats?.lastUpdated]
  );

  const updateTopRunScorers = (entries: Player[]) => {
    setTopRunScorers(sortByRunsDesc(entries));
  };

  const updateTopWicketTakers = (entries: Player[]) => {
    setTopWicketTakers(sortByWicketsDesc(entries));
  };

  const updateBestStrikeRates = (entries: Player[]) => {
    setBestStrikeRates(sortByStrikeRateDesc(entries));
  };

  const updateBestEconomyRates = (entries: Player[]) => {
    // Let admins freely choose any bowlers here; qualification filters
    // are enforced on the public /stats page, not in the editor state.
    setBestEconomyRates(sortByEconomyAsc(entries));
  };

  const rebuildLeaderboardsFromStats = () => {
    // Rebuild all four leaderboards purely from current player stats.
    // This is useful right after adding/editing players so the rankings
    // reflect the latest wickets, runs, strike rates, and economies.
    updateTopRunScorers(suggestedTopRunScorers);
    updateTopWicketTakers(suggestedTopWicketTakers);
    updateBestStrikeRates(suggestedBestStrikeRates);
    updateBestEconomyRates(suggestedBestEconomyRates);
  };

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          router.push('/admin');
          return;
        }
        setIsAuthenticated(true);
        fetchData();
      } catch {
        router.push('/admin');
      } finally {
        setAuthLoading(false);
      }
    };

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [playersData, teamsData, settingsData] = await Promise.all([
          api.getPlayers(),
          api.getTeams(),
          api.getSettings().catch(() => null),
        ]);

        setPlayers(playersData || []);
        setTeams(teamsData || []);

        let team1Id = '';
        let team2Id = '';

        if (teamsData && teamsData.length >= 2) {
          team1Id = teamsData[0].id;
          team2Id = teamsData[1].id;
        } else if (teamsData && teamsData.length === 1) {
          team1Id = teamsData[0].id;
        }

        if (settingsData && (settingsData as any).publishedStats) {
          const published = (settingsData as any).publishedStats as PublishedStats;
          setPublishedStats(published);
          if (published.description) {
            setDescription(published.description);
          }
          if (published.defaultTeams) {
            if (published.defaultTeams.team1Id) team1Id = published.defaultTeams.team1Id;
            if (published.defaultTeams.team2Id) team2Id = published.defaultTeams.team2Id;
          }
        }

        if (team1Id) setSelectedTeam1Id(team1Id);
        if (team2Id) setSelectedTeam2Id(team2Id);
      } catch (error) {
        console.error('Failed to load data for admin stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const suggestedTopRunScorers = useMemo(() => {
    return [...players]
      .sort((a, b) => b.stats.runs - a.stats.runs)
      .slice(0, 5);
  }, [players]);

  const suggestedTopWicketTakers = useMemo(() => {
    return [...players]
      .filter((p) => p.stats.wickets > 0)
      .sort((a, b) => b.stats.wickets - a.stats.wickets)
      .slice(0, 5);
  }, [players]);

  const suggestedBestStrikeRates = useMemo(() => {
    return [...players]
      .filter((p) => p.stats.runs >= 300)
      .sort((a, b) => b.stats.strikeRate - a.stats.strikeRate)
      .slice(0, 5);
  }, [players]);

  const suggestedBestEconomyRates = useMemo(() => {
    return [...players]
      .filter((p) => p.stats.wickets >= 20 && p.stats.economy > 0)
      .sort((a, b) => a.stats.economy - b.stats.economy)
      .slice(0, 5);
  }, [players]);

  useEffect(() => {
    if (!players.length || hasInitializedLeaders) {
      return;
    }

    const publishedLeaders = publishedStats?.leaders;

    const mapPublishedPlayers = (publishedList?: Player[]): Player[] => {
      if (!publishedList || !publishedList.length) return [];
      const playerMap = new Map(players.map((p) => [p.id, p] as const));
      return publishedList
        .map((pub) => playerMap.get(pub.id))
        .filter((p): p is Player => Boolean(p));
    };

    const initialTopRuns = mapPublishedPlayers(publishedLeaders?.topRunScorers);
    const initialTopWickets = mapPublishedPlayers(publishedLeaders?.topWicketTakers);
    const initialBestStrike = mapPublishedPlayers(publishedLeaders?.bestStrikeRates);
    const initialBestEconomy = mapPublishedPlayers(publishedLeaders?.bestEconomyRates);

    updateTopRunScorers(
      initialTopRuns.length ? initialTopRuns : suggestedTopRunScorers
    );
    updateTopWicketTakers(
      initialTopWickets.length ? initialTopWickets : suggestedTopWicketTakers
    );
    updateBestStrikeRates(
      initialBestStrike.length ? initialBestStrike : suggestedBestStrikeRates
    );
    updateBestEconomyRates(
      initialBestEconomy.length ? initialBestEconomy : suggestedBestEconomyRates
    );

    setHasInitializedLeaders(true);
  }, [
    players,
    publishedStats,
    suggestedTopRunScorers,
    suggestedTopWicketTakers,
    suggestedBestStrikeRates,
    suggestedBestEconomyRates,
    hasInitializedLeaders,
  ]);

  const computeTeamAggregate = (teamId: string): TeamAggregate => {
    const team = teams.find((t) => t.id === teamId) || null;
    const teamPlayers = players.filter((p) => p.teamId === teamId);

    if (teamPlayers.length === 0) {
      return {
        team,
        totalRuns: 0,
        totalWickets: 0,
        totalMatches: 0,
        avgRunsPerMatch: 0,
        avgStrikeRate: 0,
      };
    }

    const totalRuns = teamPlayers.reduce((sum, p) => sum + p.stats.runs, 0);
    const totalWickets = teamPlayers.reduce((sum, p) => sum + p.stats.wickets, 0);
    const totalMatches = teamPlayers.reduce((sum, p) => sum + p.stats.matches, 0);
    const avgStrikeRate =
      teamPlayers.reduce((sum, p) => sum + p.stats.strikeRate, 0) /
      teamPlayers.length;
    const avgRunsPerMatch = totalMatches > 0 ? totalRuns / totalMatches : 0;

    return {
      team,
      totalRuns,
      totalWickets,
      totalMatches,
      avgRunsPerMatch,
      avgStrikeRate,
    };
  };

  const leagueBattingSummary = useMemo(() => {
    if (!players.length) {
      return {
        totalRuns: 0,
        totalMatches: 0,
        avgRunsPerMatch: 0,
        avgStrikeRate: 0,
      };
    }
    const totalRuns = players.reduce((sum, p) => sum + p.stats.runs, 0);
    const totalMatches = players.reduce((sum, p) => sum + p.stats.matches, 0);
    const avgRunsPerMatch = totalMatches > 0 ? totalRuns / totalMatches : 0;
    const avgStrikeRate =
      players.reduce((sum, p) => sum + p.stats.strikeRate, 0) / players.length;
    return { totalRuns, totalMatches, avgRunsPerMatch, avgStrikeRate };
  }, [players]);

  const selectedTeam1Agg = useMemo(
    () => (selectedTeam1Id ? computeTeamAggregate(selectedTeam1Id) : null),
    [selectedTeam1Id, players, teams]
  );

  const selectedTeam2Agg = useMemo(
    () => (selectedTeam2Id ? computeTeamAggregate(selectedTeam2Id) : null),
    [selectedTeam2Id, players, teams]
  );

  const suggestedInsights = useMemo(() => {
    const points: string[] = [];

    const runLeaders = topRunScorers.length
      ? topRunScorers
      : suggestedTopRunScorers;

    if (runLeaders.length > 1) {
      const leader = runLeaders[0];
      const runnerUp = runLeaders[1];
      const diff = leader.stats.runs - runnerUp.stats.runs;
      const percent = runnerUp.stats.runs
        ? (diff / runnerUp.stats.runs) * 100
        : 0;
      points.push(
        `${leader.name} leads the run charts with ${leader.stats.runs} runs, about ${percent.toFixed(
          1
        )}% more than the next best (${runnerUp.name}).`
      );
    }

    if (selectedTeam1Agg && leagueBattingSummary.avgStrikeRate > 0) {
      const teamName = selectedTeam1Agg.team?.shortName || 'Team 1';
      const diffStrike =
        ((selectedTeam1Agg.avgStrikeRate - leagueBattingSummary.avgStrikeRate) /
          leagueBattingSummary.avgStrikeRate) * 100;
      const fasterOrSlower = diffStrike >= 0 ? 'faster' : 'slower';
      points.push(
        `${teamName} bat ${Math.abs(diffStrike).toFixed(
          1
        )}% ${fasterOrSlower} than the league average strike rate.`
      );
    }

    if (selectedTeam1Agg && selectedTeam2Agg) {
      const t1 = selectedTeam1Agg;
      const t2 = selectedTeam2Agg;
      const betterBatting =
        t1.avgRunsPerMatch > t2.avgRunsPerMatch ? t1.team : t2.team;
      const betterBowling =
        t1.totalWickets > t2.totalWickets ? t1.team : t2.team;

      if (betterBatting) {
        points.push(
          `${betterBatting.shortName} have a stronger batting unit on paper when you look at average runs per match from their full squad.`
        );
      }

      if (betterBowling) {
        points.push(
          `${betterBowling.shortName} bowlers collectively have taken more wickets than their rivals in this comparison.`
        );
      }
    }

    return points;
  }, [
    suggestedTopRunScorers,
    topRunScorers,
    selectedTeam1Agg,
    selectedTeam2Agg,
    leagueBattingSummary.avgStrikeRate,
  ]);

  const leaderboardsWithEntries = useMemo(
    () =>
      [
        topRunScorers,
        topWicketTakers,
        bestStrikeRates,
        bestEconomyRates,
      ].filter((list) => list.length > 0).length,
    [topRunScorers, topWicketTakers, bestStrikeRates, bestEconomyRates]
  );

  const checklist = useMemo(
    () => ({
      hasPlayers: players.length > 0,
      hasTeams: teams.length >= 2,
      leaderboardsComplete: leaderboardsWithEntries === 4,
      hasInsights: suggestedInsights.length > 0,
    }),
    [players.length, teams.length, leaderboardsWithEntries, suggestedInsights.length]
  );

  const handlePublish = async () => {
    if (!players.length || !teams.length) return;
    setIsPublishing(true);
    setPublishSuccess(null);
    setPublishError(null);

    try {
      const teamAggregates: TeamAggregate[] = teams.map((team) =>
        computeTeamAggregate(team.id)
      );

      const finalTopRunScorers = sortByRunsDesc(
        topRunScorers.length ? topRunScorers : suggestedTopRunScorers
      );
      const finalTopWicketTakers = sortByWicketsDesc(
        topWicketTakers.length ? topWicketTakers : suggestedTopWicketTakers
      );
      const finalBestStrikeRates = sortByStrikeRateDesc(
        bestStrikeRates.length ? bestStrikeRates : suggestedBestStrikeRates
      );
      const finalBestEconomyRates = sortByEconomyAsc(
        bestEconomyRates.length ? bestEconomyRates : suggestedBestEconomyRates
      );

      const snapshot: PublishedStats = {
        description: description || undefined,
        leaders: {
          topRunScorers: finalTopRunScorers,
          topWicketTakers: finalTopWicketTakers,
          bestStrikeRates: finalBestStrikeRates,
          bestEconomyRates: finalBestEconomyRates,
        },
        teamAggregates,
        defaultTeams: {
          team1Id: selectedTeam1Id || teams[0]?.id,
          team2Id: selectedTeam2Id || teams[1]?.id,
        },
        insights: suggestedInsights,
        lastUpdated: new Date().toISOString(),
      };

      await api.updateSettings({ publishedStats: snapshot });
      setPublishedStats(snapshot);
      setPublishSuccess('Stats snapshot published to public /stats page.');
      setTimeout(() => setPublishSuccess(null), 4000);
    } catch (error) {
      console.error('Failed to publish stats snapshot:', error);
      setPublishError('Failed to publish stats. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen bg-ipl-dark">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-ipl-dark">
        <AdminSidebar currentPage="/admin/stats" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Loading stats overview...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-ipl-dark">
      <AdminSidebar currentPage="/admin/stats" />

      <div className="flex-1 p-8 space-y-6 overflow-y-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="mb-2 text-xs text-gray-400 flex items-center gap-1">
              <button
                type="button"
                onClick={() => router.push('/admin/dashboard')}
                className="hover:text-ipl-gold transition-colors"
              >
                Admin
              </button>
              <span className="text-gray-600">/</span>
              <button
                type="button"
                onClick={() => router.push('/admin/stats')}
                className="hover:text-ipl-gold transition-colors"
              >
                Stats
              </button>
              <span className="text-gray-600">/</span>
              <span className="text-gray-300">Stats Hub</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">Stats & Records Hub</h1>
            <p className="text-sm text-gray-300 max-w-xl">
              Control what fans see on the public <span className="font-semibold">/stats</span> page.
              Review auto-computed leaderboards, then publish a snapshot when you are ready.
            </p>
            {publishedStats?.lastUpdated && (
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                <span>
                  Last published snapshot:{' '}
                  {new Date(publishedStats.lastUpdated).toLocaleString('en-US', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {snapshotFreshness && (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-medium ${
                      snapshotFreshness.variant === 'fresh'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                        : snapshotFreshness.variant === 'recent'
                        ? 'bg-amber-500/15 text-amber-200 border-amber-500/40'
                        : 'bg-gray-500/20 text-gray-300 border-gray-500/50'
                    }`}
                  >
                    {snapshotFreshness.label}
                  </span>
                )}
              </p>
            )}
          </div>

          <div className="w-full md:w-auto space-y-3">
            {publishSuccess && (
              <div className="text-xs px-3 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                {publishSuccess}
              </div>
            )}
            {publishError && (
              <div className="text-xs px-3 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300">
                {publishError}
              </div>
            )}
            <button
              type="button"
              onClick={handlePublish}
              disabled={isPublishing || !players.length || !teams.length}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-ipl-gold to-ipl-purple text-sm font-semibold text-white shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPublishing ? 'Publishing…' : 'Publish snapshot to /stats'}
            </button>
            <div className="text-[11px] bg-black/40 border border-white/10 rounded-lg px-3 py-2 space-y-1">
              <p className="text-gray-200 font-medium">
                Pre-publish checks
              </p>
              <p
                className={`flex items-center gap-1 ${
                  checklist.hasPlayers
                    ? 'text-emerald-300'
                    : 'text-red-300'
                }`}
              >
                <span>{checklist.hasPlayers ? '✓' : '•'}</span>
                <span>
                  {players.length
                    ? `${players.length} players loaded`
                    : 'No players loaded'}
                </span>
              </p>
              <p
                className={`flex items-center gap-1 ${
                  checklist.hasTeams
                    ? 'text-emerald-300'
                    : 'text-amber-200'
                }`}
              >
                <span>{checklist.hasTeams ? '✓' : '•'}</span>
                <span>
                  {teams.length >= 2
                    ? `${teams.length} teams available`
                    : 'Less than 2 teams available'}
                </span>
              </p>
              <p
                className={`flex items-center gap-1 ${
                  checklist.leaderboardsComplete
                    ? 'text-emerald-300'
                    : 'text-amber-200'
                }`}
              >
                <span>{checklist.leaderboardsComplete ? '✓' : '•'}</span>
                <span>
                  {`${leaderboardsWithEntries}/4 leaderboards have at least one player`}
                </span>
              </p>
              <p
                className={`flex items-center gap-1 ${
                  checklist.hasInsights
                    ? 'text-emerald-300'
                    : 'text-gray-300'
                }`}
              >
                <span>{checklist.hasInsights ? '✓' : '•'}</span>
                <span>
                  {checklist.hasInsights
                    ? `${suggestedInsights.length} insight line(s) ready`
                    : 'Insights will appear once enough data is available'}
                </span>
              </p>
            </div>
            <a
              href="/stats"
              target="_blank"
              rel="noreferrer"
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-[11px] text-gray-200 hover:bg-white/10 border border-white/15"
            >
              View public /stats page
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr,1fr] gap-6">
          <section className="space-y-4">
            <div className="glass-effect rounded-xl p-6">
              <div className="flex items-center justify-between mb-3 gap-3">
                <h2 className="text-lg font-semibold text-white">Auto-computed season leaders</h2>
                <button
                  type="button"
                  onClick={rebuildLeaderboardsFromStats}
                  className="text-[11px] px-3 py-1 rounded-full border border-white/20 text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  Rebuild from latest stats
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <LeaderboardEditor
                  title="Orange Cap (Runs)"
                  titleClassName="text-ipl-gold"
                  valueClassName="text-ipl-gold"
                  entries={topRunScorers}
                  setEntries={updateTopRunScorers}
                  allPlayers={players}
                  suggestedEntries={suggestedTopRunScorers}
                  formatValue={(player) => `${player.stats.runs}`}
                />
                <LeaderboardEditor
                  title="Purple Cap (Wickets)"
                  titleClassName="text-emerald-300"
                  valueClassName="text-emerald-300"
                  entries={topWicketTakers}
                  setEntries={updateTopWicketTakers}
                  allPlayers={players}
                  suggestedEntries={suggestedTopWicketTakers}
                  formatValue={(player) => `${player.stats.wickets}`}
                />
                <LeaderboardEditor
                  title="Best Strike Rates"
                  titleClassName="text-white"
                  valueClassName="text-ipl-gold"
                  entries={bestStrikeRates}
                  setEntries={updateBestStrikeRates}
                  allPlayers={players}
                  suggestedEntries={suggestedBestStrikeRates}
                  formatValue={(player) =>
                    `SR ${player.stats.strikeRate.toFixed(1)}`
                  }
                />
                <LeaderboardEditor
                  title="Best Economy"
                  titleClassName="text-white"
                  valueClassName="text-emerald-300"
                  entries={bestEconomyRates}
                  setEntries={updateBestEconomyRates}
                  allPlayers={players}
                  suggestedEntries={suggestedBestEconomyRates}
                  formatValue={(player) =>
                    `Eco ${player.stats.economy.toFixed(2)}`
                  }
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="glass-effect rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-2">Stats page description</h2>
              <p className="text-xs text-gray-400 mb-2">
                Optional text shown at the top of the public <span className="font-semibold">/stats</span> page.
              </p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ipl-gold/40"
                rows={4}
                placeholder="Example: IPL 2026 has been dominated by top-order aggression and death-over specialists. Here are the standout performers so far."
              />
            </div>

            <div className="glass-effect rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-2">Insight focus teams</h2>
              <p className="text-xs text-gray-400 mb-3">
                Choose two teams to anchor comparison-based insights that appear on the public stats page.
              </p>
              {teams.length ? (
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-300 mb-1">
                      Focus team A
                    </label>
                    <select
                      value={selectedTeam1Id}
                      onChange={(e) => setSelectedTeam1Id(e.target.value)}
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-ipl-gold/40"
                    >
                      <option value="">Auto-select first team</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name} ({team.shortName})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-300 mb-1">
                      Focus team B
                    </label>
                    <select
                      value={selectedTeam2Id}
                      onChange={(e) => setSelectedTeam2Id(e.target.value)}
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-ipl-gold/40"
                    >
                      <option value="">Auto-select second team</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name} ({team.shortName})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500">
                  Add teams in the admin Teams section to enable insight focus controls.
                </p>
              )}
            </div>

            <div className="glass-effect rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-2">AI-style insights preview</h2>
              <p className="text-xs text-gray-400 mb-2">
                These sentences will be stored with the snapshot and shown on the public page.
              </p>
              {suggestedInsights.length ? (
                <ul className="space-y-2 list-disc list-inside text-xs text-gray-200">
                  {suggestedInsights.map((line, idx) => (
                    <li key={idx}>{line}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-400">
                  Not enough data yet to generate insights. Add more players and stats to unlock this section.
                </p>
              )}
            </div>

            {publishedStats && (
              <div className="glass-effect rounded-xl p-6 text-xs text-gray-300">
                <h2 className="text-sm font-semibold text-white mb-2">Current published snapshot</h2>
                <p className="mb-1">
                  Fans are currently seeing this snapshot on the public stats page.
                </p>
                {publishedStats.leaders?.topRunScorers?.[0] && (
                  <p>
                    Top run scorer:&nbsp;
                    <span className="font-semibold text-ipl-gold">
                      {publishedStats.leaders.topRunScorers[0].name}
                    </span>
                  </p>
                )}
                {publishedStats.leaders?.topWicketTakers?.[0] && (
                  <p>
                    Top wicket taker:&nbsp;
                    <span className="font-semibold text-emerald-300">
                      {publishedStats.leaders.topWicketTakers[0].name}
                    </span>
                  </p>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

interface LeaderboardEditorProps {
  title: string;
  titleClassName?: string;
  valueClassName: string;
  entries: Player[];
  setEntries: (entries: Player[]) => void;
  allPlayers: Player[];
  formatValue: (player: Player) => string;
  suggestedEntries?: Player[];
}

function LeaderboardEditor({
  title,
  titleClassName,
  valueClassName,
  entries,
  setEntries,
  allPlayers,
  formatValue,
  suggestedEntries,
}: LeaderboardEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');

  const matchesSuggestions = useMemo(() => {
    if (!suggestedEntries || !suggestedEntries.length || !entries.length) {
      return false;
    }

    if (suggestedEntries.length !== entries.length) return false;

    return suggestedEntries.every((p, idx) => entries[idx]?.id === p.id);
  }, [suggestedEntries, entries]);

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setSelectedPlayerId(entries[index]?.id ?? '');
  };

  const startAdd = () => {
    setEditingIndex(entries.length);
    setSelectedPlayerId('');
  };

  const handleDelete = (index: number) => {
    const next = entries.filter((_, i) => i !== index);
    setEntries(next);
    setEditingIndex(null);
  };

  const handleSave = () => {
    if (editingIndex === null || !selectedPlayerId) {
      setEditingIndex(null);
      return;
    }

    const player = allPlayers.find((p) => p.id === selectedPlayerId);
    if (!player) {
      setEditingIndex(null);
      return;
    }

    const duplicateIndex = entries.findIndex((p) => p.id === player.id);
    if (duplicateIndex !== -1 && duplicateIndex !== editingIndex) {
      const updated = entries.filter((_, idx) => idx !== duplicateIndex);
      const next =
        editingIndex >= updated.length
          ? [...updated, player]
          : updated.map((existing, idx) =>
              idx === editingIndex ? player : existing
            );
      setEntries(next);
    } else {
      const next =
        editingIndex >= entries.length
          ? [...entries, player]
          : entries.map((existing, idx) =>
              idx === editingIndex ? player : existing
            );
      setEntries(next);
    }

    setEditingIndex(null);
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setSelectedPlayerId('');
  };

  return (
    <div className="space-y-2">
      <h3
        className={`font-semibold ${
          titleClassName ? titleClassName : 'text-white'
        }`}
      >
        {title}
      </h3>
      {suggestedEntries && suggestedEntries.length > 0 && (
        <p className="text-[10px] text-gray-400">
          {matchesSuggestions
            ? `Using auto suggestions (${entries.length}/${suggestedEntries.length} slots)`
            : `Using custom selection (${entries.length}/${suggestedEntries.length} slots)`}
        </p>
      )}
      <div className="space-y-1.5">
        {entries.map((player, index) => (
          <div
            key={player.id}
            className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2"
          >
            <div className="flex items-center gap-2 text-gray-300">
              <span>{index + 1}.</span>
              <span>{player.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`${valueClassName} font-semibold`}>
                {formatValue(player)}
              </span>
              <button
                type="button"
                onClick={() => startEdit(index)}
                className="px-2 py-0.5 rounded-md bg-white/10 text-[11px] text-gray-100 hover:bg-white/20 transition"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDelete(index)}
                className="px-2 py-0.5 rounded-md bg-red-500/20 text-[11px] text-red-200 hover:bg-red-500/30 transition"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {!entries.length && (
          <div className="text-xs text-gray-400">
            No players selected for this leaderboard yet.
          </div>
        )}
      </div>
      <div className="flex flex-col sm:flex-row gap-2 mt-2">
        <button
          type="button"
          onClick={startAdd}
          className="inline-flex items-center justify-center px-3 py-1.5 rounded-md bg-black/40 border border-white/15 text-[11px] text-gray-200 hover:bg-white/5 transition"
        >
          + Add player
        </button>
        {editingIndex !== null && (
          <div className="flex-1 flex flex-col sm:flex-row gap-2">
            <select
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
              className="flex-1 bg-black/60 border border-white/20 rounded-md px-3 py-1.5 text-[11px] text-white focus:outline-none focus:ring-2 focus:ring-ipl-gold/40"
            >
              <option value="">Select player</option>
              {allPlayers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={!selectedPlayerId}
                className="px-3 py-1.5 rounded-md bg-ipl-gold text-[11px] font-semibold text-black hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Save
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-1.5 rounded-md bg-white/10 text-[11px] text-gray-100 hover:bg-white/20 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
