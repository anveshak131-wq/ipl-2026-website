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

        const statsResponse = await fetch('/api/stats?league=wpl&type=all');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          
          if (statsData.battingStats && Array.isArray(statsData.battingStats)) {
            setBattingStats(statsData.battingStats);
          }
          
          if (statsData.bowlingStats && Array.isArray(statsData.bowlingStats)) {
            setBowlingStats(statsData.bowlingStats);
          }
          
          if (statsData.teamStats && Array.isArray(statsData.teamStats)) {
            setTeamStats(statsData.teamStats);
          }
        }

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
                    <table className="w-full">
                      <thead className="border-b border-white/10" style={{ background: `linear-gradient(to right, ${WPLColors.accent}10, ${WPLColors.secondary}10)` }}>
                        <tr>
                          <th className="py-4 px-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Rank</th>
                          <th className="py-4 px-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Player</th>
                          <th className="py-4 px-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider hidden md:table-cell">Team</th>
                          <th className="py-4 px-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider hidden lg:table-cell">M</th>
                          <th className="py-4 px-4 text-center text-xs font-bold text-pink-400 uppercase tracking-wider">Runs</th>
                          <th className="py-4 px-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Avg</th>
                          <th className="py-4 px-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:table-cell">SR</th>
                          <th className="py-4 px-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider hidden xl:table-cell">HS</th>
                          <th className="py-4 px-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider hidden lg:table-cell">100s/50s</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBattingStats.map((stat, index) => (
                          <motion.tr
                            key={stat.playerId}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="border-b border-white/5 hover:bg-white/5 transition-all group"
                          >
                            <td className="py-5 px-4">
                              <div className="flex items-center gap-3">
                                {index < 3 ? (
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                    index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-gray-900' :
                                    index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-900' :
                                    'bg-gradient-to-br from-orange-400 to-orange-500 text-white'
                                  }`}>
                                    {index + 1}
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-gray-400 bg-white/5">
                                    {index + 1}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-5 px-4">
                              <div className="font-bold text-white group-hover:text-pink-400 transition-colors">{stat.playerName}</div>
                              <div className="text-xs text-gray-500 md:hidden">{stat.teamName}</div>
                            </td>
                            <td className="py-5 px-4 text-center text-sm text-gray-400 hidden md:table-cell">{stat.teamName}</td>
                            <td className="py-5 px-4 text-center text-sm text-gray-400 hidden lg:table-cell">{stat.matches}</td>
                            <td className="py-5 px-4 text-center">
                              <div className="text-lg font-black text-pink-400">{stat.runs}</div>
                            </td>
                            <td className="py-5 px-4 text-center text-sm text-gray-300 hidden sm:table-cell">{stat.average.toFixed(2)}</td>
                            <td className="py-5 px-4 text-center text-sm text-gray-300 hidden sm:table-cell">{stat.strikeRate.toFixed(2)}</td>
                            <td className="py-5 px-4 text-center text-sm text-gray-400 hidden xl:table-cell">{stat.highScore}</td>
                            <td className="py-5 px-4 text-center text-sm text-gray-400 hidden lg:table-cell">
                              <span className="text-amber-400 font-semibold">{stat.hundreds}</span> / <span className="text-green-400 font-semibold">{stat.fifties}</span>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
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
                    <table className="w-full">
                      <thead className="border-b border-white/10" style={{ background: `linear-gradient(to right, ${WPLColors.secondary}10, ${WPLColors.accent}10)` }}>
                        <tr>
                          <th className="py-4 px-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Rank</th>
                          <th className="py-4 px-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Player</th>
                          <th className="py-4 px-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider hidden md:table-cell">Team</th>
                          <th className="py-4 px-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider hidden lg:table-cell">M</th>
                          <th className="py-4 px-4 text-center text-xs font-bold text-purple-400 uppercase tracking-wider">Wkts</th>
                          <th className="py-4 px-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Avg</th>
                          <th className="py-4 px-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Econ</th>
                          <th className="py-4 px-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider hidden xl:table-cell">SR</th>
                          <th className="py-4 px-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Best</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBowlingStats.map((stat, index) => (
                          <motion.tr
                            key={stat.playerId}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="border-b border-white/5 hover:bg-white/5 transition-all group"
                          >
                            <td className="py-5 px-4">
                              <div className="flex items-center gap-3">
                                {index < 3 ? (
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                    index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-gray-900' :
                                    index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-900' :
                                    'bg-gradient-to-br from-orange-400 to-orange-500 text-white'
                                  }`}>
                                    {index + 1}
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-gray-400 bg-white/5">
                                    {index + 1}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-5 px-4">
                              <div className="font-bold text-white group-hover:text-purple-400 transition-colors">{stat.playerName}</div>
                              <div className="text-xs text-gray-500 md:hidden">{stat.teamName}</div>
                            </td>
                            <td className="py-5 px-4 text-center text-sm text-gray-400 hidden md:table-cell">{stat.teamName}</td>
                            <td className="py-5 px-4 text-center text-sm text-gray-400 hidden lg:table-cell">{stat.matches}</td>
                            <td className="py-5 px-4 text-center">
                              <div className="text-lg font-black text-purple-400">{stat.wickets}</div>
                            </td>
                            <td className="py-5 px-4 text-center text-sm text-gray-300 hidden sm:table-cell">{stat.average.toFixed(2)}</td>
                            <td className="py-5 px-4 text-center text-sm text-gray-300 hidden sm:table-cell">{stat.economy.toFixed(2)}</td>
                            <td className="py-5 px-4 text-center text-sm text-gray-400 hidden xl:table-cell">{stat.strikeRate.toFixed(2)}</td>
                            <td className="py-5 px-4 text-center text-sm font-semibold text-purple-400 hidden lg:table-cell">{stat.bestBowling}</td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'points' && (
              <motion.div
                key="points"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl overflow-hidden"
                style={{ ...getWPLGlassmorphism(), border: `1px solid #f59e0b30` }}
              >
                {sortedTeamStats.length === 0 ? (
                  <div className="text-center py-20">
                    <Trophy className="mx-auto mb-4 text-gray-600" size={64} />
                    <p className="text-xl font-semibold text-gray-400 mb-2">No standings available yet</p>
                    <p className="text-sm text-gray-500">Standings will appear once matches are played</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-white/10" style={{ background: 'linear-gradient(to right, #f59e0b10, #eab30810)' }}>
                        <tr>
                          <th className="py-4 px-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Pos</th>
                          <th className="py-4 px-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Team</th>
                          <th className="py-4 px-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:table-cell">M</th>
                          <th className="py-4 px-4 text-center text-xs font-bold text-green-400 uppercase tracking-wider">W</th>
                          <th className="py-4 px-4 text-center text-xs font-bold text-red-400 uppercase tracking-wider">L</th>
                          <th className="py-4 px-4 text-center text-xs font-bold text-yellow-400 uppercase tracking-wider">Pts</th>
                          <th className="py-4 px-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider hidden md:table-cell">NRR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedTeamStats.map((stat, index) => (
                          <motion.tr
                            key={stat.teamId}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-b border-white/5 hover:bg-white/5 transition-all group"
                          >
                            <td className="py-5 px-4">
                              <div className="flex items-center gap-3">
                                {index < 4 ? (
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                    index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-gray-900' :
                                    index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-900' :
                                    index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white' :
                                    'bg-gradient-to-br from-green-400 to-emerald-500 text-white'
                                  }`}>
                                    {index + 1}
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-gray-400 bg-white/5">
                                    {index + 1}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-5 px-4">
                              <div className="font-bold text-white group-hover:text-yellow-400 transition-colors">{stat.teamName}</div>
                            </td>
                            <td className="py-5 px-4 text-center text-sm text-gray-400 hidden sm:table-cell">{stat.matches || 'N/A'}</td>
                            <td className="py-5 px-4 text-center">
                              <div className="text-base font-bold text-green-400">{stat.wins || 'N/A'}</div>
                            </td>
                            <td className="py-5 px-4 text-center">
                              <div className="text-base font-bold text-red-400">{stat.losses || 'N/A'}</div>
                            </td>
                            <td className="py-5 px-4 text-center">
                              <div className="text-xl font-black text-yellow-400">{stat.points || 'N/A'}</div>
                            </td>
                            <td className="py-5 px-4 text-center hidden md:table-cell">
                              <div className={`inline-flex items-center gap-1 text-sm font-bold ${stat.netRunRate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {stat.netRunRate > 0 ? <ArrowUp size={14} /> : stat.netRunRate < 0 ? <ArrowDown size={14} /> : null}
                                {stat.netRunRate >= 0 ? '+' : ''}{stat.netRunRate ? stat.netRunRate.toFixed(3) : 'N/A'}
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
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
