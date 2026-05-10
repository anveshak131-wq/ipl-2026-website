'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AuroraBackground from '@/components/ui/AuroraBackground';
import { Trophy, ArrowLeft, ArrowRight, TrendingUp, TrendingDown, Info, Star, Award, Users, Calendar, Clock, Filter, Search, X } from 'lucide-react';
import { api } from '@/lib/data';
import { Team, Match } from '@/types';
import { useLeague } from '@/contexts/LeagueContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import GradientText from '@/components/ui/GradientText';
import AnimatedSection from '@/components/ui/AnimatedSection';
import { formatMatchTime } from '@/lib/timeUtils';

const IPL_STORAGE_KEY = 'iplPointsTableStats';

type PublicPointsStatus = {
  qualified?: boolean;
  eliminated?: boolean;
};

// Custom components for the points table
export default function IPLPointsTablePage() {
  const router = useRouter();
  const { currentLeague } = useLeague();
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'points' | 'wins' | 'losses' | 'nrr'>('points');
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavoritesFirst, setShowFavoritesFirst] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('favoriteTeams');
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  // Fetch data for points table
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [teamsData, matchesData] = await Promise.all([
          api.getTeams(currentLeague),
          api.getMatches(currentLeague)
        ]);
        
        setTeams(teamsData);
        setMatches(matchesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [currentLeague]);

  // Generate available years (2008 to current year)
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = 2008; year <= currentYear; year++) {
      years.push(year);
    }
    setAvailableYears(years);
  }, []);

  // Calculate points table data
  const pointsTable = useMemo(() => {
    let savedStatuses: Record<string, PublicPointsStatus> = {};
    if (typeof window !== 'undefined') {
      try {
        const allStats = JSON.parse(localStorage.getItem(IPL_STORAGE_KEY) || '{}') || {};
        savedStatuses = (allStats[selectedYear] as Record<string, PublicPointsStatus>) || {};
      } catch {
        /* ignore */
      }
    }

    const currentYear = new Date().getFullYear();

    return teams.map(team => {
      const teamMatches = matches.filter(m =>
        (m.team1.id === team.id || m.team2.id === team.id) &&
        m.status === 'completed' &&
        new Date(m.date).getFullYear() === selectedYear
      );
       
      const wins = teamMatches.filter(m => {
        if (!m.result) return false;
        return m.result.includes(team.shortName) || m.result.includes(team.name);
      }).length;
       
      const losses = teamMatches.length - wins;
      const points = wins * 2;
       
      // Calculate Net Run Rate (simplified)
      let netRunRate = 0;
      if (teamMatches.length > 0) {
        const totalRunsScored = teamMatches.reduce((sum, match) => {
          if (match.team1.id === team.id) {
            return sum + (match.team1Score || 0);
          } else if (match.team2.id === team.id) {
            return sum + (match.team2Score || 0);
          }
          return sum;
        }, 0);
         
        const totalRunsConceded = teamMatches.reduce((sum, match) => {
          if (match.team1.id === team.id) {
            return sum + (match.team2Score || 0);
          } else if (match.team2.id === team.id) {
            return sum + (match.team1Score || 0);
          }
          return sum;
        }, 0);
         
        netRunRate = (totalRunsScored - totalRunsConceded) / (teamMatches.length * 20);
      }

      const apiStatus = ((team as Team & { stats?: PublicPointsStatus }).stats ?? {}) as PublicPointsStatus;
      const localStatus = savedStatuses[team.id] || {};
      const seasonStatus = Object.keys(localStatus).length > 0
        ? localStatus
        : selectedYear === currentYear
          ? apiStatus
          : {};
       
      return {
        ...team,
        matchesPlayed: teamMatches.length,
        wins,
        losses,
        points,
        netRunRate: parseFloat(netRunRate.toFixed(2)),
        qualified: Boolean(seasonStatus.qualified),
        eliminated: Boolean(seasonStatus.eliminated)
      };
    });
  }, [teams, matches, selectedYear]);

  // Sort and filter points table
  const sortedPointsTable = useMemo(() => {
    let result = [...pointsTable];
    
    // Filter by search term
    if (searchTerm) {
      const normalized = searchTerm.trim().toLowerCase();
      result = result.filter(team =>
        team.name.toLowerCase().includes(normalized) ||
        team.shortName.toLowerCase().includes(normalized)
      );
    }
    
    // Sort by selected criteria
    result.sort((a, b) => {
      if (sortBy === 'points') {
        return b.points - a.points;
      } else if (sortBy === 'wins') {
        return b.wins - a.wins;
      } else if (sortBy === 'losses') {
        return a.losses - b.losses;
      } else if (sortBy === 'nrr') {
        return b.netRunRate - a.netRunRate;
      }
      return 0;
    });
    
    // Show favorites first if enabled
    if (showFavoritesFirst) {
      result = [
        ...result.filter(t => favorites.includes(t.id)),
        ...result.filter(t => !favorites.includes(t.id))
      ];
    }
    
    return result;
  }, [pointsTable, searchTerm, sortBy, showFavoritesFirst, favorites]);

  const toggleFavorite = (teamId: string) => {
    const newFavorites = favorites.includes(teamId)
      ? favorites.filter(id => id !== teamId)
      : [...favorites, teamId];
    setFavorites(newFavorites);
    localStorage.setItem('favoriteTeams', JSON.stringify(newFavorites));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSortBy('points');
    setShowFavoritesFirst(false);
  };

  const hasActiveFilters = searchTerm || showFavoritesFirst;

  // Get upcoming matches for the league
  const upcomingMatches = useMemo(() => {
    return matches
      .filter(m => m.status === 'upcoming')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
  }, [matches]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black overflow-hidden">
      <Navbar />
      <AuroraBackground />

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `
              linear-gradient(rgba(236, 28, 36, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(236, 28, 36, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }} />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center py-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <motion.span
                className="inline-flex items-center gap-3 px-6 py-3 rounded-full backdrop-blur-2xl border-2 border-white/20 bg-gradient-to-r from-red-500/20 via-yellow-500/20 to-red-500/20 shadow-2xl"
                whileHover={{ scale: 1.05 }}
              >
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="text-sm font-black uppercase tracking-widest bg-gradient-to-r from-red-400 via-yellow-400 to-red-400 bg-clip-text text-transparent">
                  {currentLeague === 'wpl' ? 'WPL 2026' : 'IPL 2026'} POINTS TABLE
                </span>
              </motion.span>
            </motion.div>

            <motion.h1
              className="text-6xl md:text-7xl lg:text-8xl font-black mb-8 leading-[0.9] tracking-tight"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              <GradientText gradient="from-red-400 via-yellow-400 to-red-400" animate>
                Championship Standings
              </GradientText>
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto mb-12 leading-relaxed font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Track the race for the playoffs with real-time points, wins, and net run rate. 
              See which teams are leading the pack and who needs to step up their game!
            </motion.p>

            {/* Quick Stats */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              {[
                { label: 'Teams', value: teams.length, icon: Users, color: 'from-red-500 to-yellow-500' },
                { label: 'Matches Played', value: matches.filter(m => m.status === 'completed').length, icon: Calendar, color: 'from-yellow-500 to-red-500' },
                { label: 'Upcoming', value: upcomingMatches.length, icon: Clock, color: 'from-red-500 to-yellow-500' },
                { label: 'Total Points', value: pointsTable.reduce((sum, team) => sum + team.points, 0), icon: Award, color: 'from-yellow-500 to-red-500' }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  className="group relative overflow-hidden rounded-3xl backdrop-blur-2xl border-2 border-white/20 bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 p-6"
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                  whileHover={{ scale: 1.1, y: -10 }}
                >
                  <div className="relative z-10">
                    <motion.div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300`}
                    >
                      <stat.icon className="w-6 h-6 text-white" />
                    </motion.div>
                    <p className="text-4xl font-black mb-2 text-white">
                      {stat.value}
                    </p>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                      {stat.label}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Filter Section */}
        <section className="relative z-20 -mt-20 mb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="relative rounded-3xl backdrop-blur-2xl border-2 border-white/20 bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 shadow-2xl overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative z-10 p-6 md:p-8">
                {/* Year Filter */}
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-bold uppercase tracking-wider text-gray-300 mb-2">Season Year</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="w-full px-4 py-3 bg-slate-800/60 border-2 border-white/15 text-white rounded-xl focus:outline-none focus:border-yellow-500 focus:ring-4 focus:ring-yellow-500/20 transition-all text-lg font-medium"
                    >
                      {availableYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative mb-6 group">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-yellow-500/20 to-red-500/20 rounded-2xl blur-2xl opacity-0 group-focus-within:opacity-50 transition-opacity duration-500" />
                  <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 group-focus-within:text-yellow-400 transition-colors" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search teams by name or abbreviation..."
                      className="w-full pl-16 pr-14 py-4 rounded-2xl bg-slate-800/60 border-2 border-white/15 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-4 focus:ring-yellow-500/20 transition-all text-lg font-medium"
                    />
                    {searchTerm && (
                      <motion.button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        whileHover={{ scale: 1.2, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <X className="w-6 h-6" />
                      </motion.button>
                    )}
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-4">
                  {/* Sort Options */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold uppercase tracking-wider text-gray-300">Sort:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'points' | 'wins' | 'losses' | 'nrr')}
                      className="px-5 py-2.5 rounded-xl text-sm font-bold bg-slate-800/60 text-white border-2 border-white/10 focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 hover:border-yellow-500/50 transition-all cursor-pointer"
                    >
                      <option value="points">Points (High to Low)</option>
                      <option value="wins">Wins (Most first)</option>
                      <option value="losses">Losses (Least first)</option>
                      <option value="nrr">Net Run Rate</option>
                    </select>
                  </div>

                  {/* Favorites Toggle */}
                  {favorites.length > 0 && (
                    <>
                      <div className="h-8 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                      <motion.button
                        onClick={() => setShowFavoritesFirst(!showFavoritesFirst)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                          showFavoritesFirst
                            ? 'bg-gradient-to-r from-rose-500/30 to-pink-500/30 text-rose-300 border-2 border-rose-500/50 shadow-lg'
                            : 'bg-slate-800/60 text-gray-300 border-2 border-white/10 hover:border-rose-500/50 hover:bg-slate-700/60'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Star className={`w-4 h-4 ${showFavoritesFirst ? 'fill-rose-300' : ''}`} />
                        Favorites
                      </motion.button>
                    </>
                  )}

                  {/* Clear Filters */}
                  {hasActiveFilters && (
                    <>
                      <div className="flex-1" />
                      <motion.button
                        onClick={clearFilters}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-300 border-2 border-red-500/50 hover:from-red-500/30 hover:to-red-600/30 transition-all flex items-center gap-2"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <X className="w-4 h-4" />
                        Clear all
                      </motion.button>
                    </>
                  )}
                </div>

                {/* Results Count */}
                <div className="flex items-center justify-between pt-6 mt-6 border-t border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400">
                      Showing <span className="font-black text-white text-lg">{sortedPointsTable.length}</span> of <span className="font-black text-white text-lg">{teams.length}</span> teams
                    </span>
                    {hasActiveFilters && (
                      <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        Filtered
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Points Table */}
        <section className="relative z-10 pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {isLoading ? (
              <motion.div
                className="text-center py-32"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <LoadingSpinner size="lg" />
                <p className="text-gray-400 text-xl mt-8">Loading points table...</p>
              </motion.div>
            ) : sortedPointsTable.length === 0 ? (
              <motion.div
                className="text-center py-32"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  className="inline-flex items-center justify-center w-40 h-40 rounded-full bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-2 border-white/10 mb-8"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Trophy className="w-20 h-20 text-gray-400" />
                </motion.div>
                <h3 className="text-4xl font-black text-white mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  No teams found
                </h3>
                <p className="text-gray-400 text-xl max-w-md mx-auto mb-10">
                  {searchTerm ? `No teams match "${searchTerm}"` : 'No teams match your filters'}
                </p>
                <motion.button
                  onClick={clearFilters}
                  className="px-10 py-5 rounded-2xl bg-gradient-to-r from-red-500 to-yellow-500 text-white font-black text-lg hover:shadow-2xl transition-all flex items-center gap-3 mx-auto"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-5 h-5" />
                  Clear all filters
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                className="space-y-4"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                    },
                  },
                }}
              >
                {/* Table Header */}
                <div className="grid grid-cols-[40px_200px_1fr_100px_100px_100px_100px_100px_60px] gap-4 px-6 py-4 rounded-3xl backdrop-blur-2xl border-2 border-white/20 bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 text-sm font-bold uppercase tracking-wider text-gray-300">
                  <div className="flex items-center justify-center">Rank</div>
                  <div className="flex items-center gap-2">Team <Info className="w-4 h-4 text-gray-500" /></div>
                  <div className="flex items-center gap-2">Name</div>
                  <div className="flex items-center gap-2">Played</div>
                  <div className="flex items-center gap-2">Wins</div>
                  <div className="flex items-center gap-2">Losses</div>
                  <div className="flex items-center gap-2">Points</div>
                  <div className="flex items-center gap-2">NRR</div>
                  <div className="flex items-center justify-center">Favorite</div>
                </div>

                {/* Table Rows */}
                <AnimatePresence mode="popLayout">
                  {sortedPointsTable.map((team, index) => {
                    const isFavorite = favorites.includes(team.id);
                    const rank = index + 1;
                    const isTop4 = rank <= 4;
                    const isBottom2 = rank >= sortedPointsTable.length - 1;
                    const isQualified = Boolean(team.qualified);
                    const isEliminated = Boolean(team.eliminated);

                    return (
                      <motion.div
                        key={team.id}
                        layout
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8, y: -20 }}
                        transition={{
                          duration: 0.6,
                          delay: index * 0.05,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        whileHover={{
                          y: -5,
                          scale: 1.02,
                          transition: { duration: 0.3 }
                        }}
                        className={`relative group grid grid-cols-[40px_200px_1fr_100px_100px_100px_100px_100px_60px] gap-4 items-center px-6 py-5 rounded-3xl backdrop-blur-2xl border-2 border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-800/70 to-slate-900/80 transition-all duration-300 cursor-pointer ${
                          isQualified || isTop4 ? 'border-yellow-500/50 bg-gradient-to-br from-yellow-900/30 via-yellow-800/20 to-yellow-900/30' :
                          isEliminated ? 'border-rose-500/50 bg-gradient-to-br from-rose-900/30 via-rose-800/20 to-rose-900/30' :
                          isBottom2 ? 'border-red-500/50 bg-gradient-to-br from-red-900/30 via-red-800/20 to-red-900/30' :
                          'hover:border-yellow-500/50 hover:bg-gradient-to-br from-yellow-900/20 via-yellow-800/10 to-yellow-900/20'
                        }`}
                        onClick={() => router.push(`/teams/${team.id}`)}
                      >
                        {/* Rank */}
                        <div className={`flex items-center justify-center text-2xl font-black ${
                          isQualified || isTop4 ? 'text-yellow-400' : isEliminated || isBottom2 ? 'text-rose-300' : 'text-white'
                        }`}>
                          {rank}
                        </div>

                        {/* Team Logo */}
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-yellow-500 flex items-center justify-center text-white font-black text-lg shadow-lg">
                            {team.shortName.slice(0, 2)}
                          </div>
                          <span className="text-xl font-black text-white">{team.shortName}</span>
                        </div>

                        {/* Team Name */}
                        <div className="min-w-0">
                          <div className="text-white font-semibold truncate">{team.name}</div>
                          {(isQualified || isEliminated) && (
                            <div className="mt-2 flex items-center gap-2">
                              {isQualified && (
                                <span className="inline-flex items-center rounded-full border border-yellow-400/40 bg-yellow-500/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-yellow-300">
                                  Qualified
                                </span>
                              )}
                              {isEliminated && (
                                <span className="inline-flex items-center rounded-full border border-rose-400/40 bg-rose-500/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-rose-300">
                                  Eliminated
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Matches Played */}
                        <div className="text-white font-bold">{team.matchesPlayed}</div>

                        {/* Wins */}
                        <div className="text-green-400 font-bold flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          {team.wins}
                        </div>

                        {/* Losses */}
                        <div className="text-red-400 font-bold flex items-center gap-1">
                          <TrendingDown className="w-4 h-4" />
                          {team.losses}
                        </div>

                        {/* Points */}
                        <div className="text-yellow-400 font-black text-xl">{team.points}</div>

                        {/* Net Run Rate */}
                        <div className={`font-bold ${
                          team.netRunRate > 0 ? 'text-green-400' : team.netRunRate < 0 ? 'text-red-400' : 'text-white'
                        }`}>
                          {team.netRunRate}
                        </div>

                        {/* Favorite Button */}
                        <div className="flex items-center justify-center">
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(team.id);
                            }}
                            className={`p-2 rounded-full transition-all ${
                              isFavorite ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white' : 'bg-slate-800/60 text-gray-400 hover:bg-slate-700/60'
                            }`}
                            whileHover={{ scale: 1.2, rotate: isFavorite ? 0 : 15 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Star className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                          </motion.button>
                        </div>

                        {/* Hover effects */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 rounded-3xl blur-2xl" style={{
                          background: isQualified || isTop4 ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(236, 28, 36, 0.3))' :
                                      isEliminated || isBottom2 ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.28), rgba(127, 29, 29, 0.3))' :
                                      'linear-gradient(135deg, rgba(236, 28, 36, 0.2), rgba(255, 215, 0, 0.2))'
                        }} />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </section>

        {/* Upcoming Matches Section */}
        {upcomingMatches.length > 0 && (
          <section className="relative z-10 py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                className="relative overflow-hidden rounded-3xl backdrop-blur-2xl border-2 border-white/20 bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 p-12 md:p-16"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <div className="relative z-10">
                  <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                  >
                    <motion.span
                      className="inline-flex items-center gap-3 px-6 py-3 rounded-full backdrop-blur-2xl border-2 border-white/20 bg-gradient-to-r from-red-500/20 via-yellow-500/20 to-red-500/20 mb-8"
                      whileHover={{ scale: 1.05 }}
                    >
                      <Calendar className="w-5 h-5 text-yellow-400" />
                      <span className="text-sm font-black uppercase tracking-widest bg-gradient-to-r from-red-400 via-yellow-400 to-red-400 bg-clip-text text-transparent">
                        UPCOMING FIXTURES
                      </span>
                    </motion.span>

                    <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
                      Next <GradientText gradient="from-red-400 via-yellow-400 to-red-400" animate>Matches</GradientText>
                    </h2>

                    <p className="text-gray-300 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
                      Don't miss these crucial encounters that could shake up the points table!
                    </p>
                  </motion.div>

                  <motion.div
                    className="space-y-6"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    transition={{ staggerChildren: 0.1 }}
                  >
                    {upcomingMatches.map((match, index) => (
                      <motion.div
                        key={match.id}
                        className="group relative overflow-hidden rounded-2xl backdrop-blur-2xl border-2 border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-800/70 to-slate-900/80 p-6 hover:border-yellow-500/50 transition-all duration-300"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        whileHover={{ scale: 1.02, y: -5 }}
                      >
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-yellow-500 flex items-center justify-center text-white font-black text-lg shadow-lg">
                                {match.team1.shortName.slice(0, 2)}
                              </div>
                              <div>
                                <div className="text-xl font-black text-white">{match.team1.shortName}</div>
                                <div className="text-sm text-gray-400">{match.team1.name}</div>
                              </div>
                            </div>

                            <div className="text-center">
                              <div className="text-2xl font-black text-white mb-1">VS</div>
                              <div className="text-xs text-gray-400">
                                {formatMatchTime(match.time, match.date)}
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-xl font-black text-white">{match.team2.shortName}</div>
                                <div className="text-sm text-gray-400">{match.team2.name}</div>
                              </div>
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-yellow-500 flex items-center justify-center text-white font-black text-lg shadow-lg">
                                {match.team2.shortName.slice(0, 2)}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-300">{match.date}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-300">{match.time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-300">{match.venue}</span>
                            </div>
                          </div>
                        </div>

                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 rounded-2xl blur-2xl" style={{
                          background: 'linear-gradient(135deg, rgba(236, 28, 36, 0.2), rgba(255, 215, 0, 0.2))'
                        }} />
                      </motion.div>
                    ))}
                  </motion.div>

                  <motion.div
                    className="text-center mt-12"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: upcomingMatches.length * 0.1 }}
                  >
                    <motion.button
                      onClick={() => router.push('/matches')}
                      className="group relative overflow-hidden rounded-2xl font-black py-4 px-10 text-lg transition-all duration-500 cursor-pointer bg-gradient-to-r from-red-500 via-yellow-500 to-red-500 text-white shadow-2xl"
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                      <span className="relative z-10 flex items-center gap-3">
                        View All Matches
                        <ArrowRight className="w-5 h-5 transform group-hover:translate-x-2 transition-transform" />
                      </span>
                    </motion.button>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </section>
        )}

        {/* Legend Section */}
        <section className="relative z-10 py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="relative overflow-hidden rounded-3xl backdrop-blur-2xl border-2 border-white/20 bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 p-12 md:p-16"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="relative z-10">
                <motion.div
                  className="text-center mb-16"
                  initial={{ opacity: 0, y: -20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <motion.span
                    className="inline-flex items-center gap-3 px-6 py-3 rounded-full backdrop-blur-2xl border-2 border-white/20 bg-gradient-to-r from-red-500/20 via-yellow-500/20 to-red-500/20 mb-8"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Info className="w-5 h-5 text-yellow-400" />
                    <span className="text-sm font-black uppercase tracking-widest bg-gradient-to-r from-red-400 via-yellow-400 to-red-400 bg-clip-text text-transparent">
                      POINTS TABLE GUIDE
                    </span>
                  </motion.span>

                  <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
                    How It <GradientText gradient="from-red-400 via-yellow-400 to-red-400" animate>Works</GradientText>
                  </h2>

                  <p className="text-gray-300 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
                    Understanding the IPL points system and what these numbers mean
                  </p>
                </motion.div>

                <motion.div
                  className="grid grid-cols-1 md:grid-cols-3 gap-8"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ staggerChildren: 0.1 }}
                >
                  {[
                    {
                      title: 'Win',
                      description: 'Each win earns a team 2 points in the standings.',
                      icon: TrendingUp,
                      color: 'from-green-500 to-emerald-500'
                    },
                    {
                      title: 'Loss',
                      description: 'Teams receive 0 points for a loss.',
                      icon: TrendingDown,
                      color: 'from-red-500 to-pink-500'
                    },
                    {
                      title: 'Net Run Rate',
                      description: 'NRR determines rankings when teams have equal points. Higher is better.',
                      icon: Award,
                      color: 'from-yellow-500 to-amber-500'
                    },
                    {
                      title: 'Top 4',
                      description: 'The top 4 teams qualify for the playoffs at the end of the league stage.',
                      icon: Trophy,
                      color: 'from-yellow-500 to-red-500'
                    },
                    {
                      title: 'Tiebreaker',
                      description: 'If points are equal, NRR is used to break the tie.',
                      icon: Star,
                      color: 'from-purple-500 to-pink-500'
                    },
                    {
                      title: 'Playoffs',
                      description: 'Top 4 teams compete in playoffs to determine the champion.',
                      icon: Users,
                      color: 'from-blue-500 to-cyan-500'
                    }
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      className="group relative overflow-hidden rounded-2xl backdrop-blur-2xl border-2 border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-800/70 to-slate-900/80 p-8 hover:border-yellow-500/50 transition-all duration-300"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                    >
                      <div className="relative z-10">
                        <motion.div
                          className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300`}
                        >
                          <item.icon className="w-8 h-8 text-white" />
                        </motion.div>
                        <h3 className="text-2xl font-black text-white mb-4">{item.title}</h3>
                        <p className="text-gray-300 text-sm leading-relaxed">{item.description}</p>
                      </div>

                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 rounded-2xl blur-2xl" style={{
                        background: 'linear-gradient(135deg, rgba(236, 28, 36, 0.2), rgba(255, 215, 0, 0.2))'
                      }} />
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
