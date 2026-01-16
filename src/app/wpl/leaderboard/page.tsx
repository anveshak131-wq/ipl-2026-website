'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Team } from '@/types';
import { api } from '@/lib/data';
import { useLeague } from '@/contexts/LeagueContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AuroraBackground from '@/components/ui/AuroraBackground';
import AnimatedSection from '@/components/ui/AnimatedSection';
import GradientText from '@/components/ui/GradientText';
import { Trophy, TrendingUp, Target, Award, Medal, Star } from 'lucide-react';
import WPLFloatingParticles from '@/components/animations/WPLFloatingParticles';
import { WPLColors, getWPLGlassmorphism, getWPLHoverGlow } from '@/lib/wplColors';

interface BattingStats {
  playerId: string;
  playerName: string;
  teamName: string;
  matches: number;
  innings: number;
  runs: number;
  highScore: number;
  average: number;
  strikeRate: number;
  hundreds: number;
  fifties: number;
  fours: number;
  sixes: number;
}

interface BowlingStats {
  playerId: string;
  playerName: string;
  teamName: string;
  matches: number;
  innings: number;
  overs: number;
  runs: number;
  wickets: number;
  bestBowling: string;
  average: number;
  economy: number;
  strikeRate: number;
  fourWickets: number;
  fiveWickets: number;
}

interface TeamStats {
  teamId: number;
  teamName: string;
  matches: number;
  wins: number;
  losses: number;
  points: number;
  netRunRate: number;
}

export default function WPLLeaderboardPage() {
  const { currentLeague, setCurrentLeague } = useLeague();
  const [teams, setTeams] = useState<Team[]>([]);
  const [battingStats, setBattingStats] = useState<BattingStats[]>([]);
  const [bowlingStats, setBowlingStats] = useState<BowlingStats[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'batting' | 'bowling' | 'points'>('batting');

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
        // Fetch teams data
        const teamsData = await api.getTeams('wpl');
        setTeams(teamsData || []);

        // Fetch stats from API
        const statsResponse = await fetch('/api/stats?league=wpl&type=all');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          
          // Set batting stats
          if (statsData.battingStats && Array.isArray(statsData.battingStats)) {
            setBattingStats(statsData.battingStats);
          }
          
          // Set bowling stats
          if (statsData.bowlingStats && Array.isArray(statsData.bowlingStats)) {
            setBowlingStats(statsData.bowlingStats);
          }
          
          // Set team stats (points table)
          if (statsData.teamStats && Array.isArray(statsData.teamStats)) {
            setTeamStats(statsData.teamStats);
          }
        }

        // Fallback to teams data for points table if no stats available
        if (teamStats.length === 0 && teamsData && teamsData.length > 0) {
          const fallbackTeamStats = teamsData.map(team => ({
            teamId: parseInt(team.id),
            teamName: team.name,
            matches: team.stats?.matchesPlayed || 0,
            wins: team.stats?.wins || 0,
            losses: team.stats?.losses || 0,
            points: team.stats?.points || 0,
            netRunRate: team.stats?.netRunRate || 0.00
          }));
          setTeamStats(fallbackTeamStats);
        }

      } catch (err) {
        console.error('Failed to load WPL leaderboard data:', err);
        setError('Failed to load leaderboard. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Sort team stats by points and NRR
  const sortedTeamStats = useMemo(() => {
    return [...teamStats].sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      return b.netRunRate - a.netRunRate;
    });
  }, [teamStats]);

  const tabs = [
    { id: 'batting', label: 'Batting', icon: Target },
    { id: 'bowling', label: 'Bowling', icon: Award },
    { id: 'points', label: 'Points Table', icon: Trophy }
  ];

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
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-red-400 mb-4">Error Loading Data</h1>
            <p className="text-gray-400">{error}</p>
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
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        <AnimatedSection>
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              <GradientText>WPL Leaderboard</GradientText>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Player statistics and points table for Women's Premier League 2026
            </p>
          </div>
        </AnimatedSection>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div 
            className="inline-flex rounded-xl p-1"
            style={{
              ...getWPLGlassmorphism(),
              border: `1px solid ${WPLColors.accent}30`
            }}
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'text-white shadow-lg'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  style={
                    activeTab === tab.id
                      ? {
                          background: `linear-gradient(135deg, ${WPLColors.accent}, ${WPLColors.secondary})`,
                          boxShadow: `0 0 20px ${WPLColors.accent}40`
                        }
                      : {}
                  }
                >
                  <Icon size={20} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <AnimatedSection>
          {activeTab === 'batting' && (
            <div 
              className="rounded-2xl p-6 overflow-hidden"
              style={{
                ...getWPLGlassmorphism(),
                border: `1px solid ${WPLColors.accent}20`
              }}
            >
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Target className="text-pink-400" size={32} />
                <span>Top Batters</span>
              </h2>
              
              {battingStats.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-lg">No batting statistics available yet.</p>
                  <p className="text-sm mt-2">Stats will appear once matches are played.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="py-3 px-4 text-gray-400 font-semibold">#</th>
                        <th className="py-3 px-4 text-gray-400 font-semibold">Player</th>
                        <th className="py-3 px-4 text-gray-400 font-semibold">Team</th>
                        <th className="py-3 px-4 text-gray-400 font-semibold text-center">Mat</th>
                        <th className="py-3 px-4 text-gray-400 font-semibold text-center">Runs</th>
                        <th className="py-3 px-4 text-gray-400 font-semibold text-center">Avg</th>
                        <th className="py-3 px-4 text-gray-400 font-semibold text-center">SR</th>
                        <th className="py-3 px-4 text-gray-400 font-semibold text-center">HS</th>
                        <th className="py-3 px-4 text-gray-400 font-semibold text-center">50s</th>
                        <th className="py-3 px-4 text-gray-400 font-semibold text-center">100s</th>
                      </tr>
                    </thead>
                    <tbody>
                      {battingStats.map((stat, index) => (
                        <motion.tr
                          key={stat.playerId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-gray-800 hover:bg-white/5 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              {index < 3 && (
                                <Medal 
                                  size={20} 
                                  className={
                                    index === 0 ? 'text-yellow-400' :
                                    index === 1 ? 'text-gray-300' :
                                    'text-orange-400'
                                  }
                                />
                              )}
                              <span className="font-semibold">{index + 1}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 font-semibold text-white">{stat.playerName}</td>
                          <td className="py-4 px-4 text-gray-300">{stat.teamName}</td>
                          <td className="py-4 px-4 text-center">{stat.matches}</td>
                          <td className="py-4 px-4 text-center font-bold text-pink-400">{stat.runs}</td>
                          <td className="py-4 px-4 text-center">{stat.average.toFixed(2)}</td>
                          <td className="py-4 px-4 text-center">{stat.strikeRate.toFixed(2)}</td>
                          <td className="py-4 px-4 text-center">{stat.highScore}</td>
                          <td className="py-4 px-4 text-center">{stat.fifties}</td>
                          <td className="py-4 px-4 text-center">{stat.hundreds}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'bowling' && (
            <div 
              className="rounded-2xl p-6 overflow-hidden"
              style={{
                ...getWPLGlassmorphism(),
                border: `1px solid ${WPLColors.accent}20`
              }}
            >
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Award className="text-purple-400" size={32} />
                <span>Top Bowlers</span>
              </h2>
              
              {bowlingStats.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-lg">No bowling statistics available yet.</p>
                  <p className="text-sm mt-2">Stats will appear once matches are played.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="py-3 px-4 text-gray-400 font-semibold">#</th>
                        <th className="py-3 px-4 text-gray-400 font-semibold">Player</th>
                        <th className="py-3 px-4 text-gray-400 font-semibold">Team</th>
                        <th className="py-3 px-4 text-gray-400 font-semibold text-center">Mat</th>
                        <th className="py-3 px-4 text-gray-400 font-semibold text-center">Wkts</th>
                        <th className="py-3 px-4 text-gray-400 font-semibold text-center">Avg</th>
                        <th className="py-3 px-4 text-gray-400 font-semibold text-center">Econ</th>
                        <th className="py-3 px-4 text-gray-400 font-semibold text-center">SR</th>
                        <th className="py-3 px-4 text-gray-400 font-semibold text-center">Best</th>
                        <th className="py-3 px-4 text-gray-400 font-semibold text-center">4W</th>
                        <th className="py-3 px-4 text-gray-400 font-semibold text-center">5W</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bowlingStats.map((stat, index) => (
                        <motion.tr
                          key={stat.playerId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-gray-800 hover:bg-white/5 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              {index < 3 && (
                                <Medal 
                                  size={20} 
                                  className={
                                    index === 0 ? 'text-yellow-400' :
                                    index === 1 ? 'text-gray-300' :
                                    'text-orange-400'
                                  }
                                />
                              )}
                              <span className="font-semibold">{index + 1}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 font-semibold text-white">{stat.playerName}</td>
                          <td className="py-4 px-4 text-gray-300">{stat.teamName}</td>
                          <td className="py-4 px-4 text-center">{stat.matches}</td>
                          <td className="py-4 px-4 text-center font-bold text-purple-400">{stat.wickets}</td>
                          <td className="py-4 px-4 text-center">{stat.average.toFixed(2)}</td>
                          <td className="py-4 px-4 text-center">{stat.economy.toFixed(2)}</td>
                          <td className="py-4 px-4 text-center">{stat.strikeRate.toFixed(2)}</td>
                          <td className="py-4 px-4 text-center">{stat.bestBowling}</td>
                          <td className="py-4 px-4 text-center">{stat.fourWickets}</td>
                          <td className="py-4 px-4 text-center">{stat.fiveWickets}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'points' && (
            <div 
              className="rounded-2xl p-6 overflow-hidden"
              style={{
                ...getWPLGlassmorphism(),
                border: `1px solid ${WPLColors.accent}20`
              }}
            >
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Trophy className="text-yellow-400" size={32} />
                <span>Points Table</span>
              </h2>
              
              {sortedTeamStats.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-lg">No points table available yet.</p>
                  <p className="text-sm mt-2">Table will appear once matches are played.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="py-3 px-4 text-gray-400 font-semibold">#</th>
                        <th className="py-3 px-4 text-gray-400 font-semibold">Team</th>
                        <th className="py-3 px-4 text-gray-400 font-semibold text-center">Mat</th>
                        <th className="py-3 px-4 text-gray-400 font-semibold text-center">Won</th>
                        <th className="py-3 px-4 text-gray-400 font-semibold text-center">Lost</th>
                        <th className="py-3 px-4 text-gray-400 font-semibold text-center">Points</th>
                        <th className="py-3 px-4 text-gray-400 font-semibold text-center">NRR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedTeamStats.map((stat, index) => (
                        <motion.tr
                          key={stat.teamId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-gray-800 hover:bg-white/5 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              {index < 3 && (
                                <Star 
                                  size={20} 
                                  className={
                                    index === 0 ? 'text-yellow-400 fill-yellow-400' :
                                    index === 1 ? 'text-gray-300 fill-gray-300' :
                                    'text-orange-400 fill-orange-400'
                                  }
                                />
                              )}
                              <span className="font-semibold">{index + 1}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 font-semibold text-white">{stat.teamName}</td>
                          <td className="py-4 px-4 text-center">{stat.matches || 'N/A'}</td>
                          <td className="py-4 px-4 text-center text-green-400 font-semibold">{stat.wins || 'N/A'}</td>
                          <td className="py-4 px-4 text-center text-red-400">{stat.losses || 'N/A'}</td>
                          <td className="py-4 px-4 text-center font-bold text-yellow-400 text-lg">{stat.points || 'N/A'}</td>
                          <td className="py-4 px-4 text-center">
                            <span className={stat.netRunRate >= 0 ? 'text-green-400' : 'text-red-400'}>
                              {stat.netRunRate >= 0 ? '+' : ''}{stat.netRunRate ? stat.netRunRate.toFixed(3) : 'N/A'}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </AnimatedSection>
      </div>

      <Footer />
    </div>
  );
}
