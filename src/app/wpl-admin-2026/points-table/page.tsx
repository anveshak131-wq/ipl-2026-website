'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Trophy, TrendingUp, TrendingDown, Info, Star, Award, Users, Calendar, Clock, Filter, Search, X, Edit, Save, Plus, Trash2, RefreshCw } from 'lucide-react';
import { api } from '@/lib/data';
import { Team, Match } from '@/types';
import { useLeague } from '@/contexts/LeagueContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import GradientText from '@/components/ui/GradientText';
import WPLAdminSidebarNew from '@/components/admin/WPLAdminSidebarNew';

export default function WPLAdminPointsTablePage() {
  const router = useRouter();
  const { currentLeague } = useLeague();
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'points' | 'wins' | 'losses' | 'nrr'>('points');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

  // Fetch data for points table
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Try to fetch from statistics API first
        try {
          const statsResponse = await fetch('/api/stats?league=wpl&type=teams');
          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            if (statsData.teamStats && statsData.teamStats.length > 0) {
              console.log('Loaded points table from statistics API');
              // We still need teams data for full info
              const teamsData = await api.getTeams('wpl');
              setTeams(teamsData);
              
              // Store the calculated stats for use
              (window as any).calculatedTeamStats = statsData.teamStats;
              setIsLoading(false);
              return;
            }
          }
        } catch (err) {
          console.log('Statistics API not available, falling back to matches');
        }

        // Fallback to old method
        const [teamsData, matchesData] = await Promise.all([
          api.getTeams('wpl'),
          api.getMatches('wpl')
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
  }, []);

  // Generate available years (2023 to current year for WPL)
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = 2023; year <= currentYear; year++) {
      years.push(year);
    }
    setAvailableYears(years);
  }, []);

  // Calculate points table data
  const pointsTable = useMemo(() => {
    // Check if we have calculated stats from the API (only in browser)
    const calculatedStats = typeof window !== 'undefined' ? (window as any).calculatedTeamStats : null;
    if (calculatedStats && calculatedStats.length > 0) {
      return teams.map(team => {
        const teamStat = calculatedStats.find((s: any) => s.teamId === parseInt(team.id) || s.teamName === team.name);
        if (teamStat) {
          // Add shortName display
          const displayShortName = team.shortName || team.name.split(' ').map(w => w[0]).join('');
          const displayName = team.name && team.name.includes('(WPL)') ? team.name : `${team.name || ''} (WPL)`;
          
          return {
            ...team,
            shortName: displayShortName,
            name: displayName,
            matchesPlayed: teamStat.matches,
            wins: teamStat.wins,
            losses: teamStat.losses,
            points: teamStat.points,
            netRunRate: teamStat.netRunRate
          };
        }
        return null;
      }).filter(Boolean);
    }

    // Fallback to calculating from matches
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
       
      // Normalize display names for WPL teams to avoid confusion with IPL names
      const displayShortName = team.shortName && team.shortName.includes('-W') ? team.shortName : `${team.shortName || ''}-W`;
      const displayName = team.name && team.name.includes('(WPL)') ? team.name : `${team.name || ''} (WPL)`;

      return {
        ...team,
        shortName: displayShortName,
        name: displayName,
        matchesPlayed: teamMatches.length,
        wins,
        losses,
        points,
        netRunRate: parseFloat(netRunRate.toFixed(2))
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
    
    return result;
  }, [pointsTable, searchTerm, sortBy]);

  const clearFilters = () => {
    setSearchTerm('');
    setSortBy('points');
  };

  const hasActiveFilters = searchTerm;

  // Get upcoming matches for the league
  const upcomingMatches = useMemo(() => {
    return matches
      .filter(m => m.status === 'upcoming')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
  }, [matches]);

  const handleEdit = (teamId: string) => {
    const team = pointsTable.find(t => t.id === teamId);
    if (team) {
      setEditingTeam(teamId);
      setEditData({
        matchesPlayed: team.matchesPlayed,
        wins: team.wins,
        losses: team.losses,
        points: team.points,
        netRunRate: team.netRunRate
      });
    }
  };

  const handleSave = async (teamId: string) => {
    // Here you would typically save to your backend
    console.log('Saving team data:', teamId, editData);
    setEditingTeam(null);
    setEditData({});
  };

  const handleCancel = () => {
    setEditingTeam(null);
    setEditData({});
  };

  const refreshData = () => {
    // Refetch data
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [teamsData, matchesData] = await Promise.all([
          api.getTeams('wpl'),
          api.getMatches('wpl')
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-pink-900 to-black flex">
      <WPLAdminSidebarNew />
      
      <main className="flex-1 relative z-10">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 backdrop-blur-2xl border-b border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-white mb-2">
                <GradientText gradient="from-purple-400 via-pink-400 to-purple-400">
                  WPL Points Table Admin
                </GradientText>
              </h1>
              <p className="text-gray-300">Manage and view WPL championship standings</p>
            </div>
            <div className="flex items-center gap-4">
              <motion.button
                onClick={refreshData}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </motion.button>
              <motion.button
                onClick={() => setIsEditing(!isEditing)}
                className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${
                  isEditing 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                    : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isEditing ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                {isEditing ? 'Save All' : 'Edit Mode'}
              </motion.button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Filter Section */}
          <motion.div
            className="relative rounded-3xl backdrop-blur-2xl border-2 border-white/20 bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 shadow-2xl overflow-hidden mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative z-10 p-6">
              {/* Year Filter */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-bold uppercase tracking-wider text-gray-300 mb-2">Season Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-800/60 border-2 border-white/15 text-white rounded-xl focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20 transition-all text-lg font-medium"
                  >
                    {availableYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative mb-6 group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 rounded-2xl blur-2xl opacity-0 group-focus-within:opacity-50 transition-opacity duration-500" />
                <div className="relative">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 group-focus-within:text-pink-400 transition-colors" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search teams by name or abbreviation..."
                    className="w-full pl-16 pr-14 py-4 rounded-2xl bg-slate-800/60 border-2 border-white/15 text-white placeholder-gray-400 focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20 transition-all text-lg font-medium"
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
                    className="px-5 py-2.5 rounded-xl text-sm font-bold bg-slate-800/60 text-white border-2 border-white/10 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 hover:border-pink-500/50 transition-all cursor-pointer"
                  >
                    <option value="points">Points (High to Low)</option>
                    <option value="wins">Wins (Most first)</option>
                    <option value="losses">Losses (Least first)</option>
                    <option value="nrr">Net Run Rate</option>
                  </select>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <>
                    <div className="flex-1" />
                    <motion.button
                      onClick={clearFilters}
                      className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-300 border-2 border-purple-500/50 hover:from-purple-500/30 hover:to-purple-600/30 transition-all flex items-center gap-2"
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
                    <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Filtered
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Points Table */}
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
                className="px-10 py-5 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black text-lg hover:shadow-2xl transition-all flex items-center gap-3 mx-auto"
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
              <div className="grid grid-cols-[40px_200px_1fr_100px_100px_100px_100px_100px_120px] gap-4 px-6 py-4 rounded-3xl backdrop-blur-2xl border-2 border-white/20 bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 text-sm font-bold uppercase tracking-wider text-gray-300">
                <div className="flex items-center justify-center">Rank</div>
                <div className="flex items-center gap-2">Team <Info className="w-4 h-4 text-gray-500" /></div>
                <div className="flex items-center gap-2">Name</div>
                <div className="flex items-center gap-2">Played</div>
                <div className="flex items-center gap-2">Wins</div>
                <div className="flex items-center gap-2">Losses</div>
                <div className="flex items-center gap-2">Points</div>
                <div className="flex items-center gap-2">NRR</div>
                <div className="flex items-center justify-center">Actions</div>
              </div>

              {/* Table Rows */}
              <AnimatePresence mode="popLayout">
                {sortedPointsTable.map((team, index) => {
                  const rank = index + 1;
                  const isTop3 = rank <= 3; // Top 3 for 5 teams
                  const isBottom2 = rank >= sortedPointsTable.length - 1;
                  const isCurrentlyEditing = editingTeam === team.id;

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
                      className={`relative group grid grid-cols-[40px_200px_1fr_100px_100px_100px_100px_100px_120px] gap-4 items-center px-6 py-5 rounded-3xl backdrop-blur-2xl border-2 border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-800/70 to-slate-900/80 transition-all duration-300 cursor-pointer ${
                        isTop3 ? 'border-pink-500/50 bg-gradient-to-br from-pink-900/30 via-purple-800/20 to-pink-900/30' :
                        isBottom2 ? 'border-purple-500/50 bg-gradient-to-br from-purple-900/30 via-pink-800/20 to-purple-900/30' :
                        'hover:border-pink-500/50 hover:bg-gradient-to-br from-pink-900/20 via-purple-800/10 to-pink-900/20'
                      }`}
                    >
                      {/* Rank */}
                      <div className={`flex items-center justify-center text-2xl font-black ${
                        isTop3 ? 'text-pink-400' : isBottom2 ? 'text-purple-400' : 'text-white'
                      }`}>
                        {rank}
                      </div>

                      {/* Team Logo */}
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-lg shadow-lg">
                          {team.shortName.slice(0, 2)}
                        </div>
                        <span className="text-xl font-black text-white">{team.shortName}</span>
                      </div>

                      {/* Team Name */}
                      <div className="text-white font-semibold">{team.name}</div>

                      {/* Matches Played */}
                      <div className="text-white font-bold">
                        {isCurrentlyEditing ? (
                          <input
                            type="number"
                            value={editData.matchesPlayed}
                            onChange={(e) => setEditData({...editData, matchesPlayed: parseInt(e.target.value) || 0})}
                            className="w-16 px-2 py-1 bg-slate-700 border border-pink-500 rounded text-center"
                            min="0"
                          />
                        ) : (
                          team.matchesPlayed
                        )}
                      </div>

                      {/* Wins */}
                      <div className="text-green-400 font-bold flex items-center gap-1">
                        {isCurrentlyEditing ? (
                          <input
                            type="number"
                            value={editData.wins}
                            onChange={(e) => setEditData({...editData, wins: parseInt(e.target.value) || 0})}
                            className="w-16 px-2 py-1 bg-slate-700 border border-green-500 rounded text-center"
                            min="0"
                          />
                        ) : (
                          <>
                            <TrendingUp className="w-4 h-4" />
                            {team.wins}
                          </>
                        )}
                      </div>

                      {/* Losses */}
                      <div className="text-red-400 font-bold flex items-center gap-1">
                        {isCurrentlyEditing ? (
                          <input
                            type="number"
                            value={editData.losses}
                            onChange={(e) => setEditData({...editData, losses: parseInt(e.target.value) || 0})}
                            className="w-16 px-2 py-1 bg-slate-700 border border-red-500 rounded text-center"
                            min="0"
                          />
                        ) : (
                          <>
                            <TrendingDown className="w-4 h-4" />
                            {team.losses}
                          </>
                        )}
                      </div>

                      {/* Points */}
                      <div className="text-pink-400 font-black text-xl">
                        {isCurrentlyEditing ? (
                          <input
                            type="number"
                            value={editData.points}
                            onChange={(e) => setEditData({...editData, points: parseInt(e.target.value) || 0})}
                            className="w-20 px-2 py-1 bg-slate-700 border border-pink-500 rounded text-center font-black"
                            min="0"
                          />
                        ) : (
                          team.points
                        )}
                      </div>

                      {/* Net Run Rate */}
                      <div className={`font-bold ${
                        team.netRunRate > 0 ? 'text-green-400' : team.netRunRate < 0 ? 'text-red-400' : 'text-white'
                      }`}>
                        {isCurrentlyEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editData.netRunRate}
                            onChange={(e) => setEditData({...editData, netRunRate: parseFloat(e.target.value) || 0})}
                            className="w-20 px-2 py-1 bg-slate-700 border border-white rounded text-center"
                          />
                        ) : (
                          team.netRunRate
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-center gap-2">
                        {isCurrentlyEditing ? (
                          <>
                            <motion.button
                              onClick={() => handleSave(team.id)}
                              className="p-2 rounded-full bg-green-500 text-white"
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Save className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              onClick={handleCancel}
                              className="p-2 rounded-full bg-red-500 text-white"
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <X className="w-4 h-4" />
                            </motion.button>
                          </>
                        ) : (
                          <motion.button
                            onClick={() => handleEdit(team.id)}
                            disabled={!isEditing}
                            className={`p-2 rounded-full transition-all ${
                              isEditing ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-slate-700 text-gray-400 cursor-not-allowed'
                            }`}
                            whileHover={isEditing ? { scale: 1.2 } : {}}
                            whileTap={isEditing ? { scale: 0.9 } : {}}
                          >
                            <Edit className="w-4 h-4" />
                          </motion.button>
                        )}
                      </div>

                      {/* Hover effects */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 rounded-3xl blur-2xl" style={{
                        background: isTop3 ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.3), rgba(168, 85, 247, 0.3))' :
                                    isBottom2 ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(236, 72, 153, 0.3))' :
                                    'linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(168, 85, 247, 0.2))'
                      }} />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Quick Stats */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            {[
              { label: 'Teams', value: teams.length, icon: Users, color: 'from-purple-500 to-pink-500' },
              { label: 'Matches Played', value: matches.filter(m => m.status === 'completed').length, icon: Calendar, color: 'from-pink-500 to-purple-500' },
              { label: 'Upcoming', value: upcomingMatches.length, icon: Clock, color: 'from-purple-500 to-pink-500' },
              { label: 'Total Points', value: pointsTable.reduce((sum, team) => sum + team.points, 0), icon: Award, color: 'from-pink-500 to-purple-500' }
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="group relative overflow-hidden rounded-3xl backdrop-blur-2xl border-2 border-white/20 bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 p-6"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
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
      </main>
    </div>
  );
}
