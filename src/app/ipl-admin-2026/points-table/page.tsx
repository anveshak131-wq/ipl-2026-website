'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, TrendingDown, Minus, Search, Filter, Download, RefreshCw, Eye, BarChart3, Users, Calendar, Edit2, Trash2, Plus, Save, X, Clock } from 'lucide-react';
import { useAdminData } from '@/contexts/AdminDataContext';
import { useLeague } from '@/contexts/LeagueContext';
import { PageTransition, StaggeredList, LoadingSpinner } from '@/components/admin/animations';
import { EmptyStateIllustration } from '@/components/admin/icons';
import { ToastContainer, useToast } from '@/components/admin/Toast';
import { exportToCSV, exportToJSON, exportToExcel } from '@/lib/admin/exportUtils';

export const dynamic = 'force-dynamic';

interface TeamPointsData {
  position: number;
  teamId: string;
  teamName: string;
  teamCode: string;
  matches: number;
  wins: number;
  losses: number;
  ties: number;
  noResults: number;
  points: number;
  netRunRate: number;
  runsScored: number;
  runsConceded: number;
  oversFaced: number;
  oversBowled: number;
  last5Matches: string[];
  form: 'excellent' | 'good' | 'average' | 'poor';
}

export default function PointsTablePage() {
  const { teams, players, loading, refreshData } = useAdminData();
  const { currentLeague } = useLeague();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeason, setSelectedSeason] = useState('2026');
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    matches: 0,
    wins: 0,
    losses: 0,
    ties: 0,
    noResults: 0,
    netRunRate: 0,
    runsScored: 0,
    runsConceded: 0,
    oversFaced: 0,
    oversBowled: 0,
    last5Matches: ['W', 'L', 'W', 'L', 'L']
  });

  // Show loading state while admin data is loading
  if (loading) {
    return (
      <div className="min-h-screen bg-ipl-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading teams data...</p>
        </div>
      </div>
    );
  }

  // Show error state if teams data failed to load
  if (!teams || teams.length === 0) {
    return (
      <div className="min-h-screen bg-ipl-dark flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">No teams data available</div>
          <p className="text-gray-400 mb-4">Please ensure teams are properly configured</p>
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Data
          </button>
        </div>
      </div>
    );
  }

  // Storage functions for points data
  const getStoredPointsData = (teamId: string) => {
    const stored = localStorage.getItem(`points_${teamId}_${selectedSeason}`);
    if (stored) {
      return JSON.parse(stored);
    }
    // Default values
    return {
      matches: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      noResults: 0,
      points: 0,
      netRunRate: 0,
      runsScored: 0,
      runsConceded: 0,
      oversFaced: 0,
      oversBowled: 0,
      last5Matches: ['-', '-', '-', '-', '-']
    };
  };

  const savePointsData = (teamId: string, data: any) => {
    localStorage.setItem(`points_${teamId}_${selectedSeason}`, JSON.stringify(data));
  };

  const deletePointsData = (teamId: string) => {
    localStorage.removeItem(`points_${teamId}_${selectedSeason}`);
  };

  const calculateForm = (last5Matches: string[]) => {
    const wins = last5Matches.filter(m => m === 'W').length;
    const losses = last5Matches.filter(m => m === 'L').length;
    
    if (wins >= 4) return 'excellent';
    if (wins >= 3) return 'good';
    if (wins >= 2) return 'average';
    return 'poor';
  };

  // Calculate points table data - simple calculation without useMemo
  const calculatePointsData = () => {
    if (!teams || !Array.isArray(teams) || teams.length === 0) return [];
    
    const data = teams.map(team => {
      const storedData = getStoredPointsData(team.id);
      
      return {
        position: 0, // Will be calculated after sorting
        teamId: team.id,
        teamName: team.name,
        teamCode: team.shortName || team.name.substring(0, 3).toUpperCase(),
        matches: storedData.matches,
        wins: storedData.wins,
        losses: storedData.losses,
        ties: storedData.ties,
        noResults: storedData.noResults,
        points: storedData.points,
        netRunRate: storedData.netRunRate,
        runsScored: storedData.runsScored,
        runsConceded: storedData.runsConceded,
        oversFaced: storedData.oversFaced,
        oversBowled: storedData.oversBowled,
        last5Matches: storedData.last5Matches || ['-', '-', '-', '-', '-'],
        form: calculateForm(storedData.last5Matches || ['-', '-', '-', '-', '-'])
      };
    }).sort((a, b) => {
      // Sort by points (descending), then NRR (descending)
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      return b.netRunRate - a.netRunRate;
    }).map((team, index) => ({
      ...team,
      position: index + 1
    }));
    
    return data;
  };

  // Filter data based on search - simple filtering without useMemo
  const getFilteredData = () => {
    const pointsData = calculatePointsData();
    
    if (!searchQuery) return pointsData;
    
    const query = searchQuery.toLowerCase();
    return pointsData.filter(team => 
      team.teamName.toLowerCase().includes(query) ||
      team.teamCode.toLowerCase().includes(query)
    );
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await refreshData();
      showToast('Points table refreshed successfully', 'success');
    } catch (error) {
      showToast('Failed to refresh points table', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'json' | 'excel') => {
    const filteredData = getFilteredData();
    const exportData = filteredData.map(team => ({
      Position: team.position,
      Team: team.teamName,
      Matches: team.matches,
      Won: team.wins,
      Lost: team.losses,
      Tied: team.ties,
      'No Result': team.noResults,
      Points: team.points,
      'Net Run Rate': team.netRunRate.toFixed(3),
      'Runs Scored': team.runsScored,
      'Runs Conceded': team.runsConceded,
      'Overs Faced': team.oversFaced,
      'Overs Bowled': team.oversBowled,
      'Last 5': team.last5Matches.join(', ')
    }));

    switch (format) {
      case 'csv':
        exportToCSV(exportData, `ipl-points-table-${selectedSeason}`);
        break;
      case 'json':
        exportToJSON(exportData, `ipl-points-table-${selectedSeason}`);
        break;
      case 'excel':
        exportToExcel(exportData, `ipl-points-table-${selectedSeason}`);
        break;
    }
    
    showToast(`Points table exported as ${format.toUpperCase()}`, 'success');
  };

  const handleEdit = (teamId: string) => {
    const storedData = getStoredPointsData(teamId);
    setEditingTeam(teamId);
    setFormData({
      matches: storedData.matches,
      wins: storedData.wins,
      losses: storedData.losses,
      ties: storedData.ties,
      noResults: storedData.noResults,
      netRunRate: storedData.netRunRate,
      runsScored: storedData.runsScored,
      runsConceded: storedData.runsConceded,
      oversFaced: storedData.oversFaced,
      oversBowled: storedData.oversBowled,
      last5Matches: storedData.last5Matches || ['-', '-', '-', '-', '-']
    });
  };

  const handleSave = (teamId: string) => {
    savePointsData(teamId, formData);
    setEditingTeam(null);
    showToast('Team data saved successfully', 'success');
  };

  const handleDelete = (teamId: string) => {
    if (confirm('Are you sure you want to delete this team\'s data?')) {
      deletePointsData(teamId);
      showToast('Team data deleted successfully', 'success');
    }
  };

  const handleCancel = () => {
    setEditingTeam(null);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'netRunRate' ? parseFloat(value) || 0 : value
    }));
  };

  const handleLast5Change = (index: number, value: string) => {
    const newLast5 = [...formData.last5Matches];
    newLast5[index] = value;
    setFormData(prev => ({
      ...prev,
      last5Matches: newLast5
    }));
  };

  const pointsData = calculatePointsData();
  const filteredData = getFilteredData();

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                    Points Table
                  </h1>
                  <p className="text-gray-400 text-lg lg:text-xl">
                    {currentLeague.toUpperCase()} {selectedSeason} Season
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="admin-glass px-4 py-3 rounded-xl">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div className="text-left">
                    <div className="text-white text-sm font-medium">
                      {new Date().toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {new Date().toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-blue-400" />
              <span className="text-2xl font-bold text-blue-400">{teams.length}</span>
            </div>
            <div className="text-gray-300">Total Teams</div>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 backdrop-blur-xl border border-green-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-8 h-8 text-green-400" />
              <span className="text-2xl font-bold text-green-400">
                {filteredData.reduce((sum, team) => sum + team.matches, 0)}
              </span>
            </div>
            <div className="text-gray-300">Total Matches</div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Trophy className="w-8 h-8 text-yellow-400" />
              <span className="text-2xl font-bold text-yellow-400">
                {Math.max(...filteredData.map(team => team.points), 0)}
              </span>
            </div>
            <div className="text-gray-300">Highest Points</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="w-8 h-8 text-purple-400" />
              <span className="text-2xl font-bold text-purple-400">
                {filteredData.filter(team => team.netRunRate > 0).length}
              </span>
            </div>
            <div className="text-gray-300">Positive NRR</div>
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            
            <div className="relative">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  viewMode === 'table'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                <Eye className="w-4 h-4 mr-2" />
                Table
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  viewMode === 'card'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                <Filter className="w-4 h-4 mr-2" />
                Cards
              </button>
            </div>
          </div>
        </motion.div>

        {/* Points Table */}
        {viewMode === 'table' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="admin-glass rounded-2xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 text-gray-400 font-medium">Pos</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Team</th>
                    <th className="text-center p-4 text-gray-400 font-medium">M</th>
                    <th className="text-center p-4 text-gray-400 font-medium">W</th>
                    <th className="text-center p-4 text-gray-400 font-medium">L</th>
                    <th className="text-center p-4 text-gray-400 font-medium">T</th>
                    <th className="text-center p-4 text-gray-400 font-medium">NR</th>
                    <th className="text-center p-4 text-gray-400 font-medium">PTS</th>
                    <th className="text-center p-4 text-gray-400 font-medium">NRR</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Last 5</th>
                    <th className="text-center p-4 text-gray-400 font-medium">Form</th>
                    <th className="text-center p-4 text-gray-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <StaggeredList>
                    {filteredData.map((team: any, index: number) => (
                      <motion.tr
                        key={team.teamId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                          team.position <= 4 ? 'bg-green-500/5' : ''
                        }`}
                      >
                        <td className="p-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            team.position === 1 ? 'bg-yellow-500 text-black' :
                            team.position === 2 ? 'bg-gray-400 text-white' :
                            team.position === 3 ? 'bg-orange-600 text-white' :
                            team.position === 4 ? 'bg-blue-600 text-white' :
                            'bg-gray-600 text-white'
                          }`}>
                            {team.position}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${
                              team.teamId === 'rcb' ? 'from-red-500 to-red-600' :
                              team.teamId === 'mi' ? 'from-blue-500 to-blue-600' :
                              team.teamId === 'csk' ? 'from-yellow-500 to-yellow-600' :
                              team.teamId === 'kkr' ? 'from-purple-500 to-purple-600' :
                              team.teamId === 'srh' ? 'from-orange-500 to-orange-600' :
                              team.teamId === 'rr' ? 'from-pink-500 to-pink-600' :
                              team.teamId === 'dc' ? 'from-indigo-500 to-indigo-600' :
                              'from-gray-500 to-gray-600'
                            } flex items-center justify-center text-white font-bold text-xs`}>
                              {team.teamCode}
                            </div>
                            <span className="text-white font-medium">{team.teamName}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center text-white">{team.matches}</td>
                        <td className="p-4 text-center text-white">{team.wins}</td>
                        <td className="p-4 text-center text-white">{team.losses}</td>
                        <td className="p-4 text-center text-white">{team.ties}</td>
                        <td className="p-4 text-center text-white">{team.noResults}</td>
                        <td className="p-4 text-center text-white font-bold">{team.points}</td>
                        <td className="p-4">
                          <div className="flex items-center justify-center">
                            {team.netRunRate === 0 ? (
                              <Minus className="w-4 h-4 text-gray-400" />
                            ) : (
                              <>
                                <TrendingUp className={`w-4 h-4 ${team.netRunRate > 0 ? 'text-green-400' : 'text-red-400'}`} />
                                <span className="font-medium">
                                  {team.netRunRate > 0 ? '+' : ''}{team.netRunRate.toFixed(3)}
                                </span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-1">
                            {editingTeam === team.teamId ? (
                              (formData.last5Matches || []).map((result: string, idx: number) => (
                                <select
                                  key={idx}
                                  value={result}
                                  onChange={(e) => handleLast5Change(idx, e.target.value)}
                                  className="w-8 h-6 text-xs font-bold rounded bg-slate-700 border border-slate-600 text-center"
                                >
                                  <option value="W">W</option>
                                  <option value="L">L</option>
                                  <option value="T">T</option>
                                  <option value="-">-</option>
                                </select>
                              ))
                            ) : (
                              (team.last5Matches || []).map((result: string, idx: number) => (
                                <div
                                  key={idx}
                                  className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center ${
                                    result === 'W' ? 'bg-green-500 text-white' :
                                    result === 'L' ? 'bg-red-500 text-white' :
                                    result === 'T' ? 'bg-yellow-500 text-black' :
                                    'bg-gray-500 text-white'
                                  }`}
                                >
                                  {result}
                                </div>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            team.form === 'excellent' ? 'bg-green-500 text-white' :
                            team.form === 'good' ? 'bg-blue-500 text-white' :
                            team.form === 'average' ? 'bg-yellow-500 text-black' :
                            'bg-red-500 text-white'
                          }`}>
                            {team.form.toUpperCase()}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            {editingTeam === team.teamId ? (
                              <>
                                <button
                                  onClick={() => handleSave(team.teamId)}
                                  className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                  <Save className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={handleCancel}
                                  className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleEdit(team.teamId)}
                                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(team.teamId)}
                                  className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </StaggeredList>
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StaggeredList>
                {filteredData.map((team: any, index: number) => (
                  <motion.div
                    key={team.teamId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`bg-gradient-to-br ${
                      team.position <= 4 
                        ? 'from-green-500/10 to-green-600/5 border-green-500/20' 
                        : 'from-slate-700/50 to-slate-800/50 border-slate-600/30'
                    } backdrop-blur-xl border rounded-2xl p-6 hover:shadow-lg transition-all`}
                  >
                    {/* Card Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${
                          team.teamId === 'rcb' ? 'from-red-500 to-red-600' :
                          team.teamId === 'mi' ? 'from-blue-500 to-blue-600' :
                          team.teamId === 'csk' ? 'from-yellow-500 to-yellow-600' :
                          team.teamId === 'kkr' ? 'from-purple-500 to-purple-600' :
                          team.teamId === 'srh' ? 'from-orange-500 to-orange-600' :
                          team.teamId === 'rr' ? 'from-pink-500 to-pink-600' :
                          team.teamId === 'dc' ? 'from-indigo-500 to-indigo-600' :
                          'from-gray-500 to-gray-600'
                        } flex items-center justify-center text-white font-bold`}>
                          {team.teamCode}
                        </div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          team.position === 1 ? 'bg-yellow-500 text-black' :
                          team.position === 2 ? 'bg-gray-400 text-white' :
                          team.position === 3 ? 'bg-orange-600 text-white' :
                          team.position === 4 ? 'bg-blue-600 text-white' :
                          'bg-gray-600 text-white'
                        }`}>
                          {team.position}
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        team.form === 'excellent' ? 'bg-green-500 text-white' :
                        team.form === 'good' ? 'bg-blue-500 text-white' :
                        team.form === 'average' ? 'bg-yellow-500 text-black' :
                        'bg-red-500 text-white'
                      }`}>
                        {team.form.toUpperCase()}
                      </div>
                    </div>

                    {/* Team Name */}
                    <h3 className="text-white font-bold text-lg mb-4">{team.teamName}</h3>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{team.matches}</div>
                        <div className="text-gray-400 text-xs">Matches</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">{team.wins}</div>
                        <div className="text-gray-400 text-xs">Wins</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{team.points}</div>
                        <div className="text-gray-400 text-xs">Points</div>
                      </div>
                    </div>

                    {/* NRR */}
                    <div className="mb-4">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-gray-400 text-sm">NRR:</span>
                        <span className={`font-bold ${
                          team.netRunRate > 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {team.netRunRate > 0 ? '+' : ''}{team.netRunRate.toFixed(3)}
                        </span>
                      </div>
                    </div>

                    {/* Last 5 */}
                    <div className="mb-4">
                      <div className="text-gray-400 text-sm mb-2">Last 5:</div>
                      <div className="flex gap-1">
                        {(team.last5Matches || []).map((result, idx) => (
                          <div
                            key={idx}
                            className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center ${
                              result === 'W' ? 'bg-green-500 text-white' :
                              result === 'L' ? 'bg-red-500 text-white' :
                              result === 'T' ? 'bg-yellow-500 text-black' :
                              'bg-gray-500 text-white'
                            }`}
                          >
                            {result}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-center gap-2">
                      {editingTeam === team.teamId ? (
                        <>
                          <button
                            onClick={() => handleSave(team.teamId)}
                            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(team.teamId)}
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(team.teamId)}
                            className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </StaggeredList>
            </div>
          </motion.div>
        )}

        {/* Points System Legend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="admin-glass rounded-2xl p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4">Points System</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2">2</div>
              <div className="text-white font-medium">Win</div>
              <div className="text-gray-400 text-sm">2 points for a victory</div>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold mx-auto mb-2">1</div>
              <div className="text-white font-medium">Tie</div>
              <div className="text-gray-400 text-sm">1 point each team</div>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2">0</div>
              <div className="text-white font-medium">No Result</div>
              <div className="text-gray-400 text-sm">0 points</div>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2">NRR</div>
              <div className="text-white font-medium">Net Run Rate</div>
              <div className="text-gray-400 text-sm">Tie-breaker</div>
            </div>
          </div>
        </motion.div>

        <ToastContainer />
      </div>
    </PageTransition>
  );
}
