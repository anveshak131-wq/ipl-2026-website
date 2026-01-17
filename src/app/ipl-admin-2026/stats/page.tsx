'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/data';
import type { Player, Team } from '@/types';
import { getQualificationCriteria, qualifiesForStat, getQualificationDescription } from '@/lib/statsQualifications';

interface TeamAggregate {
  team: Team | null;
  totalRuns: number;
  totalWickets: number;
  totalMatches: number;
  avgRunsPerMatch: number;
  avgStrikeRate: number;
}

interface DatasetSummary {
  key: string;
  rowCount?: number;
  uploadedAt?: string;
  uploadedBy?: string;
  seasonRange?: string;
  seasonCount?: number;
}

interface TossTeamStat {
  team: string;
  matches: number;
  tossesWon: number;
  tossWinPct: number;
  wins: number;
  matchesWhenWinToss: number;
  winsWhenWinToss: number;
  winPctWhenWinToss: number;
  matchesWhenLoseToss: number;
  winsWhenLoseToss: number;
  winPctWhenLoseToss: number;
  tossImpact: number;
}

interface TossVenueStat {
  team: string;
  venue: string;
  matches: number;
  matchesWhenWinToss: number;
  winsWhenWinToss: number;
  winPctWhenWinToss: number;
  matchesWhenLoseToss: number;
  winsWhenLoseToss: number;
  winPctWhenLoseToss: number;
  tossImpact: number;
}

interface TossAnalyticsSnapshot {
  datasetKeys: string[];
  totals: {
    totalMatches: number;
  };
  teams: TossTeamStat[];
  perVenue: Record<string, TossVenueStat[]>;
  generatedAt: string;
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
  tossAnalytics?: TossAnalyticsSnapshot;
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

  const [statsConfig, setStatsConfig] = useState({
    showTopRunScorers: true,
    showTopWicketTakers: true,
    showBestStrikeRates: true,
    showBestEconomyRates: true,
    showInsights: true,
  });
  const [isSavingStatsConfig, setIsSavingStatsConfig] = useState(false);
  const [statsConfigMessage, setStatsConfigMessage] = useState<string | null>(null);

  const [availableDatasets, setAvailableDatasets] = useState<DatasetSummary[]>([]);
  const [tossDatasetKeys, setTossDatasetKeys] = useState<string[]>([]);
  const [tossAnalytics, setTossAnalytics] = useState<TossAnalyticsSnapshot | null>(null);
  const [tossLoading, setTossLoading] = useState(false);
  const [tossError, setTossError] = useState<string | null>(null);
  const [tossDatasetWeights, setTossDatasetWeights] = useState<Record<string, number>>({});

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
          router.push('/ipl-admin-2026');
          return;
        }
        setIsAuthenticated(true);
        fetchData();
      } catch {
        router.push('/ipl-admin-2026');
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

        let initialTossDatasetKeys: string[] = [];

        if (settingsData) {
          if ((settingsData as any).publishedStats) {
            const published = (settingsData as any).publishedStats as PublishedStats;
            setPublishedStats(published);
            if (published.description) {
              setDescription(published.description);
            }
            if (published.defaultTeams) {
              if (published.defaultTeams.team1Id)
                team1Id = published.defaultTeams.team1Id;
              if (published.defaultTeams.team2Id)
                team2Id = published.defaultTeams.team2Id;
            }

            if (published.tossAnalytics) {
              setTossAnalytics(published.tossAnalytics);
              if (published.tossAnalytics.datasetKeys?.length) {
                initialTossDatasetKeys = published.tossAnalytics.datasetKeys;
              }
            }
          }

          if ((settingsData as any).statsConfig) {
            const cfg = (settingsData as any).statsConfig as Partial<typeof statsConfig>;
            setStatsConfig((prev) => ({
              ...prev,
              ...cfg,
            }));
          }
        }

        if (team1Id) setSelectedTeam1Id(team1Id);
        if (team2Id) setSelectedTeam2Id(team2Id);

        try {
          const token =
            typeof window !== 'undefined'
              ? localStorage.getItem('adminToken') || localStorage.getItem('auth_token')
              : null;
          if (token) {
            const res = await fetch('/api/admin/datasets', {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            const data = await res.json().catch(() => null);
            if (res.ok && data?.datasets) {
              const list = data.datasets as DatasetSummary[];
              setAvailableDatasets(list);
              const initialWeights: Record<string, number> = {};
              for (const ds of list) {
                initialWeights[ds.key] = 100;
              }
              setTossDatasetWeights(initialWeights);
              if (initialTossDatasetKeys.length) {
                setTossDatasetKeys(initialTossDatasetKeys);
              } else if (list.length) {
                setTossDatasetKeys([list[0].key]);
              }
            }
          }
        } catch (error) {
          console.error('Failed to load datasets for toss analytics:', error);
        }
      } catch (error) {
        console.error('Failed to load data for admin stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const suggestedTopRunScorers = useMemo(() => {
    const criteria = getQualificationCriteria('orangeCap', currentLeague);
    return [...players]
      .filter((p) => qualifiesForStat(p, criteria, currentLeague))
      .sort((a, b) => b.stats.runs - a.stats.runs)
      .slice(0, 5);
  }, [players, currentLeague]);

  const suggestedTopWicketTakers = useMemo(() => {
    const criteria = getQualificationCriteria('purpleCap', currentLeague);
    return [...players]
      .filter((p) => qualifiesForStat(p, criteria, currentLeague))
      .sort((a, b) => b.stats.wickets - a.stats.wickets)
      .slice(0, 5);
  }, [players, currentLeague]);

  const suggestedBestStrikeRates = useMemo(() => {
    const criteria = getQualificationCriteria('bestStrikeRate', currentLeague);
    return [...players]
      .filter((p) => qualifiesForStat(p, criteria, currentLeague))
      .sort((a, b) => b.stats.strikeRate - a.stats.strikeRate)
      .slice(0, 5);
  }, [players, currentLeague]);

  const suggestedBestEconomyRates = useMemo(() => {
    const criteria = getQualificationCriteria('bestEconomy', currentLeague);
    return [...players]
      .filter((p) => qualifiesForStat(p, criteria, currentLeague) && p.stats.economy > 0)
      .sort((a, b) => a.stats.economy - b.stats.economy)
      .slice(0, 5);
  }, [players, currentLeague]);

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

    // Ensure all leaderboards have at least 5 players (fill from suggested if needed)
    let finalTopRuns = initialTopRuns.length ? initialTopRuns : suggestedTopRunScorers;
    if (finalTopRuns.length < 5 && suggestedTopRunScorers.length >= 5) {
      const existingIds = new Set(finalTopRuns.map(p => p.id));
      const additional = suggestedTopRunScorers
        .filter(p => !existingIds.has(p.id))
        .slice(0, 5 - finalTopRuns.length);
      finalTopRuns = [...finalTopRuns, ...additional].slice(0, 5);
    }
    updateTopRunScorers(finalTopRuns);

    let finalTopWickets = initialTopWickets.length ? initialTopWickets : suggestedTopWicketTakers;
    if (finalTopWickets.length < 5 && suggestedTopWicketTakers.length >= 5) {
      const existingIds = new Set(finalTopWickets.map(p => p.id));
      const additional = suggestedTopWicketTakers
        .filter(p => !existingIds.has(p.id))
        .slice(0, 5 - finalTopWickets.length);
      finalTopWickets = [...finalTopWickets, ...additional].slice(0, 5);
    }
    updateTopWicketTakers(finalTopWickets);

    let finalBestStrike = initialBestStrike.length ? initialBestStrike : suggestedBestStrikeRates;
    if (finalBestStrike.length < 5 && suggestedBestStrikeRates.length >= 5) {
      const existingIds = new Set(finalBestStrike.map(p => p.id));
      const additional = suggestedBestStrikeRates
        .filter(p => !existingIds.has(p.id))
        .slice(0, 5 - finalBestStrike.length);
      finalBestStrike = [...finalBestStrike, ...additional].slice(0, 5);
    }
    updateBestStrikeRates(finalBestStrike);
    // Ensure bestEconomyRates has 5 players (fill from suggested if needed)
    let finalBestEconomy = initialBestEconomy.length ? initialBestEconomy : suggestedBestEconomyRates;
    if (finalBestEconomy.length < 5 && suggestedBestEconomyRates.length >= 5) {
      // Fill up to 5 players from suggested list
      const existingIds = new Set(finalBestEconomy.map(p => p.id));
      const additional = suggestedBestEconomyRates
        .filter(p => !existingIds.has(p.id))
        .slice(0, 5 - finalBestEconomy.length);
      finalBestEconomy = [...finalBestEconomy, ...additional].slice(0, 5);
    }
    updateBestEconomyRates(finalBestEconomy);

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

  const effectiveTossWeightsLabel = useMemo(() => {
    if (!tossDatasetKeys.length) return '';

    const entries: { key: string; weight: number }[] = [];
    let weightSum = 0;

    for (const key of tossDatasetKeys) {
      const raw = tossDatasetWeights[key];
      const w = typeof raw === 'number' && raw > 0 ? raw : 100;
      entries.push({ key, weight: w });
      weightSum += w;
    }

    if (entries.length <= 1 || weightSum <= 0) return '';

    const parts = entries.map((entry) => {
      const pct = (entry.weight / weightSum) * 100;
      const rounded = Math.round(pct);
      return `${entry.key} ~ ${rounded}%`;
    });

    return `Effective weighting: ${parts.join(', ')}`;
  }, [tossDatasetKeys, tossDatasetWeights]);

  const tossLuckiestTeams = useMemo(() => {
    if (!tossAnalytics || !tossAnalytics.teams?.length) return [] as TossTeamStat[];
    const legacyTeams = [
      'rising pune supergiant',
      'rising pune supergiants',
      'gujarat lions',
      'deccan chargers',
      'kochi tuskers kerala',
    ];
    return [...tossAnalytics.teams]
      .filter((t) => {
        if (t.matches <= 0) return false;
        const name = (t.team || '').trim().toLowerCase();
        return !legacyTeams.includes(name);
      })
      .sort((a, b) => b.tossImpact - a.tossImpact)
      .slice(0, 6);
  }, [tossAnalytics]);

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
        tossAnalytics: tossAnalytics || undefined,
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

  const handleSaveStatsConfig = async () => {
    setIsSavingStatsConfig(true);
    setStatsConfigMessage(null);
    try {
      await api.updateSettings({ statsConfig });
      setStatsConfigMessage('Stats display settings saved.');
    } catch (error) {
      console.error('Failed to save stats display settings:', error);
      setStatsConfigMessage('Failed to save display settings.');
    } finally {
      setIsSavingStatsConfig(false);
      setTimeout(() => setStatsConfigMessage(null), 4000);
    }
  };

  const updateTossDatasetWeight = (key: string, value: number) => {
    setTossDatasetWeights((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const toggleTossDatasetKey = (key: string) => {
    setTossDatasetKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handleRunTossAnalytics = async () => {
    setTossError(null);
    if (!tossDatasetKeys.length) {
      setTossError('Select at least one dataset to run toss analytics.');
      return;
    }

    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('adminToken') || localStorage.getItem('auth_token')
        : null;

    if (!token) {
      setTossError('Admin session expired. Please sign in again.');
      return;
    }

    setTossLoading(true);
    try {
      const weightsPayload: Record<string, number> = {};
      tossDatasetKeys.forEach((key) => {
        const w = tossDatasetWeights[key];
        if (typeof w === 'number' && w > 0) {
          weightsPayload[key] = w;
        }
      });

      const res = await fetch('/api/admin/analytics/toss', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ datasetKeys: tossDatasetKeys, datasetWeights: weightsPayload }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setTossError(data?.error || 'Failed to compute toss analytics.');
        setTossAnalytics(null);
        return;
      }

      const snapshot: TossAnalyticsSnapshot = {
        datasetKeys: Array.isArray(data.datasetKeys)
          ? data.datasetKeys
          : tossDatasetKeys,
        totals: data.totals || { totalMatches: 0 },
        teams: Array.isArray(data.teams) ? data.teams : [],
        perVenue: data.perVenue || {},
        generatedAt: new Date().toISOString(),
      };

      setTossAnalytics(snapshot);
    } catch (error) {
      console.error('Toss analytics error:', error);
      setTossError('Unexpected error while computing toss analytics.');
      setTossAnalytics(null);
    } finally {
      setTossLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-ipl-dark">
        <div className="text-white">Loading stats overview...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 space-y-6 overflow-y-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="mb-2 text-xs text-gray-400 flex items-center gap-1">
              <button
                type="button"
                onClick={() => router.push('/ipl-admin-2026/dashboard')}
                className="hover:text-ipl-gold transition-colors"
              >
                Admin
              </button>
              <span className="text-gray-600">/</span>
              <button
                type="button"
                onClick={() => router.push('/ipl-admin-2026/stats')}
                className="hover:text-ipl-gold transition-colors"
              >
                Stats
              </button>
              <span className="text-gray-600">/</span>
              <span className="text-gray-300">Stats Hub</span>
            </div>
            <h1 className="text-4xl font-black text-white mb-2 bg-gradient-to-r from-white via-ipl-gold to-white bg-clip-text text-transparent">
              Stats & Records Hub
            </h1>
            <p className="text-sm text-gray-300 max-w-xl">
              Control what fans see on the public <span className="font-semibold text-ipl-gold">/stats</span> page.
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

        {/* Quick Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="glass-effect rounded-xl p-4 border border-blue-500/30">
            <div className="text-xs text-gray-400 mb-1">Total Players</div>
            <div className="text-2xl font-black text-blue-400">{players.length}</div>
          </div>
          <div className="glass-effect rounded-xl p-4 border border-purple-500/30">
            <div className="text-xs text-gray-400 mb-1">Total Teams</div>
            <div className="text-2xl font-black text-purple-400">{teams.length}</div>
          </div>
          <div className="glass-effect rounded-xl p-4 border border-orange-500/30">
            <div className="text-xs text-gray-400 mb-1">Top Run Scorer</div>
            <div className="text-lg font-bold text-orange-400 truncate">
              {topRunScorers[0]?.name || 'N/A'}
            </div>
            <div className="text-xs text-gray-500">{topRunScorers[0]?.stats.runs || 0} runs</div>
          </div>
          <div className="glass-effect rounded-xl p-4 border border-emerald-500/30">
            <div className="text-xs text-gray-400 mb-1">Top Wicket Taker</div>
            <div className="text-lg font-bold text-emerald-400 truncate">
              {topWicketTakers[0]?.name || 'N/A'}
            </div>
            <div className="text-xs text-gray-500">{topWicketTakers[0]?.stats.wickets || 0} wickets</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr,1fr] gap-6">
          <section className="space-y-4">
            <div className="glass-effect rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4 gap-3">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Auto-computed Season Leaders</h2>
                  <p className="text-xs text-gray-400">
                    Review and edit leaderboards before publishing
                  </p>
                </div>
                <button
                  type="button"
                  onClick={rebuildLeaderboardsFromStats}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-ipl-gold to-ipl-purple text-sm font-semibold text-white hover:shadow-lg hover:shadow-ipl-gold/30 transition-all"
                >
                  Rebuild
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
                  qualificationText={getQualificationDescription('orangeCap', currentLeague, false)}
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
                  qualificationText={getQualificationDescription('purpleCap', currentLeague, false)}
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
                  qualificationText={getQualificationDescription('bestStrikeRate', currentLeague, false)}
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
                  qualificationText={getQualificationDescription('bestEconomy', currentLeague, false)}
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
              <h2 className="text-lg font-semibold text-white mb-2">Luck &amp; toss analytics</h2>
              <p className="text-xs text-gray-400 mb-3">
                Select one or more uploaded match datasets, then run toss analytics to see which
                teams benefit most from the toss.
              </p>
              <p className="text-[11px] text-gray-500 mb-3">
                When combining multiple datasets, adjust the weight sliders so that newer or more
                trusted seasons contribute more strongly. We normalise these values automatically
                when running the analytics.
              </p>
              {availableDatasets.length ? (
                <div className="space-y-3 text-xs text-gray-200">
                  <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                    {availableDatasets.map((ds) => {
                      const checked = tossDatasetKeys.includes(ds.key);
                      return (
                        <label
                          key={ds.key}
                          className="flex flex-col gap-1 px-2 py-1 rounded-md hover:bg-white/5 cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-2 w-full">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleTossDatasetKey(ds.key)}
                                className="h-3.5 w-3.5 accent-ipl-gold"
                              />
                              <span className="font-mono text-[11px]">{ds.key}</span>
                            </div>
                            <div className="text-[10px] text-gray-400 text-right space-y-0.5">
                              <div>
                                {typeof ds.rowCount === 'number'
                                  ? `${ds.rowCount} rows`
                                  : 'row count unknown'}
                              </div>
                              {ds.seasonRange && (
                                <div>
                                  Seasons: {ds.seasonRange}
                                  {typeof ds.seasonCount === 'number'
                                    ? ` (${ds.seasonCount} season${ds.seasonCount === 1 ? '' : 's'})`
                                    : ''}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 w-full pl-6 pr-1">
                            <input
                              type="range"
                              min={50}
                              max={150}
                              step={10}
                              value={tossDatasetWeights[ds.key] ?? 100}
                              onChange={(e) =>
                                updateTossDatasetWeight(ds.key, Number(e.target.value))
                              }
                              className="flex-1 h-1.5 cursor-pointer accent-ipl-gold"
                            />
                            <span className="text-[10px] text-gray-300 whitespace-nowrap">
                              {((tossDatasetWeights[ds.key] ?? 100) / 100).toFixed(2)}x
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleRunTossAnalytics}
                      disabled={tossLoading || !tossDatasetKeys.length}
                      className="inline-flex items-center justify-center px-3 py-1.5 rounded-md bg-ipl-gold text-[11px] font-semibold text-black hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {tossLoading ? 'Running analytics…' : 'Run toss analytics'}
                    </button>
                    {tossAnalytics && (
                      <div className="text-[11px] text-gray-300 space-y-0.5">
                        <p>
                          Analysed {tossAnalytics.totals.totalMatches} matches from{' '}
                          {tossAnalytics.datasetKeys.join(', ')}
                        </p>
                        {effectiveTossWeightsLabel && (
                          <p className="text-gray-400">{effectiveTossWeightsLabel}</p>
                        )}
                      </div>
                    )}
                  </div>
                  {tossError && (
                    <p className="text-[11px] text-red-300">{tossError}</p>
                  )}
                  {tossLuckiestTeams.length > 0 && (
                    <div className="mt-2 border-t border-white/10 pt-2">
                      <p className="text-[11px] text-gray-400 mb-1">
                        Luckiest teams by toss impact (win % after winning toss minus after losing
                        toss).
                      </p>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {tossLuckiestTeams.map((team) => (
                          <div
                            key={team.team}
                            className="flex items-center justify-between rounded-md bg-black/30 border border-white/10 px-2 py-1.5"
                          >
                            <div className="text-[11px] text-gray-100">
                              {team.team}{' '}
                              <span className="text-gray-400">
                                ({team.matches} matches)
                              </span>
                            </div>
                            <div className="text-right text-[11px]">
                              <div className="text-ipl-gold font-semibold">
                                Toss impact {(team.tossImpact * 100).toFixed(1)}%
                              </div>
                              <div className="text-gray-400">
                                Win% win toss{' '}
                                {(team.winPctWhenWinToss * 100).toFixed(1)}%
                                , lose toss{' '}
                                {(team.winPctWhenLoseToss * 100).toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-400">
                  No datasets found yet. Upload match CSVs in the Data Lab tab to enable toss
                  analytics.
                </p>
              )}
            </div>

            <div className="glass-effect rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-2">Stats display toggles</h2>
              <p className="text-xs text-gray-400 mb-3">
                Choose which leaderboards and insights appear on the public{' '}
                <span className="font-semibold">/stats</span> page.
              </p>
              {statsConfigMessage && (
                <p className="text-[11px] mb-2 text-emerald-300">{statsConfigMessage}</p>
              )}
              <div className="space-y-2 text-xs text-gray-200">
                <label className="flex items-center justify-between gap-3">
                  <span>Show Orange Cap (runs)</span>
                  <input
                    type="checkbox"
                    checked={statsConfig.showTopRunScorers}
                    onChange={(e) =>
                      setStatsConfig((prev) => ({
                        ...prev,
                        showTopRunScorers: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 accent-ipl-gold"
                  />
                </label>
                <label className="flex items-center justify-between gap-3">
                  <span>Show Purple Cap (wickets)</span>
                  <input
                    type="checkbox"
                    checked={statsConfig.showTopWicketTakers}
                    onChange={(e) =>
                      setStatsConfig((prev) => ({
                        ...prev,
                        showTopWicketTakers: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 accent-emerald-400"
                  />
                </label>
                <label className="flex items-center justify-between gap-3">
                  <span>Show best strike rates</span>
                  <input
                    type="checkbox"
                    checked={statsConfig.showBestStrikeRates}
                    onChange={(e) =>
                      setStatsConfig((prev) => ({
                        ...prev,
                        showBestStrikeRates: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 accent-ipl-gold"
                  />
                </label>
                <label className="flex items-center justify-between gap-3">
                  <span>Show best economy</span>
                  <input
                    type="checkbox"
                    checked={statsConfig.showBestEconomyRates}
                    onChange={(e) =>
                      setStatsConfig((prev) => ({
                        ...prev,
                        showBestEconomyRates: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 accent-emerald-400"
                  />
                </label>
                <label className="flex items-center justify-between gap-3">
                  <span>Show insights section</span>
                  <input
                    type="checkbox"
                    checked={statsConfig.showInsights}
                    onChange={(e) =>
                      setStatsConfig((prev) => ({
                        ...prev,
                        showInsights: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 accent-ipl-gold"
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={handleSaveStatsConfig}
                disabled={isSavingStatsConfig}
                className="mt-3 inline-flex items-center justify-center px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-[11px] text-white disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSavingStatsConfig ? 'Saving…' : 'Save display settings'}
              </button>
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
  qualificationText?: string;
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
  qualificationText,
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
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3
          className={`font-semibold ${
            titleClassName ? titleClassName : 'text-white'
          }`}
        >
          {title}
        </h3>
      </div>
      {qualificationText && (
        <p className="text-[10px] text-gray-500 mb-1 italic">
          Qualification: {qualificationText}
        </p>
      )}
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
