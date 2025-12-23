'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminData } from '@/contexts/AdminDataContext';
import AdminSidebar from '@/components/admin/AdminSidebar';
import PlayersAdminSidebar from '@/components/admin/PlayersAdminSidebar';
import { Search, Filter, Edit2, X, TrendingUp, Award, Target, Zap, ChevronDown, ChevronUp, SortAsc, SortDesc } from 'lucide-react';

const BattingStatsPage = () => {
  const router = useRouter();
  const { players, teams, loading, error, updatePlayer } = useAdminData();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [sortField, setSortField] = useState<string>('runs');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [editForm, setEditForm] = useState({
    name: '',
    role: '',
    age: '',
    jerseyNumber: '',
    stats: {
      matches: 0,
      battingInnings: 0,
      notOuts: 0,
      runs: 0,
      ballsFaced: 0,
      highest: 0,
      fours: 0,
      sixes: 0,
      fifties: 0,
      hundreds: 0,
      battingAverage: '',
      battingStrikeRate: ''
    }
  });

  // Check authentication and role
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
        if (!token) {
          router.push('/ipl-admin-2026');
          return;
        }

        const response = await fetch(`/api/auth?action=verify&token=${token}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          router.push('/ipl-admin-2026');
          return;
        }

        const role = data.user?.role;
        setUserRole(role);

        if (role !== 'admin' && role !== 'super_admin' && role !== 'players_admin') {
          alert('Access denied. Admin privileges required.');
          router.push('/ipl-admin-2026');
          return;
        }

        setIsCheckingAuth(false);
      } catch (error) {
        console.error('Auth error:', error);
        router.push('/ipl-admin-2026');
      }
    };

    checkAuth();
  }, [router]);

  const handleCancelEdit = useCallback(() => {
    setShowEditModal(false);
    setEditingPlayer(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showEditModal) {
        handleCancelEdit();
      }
    };

    if (showEditModal) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showEditModal, handleCancelEdit]);

  const handleEditPlayer = (player) => {
    setEditingPlayer(player);
    setEditForm({
      name: player.name || '',
      role: player.role || '',
      age: player.age || '',
      jerseyNumber: player.jerseyNumber || '',
      stats: {
        matches: player.stats?.matches || 0,
        battingInnings: player.stats?.battingInnings || 0,
        notOuts: player.stats?.notOuts || 0,
        runs: player.stats?.runs || 0,
        ballsFaced: player.stats?.ballsFaced || 0,
        highest: player.stats?.highest || 0,
        fours: player.stats?.fours || 0,
        sixes: player.stats?.sixes || 0,
        fifties: player.stats?.fifties || 0,
        hundreds: player.stats?.hundreds || 0,
        battingAverage: player.stats?.battingAverage || '',
        battingStrikeRate: player.stats?.battingStrikeRate || ''
      }
    });
    setShowEditModal(true);
  };

  const handleSavePlayer = async () => {
    try {
      const updatedPlayer = {
        ...editingPlayer,
        ...editForm,
        stats: {
          ...editingPlayer.stats,
          ...editForm.stats
        }
      };

      await updatePlayer(editingPlayer.id, updatedPlayer);
      
      window.dispatchEvent(new CustomEvent('admin-data-updated', {
        detail: { type: 'player-updated', playerId: editingPlayer.id }
      }));
      
      setShowEditModal(false);
      setEditingPlayer(null);
    } catch (error) {
      console.error('Failed to update player:', error);
      alert('Failed to update player. Please try again.');
    }
  };

  const handleFormChange = (field, value) => {
    if (field.startsWith('stats.')) {
      const statField = field.replace('stats.', '');
      setEditForm(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          [statField]: value
        }
      }));
    } else {
      setEditForm(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filter and sort players
  const filteredAndSortedPlayers = useMemo(() => {
    let filtered = players.filter(player => {
      const matchesSearch = player.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           player.teamId?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTeam = selectedTeam === 'all' || player.teamId === selectedTeam;
      const hasBattingStats = player.stats?.battingInnings > 0 || player.stats?.runs > 0;
      return matchesSearch && matchesTeam && hasBattingStats;
    });

    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortField) {
        case 'name':
          aVal = a.name || '';
          bVal = b.name || '';
          break;
        case 'runs':
          aVal = a.stats?.runs || 0;
          bVal = b.stats?.runs || 0;
          break;
        case 'average':
          aVal = parseFloat(a.stats?.battingAverage) || 0;
          bVal = parseFloat(b.stats?.battingAverage) || 0;
          break;
        case 'strikeRate':
          aVal = parseFloat(a.stats?.battingStrikeRate) || 0;
          bVal = parseFloat(b.stats?.battingStrikeRate) || 0;
          break;
        case 'highest':
          aVal = a.stats?.highest || 0;
          bVal = b.stats?.highest || 0;
          break;
        case 'hundreds':
          aVal = a.stats?.hundreds || 0;
          bVal = b.stats?.hundreds || 0;
          break;
        case 'fifties':
          aVal = a.stats?.fifties || 0;
          bVal = b.stats?.fifties || 0;
          break;
        default:
          aVal = a.stats?.runs || 0;
          bVal = b.stats?.runs || 0;
      }

      if (typeof aVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return filtered;
  }, [players, searchQuery, selectedTeam, sortField, sortDirection]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const activeBatsmen = players.filter(p => p.stats?.battingInnings > 0 || p.stats?.runs > 0);
    const totalRuns = activeBatsmen.reduce((sum, p) => sum + (p.stats?.runs || 0), 0);
    const totalHundreds = activeBatsmen.reduce((sum, p) => sum + (p.stats?.hundreds || 0), 0);
    const totalFifties = activeBatsmen.reduce((sum, p) => sum + (p.stats?.fifties || 0), 0);
    const highestScore = Math.max(...activeBatsmen.map(p => p.stats?.highest || 0), 0);
    const avgRuns = activeBatsmen.length > 0 ? Math.round(totalRuns / activeBatsmen.length) : 0;

    return { activeBatsmen: activeBatsmen.length, totalRuns, totalHundreds, totalFifties, highestScore, avgRuns };
  }, [players]);

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <SortAsc className="w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100" />;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 text-blue-400" /> : <ChevronDown className="w-4 h-4 text-blue-400" />;
  };

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-white text-xl">Loading batting stats...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      {userRole === 'players_admin' ? (
        <PlayersAdminSidebar currentPage="/ipl-admin-2026/batting-stats" />
      ) : (
        <AdminSidebar currentPage="/ipl-admin-2026/batting-stats" />
      )}
      <div className="flex-1 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 min-h-screen overflow-x-hidden">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 shadow-2xl">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2 flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  Batting Statistics
                </h1>
                <p className="text-blue-100 text-lg">Comprehensive batting performance analytics</p>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center min-w-[120px]">
                  <div className="text-3xl font-bold text-white">{summaryStats.activeBatsmen}</div>
                  <div className="text-blue-100 text-sm mt-1">Active Batsmen</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center min-w-[120px]">
                  <div className="text-3xl font-bold text-white">{teams.length}</div>
                  <div className="text-blue-100 text-sm mt-1">Teams</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5 shadow-lg border border-blue-500/30">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-5 h-5 text-blue-200" />
              </div>
              <div className="text-2xl font-bold text-white">{summaryStats.totalRuns.toLocaleString()}</div>
              <div className="text-blue-100 text-xs mt-1">Total Runs</div>
            </div>
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-5 shadow-lg border border-purple-500/30">
              <div className="flex items-center justify-between mb-2">
                <Award className="w-5 h-5 text-purple-200" />
              </div>
              <div className="text-2xl font-bold text-white">{summaryStats.highestScore}</div>
              <div className="text-purple-100 text-xs mt-1">Highest Score</div>
            </div>
            <div className="bg-gradient-to-br from-pink-600 to-pink-700 rounded-xl p-5 shadow-lg border border-pink-500/30">
              <div className="flex items-center justify-between mb-2">
                <Award className="w-5 h-5 text-pink-200" />
              </div>
              <div className="text-2xl font-bold text-white">{summaryStats.totalHundreds}</div>
              <div className="text-pink-100 text-xs mt-1">Centuries</div>
            </div>
            <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-5 shadow-lg border border-orange-500/30">
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-5 h-5 text-orange-200" />
              </div>
              <div className="text-2xl font-bold text-white">{summaryStats.totalFifties}</div>
              <div className="text-orange-100 text-xs mt-1">Half Centuries</div>
            </div>
            <div className="bg-gradient-to-br from-cyan-600 to-cyan-700 rounded-xl p-5 shadow-lg border border-cyan-500/30">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-5 h-5 text-cyan-200" />
              </div>
              <div className="text-2xl font-bold text-white">{summaryStats.avgRuns}</div>
              <div className="text-cyan-100 text-xs mt-1">Avg Runs/Player</div>
            </div>
            <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl p-5 shadow-lg border border-teal-500/30">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-5 h-5 text-teal-200" />
              </div>
              <div className="text-2xl font-bold text-white">{filteredAndSortedPlayers.length}</div>
              <div className="text-teal-100 text-xs mt-1">Filtered Players</div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 mb-6 border border-gray-700/50">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="pl-10 pr-8 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
                >
                  <option value="all">All Teams</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Players Table */}
          {filteredAndSortedPlayers.length === 0 ? (
            <div className="bg-gray-800/30 backdrop-blur rounded-2xl p-16 text-center border border-gray-700/50">
              <div className="w-20 h-20 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-gray-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">No Players Found</h3>
              <p className="text-gray-400 text-lg mb-6">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="bg-gray-800/30 backdrop-blur rounded-2xl border border-gray-700/50 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900/50 border-b border-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleSort('name')}
                          className="flex items-center gap-2 text-gray-300 hover:text-white font-semibold text-sm uppercase tracking-wider group"
                        >
                          Player
                          <SortIcon field="name" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleSort('runs')}
                          className="flex items-center gap-2 text-gray-300 hover:text-white font-semibold text-sm uppercase tracking-wider group"
                        >
                          Runs
                          <SortIcon field="runs" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleSort('average')}
                          className="flex items-center gap-2 text-gray-300 hover:text-white font-semibold text-sm uppercase tracking-wider group"
                        >
                          Avg
                          <SortIcon field="average" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleSort('strikeRate')}
                          className="flex items-center gap-2 text-gray-300 hover:text-white font-semibold text-sm uppercase tracking-wider group"
                        >
                          SR
                          <SortIcon field="strikeRate" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleSort('highest')}
                          className="flex items-center gap-2 text-gray-300 hover:text-white font-semibold text-sm uppercase tracking-wider group"
                        >
                          HS
                          <SortIcon field="highest" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-gray-300 font-semibold text-sm uppercase tracking-wider">Innings</th>
                      <th className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleSort('hundreds')}
                          className="flex items-center gap-2 text-gray-300 hover:text-white font-semibold text-sm uppercase tracking-wider group"
                        >
                          100s
                          <SortIcon field="hundreds" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleSort('fifties')}
                          className="flex items-center gap-2 text-gray-300 hover:text-white font-semibold text-sm uppercase tracking-wider group"
                        >
                          50s
                          <SortIcon field="fifties" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-gray-300 font-semibold text-sm uppercase tracking-wider">4s/6s</th>
                      <th className="px-6 py-4 text-center text-gray-300 font-semibold text-sm uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {filteredAndSortedPlayers.map((player, index) => {
                      const team = teams.find(t => t.id === player.teamId);
                      const runs = player.stats?.runs || 0;
                      const maxRuns = Math.max(...filteredAndSortedPlayers.map(p => p.stats?.runs || 0), 1);
                      const runsPercentage = (runs / maxRuns) * 100;

                      return (
                        <tr key={player.id} className="hover:bg-gray-800/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                {player.name?.charAt(0) || '?'}
                              </div>
                              <div>
                                <div className="font-semibold text-white">{player.name || 'Unknown'}</div>
                                <div className="text-sm text-gray-400">{team?.shortName || 'No Team'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{runs.toLocaleString()}</span>
                              <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                                  style={{ width: `${runsPercentage}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-white font-medium">
                              {player.stats?.battingAverage || player.stats?.battingAverage === '0' ? '-' : (player.stats?.battingAverage || '-')}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-white font-medium">
                              {player.stats?.battingStrikeRate || player.stats?.battingStrikeRate === '0' ? '-' : (player.stats?.battingStrikeRate || '-')}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-white font-semibold">{player.stats?.highest || '-'}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-gray-300">{player.stats?.battingInnings || 0}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-pink-400 font-semibold">{player.stats?.hundreds || 0}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-orange-400 font-semibold">{player.stats?.fifties || 0}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-gray-300">
                              {player.stats?.fours || 0}/{player.stats?.sixes || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleEditPlayer(player)}
                              className="mx-auto flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                            >
                              <Edit2 className="w-4 h-4" />
                              Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-700">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Edit Batting Statistics</h2>
                  <button
                    onClick={handleCancelEdit}
                    className="text-white hover:text-gray-200 transition-colors bg-white/10 hover:bg-white/20 rounded-lg w-8 h-8 flex items-center justify-center"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Player Name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                    <select
                      value={editForm.role}
                      onChange={(e) => handleFormChange('role', e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Batsman">Batsman</option>
                      <option value="Bowler">Bowler</option>
                      <option value="All-rounder">All-rounder</option>
                      <option value="Wicket-keeper">Wicket-keeper</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Jersey Number</label>
                    <input
                      type="text"
                      value={editForm.jerseyNumber}
                      onChange={(e) => handleFormChange('jerseyNumber', e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Matches</label>
                    <input
                      type="number"
                      value={editForm.stats.matches}
                      onChange={(e) => handleFormChange('stats.matches', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Batting Innings</label>
                    <input
                      type="number"
                      value={editForm.stats.battingInnings}
                      onChange={(e) => handleFormChange('stats.battingInnings', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Not Outs</label>
                    <input
                      type="number"
                      value={editForm.stats.notOuts}
                      onChange={(e) => handleFormChange('stats.notOuts', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Runs</label>
                    <input
                      type="number"
                      value={editForm.stats.runs}
                      onChange={(e) => handleFormChange('stats.runs', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Balls Faced</label>
                    <input
                      type="number"
                      value={editForm.stats.ballsFaced}
                      onChange={(e) => handleFormChange('stats.ballsFaced', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Highest Score</label>
                    <input
                      type="number"
                      value={editForm.stats.highest}
                      onChange={(e) => handleFormChange('stats.highest', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Fours</label>
                    <input
                      type="number"
                      value={editForm.stats.fours}
                      onChange={(e) => handleFormChange('stats.fours', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Sixes</label>
                    <input
                      type="number"
                      value={editForm.stats.sixes}
                      onChange={(e) => handleFormChange('stats.sixes', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Fifties</label>
                    <input
                      type="number"
                      value={editForm.stats.fifties}
                      onChange={(e) => handleFormChange('stats.fifties', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Hundreds</label>
                    <input
                      type="number"
                      value={editForm.stats.hundreds}
                      onChange={(e) => handleFormChange('stats.hundreds', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Batting Average</label>
                    <input
                      type="text"
                      value={editForm.stats.battingAverage}
                      onChange={(e) => handleFormChange('stats.battingAverage', e.target.value)}
                      placeholder="e.g., 45.67"
                      className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Strike Rate</label>
                    <input
                      type="text"
                      value={editForm.stats.battingStrikeRate}
                      onChange={(e) => handleFormChange('stats.battingStrikeRate', e.target.value)}
                      placeholder="e.g., 145.50"
                      className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 p-6 border-t border-gray-700 flex justify-end gap-4">
                <button
                  onClick={handleCancelEdit}
                  className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePlayer}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-colors font-medium"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BattingStatsPage;
