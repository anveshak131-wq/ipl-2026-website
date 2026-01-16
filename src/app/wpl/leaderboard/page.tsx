'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Team } from '@/types';
import { api } from '@/lib/data';
import { useLeague } from '@/contexts/LeagueContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AuroraBackground from '@/components/ui/AuroraBackground';
import AnimatedSection from '@/components/ui/AnimatedSection';
import GradientText from '@/components/ui/GradientText';
import { Trophy, TrendingUp, Target, Award, Medal, Star, Crown, Zap, Activity, BarChart3, Users, Search, Filter, ArrowUp, ArrowDown, Sparkles, Flame, TrendingDown } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [showTopOnly, setShowTopOnly] = useState(false);

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
        const teamsData = await api.getTeams('wpl');
        setTeams(teamsData || []);

        // Use points table data from WPL admin (stored in teams stats)
        if (teamsData && teamsData.length > 0) {
          const pointsTableStats = teamsData
            .filter(team => team.stats && (team.stats.matchesPlayed || 0) > 0) // Only teams with matches
            .map(team => ({
              teamId: parseInt(team.id),
              teamName: team.name,
              matches: team.stats?.matchesPlayed || 0,
              wins: team.stats?.wins || 0,
              losses: team.stats?.losses || 0,
              points: team.stats?.points || 0,
              netRunRate: team.stats?.netRunRate || 0.00
            }));
          
          if (pointsTableStats.length > 0) {
            setTeamStats(pointsTableStats);
          }
        }

        // Fetch batting and bowling stats from scorecards
        const statsResponse = await fetch('/api/stats?league=wpl&type=all');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          
          // Only set stats if there's actual data from scorecards
          if (statsData.battingStats && Array.isArray(statsData.battingStats) && statsData.battingStats.length > 0) {
            setBattingStats(statsData.battingStats);
          }
          
          if (statsData.bowlingStats && Array.isArray(statsData.bowlingStats) && statsData.bowlingStats.length > 0) {
            setBowlingStats(statsData.bowlingStats);
          }
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

  const sortedTeamStats = useMemo(() => {
    return [...teamStats].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.netRunRate - a.netRunRate;
    });
  }, [teamStats]);

  // Filter stats based on search
  const filteredBattingStats = useMemo(() => {
    let stats = [...battingStats];
    if (searchTerm) {
      stats = stats.filter(s => 
        s.playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.teamName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return showTopOnly ? stats.slice(0, 10) : stats;
  }, [battingStats, searchTerm, showTopOnly]);

  const filteredBowlingStats = useMemo(() => {
    let stats = [...bowlingStats];
    if (searchTerm) {
      stats = stats.filter(s => 
        s.playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.teamName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return showTopOnly ? stats.slice(0, 10) : stats;
  }, [bowlingStats, searchTerm, showTopOnly]);

  // Group batting stats by team
  const battingStatsByTeam = useMemo(() => {
    const grouped: { [key: string]: typeof filteredBattingStats } = {};
    filteredBattingStats.forEach((stat) => {
      const teamName = stat.teamName || 'Unknown Team';
      if (!grouped[teamName]) {
        grouped[teamName] = [];
      }
      grouped[teamName].push(stat);
    });
    return grouped;
  }, [filteredBattingStats]);

  // Group bowling stats by team
  const bowlingStatsByTeam = useMemo(() => {
    const grouped: { [key: string]: typeof filteredBowlingStats } = {};
    filteredBowlingStats.forEach((stat) => {
      const teamName = stat.teamName || 'Unknown Team';
      if (!grouped[teamName]) {
        grouped[teamName] = [];
      }
      grouped[teamName].push(stat);
    });
    return grouped;
  }, [filteredBowlingStats]);

  // Get top performers
  const orangeCap = battingStats[0];
  const purpleCap = bowlingStats[0];
  const mostSixes = useMemo(() => [...battingStats].sort((a, b) => b.sixes - a.sixes)[0], [battingStats]);
  const bestEconomy = useMemo(() => [...bowlingStats].sort((a, b) => a.economy - b.economy)[0], [bowlingStats]);

  const tabs = [
    { id: 'batting', label: 'Batting Leaders', icon: Target, color: 'from-pink-500 to-rose-500' },
    { id: 'bowling', label: 'Bowling Leaders', icon: Award, color: 'from-purple-500 to-indigo-500' },
    { id: 'points', label: 'Standings', icon: Trophy, color: 'from-amber-500 to-yellow-500' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: `linear-gradient(to bottom, ${WPLColors.base}, ${WPLColors.gradientStart}66, ${WPLColors.gradientMid}33, ${WPLColors.base})` }}>
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
      <div className="min-h-screen" style={{ background: `linear-gradient(to bottom, ${WPLColors.base}, ${WPLColors.gradientStart}66, ${WPLColors.gradientMid}33, ${WPLColors.base})` }}>
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
    <div className="min-h-screen" style={{ background: `linear-gradient(to bottom, ${WPLColors.base}, ${WPLColors.gradientStart}66, ${WPLColors.gradientMid}33, ${WPLColors.base})` }}>
      <Navbar />
      <AuroraBackground />
      <WPLFloatingParticles />
      
      <div className="container mx-auto px-4 py-8 md:py-12 relative z-10">
        {/* Hero Section */}
        <AnimatedSection>
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
              style={{
                ...getWPLGlassmorphism(),
                border: `1px solid ${WPLColors.accent}40`
              }}
            >
              <Sparkles size={16} className="text-pink-400" />
              <span className="text-sm font-semibold text-gray-300">Season 2026</span>
            </motion.div>
            <h1 className="text-4xl md:text-6xl font-bold mb-3">
              <GradientText>WPL Leaderboard</GradientText>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
              Live stats & standings for Women's Premier League 2026
            </p>
          </div>
        </AnimatedSection>

        {/* Highlights Cards - Top Performers */}
        {(orangeCap || purpleCap || mostSixes || bestEconomy) && (
          <AnimatedSection>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Orange Cap */}
              {orangeCap && (
                <motion.div
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="rounded-2xl p-6 relative overflow-hidden group cursor-pointer"
                  style={{
                    ...getWPLGlassmorphism(),
                    border: `1px solid ${WPLColors.accent}30`
                  }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/20 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <Crown className="text-orange-400" size={24} />
                      <span className="text-xs font-semibold text-orange-400 px-2 py-1 rounded-full bg-orange-400/10">ORANGE CAP</span>
                    </div>
                    <div className="text-3xl font-black text-white mb-1">{orangeCap.runs}</div>
                    <div className="text-sm text-gray-400 mb-2">runs</div>
                    <div className="font-semibold text-white truncate">{orangeCap.playerName}</div>
                    <div className="text-xs text-gray-500">{orangeCap.teamName}</div>
                  </div>
                </motion.div>
              )}

              {/* Purple Cap */}
              {purpleCap && (
                <motion.div
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="rounded-2xl p-6 relative overflow-hidden group cursor-pointer"
                  style={{
                    ...getWPLGlassmorphism(),
                    border: `1px solid ${WPLColors.secondary}30`
                  }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <Target className="text-purple-400" size={24} />
                      <span className="text-xs font-semibold text-purple-400 px-2 py-1 rounded-full bg-purple-400/10">PURPLE CAP</span>
                    </div>
                    <div className="text-3xl font-black text-white mb-1">{purpleCap.wickets}</div>
                    <div className="text-sm text-gray-400 mb-2">wickets</div>
                    <div className="font-semibold text-white truncate">{purpleCap.playerName}</div>
                    <div className="text-xs text-gray-500">{purpleCap.teamName}</div>
                  </div>
                </motion.div>
              )}

              {/* Most Sixes */}
              {mostSixes && (
                <motion.div
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="rounded-2xl p-6 relative overflow-hidden group cursor-pointer"
                  style={{
                    ...getWPLGlassmorphism(),
                    border: `1px solid #10b981/30`
                  }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/20 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <Zap className="text-green-400" size={24} />
                      <span className="text-xs font-semibold text-green-400 px-2 py-1 rounded-full bg-green-400/10">MOST SIXES</span>
                    </div>
                    <div className="text-3xl font-black text-white mb-1">{mostSixes.sixes}</div>
                    <div className="text-sm text-gray-400 mb-2">sixes</div>
                    <div className="font-semibold text-white truncate">{mostSixes.playerName}</div>
                    <div className="text-xs text-gray-500">{mostSixes.teamName}</div>
                  </div>
                </motion.div>
              )}

              {/* Best Economy */}
              {bestEconomy && (
                <motion.div
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="rounded-2xl p-6 relative overflow-hidden group cursor-pointer"
                  style={{
                    ...getWPLGlassmorphism(),
                    border: `1px solid #3b82f6/30`
                  }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <Activity className="text-blue-400" size={24} />
                      <span className="text-xs font-semibold text-blue-400 px-2 py-1 rounded-full bg-blue-400/10">BEST ECON</span>
                    </div>
                    <div className="text-3xl font-black text-white mb-1">{bestEconomy.economy.toFixed(2)}</div>
                    <div className="text-sm text-gray-400 mb-2">economy</div>
                    <div className="font-semibold text-white truncate">{bestEconomy.playerName}</div>
                    <div className="text-xs text-gray-500">{bestEconomy.teamName}</div>
                  </div>
                </motion.div>
              )}
            </div>
          </AnimatedSection>
        )}

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex flex-wrap justify-center gap-2 p-2 rounded-2xl" style={{ ...getWPLGlassmorphism(), border: `1px solid ${WPLColors.accent}20` }}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    activeTab === tab.id ? 'text-white shadow-xl' : 'text-gray-400 hover:text-white'
                  }`}
                  style={activeTab === tab.id ? {
                    background: `linear-gradient(135deg, ${tab.id === 'batting' ? WPLColors.accent : tab.id === 'bowling' ? WPLColors.secondary : '#f59e0b'}, ${tab.id === 'batting' ? '#f43f5e' : tab.id === 'bowling' ? '#6366f1' : '#eab308'})`,
                    boxShadow: `0 8px 25px ${tab.id === 'batting' ? WPLColors.accent : tab.id === 'bowling' ? WPLColors.secondary : '#f59e0b'}40`
                  } : {}}
                >
                  <Icon size={20} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Search and Filters */}
        {activeTab !== 'points' && (
          <AnimatedSection>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search players or teams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all"
                  style={{
                    ...getWPLGlassmorphism(),
                    border: `1px solid ${WPLColors.accent}30`,
                    boxShadow: searchTerm ? `0 0 20px ${WPLColors.accent}20` : 'none'
                  }}
                />
              </div>
              <button
                onClick={() => setShowTopOnly(!showTopOnly)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                  showTopOnly ? 'text-white' : 'text-gray-400'
                }`}
                style={showTopOnly ? {
                  background: `linear-gradient(135deg, ${WPLColors.accent}, ${WPLColors.secondary})`,
                  ...getWPLGlassmorphism(),
                  border: `1px solid ${WPLColors.accent}40`
                } : {
                  ...getWPLGlassmorphism(),
                  border: `1px solid ${WPLColors.accent}20`
                }}
              >
                <Filter size={20} />
                <span className="hidden sm:inline">Top 10</span>
              </button>
            </div>
          </AnimatedSection>
        )}

        {/* Content */}
        <AnimatedSection>
          <AnimatePresence mode="wait">
            {activeTab === 'batting' && (
              <motion.div
                key="batting"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl overflow-hidden"
                style={{ ...getWPLGlassmorphism(), border: `1px solid ${WPLColors.accent}20` }}
              >
                {filteredBattingStats.length === 0 ? (
                  <div className="text-center py-20">
                    <Target className="mx-auto mb-4 text-gray-600" size={64} />
                    <p className="text-xl font-semibold text-gray-400 mb-2">
                      {searchTerm ? 'No players found' : 'No batting statistics available yet'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {searchTerm ? 'Try a different search term' : 'Stats will appear once matches are played'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    {Object.entries(battingStatsByTeam).map(([teamName, teamStats]) => (
                      <div key={teamName} className="mb-8 last:mb-0">
                        {/* Team Header */}
                        <div className="px-6 py-4 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border-b border-white/20">
                          <h3 className="text-xl font-bold text-white">{teamName}</h3>
                        </div>
                        
                        {/* Team Table */}
                        <table className="w-full">
                          <thead className="border-b border-white/10 bg-white/5">
                            <tr>
                              <th className="py-4 px-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Rank</th>
                              <th className="py-4 px-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Player</th>
                              <th className="py-4 px-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider hidden lg:table-cell">M</th>
                              <th className="py-4 px-4 text-center text-xs font-bold text-pink-400 uppercase tracking-wider">Runs</th>
                              <th className="py-4 px-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Avg</th>
                              <th className="py-4 px-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:table-cell">SR</th>
                              <th className="py-4 px-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider hidden xl:table-cell">HS</th>
                              <th className="py-4 px-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider hidden lg:table-cell">100s/50s</th>
                            </tr>
                          </thead>
                          <tbody>
                            {teamStats.map((stat, teamIndex) => {
                              return (
                                <motion.tr
                                  key={stat.playerId}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className="border-b border-white/5 hover:bg-white/5 transition-all group"
                                >
                                  <td className="py-5 px-4">
                                    <div className="flex items-center gap-3">
                                      {teamIndex < 3 ? (
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                          teamIndex === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-gray-900' :
                                          teamIndex === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-900' :
                                          'bg-gradient-to-br from-orange-400 to-orange-500 text-white'
                                        }`}>
                                          #{teamIndex + 1}
                                        </div>
                                      ) : (
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-gray-400 bg-white/5">
                                          #{teamIndex + 1}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-5 px-4">
                                    <div className="font-bold text-white group-hover:text-pink-400 transition-colors">{stat.playerName}</div>
                                  </td>
                                  <td className="py-5 px-4 text-center text-sm text-gray-400 hidden lg:table-cell">{stat.matches}</td>
                                  <td className="py-5 px-4 text-center">
                                    <div className="text-lg font-black text-pink-400">{stat.runs}</div>
                                  </td>
                                  <td className="py-5 px-4 text-center text-sm text-gray-300 hidden sm:table-cell">{stat.average.toFixed(2)}</td>
                                  <td className="py-5 px-4 text-center text-sm text-gray-300 hidden sm:table-cell">{stat.strikeRate.toFixed(2)}</td>
                                  <td className="py-5 px-4 text-center text-sm text-gray-400 hidden xl:table-cell">{stat.highestScore || stat.highScore}</td>
                                  <td className="py-5 px-4 text-center text-sm text-gray-400 hidden lg:table-cell">
                                    <span className="text-amber-400 font-semibold">{stat.hundreds}</span> / <span className="text-green-400 font-semibold">{stat.fifties}</span>
                                  </td>
                                </motion.tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'bowling' && (
              <motion.div
                key="bowling"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl overflow-hidden"
                style={{ ...getWPLGlassmorphism(), border: `1px solid ${WPLColors.secondary}20` }}
              >
                {filteredBowlingStats.length === 0 ? (
                  <div className="text-center py-20">
                    <Award className="mx-auto mb-4 text-gray-600" size={64} />
                    <p className="text-xl font-semibold text-gray-400 mb-2">
                      {searchTerm ? 'No players found' : 'No bowling statistics available yet'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {searchTerm ? 'Try a different search term' : 'Stats will appear once matches are played'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    {Object.entries(bowlingStatsByTeam).map(([teamName, teamStats]) => (
                      <div key={teamName} className="mb-8 last:mb-0">
                        {/* Team Header */}
                        <div className="px-6 py-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-white/20">
                          <h3 className="text-xl font-bold text-white">{teamName}</h3>
                        </div>
                        
                        {/* Team Table */}
                        <table className="w-full">
                          <thead className="border-b border-white/10 bg-white/5">
                            <tr>
                              <th className="py-4 px-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Rank</th>
                              <th className="py-4 px-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Player</th>
                              <th className="py-4 px-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider hidden lg:table-cell">M</th>
                              <th className="py-4 px-4 text-center text-xs font-bold text-purple-400 uppercase tracking-wider">Wkts</th>
                              <th className="py-4 px-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Avg</th>
                              <th className="py-4 px-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Econ</th>
                              <th className="py-4 px-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider hidden xl:table-cell">SR</th>
                              <th className="py-4 px-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Best</th>
                            </tr>
                          </thead>
                          <tbody>
                            {teamStats.map((stat, teamIndex) => {
                              return (
                                <motion.tr
                                  key={stat.playerId}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className="border-b border-white/5 hover:bg-white/5 transition-all group"
                                >
                                  <td className="py-5 px-4">
                                    <div className="flex items-center gap-3">
                                      {teamIndex < 3 ? (
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                          teamIndex === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-gray-900' :
                                          teamIndex === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-900' :
                                          'bg-gradient-to-br from-orange-400 to-orange-500 text-white'
                                        }`}>
                                          #{teamIndex + 1}
                                        </div>
                                      ) : (
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-gray-400 bg-white/5">
                                          #{teamIndex + 1}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-5 px-4">
                                    <div className="font-bold text-white group-hover:text-purple-400 transition-colors">{stat.playerName}</div>
                                  </td>
                                  <td className="py-5 px-4 text-center text-sm text-gray-400 hidden lg:table-cell">{stat.matches}</td>
                                  <td className="py-5 px-4 text-center">
                                    <div className="text-lg font-black text-purple-400">{stat.wickets}</div>
                                  </td>
                                  <td className="py-5 px-4 text-center text-sm text-gray-300 hidden sm:table-cell">{stat.average.toFixed(2)}</td>
                                  <td className="py-5 px-4 text-center text-sm text-gray-300 hidden sm:table-cell">{stat.economy.toFixed(2)}</td>
                                  <td className="py-5 px-4 text-center text-sm text-gray-400 hidden xl:table-cell">{stat.strikeRate.toFixed(2)}</td>
                                  <td className="py-5 px-4 text-center text-sm font-semibold text-purple-400 hidden lg:table-cell">{stat.bestBowling}</td>
                                </motion.tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'points' && (
              <motion.div
                key="points"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                {sortedTeamStats.length === 0 ? (
                  <div className="text-center py-20 rounded-2xl" style={{ ...getWPLGlassmorphism(), border: `1px solid #f59e0b30` }}>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    >
                      <Trophy className="mx-auto mb-4 text-amber-500" size={64} />
                    </motion.div>
                    <p className="text-xl font-semibold text-gray-400 mb-2">No standings available yet</p>
                    <p className="text-sm text-gray-500">Standings will appear once matches are played</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sortedTeamStats.map((stat, index) => {
                      const isQualifyingPosition = index < 4;
                      const isChampion = index === 0;
                      
                      return (
                        <motion.div
                          key={stat.teamId}
                          initial={{ opacity: 0, y: 30, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ 
                            delay: index * 0.08,
                            duration: 0.5,
                            ease: [0.16, 1, 0.3, 1]
                          }}
                          whileHover={{ 
                            scale: 1.02, 
                            y: -4,
                            transition: { duration: 0.2 }
                          }}
                          className="relative rounded-2xl overflow-hidden group cursor-pointer"
                          style={{
                            ...getWPLGlassmorphism(),
                            border: `2px solid ${
                              isChampion ? '#fbbf24' :
                              isQualifyingPosition ? '#10b98150' :
                              '#ffffff10'
                            }`,
                          }}
                        >
                          {/* Animated background glow */}
                          <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                            isChampion ? 'bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10' :
                            isQualifyingPosition ? 'bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10' :
                            'bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10'
                          }`}></div>
                          
                          {/* Qualifying badge */}
                          {isQualifyingPosition && (
                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.08 + 0.3 }}
                              className="absolute top-3 right-3"
                            >
                              <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                                isChampion ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900' :
                                'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                              }`}>
                                {isChampion ? (
                                  <>
                                    <Crown size={12} />
                                    <span>Leader</span>
                                  </>
                                ) : (
                                  <>
                                    <Star size={12} />
                                    <span>Playoffs</span>
                                  </>
                                )}
                              </div>
                            </motion.div>
                          )}
                          
                          <div className="relative p-6">
                            <div className="flex items-center gap-6">
                              {/* Position Badge */}
                              <motion.div
                                whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                                transition={{ duration: 0.5 }}
                                className="flex-shrink-0"
                              >
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black relative overflow-hidden ${
                                  isChampion ? 'bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 text-gray-900 shadow-2xl shadow-amber-500/50' :
                                  index === 1 ? 'bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 text-gray-900 shadow-xl shadow-gray-500/30' :
                                  index === 2 ? 'bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 text-white shadow-xl shadow-orange-500/30' :
                                  isQualifyingPosition ? 'bg-gradient-to-br from-green-400 via-emerald-500 to-green-600 text-white shadow-xl shadow-green-500/30' :
                                  'bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-white border-2 border-white/20'
                                }`}>
                                  {isChampion && (
                                    <motion.div
                                      animate={{ 
                                        scale: [1, 1.2, 1],
                                        rotate: [0, 5, -5, 0]
                                      }}
                                      transition={{ 
                                        duration: 2,
                                        repeat: Infinity,
                                        repeatType: "reverse"
                                      }}
                                      className="absolute inset-0 flex items-center justify-center"
                                    >
                                      <Sparkles size={20} className="absolute top-1 right-1" />
                                    </motion.div>
                                  )}
                                  <span className="relative z-10">{index + 1}</span>
                                </div>
                              </motion.div>
                              
                              {/* Team Info */}
                              <div className="flex-1 min-w-0">
                                <motion.h3 
                                  className={`text-xl md:text-2xl font-black mb-2 truncate ${
                                    isChampion ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500' :
                                    'text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-pink-400 group-hover:to-purple-400'
                                  }`}
                                  transition={{ duration: 0.3 }}
                                >
                                  {stat.teamName}
                                </motion.h3>
                                
                                {/* Stats Grid */}
                                <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
                                  <div className="text-center">
                                    <div className="text-xs text-gray-500 uppercase mb-1 font-semibold">Matches</div>
                                    <div className="text-lg md:text-xl font-bold text-gray-300">{stat.matches ?? 0}</div>
                                  </div>
                                  
                                  <div className="text-center">
                                    <div className="text-xs text-gray-500 uppercase mb-1 font-semibold">Won</div>
                                    <div className="text-lg md:text-xl font-bold text-green-400 flex items-center justify-center gap-1">
                                      <TrendingUp size={16} />
                                      {stat.wins ?? 0}
                                    </div>
                                  </div>
                                  
                                  <div className="text-center">
                                    <div className="text-xs text-gray-500 uppercase mb-1 font-semibold">Lost</div>
                                    <div className="text-lg md:text-xl font-bold text-red-400 flex items-center justify-center gap-1">
                                      <TrendingDown size={16} />
                                      {stat.losses ?? 0}
                                    </div>
                                  </div>
                                  
                                  <div className="text-center">
                                    <div className="text-xs text-gray-500 uppercase mb-1 font-semibold">Points</div>
                                    <motion.div 
                                      className={`text-2xl md:text-3xl font-black ${
                                        isChampion ? 'text-amber-400' : 'text-yellow-400'
                                      }`}
                                      whileHover={{ scale: 1.2 }}
                                      transition={{ type: "spring", stiffness: 300 }}
                                    >
                                      {stat.points ?? 0}
                                    </motion.div>
                                  </div>
                                  
                                  <div className="text-center hidden md:block">
                                    <div className="text-xs text-gray-500 uppercase mb-1 font-semibold">NRR</div>
                                    <div className={`text-lg font-bold flex items-center justify-center gap-1 ${
                                      (stat.netRunRate ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                      {(stat.netRunRate ?? 0) > 0 ? <ArrowUp size={16} /> : (stat.netRunRate ?? 0) < 0 ? <ArrowDown size={16} /> : null}
                                      {(stat.netRunRate ?? 0) >= 0 ? '+' : ''}{(stat.netRunRate ?? 0).toFixed(3)}
                                    </div>
                                  </div>
                                  
                                  <div className="text-center hidden md:block">
                                    <div className="text-xs text-gray-500 uppercase mb-1 font-semibold">Form</div>
                                    <div className="flex items-center justify-center gap-1">
                                      {[...Array(Math.min(5, stat.matches ?? 0))].map((_, i) => {
                                        const isWin = i < (stat.wins ?? 0);
                                        return (
                                          <motion.div
                                            key={i}
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: index * 0.08 + 0.5 + i * 0.05 }}
                                            className={`w-2 h-2 rounded-full ${isWin ? 'bg-green-400' : 'bg-red-400'}`}
                                          />
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Animated border shimmer */}
                          {isQualifyingPosition && (
                            <motion.div
                              className="absolute inset-0 rounded-2xl"
                              style={{
                                background: `linear-gradient(90deg, transparent, ${isChampion ? '#fbbf2440' : '#10b98140'}, transparent)`,
                              }}
                              animate={{
                                x: ['-100%', '200%'],
                              }}
                              transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "linear",
                                delay: index * 0.3
                              }}
                            />
                          )}
                        </motion.div>
                      );
                    })}
                    
                    {/* Legend */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: sortedTeamStats.length * 0.08 + 0.3 }}
                      className="mt-8 p-4 rounded-xl"
                      style={{ ...getWPLGlassmorphism(), border: '1px solid #ffffff10' }}
                    >
                      <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500"></div>
                          <span className="text-gray-400">League Leader</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-green-400 to-emerald-500"></div>
                          <span className="text-gray-400">Playoff Qualification</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ArrowUp size={14} className="text-green-400" />
                          <span className="text-gray-400">Positive NRR</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ArrowDown size={14} className="text-red-400" />
                          <span className="text-gray-400">Negative NRR</span>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </AnimatedSection>
      </div>

      <Footer />
    </div>
  );
}
