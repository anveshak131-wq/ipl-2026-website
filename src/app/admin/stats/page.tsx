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

export default function AdminStatsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [publishedStats, setPublishedStats] = useState<PublishedStats | null>(null);

  const [description, setDescription] = useState('');
  const [selectedTeam1Id, setSelectedTeam1Id] = useState('');
  const [selectedTeam2Id, setSelectedTeam2Id] = useState('');

  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

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

    if (suggestedTopRunScorers.length > 1) {
      const leader = suggestedTopRunScorers[0];
      const runnerUp = suggestedTopRunScorers[1];
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
    selectedTeam1Agg,
    selectedTeam2Agg,
    leagueBattingSummary.avgStrikeRate,
  ]);

  const handlePublish = async () => {
    if (!players.length || !teams.length) return;
    setIsPublishing(true);
    setPublishSuccess(null);
    setPublishError(null);

    try {
      const teamAggregates: TeamAggregate[] = teams.map((team) =>
        computeTeamAggregate(team.id)
      );

      const snapshot: PublishedStats = {
        description: description || undefined,
        leaders: {
          topRunScorers: suggestedTopRunScorers,
          topWicketTakers: suggestedTopWicketTakers,
          bestStrikeRates: suggestedBestStrikeRates,
          bestEconomyRates: suggestedBestEconomyRates,
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
            <h1 className="text-3xl font-bold text-white mb-1">Stats & Records Hub</h1>
            <p className="text-sm text-gray-300 max-w-xl">
              Control what fans see on the public <span className="font-semibold">/stats</span> page.
              Review auto-computed leaderboards, then publish a snapshot when you are ready.
            </p>
            {publishedStats?.lastUpdated && (
              <p className="text-xs text-gray-400 mt-1">
                Last published snapshot:{' '}
                {new Date(publishedStats.lastUpdated).toLocaleString('en-US', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
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
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr,1fr] gap-6">
          <section className="space-y-4">
            <div className="glass-effect rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-3">Auto-computed season leaders</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <h3 className="font-semibold text-ipl-gold mb-2">Orange Cap (Runs)</h3>
                  <div className="space-y-1.5">
                    {suggestedTopRunScorers.map((p, index) => (
                      <div key={p.id} className="flex justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                        <span className="text-gray-300">
                          {index + 1}. {p.name}
                        </span>
                        <span className="text-ipl-gold font-semibold">{p.stats.runs}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-emerald-300 mb-2">Purple Cap (Wickets)</h3>
                  <div className="space-y-1.5">
                    {suggestedTopWicketTakers.map((p, index) => (
                      <div key={p.id} className="flex justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                        <span className="text-gray-300">
                          {index + 1}. {p.name}
                        </span>
                        <span className="text-emerald-300 font-semibold">{p.stats.wickets}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">Best Strike Rates</h3>
                  <div className="space-y-1.5">
                    {suggestedBestStrikeRates.map((p, index) => (
                      <div key={p.id} className="flex justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                        <span className="text-gray-300">
                          {index + 1}. {p.name}
                        </span>
                        <span className="text-ipl-gold font-semibold">SR {p.stats.strikeRate.toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">Best Economy</h3>
                  <div className="space-y-1.5">
                    {suggestedBestEconomyRates.map((p, index) => (
                      <div key={p.id} className="flex justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                        <span className="text-gray-300">
                          {index + 1}. {p.name}
                        </span>
                        <span className="text-emerald-300 font-semibold">Eco {p.stats.economy.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-effect rounded-xl p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-white mb-1">Default team comparison</h2>
                  <p className="text-xs text-gray-400">
                    Choose which two teams should be pre-selected on the public comparison widget.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 text-xs">
                  <select
                    value={selectedTeam1Id}
                    onChange={(e) => setSelectedTeam1Id(e.target.value)}
                    className="bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-ipl-gold/40"
                  >
                    <option value="">Select Team 1</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.shortName}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedTeam2Id}
                    onChange={(e) => setSelectedTeam2Id(e.target.value)}
                    className="bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-ipl-gold/40"
                  >
                    <option value="">Select Team 2</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.shortName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <TeamAggregateCard aggregate={selectedTeam1Agg} label="Team 1" />
                <TeamAggregateCard aggregate={selectedTeam2Agg} label="Team 2" />
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

function TeamAggregateCard({
  aggregate,
  label,
}: {
  aggregate: TeamAggregate | null;
  label: string;
}) {
  if (!aggregate || !aggregate.team) {
    return (
      <div className="rounded-lg bg-black/40 border border-white/10 p-4 text-xs text-gray-400 flex items-center justify-center">
        Select {label} to preview comparison.
      </div>
    );
  }

  const { team, totalRuns, totalWickets, totalMatches, avgRunsPerMatch, avgStrikeRate } =
    aggregate;

  return (
    <div className="rounded-lg bg-black/40 border border-white/10 p-4 space-y-3 text-xs">
      <div>
        <div className="text-[10px] uppercase tracking-wide text-gray-400">{label}</div>
        <div className="text-sm font-semibold text-white flex items-center gap-2">
          <span>{team.shortName}</span>
        </div>
        <div className="text-[11px] text-gray-400">{team.name}</div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-md bg-white/5 border border-white/10 p-2">
          <div className="text-[10px] text-gray-400 mb-1">Squad runs</div>
          <div className="text-sm font-bold text-ipl-gold">{totalRuns}</div>
          <div className="text-[10px] text-gray-400">across {totalMatches} matches</div>
        </div>
        <div className="rounded-md bg-white/5 border border-white/10 p-2">
          <div className="text-[10px] text-gray-400 mb-1">Squad wickets</div>
          <div className="text-sm font-bold text-emerald-300">{totalWickets}</div>
          <div className="text-[10px] text-gray-400">all bowlers combined</div>
        </div>
        <div className="rounded-md bg-white/5 border border-white/10 p-2">
          <div className="text-[10px] text-gray-400 mb-1">Avg runs / match</div>
          <div className="text-sm font-bold text-white">{avgRunsPerMatch.toFixed(1)}</div>
        </div>
        <div className="rounded-md bg-white/5 border border-white/10 p-2">
          <div className="text-[10px] text-gray-400 mb-1">Avg strike rate</div>
          <div className="text-sm font-bold text-white">{avgStrikeRate.toFixed(1)}</div>
        </div>
      </div>
    </div>
  );
}
