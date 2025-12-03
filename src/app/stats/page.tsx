'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AuroraBackground from '@/components/ui/AuroraBackground';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Icon from '@/components/ui/Icon';
import { api } from '@/lib/data';
import { useLeague } from '@/contexts/LeagueContext';
import type { Player, Team } from '@/types';
import AnimatedSection from '@/components/ui/AnimatedSection';
import GradientText from '@/components/ui/GradientText';
import GlassCard from '@/components/ui/GlassCard';

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

type StatsTabKey = 'overview' | 'batting' | 'bowling' | 'teams' | 'toss';

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

function getBattingFormLabel(p: Player): 'Hot' | 'Consistent' | 'Cooling' {
  const matches = p.stats.matches || 0;
  const runs = p.stats.runs || 0;
  const strikeRate = p.stats.strikeRate || 0;
  const runsPerMatch = matches > 0 ? runs / matches : 0;

  if (runsPerMatch >= 45 && strikeRate >= 140) return 'Hot';
  if (runsPerMatch >= 30 && strikeRate >= 125) return 'Consistent';
  return 'Cooling';
}

function getBattingContextLine(p: Player): string {
  const matches = p.stats.matches || 0;
  const runs = p.stats.runs || 0;
  const strikeRate = p.stats.strikeRate || 0;
  const boundaries = (p.stats.fours || 0) + (p.stats.sixes || 0);

  if (matches > 0 && runs > 0) {
    const runsPerMatch = runs / matches;
    const projected = Math.round(((runsPerMatch * 14) / 50)) * 50;
    if (projected > 0) {
      return `On track to cross around ${projected} runs if this pace continues.`;
    }
  }

  if (strikeRate > 0 && boundaries > 0 && runs > 0) {
    const ballsFaced = (runs * 100) / strikeRate;
    const ballsPerBoundary = ballsFaced / boundaries;
    if (ballsPerBoundary > 0) {
      return `Strikes a four or six roughly every ${ballsPerBoundary.toFixed(0)} balls.`;
    }
  }

  return '';
}

function getBowlingFormLabel(p: Player): 'Hot' | 'Consistent' | 'Cooling' {
  const matches = p.stats.matches || 0;
  const wickets = p.stats.wickets || 0;
  const economy = p.stats.economy || 0;
  const wicketsPerMatch = matches > 0 ? wickets / matches : 0;

  if (wicketsPerMatch >= 2 || (economy > 0 && economy <= 7)) return 'Hot';
  if (wicketsPerMatch >= 1.2 || (economy > 0 && economy <= 8.5)) return 'Consistent';
  return 'Cooling';
}

function getBowlingContextLine(p: Player): string {
  const economy = p.stats.economy || 0;
  const bowlingAverage = p.stats.bowlingAverage || 0;

  if (economy > 0 && bowlingAverage > 0) {
    const oversPerWicket = bowlingAverage / economy;
    const ballsPerWicket = oversPerWicket * 6;
    if (ballsPerWicket > 0) {
      return `Strikes once every about ${ballsPerWicket.toFixed(0)} balls on average.`;
    }
  }

  const matches = p.stats.matches || 0;
  const wickets = p.stats.wickets || 0;
  if (matches > 0 && wickets > 0) {
    const wicketsPerMatch = wickets / matches;
    return `Takes around ${wicketsPerMatch.toFixed(1)} wickets per match.`;
  }

  return '';
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
  
  // All hooks must be called before any conditional returns
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishedStats, setPublishedStats] = useState<PublishedStats | null>(null);
  const [selectedTeam1Id, setSelectedTeam1Id] = useState<string>('');
  const [selectedTeam2Id, setSelectedTeam2Id] = useState<string>('');
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const [statsConfig, setStatsConfig] = useState({
    showTopRunScorers: true,
    showTopWicketTakers: true,
    showBestStrikeRates: true,
    showBestEconomyRates: true,
    showInsights: true,
  });
  const [activeStatsTab, setActiveStatsTab] = useState<StatsTabKey>('overview');
  const [leadersRange, setLeadersRange] = useState<'season' | 'recent'>('season');
  const [leadersLimit, setLeadersLimit] = useState<10 | 50>(10);
  
  // Redirect WPL users away from stats page
  useEffect(() => {
    if (currentLeague === 'wpl') {
      router.push('/');
    }
  }, [currentLeague, router]);

  useEffect(() => {
    // Only fetch data if not WPL
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

        let team1Id = '';
        let team2Id = '';

        if (teamsData && teamsData.length >= 2) {
          team1Id = teamsData[0].id;
          team2Id = teamsData[1].id;
        } else if (teamsData && teamsData.length === 1) {
          team1Id = teamsData[0].id;
        }

        if (settingsData) {
          if ((settingsData as any).publishedStats) {
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
      } catch (err) {
        console.error('Failed to load stats data:', err);
        setError('Failed to load stats. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentLeague]); // Re-fetch when league changes

  const computedTopRunScorers = useMemo(() => {
    return [...players]
      .sort((a, b) => b.stats.runs - a.stats.runs)
      .slice(0, 50);
  }, [players]);

  const computedTopWicketTakers = useMemo(() => {
    return [...players]
      .filter((p) => p.stats.wickets > 0)
      .sort((a, b) => b.stats.wickets - a.stats.wickets)
      .slice(0, 50);
  }, [players]);

  const computedBestStrikeRates = useMemo(() => {
    return [...players]
      .filter((p) => p.stats.runs >= 300)
      .sort((a, b) => b.stats.strikeRate - a.stats.strikeRate)
      .slice(0, 50);
  }, [players]);

  const computedBestEconomyRates = useMemo(() => {
    return [...players]
      .filter((p) => p.stats.wickets >= 20 && p.stats.economy > 0)
      .sort((a, b) => a.stats.economy - b.stats.economy)
      .slice(0, 50);
  }, [players]);

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

    const eligible = base.filter(
      (p) => p.stats.wickets >= 20 && p.stats.economy > 0
    );

    return sortByEconomyAsc(eligible).slice(0, 5);
  }, [publishedStats?.leaders?.bestEconomyRates, computedBestEconomyRates]);

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

  const handleStatsTabClick = (tab: StatsTabKey, targetId: string) => {
    setActiveStatsTab(tab);
    if (typeof window === 'undefined') return;
    const el = document.getElementById(targetId);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const offset = 96; // offset for sticky main navbar
    const targetTop = rect.top + window.scrollY - offset;
    window.scrollTo({ top: targetTop, behavior: 'smooth' });
  };

  // Don't render stats page for WPL - must be after all hooks
  if (currentLeague === 'wpl') {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
        <Footer />
      </div>
    );
  }

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

      <main className="relative flex-1 py-12 overflow-hidden section-match-bg">
        <AuroraBackground />
        
        {/* Enhanced floating orbs */}
        <motion.div 
          className="absolute top-20 right-10 w-96 h-96 rounded-full blur-3xl"
          style={{ 
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25), rgba(139, 92, 246, 0.15), transparent)',
          }}
          animate={{
            y: [0, -25, 0],
            x: [0, 15, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-20 left-10 w-80 h-80 rounded-full blur-3xl"
          style={{ 
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.2), rgba(245, 158, 11, 0.12), transparent)',
          }}
          animate={{
            y: [0, 25, 0],
            x: [0, -15, 0],
            scale: [1, 1.12, 1],
          }}
          transition={{
            duration: 11,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.5
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Hero / Header */}
          <AnimatedSection direction="down" delay={0.1}>
            <section id="stats-overview" className="space-y-4">
              <motion.div 
                className="inline-flex items-center space-x-2 mb-2"
                whileHover={{ scale: 1.05 }}
              >
                <span className="px-3 py-1 rounded-full text-xs font-bold glass-effect text-amber-300 flex items-center gap-2">
                  <Icon name="stats" size={16} />
                  STATS & RECORDS HUB
                </span>
              </motion.div>
              <motion.h1 
                className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 50%, #cbd5e1 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Season Leaders &
                <span className="block mt-1">
                  <GradientText gradient="from-indigo-400 via-purple-400 to-pink-400" animate>
                    Deep IPL Insights
                  </GradientText>
                </span>
              </motion.h1>
              <motion.p 
                className="text-slate-200 text-base md:text-lg max-w-2xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                Explore Orange Cap and Purple Cap races, plus the best strike
                rates and bowling economies across the league.
              </motion.p>
            </section>
          </AnimatedSection>
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

          {/* Quick Stats - Similar to WPL stats page */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <motion.div 
              className="rounded-xl px-6 py-4 cursor-pointer glass-effect"
              whileHover={{ scale: 1.05 }}
            >
              <p className="text-xs uppercase tracking-wide font-semibold mb-1 text-gray-400">Players</p>
              <p className="text-3xl font-black text-white">{players.length}</p>
            </motion.div>
            <motion.div 
              className="rounded-xl px-6 py-4 cursor-pointer glass-effect"
              whileHover={{ scale: 1.05 }}
            >
              <p className="text-xs uppercase tracking-wide font-semibold mb-1 text-gray-400">Teams</p>
              <p className="text-3xl font-black text-white">{teams.length}</p>
            </motion.div>
            <motion.div 
              className="rounded-xl px-6 py-4 cursor-pointer glass-effect"
              whileHover={{ scale: 1.05 }}
            >
              <p className="text-xs uppercase tracking-wide font-semibold mb-1 text-gray-400">Total Runs</p>
              <p className="text-3xl font-black text-white">{players.reduce((sum, p) => sum + p.stats.runs, 0).toLocaleString()}</p>
            </motion.div>
            <motion.div 
              className="rounded-xl px-6 py-4 cursor-pointer glass-effect"
              whileHover={{ scale: 1.05 }}
            >
              <p className="text-xs uppercase tracking-wide font-semibold mb-1 text-gray-400">Total Wickets</p>
              <p className="text-3xl font-black text-white">{players.reduce((sum, p) => sum + p.stats.wickets, 0)}</p>
            </motion.div>
          </div>

          {/* Contextual sub-navigation */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 -mt-4">
            <div className="inline-flex items-center gap-1 bg-black/40 border border-white/10 rounded-full px-2 py-1 overflow-x-auto no-scrollbar">
              {[
                { key: 'overview' as StatsTabKey, label: 'Overview', targetId: 'stats-overview' },
                { key: 'batting' as StatsTabKey, label: 'Batting', targetId: 'stats-batting' },
                { key: 'bowling' as StatsTabKey, label: 'Bowling', targetId: 'stats-bowling' },
                { key: 'teams' as StatsTabKey, label: 'Teams', targetId: 'stats-teams' },
                { key: 'toss' as StatsTabKey, label: 'Toss & Luck', targetId: 'stats-toss' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleStatsTabClick(tab.key, tab.targetId)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-1 whitespace-nowrap transition-colors
                    ${
                      activeStatsTab === tab.key
                        ? 'bg-gradient-to-r from-ipl-blue-dark to-ipl-purple text-white shadow-sm shadow-ipl-purple/40 border border-ipl-gold/40'
                        : 'bg-transparent text-gray-300 border border-transparent hover:border-white/20 hover:bg-white/5'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 md:text-right">
              Quickly jump between season overview, batting and bowling leaders, team comparison,
              and toss & luck insights.
            </p>
          </div>

          {/* Season Leaders */}
          {(statsConfig.showTopRunScorers || statsConfig.showTopWicketTakers) && (
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1 text-[11px] text-gray-300">
                <div className="inline-flex items-center gap-1 bg-black/40 border border-white/10 rounded-full px-1 py-0.5">
                  <span className="px-2 py-0.5 rounded-full uppercase tracking-wide text-[10px] text-gray-400">
                    Range
                  </span>
                  <button
                    type="button"
                    onClick={() => setLeadersRange('season')}
                    className={`px-3 py-0.5 rounded-full font-semibold transition-colors ${
                      leadersRange === 'season'
                        ? 'bg-gradient-to-r from-ipl-blue-dark to-ipl-purple text-white shadow-sm shadow-ipl-purple/40'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    All season
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeadersRange('recent')}
                    className={`px-3 py-0.5 rounded-full font-semibold transition-colors ${
                      leadersRange === 'recent'
                        ? 'bg-gradient-to-r from-ipl-blue-dark to-ipl-purple text-white shadow-sm shadow-ipl-purple/40'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Last 5 matches
                  </button>
                </div>
                <div className="inline-flex items-center gap-1 bg-black/40 border border-white/10 rounded-full px-1 py-0.5">
                  <span className="px-2 py-0.5 rounded-full uppercase tracking-wide text-[10px] text-gray-400">
                    Showing
                  </span>
                  <button
                    type="button"
                    onClick={() => setLeadersLimit(10)}
                    className={`px-3 py-0.5 rounded-full font-semibold transition-colors ${
                      leadersLimit === 10
                        ? 'bg-gradient-to-r from-ipl-gold to-ipl-purple text-black shadow-sm shadow-ipl-gold/40'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Top 10
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeadersLimit(50)}
                    className={`px-3 py-0.5 rounded-full font-semibold transition-colors ${
                      leadersLimit === 50
                        ? 'bg-gradient-to-r from-ipl-gold to-ipl-purple text-black shadow-sm shadow-ipl-gold/40'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Top 50
                  </button>
                </div>
              </div>
              {/* Batting leaders */}
              {statsConfig.showTopRunScorers && (
                <div
                  id="stats-batting"
                  className="rounded-3xl bg-white/5 border border-white/10 p-6 backdrop-blur-md shadow-xl"
                >
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
                    {topRunScorers.slice(0, leadersLimit).map((p, index) => {
                      const isLeader = index === 0;
                      const team = teams.find((t) => t.id === p.teamId);
                      const formLabel = getBattingFormLabel(p);
                      const contextLine = getBattingContextLine(p);
                      const formBaseClasses =
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border';
                      const formClasses =
                        formLabel === 'Hot'
                          ? `${formBaseClasses} bg-red-500/15 text-red-300 border-red-400/60`
                          : formLabel === 'Consistent'
                          ? `${formBaseClasses} bg-emerald-500/15 text-emerald-300 border-emerald-400/60`
                          : `${formBaseClasses} bg-slate-500/20 text-slate-200 border-slate-400/50`;
                      return (
                        <div
                          key={p.id}
                          onClick={() =>
                            setExpandedPlayerId((prev) => (prev === p.id ? null : p.id))
                          }
                          className={`rounded-2xl border px-4 py-3 transition-all duration-200 cursor-pointer ${
                            isLeader
                              ? 'bg-gradient-to-r from-ipl-gold/20 via-ipl-purple/20 to-black/40 border-ipl-gold/60 shadow-lg shadow-ipl-gold/20'
                              : 'bg-black/20 border-white/10 hover:border-ipl-gold/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={`rounded-full flex items-center justify-center text-xs font-bold text-white ${
                                  isLeader
                                    ? 'w-10 h-10 bg-gradient-to-br from-ipl-gold to-ipl-purple'
                                    : 'w-8 h-8 bg-gradient-to-br from-ipl-gold/80 to-ipl-purple/80'
                                }`}
                              >
                                #{index + 1}
                              </div>
                              <div>
                                <div
                                  className={`font-semibold text-white ${
                                    isLeader ? 'text-base' : 'text-sm'
                                  }`}
                                >
                                  {p.name}
                                </div>
                                <div className="text-[11px] text-gray-400">
                                  {p.role} • {team?.shortName || 'Unknown'} • {p.stats.matches}{' '}
                                  matches
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div
                                className={`font-bold text-ipl-gold ${
                                  isLeader ? 'text-lg' : 'text-base'
                                }`}
                              >
                                {p.stats.runs} runs
                              </div>
                              <div className="text-[11px] text-gray-400">
                                SR {p.stats.strikeRate.toFixed(1)} • Avg{' '}
                                {p.stats.average.toFixed(1)}
                              </div>
                            </div>
                          </div>
                          <div className="mt-1 flex items-center justify-between gap-2">
                            <span className={formClasses}>
                              <span className="opacity-70">Form:</span>
                              <span>{formLabel}</span>
                            </span>
                          </div>
                          {contextLine && (
                            <div className="mt-1 text-[11px] text-gray-300">
                              {contextLine}
                            </div>
                          )}
                          {expandedPlayerId === p.id && (
                            <div className="mt-2 pt-2 border-t border-white/10 text-[11px] text-gray-300 flex flex-wrap gap-x-4 gap-y-1">
                              <span>Highest: {p.stats.highest}</span>
                              <span>4s: {p.stats.fours}</span>
                              <span>6s: {p.stats.sixes}</span>
                              <span>50s: {p.stats.fifties}</span>
                              <span>100s: {p.stats.hundreds}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Bowling leaders */}
              {statsConfig.showTopWicketTakers && (
                <div
                  id="stats-bowling"
                  className="rounded-3xl bg-white/5 border border-white/10 p-6 backdrop-blur-md shadow-xl"
                >
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
                {topWicketTakers.slice(0, leadersLimit).map((p, index) => {
                  const isLeader = index === 0;
                  const bowlingAverage =
                    p.stats.bowlingAverage !== undefined
                      ? p.stats.bowlingAverage.toFixed(1)
                      : '-';
                  const team = teams.find((t) => t.id === p.teamId);
                  const formLabel = getBowlingFormLabel(p);
                  const contextLine = getBowlingContextLine(p);
                  const formBaseClasses =
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border';
                  const formClasses =
                    formLabel === 'Hot'
                      ? `${formBaseClasses} bg-emerald-500/20 text-emerald-200 border-emerald-400/70`
                      : formLabel === 'Consistent'
                      ? `${formBaseClasses} bg-sky-500/20 text-sky-200 border-sky-400/70`
                      : `${formBaseClasses} bg-slate-500/20 text-slate-200 border-slate-400/50`;

                  return (
                    <div
                      key={p.id}
                      onClick={() =>
                        setExpandedPlayerId((prev) => (prev === p.id ? null : p.id))
                      }
                      className={`rounded-2xl border px-4 py-3 transition-all duration-200 cursor-pointer ${
                        isLeader
                          ? 'bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-black/40 border-emerald-400/70 shadow-lg shadow-emerald-400/20'
                          : 'bg-black/20 border-white/10 hover:border-emerald-400/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`rounded-full flex items-center justify-center text-xs font-bold text-white ${
                              isLeader
                                ? 'w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500'
                                : 'w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500'
                            }`}
                          >
                            #{index + 1}
                          </div>
                          <div>
                            <div
                              className={`font-semibold text-white ${
                                isLeader ? 'text-base' : 'text-sm'
                              }`}
                            >
                              {p.name}
                            </div>
                            <div className="text-[11px] text-gray-400">
                              {p.role} • {team?.shortName || 'Unknown'} • {p.stats.matches}{' '}
                              matches
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-bold text-emerald-300 ${
                              isLeader ? 'text-lg' : 'text-base'
                            }`}
                          >
                            {p.stats.wickets} wickets
                          </div>
                          <div className="text-[11px] text-gray-400">
                            Eco {p.stats.economy.toFixed(2)} • Best {p.stats.bestBowling}
                          </div>
                        </div>
                      </div>
                      {expandedPlayerId === p.id && (
                        <div className="mt-2 pt-2 border-t border-white/10 text-[11px] text-gray-300 flex flex-wrap gap-x-4 gap-y-1">
                          <span>Bowling avg: {bowlingAverage}</span>
                          <span>Matches: {p.stats.matches}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Teams anchor (placeholder) */}
          <section
            id="stats-teams"
            className="rounded-3xl bg-white/5 border border-white/10 p-6 md:p-8 backdrop-blur-md text-xs text-gray-300"
          >
            <h2 className="text-sm md:text-base font-bold text-white mb-2">Teams spotlight</h2>
            <p>
              Team comparison cards on this page already use aggregated squad statistics. A richer
              dedicated teams analytics view will appear here in a future update.
            </p>
          </section>

          {/* Toss & Luck anchor (placeholder) */}
          <section
            id="stats-toss"
            className="rounded-3xl bg-white/5 border border-white/10 p-6 md:p-8 backdrop-blur-md text-xs text-gray-300"
          >
            <h2 className="text-sm md:text-base font-bold text-white mb-2">Toss &amp; luck insights</h2>
            <p>
              Toss &amp; luck analytics from admin-selected datasets will surface here once
              published. For now, visit the AI Predictions page to see how toss trends are already
              influencing win probabilities.
            </p>
          </section>

          {/* Strike rate & economy tables */}
          {(statsConfig.showBestStrikeRates || statsConfig.showBestEconomyRates) && (
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {statsConfig.showBestStrikeRates && (
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
                        onClick={() =>
                          setExpandedPlayerId((prev) => (prev === p.id ? null : p.id))
                        }
                        className="rounded-2xl bg-black/20 border border-white/10 px-4 py-3 cursor-pointer hover:border-ipl-gold/50 transition-all duration-200"
                      >
                        <div className="flex items-center justify-between">
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
                        {expandedPlayerId === p.id && (
                          <div className="mt-2 pt-2 border-t border-white/10 text-[11px] text-gray-300 flex flex-wrap gap-x-4 gap-y-1">
                            <span>Highest: {p.stats.highest}</span>
                            <span>4s: {p.stats.fours}</span>
                            <span>6s: {p.stats.sixes}</span>
                            <span>50s: {p.stats.fifties}</span>
                            <span>100s: {p.stats.hundreds}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {statsConfig.showBestEconomyRates && (
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
                    {bestEconomyRates.map((p, index) => {
                      const bowlingAverage =
                        p.stats.bowlingAverage !== undefined
                          ? p.stats.bowlingAverage.toFixed(1)
                          : '-';

                      return (
                        <div
                          key={p.id}
                          onClick={() =>
                            setExpandedPlayerId((prev) => (prev === p.id ? null : p.id))
                          }
                          className="rounded-2xl bg-black/20 border border-white/10 px-4 py-3 cursor-pointer hover:border-emerald-400/50 transition-all duration-200"
                        >
                          <div className="flex items-center justify-between">
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
                          {expandedPlayerId === p.id && (
                            <div className="mt-2 pt-2 border-t border-white/10 text-[11px] text-gray-300 flex flex-wrap gap-x-4 gap-y-1">
                              <span>Bowling avg: {bowlingAverage}</span>
                              <span>Best: {p.stats.bestBowling}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* AI-style insights */}
          {statsConfig.showInsights && (
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
          )}
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
