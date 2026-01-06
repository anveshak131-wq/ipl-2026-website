'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, TrendingDown, Minus, Search, Filter, Download, RefreshCw, Eye, BarChart3, Users, Calendar, Edit2, Trash2, Plus, Save, X } from 'lucide-react';
import { useAdminData } from '@/contexts/AdminDataContext';
import { useLeague } from '@/contexts/LeagueContext';
import { PageTransition, StaggeredList, LoadingSpinner } from '@/components/admin/animations';
import { EmptyStateIllustration } from '@/components/admin/icons';
import { ToastContainer, useToast } from '@/components/admin/Toast';
import { exportToCSV, exportToJSON, exportToExcel } from '@/lib/admin/exportUtils';

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

  const handleEdit = (team: any) => {
    setEditingTeam(team.teamId);
    setFormData({
      matches: team.matches,
      wins: team.wins,
      losses: team.losses,
      ties: team.ties,
      noResults: team.noResults,
      netRunRate: team.netRunRate,
      runsScored: team.runsScored,
      runsConceded: team.runsConceded,
      oversFaced: team.oversFaced,
      oversBowled: team.oversBowled,
      last5Matches: team.last5Matches
    });
  };

  const handleSave = (teamId: string) => {
    const points = (formData.wins * 2) + (formData.ties * 1) + (formData.noResults * 1);
    const dataToSave = {
      ...formData,
      points
    };
    savePointsData(teamId, dataToSave);
    setEditingTeam(null);
    showToast('Team data updated successfully', 'success');
    // Trigger re-render
    window.location.reload();
  };

  const handleDelete = (teamId: string) => {
    if (confirm('Are you sure you want to delete this team\'s points data?')) {
      deletePointsData(teamId);
      showToast('Team data deleted successfully', 'success');
      // Trigger re-render
      window.location.reload();
    }
  };

  const handleCancel = () => {
    setEditingTeam(null);
    setFormData({
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
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
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

  // Calculate points table data
  const pointsData = useMemo(() => {
    if (!teams || !Array.isArray(teams) || teams.length === 0) return [];
    
    // Use manually entered points data instead of mock data
    return teams.map(team => {
      // Get stored points data or use defaults
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
  }, [teams]);

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchQuery) return pointsData || [];
    
    const query = searchQuery.toLowerCase();
    return (pointsData || []).filter(team => 
      team.teamName.toLowerCase().includes(query) ||
      team.teamCode.toLowerCase().includes(query)
    );
  }, [pointsData, searchQuery]);

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
    const exportData = (filteredData || []).map(team => ({
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
      'Runs Conceded': team.runsConceded
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

  if (loading) {
    return (
      <div className="min-h-screen bg-ipl-dark flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

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
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center shadow-lg">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                    IPL Points Table 2026
                  </h1>
                  <p className="text-gray-400 mt-2">
                    Tournament standings with net run rate and form analysis
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Season Selector */}
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-gray-300 focus:border-blue-500 focus:outline-none"
              >
                <option value="2026">IPL 2026</option>
                <option value="2025">IPL 2025</option>
                <option value="2024">IPL 2024</option>
                <option value="2023">IPL 2023</option>
              </select>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search teams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-gray-300 placeholder-gray-500 focus:border-blue-500 focus:outline-none w-64"
                />
              </div>

              {/* View Mode Toggle */}
              <div className="flex bg-slate-800 border border-slate-600 rounded-lg">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-4 py-2 rounded-l-lg transition-colors ${
                    viewMode === 'table' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('card')}
                  className={`px-4 py-2 rounded-r-lg transition-colors ${
                    viewMode === 'card' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>

                {/* Export Dropdown */}
                <div className="relative group">
                  <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-600 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                    <button
                      onClick={() => handleExport('csv')}
                      className="w-full text-left px-4 py-2 text-gray-300 hover:bg-slate-700 transition-colors rounded-t-lg"
                    >
                      Export as CSV
                    </button>
                    <button
                      onClick={() => handleExport('json')}
                      className="w-full text-left px-4 py-2 text-gray-300 hover:bg-slate-700 transition-colors"
                    >
                      Export as JSON
                    </button>
                    <button
                      onClick={() => handleExport('excel')}
                      className="w-full text-left px-4 py-2 text-gray-300 hover:bg-slate-700 transition-colors rounded-b-lg"
                    >
                      Export as Excel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
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
                {(filteredData || []).reduce((sum, team) => sum + team.matches, 0)}
              </span>
            </div>
            <div className="text-gray-300">Total Matches</div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Trophy className="w-8 h-8 text-yellow-400" />
              <span className="text-2xl font-bold text-yellow-400">
                {Math.max(...(filteredData || []).map(team => team.points), 0)}
              </span>
            </div>
            <div className="text-gray-300">Highest Points</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="w-8 h-8 text-purple-400" />
              <span className="text-2xl font-bold text-purple-400">
                {(filteredData || []).filter(team => team.netRunRate > 0).length}
              </span>
            </div>
            <div className="text-gray-300">Positive NRR</div>
          </div>
        </motion.div>

        {/* Points System Legend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            IPL Points System & Qualification
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Points Distribution</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Win</span>
                  <span className="text-green-400 font-medium">2 points</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tie / No Result</span>
                  <span className="text-yellow-400 font-medium">1 point</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Loss</span>
                  <span className="text-red-400 font-medium">0 points</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Playoff Qualification</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Top 2</span>
                  <span className="text-blue-400 font-medium">Qualifier 1 & 2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">3rd & 4th</span>
                  <span className="text-purple-400 font-medium">Eliminator</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tie-breaker</span>
                  <span className="text-orange-400 font-medium">Net Run Rate</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Points Table */}
        {filteredData.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
          >
            {viewMode === 'table' ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-4 text-gray-400 font-medium">POS</th>
                      <th className="text-left p-4 text-gray-400 font-medium">Team</th>
                      <th className="text-center p-4 text-gray-400 font-medium">MAT</th>
                      <th className="text-center p-4 text-gray-400 font-medium">WON</th>
                      <th className="text-center p-4 text-gray-400 font-medium">LOST</th>
                      <th className="text-center p-4 text-gray-400 font-medium">TIED</th>
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
                      {(filteredData || []).map((team: any, index: number) => (
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
                            <div className="relative">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                team.position === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black shadow-lg' :
                                team.position === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black shadow-lg' :
                                team.position === 3 ? 'bg-gradient-to-br from-orange-500 to-orange-700 text-white shadow-lg' :
                                team.position === 4 ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg' :
                                'bg-gray-600 text-white'
                              }`}>
                                {team.position}
                              </div>
                              {team.position <= 4 && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse border-2 border-slate-900"></span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold shadow-lg ${getTeamColorClass(team.teamCode)}`}>
                                {team.teamCode}
                              </div>
                              <div>
                                <span className="text-white font-medium">{team.teamName}</span>
                                {team.position <= 4 && (
                                  <div className="text-xs text-green-400 font-medium">
                                    {team.position === 1 ? '🏆 Champion' : 
                                     team.position === 2 ? '🥈 Qualifier 1' :
                                     team.position === 3 ? '🥉 Qualifier 2' : '🎯 Playoffs'}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="text-center p-4 text-gray-300">
                            {editingTeam === team.teamId ? (
                              <input
                                type="number"
                                value={formData.matches}
                                onChange={(e) => handleInputChange('matches', parseInt(e.target.value) || 0)}
                                className="w-16 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-gray-300 text-center"
                              />
                            ) : (
                              team.matches
                            )}
                          </td>
                          <td className="text-center p-4 text-green-400 font-medium">
                            {editingTeam === team.teamId ? (
                              <input
                                type="number"
                                value={formData.wins}
                                onChange={(e) => handleInputChange('wins', parseInt(e.target.value) || 0)}
                                className="w-16 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-green-400 text-center font-medium"
                              />
                            ) : (
                              team.wins
                            )}
                          </td>
                          <td className="text-center p-4 text-red-400 font-medium">
                            {editingTeam === team.teamId ? (
                              <input
                                type="number"
                                value={formData.losses}
                                onChange={(e) => handleInputChange('losses', parseInt(e.target.value) || 0)}
                                className="w-16 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-red-400 text-center font-medium"
                              />
                            ) : (
                              team.losses
                            )}
                          </td>
                          <td className="text-center p-4 text-yellow-400 font-medium">
                            {editingTeam === team.teamId ? (
                              <input
                                type="number"
                                value={formData.ties}
                                onChange={(e) => handleInputChange('ties', parseInt(e.target.value) || 0)}
                                className="w-16 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-yellow-400 text-center font-medium"
                              />
                            ) : (
                              team.ties
                            )}
                          </td>
                          <td className="text-center p-4 text-gray-400">
                            {editingTeam === team.teamId ? (
                              <input
                                type="number"
                                value={formData.noResults}
                                onChange={(e) => handleInputChange('noResults', parseInt(e.target.value) || 0)}
                                className="w-16 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-gray-400 text-center"
                              />
                            ) : (
                              team.noResults
                            )}
                          </td>
                          <td className="text-center p-4">
                            <span className="text-xl font-bold text-yellow-400">{team.points}</span>
                          </td>
                          <td className="text-center p-4">
                            {editingTeam === team.teamId ? (
                              <input
                                type="number"
                                step="0.001"
                                value={formData.netRunRate}
                                onChange={(e) => handleInputChange('netRunRate', parseFloat(e.target.value) || 0)}
                                className="w-20 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-gray-300 text-center"
                              />
                            ) : (
                              <div className={`flex items-center justify-center gap-1 ${
                                team.netRunRate > 0 ? 'text-green-400' : 
                                team.netRunRate < 0 ? 'text-red-400' : 'text-gray-400'
                              }`}>
                                {team.netRunRate > 0 && <TrendingUp className="w-4 h-4" />}
                                {team.netRunRate < 0 && <TrendingDown className="w-4 h-4" />}
                                {team.netRunRate === 0 && <Minus className="w-4 h-4" />}
                                <span className="font-medium">
                                  {team.netRunRate > 0 ? '+' : ''}{team.netRunRate.toFixed(3)}
                                </span>
                              </div>
                            )}
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
                          <td className="text-center p-4">
                            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                              team.form === 'excellent' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                              team.form === 'good' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                              team.form === 'average' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                              'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}>
                              {team.form === 'excellent' && <TrendingUp className="w-3 h-3" />}
                              {team.form === 'good' && <TrendingUp className="w-3 h-3" />}
                              {team.form === 'average' && <Minus className="w-3 h-3" />}
                              {team.form === 'poor' && <TrendingDown className="w-3 h-3" />}
                              <span className="capitalize">{team.form}</span>
                            </div>
                          </td>
                          <td className="text-center p-4">
                            <div className="flex items-center justify-center gap-2">
                              {editingTeam === team.teamId ? (
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleSave(team.teamId)}
                                    className="p-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                  >
                                    <Save className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={handleCancel}
                                    className="p-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleEdit(team)}
                                    className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(team.teamId)}
                                    className="p-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </StaggeredList>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <StaggeredList>
                    {(filteredData || []).map((team: any, index: number) => (
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
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                              team.position === 1 ? 'bg-yellow-500 text-black' :
                              team.position === 2 ? 'bg-gray-400 text-black' :
                              team.position === 3 ? 'bg-orange-600 text-white' :
                              team.position === 4 ? 'bg-blue-600 text-white' :
                              'bg-gray-600 text-white'
                            }`}>
                              {team.position}
                            </div>
                            <div>
                              <div className="text-white font-bold text-lg">{team.teamName}</div>
                              <div className="text-gray-400 text-sm">{team.teamCode}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-yellow-400">{team.points}</div>
                            <div className="text-xs text-gray-400">PTS</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-gray-400">Matches</div>
                            <div className="text-white font-medium">{team.matches}</div>
                          </div>
                          <div>
                            <div className="text-gray-400">Won</div>
                            <div className="text-green-400 font-medium">{team.wins}</div>
                          </div>
                          <div>
                            <div className="text-gray-400">Lost</div>
                            <div className="text-red-400 font-medium">{team.losses}</div>
                          </div>
                          <div>
                            <div className="text-gray-400">NRR</div>
                            <div className={`font-medium ${
                              team.netRunRate > 0 ? 'text-green-400' : 
                              team.netRunRate < 0 ? 'text-red-400' : 'text-gray-400'
                            }`}>
                              {team.netRunRate > 0 ? '+' : ''}{team.netRunRate.toFixed(3)}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-700">
                          <div className="flex items-center justify-between">
                            <div className="text-gray-400 text-sm">Last 5 Matches</div>
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              team.form === 'excellent' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                              team.form === 'good' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                              team.form === 'average' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                              'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}>
                              {team.form === 'excellent' && <TrendingUp className="w-3 h-3" />}
                              {team.form === 'good' && <TrendingUp className="w-3 h-3" />}
                              {team.form === 'average' && <Minus className="w-3 h-3" />}
                              {team.form === 'poor' && <TrendingDown className="w-3 h-3" />}
                              <span className="capitalize">{team.form}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </StaggeredList>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <EmptyStateIllustration />
            <h3 className="text-xl font-semibold text-white mt-4">No teams found</h3>
            <p className="text-gray-400 text-center mt-2">
              Try adjusting your search or filters
            </p>
          </motion.div>
        )}

        <ToastContainer />
      </div>
    </PageTransition>
  );
}

// Helper functions
function getTeamColorClass(teamCode: string): string {
  const teamColors: { [key: string]: string } = {
    'CSK': 'bg-gradient-to-br from-yellow-400 to-yellow-600', // Chennai Super Kings - Yellow
    'MI': 'bg-gradient-to-br from-blue-400 to-blue-600', // Mumbai Indians - Blue  
    'RCB': 'bg-gradient-to-br from-red-500 to-red-700', // Royal Challengers Bangalore - Red
    'KKR': 'bg-gradient-to-br from-purple-500 to-purple-700', // Kolkata Knight Riders - Purple
    'SRH': 'bg-gradient-to-br from-orange-500 to-orange-700', // Sunrisers Hyderabad - Orange
    'DC': 'bg-gradient-to-br from-blue-500 to-cyan-500', // Delhi Capitals - Blue/Cyan
    'PBKS': 'bg-gradient-to-br from-red-600 to-red-800', // Punjab Kings - Red
    'RR': 'bg-gradient-to-br from-pink-500 to-pink-700', // Rajasthan Royals - Pink
    'GT': 'bg-gradient-to-br from-indigo-500 to-indigo-700', // Gujarat Titans - Indigo
    'LSG': 'bg-gradient-to-br from-teal-500 to-teal-700' // Lucknow Super Giants - Teal
  };
  return teamColors[teamCode] || 'bg-gradient-to-br from-gray-500 to-gray-700';
}

function calculateForm(last5Matches: string[]): 'excellent' | 'good' | 'average' | 'poor' {
  const wins = last5Matches.filter(m => m === 'W').length;
  const losses = last5Matches.filter(m => m === 'L').length;
  
  if (wins >= 4) return 'excellent';
  if (wins >= 3) return 'good';
  if (wins >= 2) return 'average';
  return 'poor';
}
