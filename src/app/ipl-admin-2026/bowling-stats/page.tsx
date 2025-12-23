'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminData } from '@/contexts/AdminDataContext';
import AdminSidebar from '@/components/admin/AdminSidebar';
import PlayersAdminSidebar from '@/components/admin/PlayersAdminSidebar';
import { Search, Filter, Edit2, X, TrendingDown, Award, Target, Zap, ChevronDown, ChevronUp, SortAsc, SortDesc } from 'lucide-react';

const BowlingStatsPage = () => {
  const router = useRouter();
  const { players, teams, loading, error, updatePlayer } = useAdminData();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [sortField, setSortField] = useState<string>('wickets');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [editForm, setEditForm] = useState({
    name: '',
    role: '',
    age: '',
    jerseyNumber: '',
    stats: {
      matches: 0,
      bowlingInnings: 0,
      balls: 0,
      maidens: 0,
      wickets: 0,
      runsConceded: 0,
      bowlingAverage: '',
      bowlingStrikeRate: '',
      economy: '',
      bestBowling: '',
      fiveWickets: 0
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
        bowlingInnings: player.stats?.bowlingInnings || 0,
        balls: player.stats?.balls || 0,
        maidens: player.stats?.maidens || 0,
        wickets: player.stats?.wickets || 0,
        runsConceded: player.stats?.runsConceded || 0,
        bowlingAverage: player.stats?.bowlingAverage || '',
        bowlingStrikeRate: player.stats?.bowlingStrikeRate || '',
        economy: player.stats?.economy || '',
        bestBowling: player.stats?.bestBowling || '',
        fiveWickets: player.stats?.fiveWickets || 0
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
      const hasBowlingStats = player.stats?.bowlingInnings > 0 || player.stats?.wickets > 0;
      return matchesSearch && matchesTeam && hasBowlingStats;
    });

    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortField) {
        case 'name':
          aVal = a.name || '';
          bVal = b.name || '';
          break;
        case 'wickets':
          aVal = a.stats?.wickets || 0;
          bVal = b.stats?.wickets || 0;
          break;
        case 'average':
          aVal = parseFloat(a.stats?.bowlingAverage) || Infinity;
          bVal = parseFloat(b.stats?.bowlingAverage) || Infinity;
          break;
        case 'economy':
          aVal = parseFloat(a.stats?.economy) || Infinity;
          bVal = parseFloat(b.stats?.economy) || Infinity;
          break;
        case 'strikeRate':
          aVal = parseFloat(a.stats?.bowlingStrikeRate) || Infinity;
          bVal = parseFloat(b.stats?.bowlingStrikeRate) || Infinity;
          break;
        case 'fiveWickets':
          aVal = a.stats?.fiveWickets || 0;
          bVal = b.stats?.fiveWickets || 0;
          break;
        default:
          aVal = a.stats?.wickets || 0;
          bVal = b.stats?.wickets || 0;
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
    const activeBowlers = players.filter(p => p.stats?.bowlingInnings > 0 || p.stats?.wickets > 0);
    const totalWickets = activeBowlers.reduce((sum, p) => sum + (p.stats?.wickets || 0), 0);
    const totalFiveWickets = activeBowlers.reduce((sum, p) => sum + (p.stats?.fiveWickets || 0), 0);
    const totalMaidens = activeBowlers.reduce((sum, p) => sum + (p.stats?.maidens || 0), 0);
    const economies = activeBowlers
      .map(p => parseFloat(p.stats?.economy) || Infinity)
      .filter(e => e !== Infinity);
    const bestEconomy = economies.length > 0 ? Math.min(...economies) : 0;
    const avgWickets = activeBowlers.length > 0 ? (totalWickets / activeBowlers.length).toFixed(1) : 0;

    return { 
      activeBowlers: activeBowlers.length, 
      totalWickets, 
      totalFiveWickets, 
      totalMaidens, 
      bestEconomy: bestEconomy.toFixed(2),
      avgWickets: parseFloat(avgWickets)
    };
  }, [players]);

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <SortAsc className="w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100" />;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 text-green-400" /> : <ChevronDown className="w-4 h-4 text-green-400" />;
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
        <div className="text-white text-xl">Loading bowling stats...</div>
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
      <PlayersAdminSidebar currentPage="/ipl-admin-2026/bowling-stats" />
      ) : (
        <AdminSidebar currentPage="/ipl-admin-2026/bowling-stats" />
      )}
      <div className="flex-1 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 min-h-screen overflow-x-hidden">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 p-8 shadow-2xl">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2 flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                    <TrendingDown className="w-6 h-6 text-white" />
                  </div>
                  Bowling Statistics
                </h1>
                <p className="text-green-100 text-lg">Comprehensive bowling performance analytics</p>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center min-w-[120px]">
                  <div className="text-3xl font-bold text-white">{summaryStats.activeBowlers}</div>
                  <div className="text-green-100 text-sm mt-1">Active Bowlers</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center min-w-[120px]">
                  <div className="text-3xl font-bold text-white">{teams.length}</div>
                  <div className="text-green-100 text-sm mt-1">Teams</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-5 shadow-lg border border-green-500/30">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-5 h-5 text-green-200" />
              </div>
              <div className="text-2xl font-bold text-white">{summaryStats.totalWickets.toLocaleString()}</div>
              <div className="text-green-100 text-xs mt-1">Total Wickets</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-5 shadow-lg border border-emerald-500/30">
              <div className="flex items-center justify-between mb-2">
                <TrendingDown className="w-5 h-5 text-emerald-200" />
              </div>
              <div className="text-2xl font-bold text-white">{summaryStats.bestEconomy}</div>
              <div className="text-emerald-100 text-xs mt-1">Best Economy</div>
            </div>
            <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl p-5 shadow-lg border border-teal-500/30">
              <div className="flex items-center justify-between mb-2">
                <Award className="w-5 h-5 text-teal-200" />
              </div>
              <div className="text-2xl font-bold text-white">{summaryStats.totalFiveWickets}</div>
              <div className="text-teal-100 text-xs mt-1">5-Wicket Hauls</div>
            </div>
            <div className="bg-gradient-to-br from-cyan-600 to-cyan-700 rounded-xl p-5 shadow-lg border border-cyan-500/30">
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-5 h-5 text-cyan-200" />
              </div>
              <div className="text-2xl font-bold text-white">{summaryStats.totalMaidens}</div>
              <div className="text-cyan-100 text-xs mt-1">Maiden Overs</div>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5 shadow-lg border border-blue-500/30">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-5 h-5 text-blue-200" />
              </div>
              <div className="text-2xl font-bold text-white">{summaryStats.avgWickets}</div>
              <div className="text-blue-100 text-xs mt-1">Avg Wickets/Bowler</div>
            </div>
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl p-5 shadow-lg border border-indigo-500/30">
              <div className="flex items-center justify-between mb-2">
                <Filter className="w-5 h-5 text-indigo-200" />
              </div>
              <div className="text-2xl font-bold text-white">{filteredAndSortedPlayers.length}</div>
              <div className="text-indigo-100 text-xs mt-1">Filtered Players</div>
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
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="pl-10 pr-8 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none cursor-pointer"
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
                          onClick={() => handleSort('wickets')}
                          className="flex items-center gap-2 text-gray-300 hover:text-white font-semibold text-sm uppercase tracking-wider group"
                        >
                          Wickets
                          <SortIcon field="wickets" />
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
                          onClick={() => handleSort('economy')}
                          className="flex items-center gap-2 text-gray-300 hover:text-white font-semibold text-sm uppercase tracking-wider group"
                        >
                          Economy
                          <SortIcon field="economy" />
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
                      <th className="px-6 py-4 text-left text-gray-300 font-semibold text-sm uppercase tracking-wider">Innings</th>
                      <th className="px-6 py-4 text-left text-gray-300 font-semibold text-sm uppercase tracking-wider">Overs</th>
                      <th className="px-6 py-4 text-left text-gray-300 font-semibold text-sm uppercase tracking-wider">Maidens</th>
                      <th className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleSort('fiveWickets')}
                          className="flex items-center gap-2 text-gray-300 hover:text-white font-semibold text-sm uppercase tracking-wider group"
                        >
                          5W
                          <SortIcon field="fiveWickets" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-gray-300 font-semibold text-sm uppercase tracking-wider">Best</th>
                      <th className="px-6 py-4 text-center text-gray-300 font-semibold text-sm uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {filteredAndSortedPlayers.map((player) => {
                      const team = teams.find(t => t.id === player.teamId);
                      const wickets = player.stats?.wickets || 0;
                      const maxWickets = Math.max(...filteredAndSortedPlayers.map(p => p.stats?.wickets || 0), 1);
                      const wicketsPercentage = (wickets / maxWickets) * 100;
                      const overs = player.stats?.balls ? Math.floor(player.stats.balls / 6) : 0;
                      const balls = player.stats?.balls ? player.stats.balls % 6 : 0;
                      const oversDisplay = overs > 0 ? `${overs}.${balls}` : '0.0';

                      return (
                        <tr key={player.id} className="hover:bg-gray-800/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
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
                              <span className="font-bold text-white">{wickets}</span>
                              <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-green-500 to-teal-500 transition-all"
                                  style={{ width: `${wicketsPercentage}%` }}
                                />
                  </div>
                </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-white font-medium">
                              {player.stats?.bowlingAverage || player.stats?.bowlingAverage === '0' ? '-' : (player.stats?.bowlingAverage || '-')}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-white font-medium">
                              {player.stats?.economy || player.stats?.economy === '0' ? '-' : (player.stats?.economy || '-')}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-white font-medium">
                              {player.stats?.bowlingStrikeRate || player.stats?.bowlingStrikeRate === '0' ? '-' : (player.stats?.bowlingStrikeRate || '-')}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-gray-300">{player.stats?.bowlingInnings || 0}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-gray-300">{oversDisplay}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-cyan-400 font-semibold">{player.stats?.maidens || 0}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-teal-400 font-semibold">{player.stats?.fiveWickets || 0}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-white font-semibold">{player.stats?.bestBowling || '-'}</span>
                          </td>
                          <td className="px-6 py-4">
                <button
                              onClick={() => handleEditPlayer(player)}
                              className="mx-auto flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-700">
              <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Edit Bowling Statistics</h2>
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
                      className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => handleFormChange('role', e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
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
                      className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Matches</label>
                <input
                  type="number"
                  value={editForm.stats.matches}
                  onChange={(e) => handleFormChange('stats.matches', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Bowling Innings</label>
                <input
                  type="number"
                  value={editForm.stats.bowlingInnings}
                  onChange={(e) => handleFormChange('stats.bowlingInnings', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Balls</label>
                <input
                  type="number"
                  value={editForm.stats.balls}
                  onChange={(e) => handleFormChange('stats.balls', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Maidens</label>
                <input
                  type="number"
                  value={editForm.stats.maidens}
                  onChange={(e) => handleFormChange('stats.maidens', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Wickets</label>
                <input
                  type="number"
                  value={editForm.stats.wickets}
                  onChange={(e) => handleFormChange('stats.wickets', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Runs Conceded</label>
                <input
                  type="number"
                  value={editForm.stats.runsConceded}
                  onChange={(e) => handleFormChange('stats.runsConceded', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Bowling Average</label>
                <input
                  type="text"
                  value={editForm.stats.bowlingAverage}
                  onChange={(e) => handleFormChange('stats.bowlingAverage', e.target.value)}
                      placeholder="e.g., 25.50"
                      className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Bowling Strike Rate</label>
                <input
                  type="text"
                  value={editForm.stats.bowlingStrikeRate}
                  onChange={(e) => handleFormChange('stats.bowlingStrikeRate', e.target.value)}
                      placeholder="e.g., 18.5"
                      className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Economy</label>
                <input
                  type="text"
                  value={editForm.stats.economy}
                  onChange={(e) => handleFormChange('stats.economy', e.target.value)}
                      placeholder="e.g., 8.25"
                      className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Best Bowling</label>
                <input
                  type="text"
                  value={editForm.stats.bestBowling}
                  onChange={(e) => handleFormChange('stats.bestBowling', e.target.value)}
                      placeholder="e.g., 5/25"
                      className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">5-Wicket Hauls</label>
                <input
                  type="number"
                  value={editForm.stats.fiveWickets}
                  onChange={(e) => handleFormChange('stats.fiveWickets', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white rounded-lg transition-colors font-medium"
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

export default BowlingStatsPage;
