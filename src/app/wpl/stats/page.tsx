'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
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
import WPLFloatingParticles from '@/components/animations/WPLFloatingParticles';
import { WPLColors, getWPLGlassmorphism, getWPLHoverGlow } from '@/lib/wplColors';

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
      <div 
        className="min-h-screen"
        style={{
          background: `linear-gradient(to bottom, ${WPLColors.base}, ${WPLColors.gradientStart}66, ${WPLColors.gradientMid}33, ${WPLColors.base})`,
        }}
      >
        <Navbar />
        <AuroraBackground />
        <WPLFloatingParticles />
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="min-h-screen"
        style={{
          background: `linear-gradient(to bottom, ${WPLColors.base}, ${WPLColors.gradientStart}66, ${WPLColors.gradientMid}33, ${WPLColors.base})`,
        }}
      >
        <Navbar />
        <AuroraBackground />
        <WPLFloatingParticles />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-lg mb-4" style={{ color: WPLColors.rose }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-xl text-white font-bold hover:shadow-xl transition-all"
              style={{
                background: `linear-gradient(to right, ${WPLColors.purple}, ${WPLColors.pink})`,
              }}
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
    <div 
      className="min-h-screen"
      style={{
        background: `linear-gradient(to bottom, ${WPLColors.base}, ${WPLColors.gradientStart}66, ${WPLColors.gradientMid}33, ${WPLColors.base})`,
      }}
    >
      <Navbar />
      <AuroraBackground />
      <WPLFloatingParticles />

      <main className="relative py-16 min-h-screen">
        {/* Enhanced gradient overlays using exact WPL colors */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${WPLColors.gradientMid}1A, ${WPLColors.pinkRGBA[10]}, ${WPLColors.roseRGBA[10]})`,
          }}
        />
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(to top, ${WPLColors.gradientMid}33, transparent, ${WPLColors.gradientEnd}33)`,
          }}
        />
        
        <motion.div 
          className="absolute top-20 left-10 w-96 h-96 rounded-full blur-3xl"
          style={{ 
            background: `radial-gradient(circle, ${WPLColors.purpleRGBA[20]}, ${WPLColors.pinkRGBA[15]}, transparent)`,
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
          className="absolute bottom-10 right-20 w-96 h-96 rounded-full blur-3xl"
          style={{ 
            background: `radial-gradient(circle, ${WPLColors.pinkRGBA[20]}, ${WPLColors.roseRGBA[10]}, transparent)`,
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

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <AnimatedSection direction="down" delay={0.1}>
            <div className="mb-12">
              <div className="inline-flex items-center space-x-2 mb-4">
                <span 
                  className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 transition-all duration-300 cursor-default"
                  style={{
                    ...getWPLGlassmorphism('purple', 20),
                    color: WPLColors.textAccent,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = WPLColors.purpleRGBA[30];
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = WPLColors.purpleRGBA[20];
                  }}
                >
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

          {/* Quick Stats - Enhanced Glassmorphism */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <motion.div 
              className="rounded-xl px-6 py-4 cursor-pointer"
              style={{
                ...getWPLGlassmorphism('purple', 20),
              }}
              whileHover={{ 
                scale: 1.05,
                ...getWPLHoverGlow('purple'),
              }}
            >
              <p className="text-xs uppercase tracking-wide font-semibold mb-1" style={{ color: WPLColors.textAccent }}>Players</p>
              <p className="text-3xl font-black" style={{ color: WPLColors.textPrimary }}>{players.length}</p>
            </motion.div>
            <motion.div 
              className="rounded-xl px-6 py-4 cursor-pointer"
              style={{
                ...getWPLGlassmorphism('pink', 20),
              }}
              whileHover={{ 
                scale: 1.05,
                ...getWPLHoverGlow('pink'),
              }}
            >
              <p className="text-xs uppercase tracking-wide font-semibold mb-1" style={{ color: WPLColors.pink }}>Teams</p>
              <p className="text-3xl font-black" style={{ color: WPLColors.textPrimary }}>{teams.length}</p>
            </motion.div>
            <motion.div 
              className="rounded-xl px-6 py-4 cursor-pointer"
              style={{
                ...getWPLGlassmorphism('rose', 20),
              }}
              whileHover={{ 
                scale: 1.05,
                ...getWPLHoverGlow('rose'),
              }}
            >
              <p className="text-xs uppercase tracking-wide font-semibold mb-1" style={{ color: WPLColors.rose }}>Total Runs</p>
              <p className="text-3xl font-black" style={{ color: WPLColors.textPrimary }}>{players.reduce((sum, p) => sum + p.stats.runs, 0).toLocaleString()}</p>
            </motion.div>
            <motion.div 
              className="rounded-xl px-6 py-4 cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${WPLColors.purpleRGBA[20]}, ${WPLColors.pinkRGBA[10]})`,
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: `1px solid ${WPLColors.violetRGBA[30]}`,
                boxShadow: `0 8px 32px 0 ${WPLColors.violetRGBA[20]}`,
              }}
              whileHover={{ 
                scale: 1.05,
                boxShadow: `0 12px 40px 0 ${WPLColors.violetRGBA[30]}`,
              }}
            >
              <p className="text-xs uppercase tracking-wide font-semibold mb-1" style={{ color: WPLColors.textAccent }}>Total Wickets</p>
              <p className="text-3xl font-black" style={{ color: WPLColors.textPrimary }}>{players.reduce((sum, p) => sum + p.stats.wickets, 0)}</p>
            </motion.div>
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

