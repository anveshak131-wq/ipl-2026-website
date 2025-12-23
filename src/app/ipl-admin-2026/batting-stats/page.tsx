'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminData } from '@/contexts/AdminDataContext';
import AdminSidebar from '@/components/admin/AdminSidebar';
import PlayersAdminSidebar from '@/components/admin/PlayersAdminSidebar';

const BattingStatsPage = () => {
  const router = useRouter();
  const { players, teams, loading, error, updatePlayer } = useAdminData();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showTeamPanel, setShowTeamPanel] = useState(false);
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

        // Check if user has valid admin role
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

  // Handle ESC key to close modal
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

  const playersByTeam = teams.map(team => ({
    team,
    players: players.filter(player => player.teamId === team.id)
  })).filter(teamGroup => teamGroup.players.length > 0);

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Loading batting stats...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-900">
      {userRole === 'players_admin' ? (
        <PlayersAdminSidebar currentPage="/ipl-admin-2026/batting-stats" />
      ) : (
        <AdminSidebar currentPage="/ipl-admin-2026/batting-stats" />
      )}
      <div className="flex-1 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 min-h-screen">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 p-8 rounded-b-3xl shadow-2xl">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3 flex items-center gap-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 backdrop-blur rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  Batting Statistics
                </h1>
                <p className="text-blue-100 text-lg">Manage comprehensive batting statistics and player performance</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">{players.filter(p => p.stats?.battingInnings > 0).length}</div>
                  <div className="text-blue-100 text-sm">Active Batsmen</div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">{teams.length}</div>
                  <div className="text-blue-100 text-sm">Teams</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-8">
          {/* Stats Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-6 shadow-xl border border-blue-500 border-opacity-30">
              <div className="flex items-center justify-between mb-2">
                <div className="text-blue-100 text-sm font-medium">Total Runs</div>
                <svg className="w-5 h-5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-white">
                {players.reduce((sum, p) => sum + (p.stats?.runs || 0), 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-6 shadow-xl border border-purple-500 border-opacity-30">
              <div className="flex items-center justify-between mb-2">
                <div className="text-purple-100 text-sm font-medium">Highest Score</div>
                <svg className="w-5 h-5 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-white">
                {Math.max(...players.map(p => p.stats?.highest || 0), 0)}
              </div>
            </div>
            <div className="bg-gradient-to-br from-pink-600 to-red-600 rounded-xl p-6 shadow-xl border border-pink-500 border-opacity-30">
              <div className="flex items-center justify-between mb-2">
                <div className="text-pink-100 text-sm font-medium">Centuries</div>
                <svg className="w-5 h-5 text-pink-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-white">
                {players.reduce((sum, p) => sum + (p.stats?.hundreds || 0), 0)}
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-600 to-orange-600 rounded-xl p-6 shadow-xl border border-red-500 border-opacity-30">
              <div className="flex items-center justify-between mb-2">
                <div className="text-red-100 text-sm font-medium">Half Centuries</div>
                <svg className="w-5 h-5 text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-white">
                {players.reduce((sum, p) => sum + (p.stats?.fifties || 0), 0)}
              </div>
            </div>
          </div>

          {playersByTeam.length === 0 ? (
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-16 text-center border border-gray-700">
              <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">No Batting Statistics Available</h3>
              <p className="text-gray-400 text-lg mb-6">Players will appear here once they are added to teams with batting statistics</p>
              <div className="flex justify-center">
                <a href="/ipl-admin-2026/players" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Players</span>
                </a>
              </div>
            </div>
          ) : (
            playersByTeam.map(({ team, players: teamPlayers }) => (
              <div key={team.id} className="mb-8">
                <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 shadow-xl">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg border border-blue-400 border-opacity-30">
                        {team.shortName}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">{team.name}</h2>
                        <p className="text-gray-400 text-sm mt-1">{teamPlayers.length} players • {teamPlayers.filter(p => p.stats?.battingInnings > 0).length} active batsmen</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedTeam(team);
                        setShowTeamPanel(true);
                      }}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>View Team Panel</span>
                    </button>
                  </div>

                  <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl p-8 text-center border border-gray-600">
                    <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <p className="text-gray-300 text-lg font-medium mb-2">Team Statistics Panel</p>
                    <p className="text-gray-400">Click "View Team Panel" to see detailed batting statistics for all {teamPlayers.length} players</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Edit Player Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-white mb-6">Edit Player Stats</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Player Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => handleFormChange('role', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Batsman">Batsman</option>
                    <option value="Bowler">Bowler</option>
                    <option value="All-rounder">All-rounder</option>
                    <option value="Wicket-keeper">Wicket-keeper</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Age</label>
                  <input
                    type="number"
                    value={editForm.age}
                    onChange={(e) => handleFormChange('age', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Jersey Number</label>
                  <input
                    type="text"
                    value={editForm.jerseyNumber}
                    onChange={(e) => handleFormChange('jerseyNumber', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Matches</label>
                  <input
                    type="number"
                    value={editForm.stats.matches}
                    onChange={(e) => handleFormChange('stats.matches', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Batting Innings</label>
                  <input
                    type="number"
                    value={editForm.stats.battingInnings}
                    onChange={(e) => handleFormChange('stats.battingInnings', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Not Outs</label>
                  <input
                    type="number"
                    value={editForm.stats.notOuts}
                    onChange={(e) => handleFormChange('stats.notOuts', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Runs</label>
                  <input
                    type="number"
                    value={editForm.stats.runs}
                    onChange={(e) => handleFormChange('stats.runs', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Balls Faced</label>
                  <input
                    type="number"
                    value={editForm.stats.ballsFaced}
                    onChange={(e) => handleFormChange('stats.ballsFaced', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Highest Score</label>
                  <input
                    type="number"
                    value={editForm.stats.highest}
                    onChange={(e) => handleFormChange('stats.highest', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Fours</label>
                  <input
                    type="number"
                    value={editForm.stats.fours}
                    onChange={(e) => handleFormChange('stats.fours', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Sixes</label>
                  <input
                    type="number"
                    value={editForm.stats.sixes}
                    onChange={(e) => handleFormChange('stats.sixes', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Fifties</label>
                  <input
                    type="number"
                    value={editForm.stats.fifties}
                    onChange={(e) => handleFormChange('stats.fifties', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Hundreds</label>
                  <input
                    type="number"
                    value={editForm.stats.hundreds}
                    onChange={(e) => handleFormChange('stats.hundreds', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Batting Average</label>
                  <input
                    type="text"
                    value={editForm.stats.battingAverage}
                    onChange={(e) => handleFormChange('stats.battingAverage', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Batting Strike Rate</label>
                  <input
                    type="text"
                    value={editForm.stats.battingStrikeRate}
                    onChange={(e) => handleFormChange('stats.battingStrikeRate', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePlayer}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Team Panel */}
        {showTeamPanel && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden border border-gray-700">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 border-b border-gray-700">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-white bg-opacity-20 backdrop-blur rounded-full flex items-center justify-center text-white font-bold text-2xl border-2 border-white border-opacity-30">
                      {selectedTeam?.shortName}
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-white">{selectedTeam?.name}</h2>
                      <p className="text-blue-100 text-sm mt-1">Squad Management</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTeamPanel(false)}
                    className="text-white hover:text-gray-200 text-3xl font-light transition-colors bg-white bg-opacity-10 hover:bg-opacity-20 rounded-full w-10 h-10 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {players.filter(player => player.teamId === selectedTeam?.id).length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-300 mb-2">No Players Found</h3>
                    <p className="text-gray-500">This team doesn't have any players yet. Add players to see them here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {players
                      .filter(player => player.teamId === selectedTeam?.id)
                      .map((player) => (
                        <div key={player.id} className="group relative bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl p-6 hover:from-gray-600 hover:to-gray-700 transition-all duration-300 transform hover:scale-105 hover:shadow-xl border border-gray-600 hover:border-blue-500">
                          {/* Player Avatar */}
                          <div className="flex items-center mb-4">
                            <div className="relative">
                              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                {player.name.charAt(0)}
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">{player.jerseyNumber || '#1'}</span>
                              </div>
                            </div>
                            <div className="ml-4 flex-1">
                              <h3 className="text-white font-semibold text-lg group-hover:text-blue-300 transition-colors">{player.name}</h3>
                              <p className="text-gray-400 text-sm">{player.role}</p>
                            </div>
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-gray-900 bg-opacity-50 rounded-lg p-3 text-center">
                              <div className="text-blue-400 text-2xl font-bold">{player.stats?.matches || 0}</div>
                              <div className="text-gray-400 text-xs">Matches</div>
                            </div>
                            <div className="bg-gray-900 bg-opacity-50 rounded-lg p-3 text-center">
                              <div className="text-green-400 text-2xl font-bold">{player.stats?.runs || 0}</div>
                              <div className="text-gray-400 text-xs">Runs</div>
                            </div>
                            <div className="bg-gray-900 bg-opacity-50 rounded-lg p-3 text-center">
                              <div className="text-yellow-400 text-2xl font-bold">{player.stats?.battingAverage || '-'}</div>
                              <div className="text-gray-400 text-xs">Average</div>
                            </div>
                            <div className="bg-gray-900 bg-opacity-50 rounded-lg p-3 text-center">
                              <div className="text-purple-400 text-2xl font-bold">{player.stats?.battingStrikeRate || '-'}</div>
                              <div className="text-gray-400 text-xs">Strike Rate</div>
                            </div>
                          </div>

                          {/* Action Button */}
                          <button
                            onClick={() => handleEditPlayer(player)}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Edit Stats</span>
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BattingStatsPage;
