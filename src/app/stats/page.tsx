'use client';

import { useEffect, useMemo, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AuroraBackground from '@/components/ui/AuroraBackground';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Icon from '@/components/ui/Icon';
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

export default function StatsPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishedStats, setPublishedStats] = useState<PublishedStats | null>(null);
  const [selectedTeam1Id, setSelectedTeam1Id] = useState<string>('');
  const [selectedTeam2Id, setSelectedTeam2Id] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
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
          if (published.defaultTeams) {
            if (published.defaultTeams.team1Id) {
              team1Id = published.defaultTeams.team1Id;
            }
            if (published.defaultTeams.team2Id) {
              team2Id = published.defaultTeams.team2Id;
            }
          }
        }

        if (team1Id) setSelectedTeam1Id(team1Id);
        if (team2Id) setSelectedTeam2Id(team2Id);
      } catch (err) {
        console.error('Failed to load stats data:', err);
        setError('Failed to load stats. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const computedTopRunScorers = useMemo(() => {
    return [...players]
      .sort((a, b) => b.stats.runs - a.stats.runs)
      .slice(0, 5);
  }, [players]);

  const computedTopWicketTakers = useMemo(() => {
    return [...players]
      .filter((p) => p.stats.wickets > 0)
      .sort((a, b) => b.stats.wickets - a.stats.wickets)
      .slice(0, 5);
  }, [players]);

  const computedBestStrikeRates = useMemo(() => {
    return [...players]
      .filter((p) => p.stats.runs >= 300)
      .sort((a, b) => b.stats.strikeRate - a.stats.strikeRate)
      .slice(0, 5);
  }, [players]);

  const computedBestEconomyRates = useMemo(() => {
    return [...players]
      .filter((p) => p.stats.wickets >= 20 && p.stats.economy > 0)
      .sort((a, b) => a.stats.economy - b.stats.economy)
      .slice(0, 5);
  }, [players]);

  const topRunScorers = useMemo(
    () =>
      publishedStats?.leaders?.topRunScorers?.length
        ? publishedStats.leaders.topRunScorers
        : computedTopRunScorers,
    [publishedStats, computedTopRunScorers]
  );

  const topWicketTakers = useMemo(
    () =>
      publishedStats?.leaders?.topWicketTakers?.length
        ? publishedStats.leaders.topWicketTakers
        : computedTopWicketTakers,
    [publishedStats, computedTopWicketTakers]
  );

  const bestStrikeRates = useMemo(
    () =>
      publishedStats?.leaders?.bestStrikeRates?.length
        ? publishedStats.leaders.bestStrikeRates
        : computedBestStrikeRates,
    [publishedStats, computedBestStrikeRates]
  );

  const bestEconomyRates = useMemo(
    () =>
      publishedStats?.leaders?.bestEconomyRates?.length
        ? publishedStats.leaders.bestEconomyRates
        : computedBestEconomyRates,
    [publishedStats, computedBestEconomyRates]
  );

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

    return {
      totalRuns,
      totalMatches,
      avgRunsPerMatch,
      avgStrikeRate,
    };
  }, [players]);

  const findPublishedTeamAggregate = (teamId: string): TeamAggregate | null => {
    if (!publishedStats?.teamAggregates || !publishedStats.teamAggregates.length) {
      return null;
    }
    const found = publishedStats.teamAggregates.find(
      (agg) => agg.team && agg.team.id === teamId
    );
    return found || null;
  };

  const selectedTeam1Agg = useMemo(
    () => {
      if (!selectedTeam1Id) return null;
      const publishedAgg = findPublishedTeamAggregate(selectedTeam1Id);
      if (publishedAgg) return publishedAgg;
      return computeTeamAggregate(selectedTeam1Id);
    },
    [selectedTeam1Id, publishedStats, players, teams]
  );

  const selectedTeam2Agg = useMemo(
    () => {
      if (!selectedTeam2Id) return null;
      const publishedAgg = findPublishedTeamAggregate(selectedTeam2Id);
      if (publishedAgg) return publishedAgg;
      return computeTeamAggregate(selectedTeam2Id);
    },
    [selectedTeam2Id, publishedStats, players, teams]
  );

  const insights = useMemo(() => {
    const points: string[] = [];

    if (topRunScorers.length > 1) {
      const leader = topRunScorers[0];
      const runnerUp = topRunScorers[1];
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
    topRunScorers,
    selectedTeam1Agg,
    selectedTeam2Agg,
    leagueBattingSummary.avgStrikeRate,
  ]);

  const displayInsights = useMemo(() => {
    if (publishedStats?.insights && publishedStats.insights.length) {
      return publishedStats.insights;
    }
    return insights;
  }, [publishedStats, insights]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center bg-ipl-dark">
          <LoadingSpinner size="lg" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center bg-ipl-dark px-4">
          <div className="max-w-md w-full rounded-2xl bg-white/5 border border-red-500/40 p-6 text-center">
            <p className="text-red-300 font-semibold mb-2">{error}</p>
            <p className="text-gray-300 text-sm">
              This page uses aggregated data from players and teams. Please refresh
              the page or try again later.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-ipl-dark">
      <Navbar />

      <main className="relative flex-1 py-12 overflow-hidden">
        <AuroraBackground />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Hero / Header */}
          <section className="space-y-4 animate-slide-up">
            <div className="inline-flex items-center space-x-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/20 text-ipl-gold flex items-center gap-2">
                <Icon name="stats" size={16} />
                STATS & RECORDS HUB
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight">
              Season Leaders &
              <span className="block bg-gradient-to-r from-ipl-blue-light via-ipl-gold to-ipl-purple bg-clip-text text-transparent mt-1">
                Deep IPL Insights
              </span>
            </h1>
            <p className="text-gray-300 text-base md:text-lg max-w-2xl">
              Explore Orange Cap and Purple Cap races, best strike rates and
              bowling economies, plus smart comparisons between your favourite
              teams.
            </p>
            {publishedStats?.lastUpdated && (
              <p className="text-xs text-gray-400">
                Snapshot published by admin on{' '}
                {new Date(publishedStats.lastUpdated).toLocaleString('en-US', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                .
              </p>
            )}
          </section>

          {/* Season Leaders */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Batting leaders */}
            <div className="rounded-3xl bg-white/5 border border-white/10 p-6 backdrop-blur-md shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-ipl-gold to-ipl-purple flex items-center justify-center">
                    <Icon name="trophy" size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Orange Cap Race</h2>
                    <p className="text-xs text-gray-400">
                      Top run scorers in the tournament
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {topRunScorers.map((p, index) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-2xl bg-black/20 border border-white/10 px-4 py-3 hover:border-ipl-gold/50 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ipl-gold/80 to-ipl-purple/80 flex items-center justify-center text-xs font-bold text-white">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {p.role} • {p.stats.matches} matches
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold text-ipl-gold">
                        {p.stats.runs} runs
                      </div>
                      <div className="text-[11px] text-gray-400">
                        SR {p.stats.strikeRate.toFixed(1)} • Avg {p.stats.average.toFixed(1)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bowling leaders */}
            <div className="rounded-3xl bg-white/5 border border-white/10 p-6 backdrop-blur-md shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <Icon name="cricket" size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Purple Cap Race</h2>
                    <p className="text-xs text-gray-400">
                      Leading wicket takers and economy masters
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {topWicketTakers.map((p, index) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-2xl bg-black/20 border border-white/10 px-4 py-3 hover:border-emerald-400/50 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-xs font-bold text-white">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {p.role} • {p.stats.matches} matches
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold text-emerald-300">
                        {p.stats.wickets} wickets
                      </div>
                      <div className="text-[11px] text-gray-400">
                        Eco {p.stats.economy.toFixed(2)} • Best {p.stats.bestBowling}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Strike rate & economy tables */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-3xl bg-white/5 border border-white/10 p-6 backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Best Strike Rates</h2>
                  <p className="text-xs text-gray-400">
                    Minimum 300 runs in the tournament
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {bestStrikeRates.map((p, index) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-2xl bg-black/20 border border-white/10 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-6 text-center">
                        {index + 1}.
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {p.stats.runs} runs • {p.stats.matches} matches
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-ipl-gold">
                        SR {p.stats.strikeRate.toFixed(1)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-white/5 border border-white/10 p-6 backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Best Economy (Qualifiers)</h2>
                  <p className="text-xs text-gray-400">
                    Minimum 20 wickets in the tournament
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {bestEconomyRates.map((p, index) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-2xl bg-black/20 border border-white/10 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-6 text-center">
                        {index + 1}.
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {p.stats.wickets} wickets • {p.stats.matches} matches
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-300">
                        Eco {p.stats.economy.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Team comparison */}
          <section className="rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6 md:p-8 backdrop-blur-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Team Comparison</h2>
                <p className="text-sm text-gray-300 max-w-xl">
                  Pick any two teams to compare their squad strength based on total
                  runs, wickets and average strike rates.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={selectedTeam1Id}
                  onChange={(e) => setSelectedTeam1Id(e.target.value)}
                  className="bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-ipl-gold/40"
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
                  className="bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-ipl-gold/40"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TeamComparisonCard aggregate={selectedTeam1Agg} label="Team 1" />
              <TeamComparisonCard aggregate={selectedTeam2Agg} label="Team 2" />
            </div>
          </section>

          {/* AI-style insights */}
          <section className="rounded-3xl bg-white/5 border border-white/10 p-6 md:p-8 backdrop-blur-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-ipl-blue-light to-ipl-purple flex items-center justify-center">
                <Icon name="news" size={18} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Insights from the numbers</h2>
                <p className="text-xs text-gray-400">
                  Light-weight AI-style summaries generated from current squad
                  statistics.
                </p>
              </div>
            </div>

            {displayInsights.length ? (
              <ul className="space-y-2 list-disc list-inside text-sm text-gray-200">
                {displayInsights.map((line, idx) => (
                  <li key={idx}>{line}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 text-sm">
                Not enough data yet to generate meaningful insights. Once more
                players and stats are available, this section will light up with
                stories.
              </p>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function TeamComparisonCard({
  aggregate,
  label,
}: {
  aggregate: TeamAggregate | null;
  label: string;
}) {
  if (!aggregate || !aggregate.team) {
    return (
      <div className="rounded-2xl bg-black/30 border border-white/10 p-5 flex items-center justify-center text-sm text-gray-400">
        Select {label} to see squad statistics.
      </div>
    );
  }

  const { team, totalRuns, totalWickets, totalMatches, avgRunsPerMatch, avgStrikeRate } =
    aggregate;

  return (
    <div className="rounded-2xl bg-black/40 border border-white/10 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-gray-400">
            {label}
          </div>
          <div className="text-xl font-bold text-white flex items-center gap-2">
            <span>{team.shortName}</span>
          </div>
          <div className="text-[11px] text-gray-400">{team.name}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-white/5 border border-white/10 p-3">
          <div className="text-[11px] text-gray-400 mb-1">Squad runs</div>
          <div className="text-lg font-bold text-ipl-gold">{totalRuns}</div>
          <div className="text-[11px] text-gray-400">across {totalMatches} matches</div>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 p-3">
          <div className="text-[11px] text-gray-400 mb-1">Squad wickets</div>
          <div className="text-lg font-bold text-emerald-300">{totalWickets}</div>
          <div className="text-[11px] text-gray-400">all bowlers combined</div>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 p-3">
          <div className="text-[11px] text-gray-400 mb-1">Avg runs / match</div>
          <div className="text-lg font-bold text-white">{avgRunsPerMatch.toFixed(1)}</div>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 p-3">
          <div className="text-[11px] text-gray-400 mb-1">Avg strike rate</div>
          <div className="text-lg font-bold text-white">{avgStrikeRate.toFixed(1)}</div>
        </div>
      </div>
    </div>
  );
}
