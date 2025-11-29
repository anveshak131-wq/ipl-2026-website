'use client';

import { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Player, Team } from '@/types';
import { api } from '@/lib/data';
import { useLeague } from '@/contexts/LeagueContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AuroraBackground from '@/components/ui/AuroraBackground';
import AnimatedSection from '@/components/ui/AnimatedSection';
import GradientText from '@/components/ui/GradientText';
import { Sparkles } from 'lucide-react';

export default function WPLStatsPage() {
  const { currentLeague, setCurrentLeague } = useLeague();
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Set league to WPL when page loads
  useEffect(() => {
    if (currentLeague !== 'wpl') {
      setCurrentLeague('wpl');
    }
  }, [currentLeague, setCurrentLeague]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [playersData, teamsData] = await Promise.all([
          api.getPlayers(undefined, 'wpl'),
          api.getTeams('wpl'),
        ]);
        setPlayers(playersData || []);
        setTeams(teamsData || []);
      } catch (err) {
        console.error('Failed to load WPL stats data:', err);
        setError('Failed to load stats. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const topRunScorers = useMemo(() => {
    return [...players]
      .sort((a, b) => b.stats.runs - a.stats.runs)
      .slice(0, 10);
  }, [players]);

  const topWicketTakers = useMemo(() => {
    return [...players]
      .filter((p) => p.stats.wickets > 0)
      .sort((a, b) => b.stats.wickets - a.stats.wickets)
      .slice(0, 10);
  }, [players]);

  const bestStrikeRates = useMemo(() => {
    return [...players]
      .filter((p) => p.stats.runs >= 100)
      .sort((a, b) => b.stats.strikeRate - a.stats.strikeRate)
      .slice(0, 10);
  }, [players]);

  const bestEconomyRates = useMemo(() => {
    return [...players]
      .filter((p) => p.stats.wickets > 0 && p.stats.economy > 0)
      .sort((a, b) => a.stats.economy - b.stats.economy)
      .slice(0, 10);
  }, [players]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-purple-950/20 to-gray-950">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-purple-950/20 to-gray-950">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-red-400 text-lg mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:shadow-xl transition-all"
            >
              Retry
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-purple-950/20 to-gray-950">
      <Navbar />
      <AuroraBackground />

      <main className="relative py-16 min-h-screen">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10 animate-float" />
        <div className="absolute bottom-10 right-20 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl -z-10 animate-float" style={{ animationDelay: '1s' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <AnimatedSection direction="down" delay={0.1}>
            <div className="mb-12">
              <div className="inline-flex items-center space-x-2 mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 border border-purple-500/30 text-purple-300 flex items-center gap-2 backdrop-blur-sm hover:bg-purple-500/30 transition-all duration-300 cursor-default">
                  <Sparkles className="w-4 h-4" /> WPL STATISTICS
                </span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tight">
                WPL 2026 <GradientText gradient="from-purple-400 via-pink-400 to-rose-400" animate>Statistics</GradientText>
              </h1>
              <p className="text-slate-200 text-lg max-w-2xl leading-relaxed">
                Comprehensive statistics and leaderboards for the Women's Premier League 2026 season
              </p>
            </div>
          </AnimatedSection>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 px-6 py-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-purple-300 font-semibold mb-1">Players</p>
              <p className="text-3xl font-black text-white">{players.length}</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-600/10 border border-pink-500/30 px-6 py-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-pink-300 font-semibold mb-1">Teams</p>
              <p className="text-3xl font-black text-white">{teams.length}</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-rose-500/20 to-rose-600/10 border border-rose-500/30 px-6 py-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-rose-300 font-semibold mb-1">Total Runs</p>
              <p className="text-3xl font-black text-white">{players.reduce((sum, p) => sum + p.stats.runs, 0).toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/30 px-6 py-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-purple-300 font-semibold mb-1">Total Wickets</p>
              <p className="text-3xl font-black text-white">{players.reduce((sum, p) => sum + p.stats.wickets, 0)}</p>
            </div>
          </div>

          {/* Top Run Scorers */}
          <AnimatedSection direction="up" delay={0.2}>
            <div className="mb-12">
              <h2 className="text-3xl font-black text-white mb-6">
                Top <GradientText gradient="from-purple-400 to-pink-400">Run Scorers</GradientText>
              </h2>
              <div className="rounded-xl bg-slate-900/60 border border-purple-500/20 backdrop-blur-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-purple-500/20">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-purple-300 uppercase tracking-wider">Rank</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-purple-300 uppercase tracking-wider">Player</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-purple-300 uppercase tracking-wider">Runs</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-purple-300 uppercase tracking-wider">Matches</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-purple-300 uppercase tracking-wider">SR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-500/10">
                      {topRunScorers.map((player, index) => (
                        <tr key={player.id} className="hover:bg-purple-500/10 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">#{index + 1}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-200">{player.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white text-right">{player.stats.runs}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 text-right">{player.stats.matches}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 text-right">{player.stats.strikeRate.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Top Wicket Takers */}
          <AnimatedSection direction="up" delay={0.3}>
            <div className="mb-12">
              <h2 className="text-3xl font-black text-white mb-6">
                Top <GradientText gradient="from-pink-400 to-rose-400">Wicket Takers</GradientText>
              </h2>
              <div className="rounded-xl bg-slate-900/60 border border-pink-500/20 backdrop-blur-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-pink-500/20">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-pink-300 uppercase tracking-wider">Rank</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-pink-300 uppercase tracking-wider">Player</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-pink-300 uppercase tracking-wider">Wickets</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-pink-300 uppercase tracking-wider">Matches</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-pink-300 uppercase tracking-wider">Economy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-pink-500/10">
                      {topWicketTakers.map((player, index) => (
                        <tr key={player.id} className="hover:bg-pink-500/10 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">#{index + 1}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-200">{player.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white text-right">{player.stats.wickets}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 text-right">{player.stats.matches}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 text-right">{player.stats.economy.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Best Strike Rates */}
          {bestStrikeRates.length > 0 && (
            <AnimatedSection direction="up" delay={0.4}>
              <div className="mb-12">
                <h2 className="text-3xl font-black text-white mb-6">
                  Best <GradientText gradient="from-purple-400 via-pink-400 to-rose-400">Strike Rates</GradientText>
                </h2>
                <div className="rounded-xl bg-slate-900/60 border border-rose-500/20 backdrop-blur-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-rose-500/20">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-rose-300 uppercase tracking-wider">Rank</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-rose-300 uppercase tracking-wider">Player</th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-rose-300 uppercase tracking-wider">Strike Rate</th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-rose-300 uppercase tracking-wider">Runs</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rose-500/10">
                        {bestStrikeRates.map((player, index) => (
                          <tr key={player.id} className="hover:bg-rose-500/10 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">#{index + 1}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-200">{player.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white text-right">{player.stats.strikeRate.toFixed(2)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 text-right">{player.stats.runs}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          )}

          {/* Best Economy Rates */}
          {bestEconomyRates.length > 0 && (
            <AnimatedSection direction="up" delay={0.5}>
              <div className="mb-12">
                <h2 className="text-3xl font-black text-white mb-6">
                  Best <GradientText gradient="from-purple-400 to-pink-400">Economy Rates</GradientText>
                </h2>
                <div className="rounded-xl bg-slate-900/60 border border-purple-500/20 backdrop-blur-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-purple-500/20">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-purple-300 uppercase tracking-wider">Rank</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-purple-300 uppercase tracking-wider">Player</th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-purple-300 uppercase tracking-wider">Economy</th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-purple-300 uppercase tracking-wider">Wickets</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-500/10">
                        {bestEconomyRates.map((player, index) => (
                          <tr key={player.id} className="hover:bg-purple-500/10 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">#{index + 1}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-200">{player.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white text-right">{player.stats.economy.toFixed(2)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 text-right">{player.stats.wickets}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

