'use client';

import { useState, useEffect } from 'react';
import { useAdminData } from '@/contexts/AdminDataContext';
import PlayersAdminSidebar from '@/components/admin/PlayersAdminSidebar';

const BowlingStatsPage = () => {
  const { players, teams, loading, error, updatePlayer } = useAdminData();
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

  useEffect(() => {
    // Data is automatically loaded by the context
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
  }, [showEditModal]);

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
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingPlayer(null);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Loading bowling stats...</div>
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
      <PlayersAdminSidebar currentPage="/ipl-admin-2026/bowling-stats" />
      <div className="flex-1 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 min-h-screen">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-green-600 via-blue-600 to-green-700 p-8 rounded-b-3xl shadow-2xl">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3 flex items-center gap-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 backdrop-blur rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  Bowling Statistics
                </h1>
                <p className="text-green-100 text-lg">Manage comprehensive bowling statistics and player performance</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">{players.filter(p => p.stats?.bowlingInnings > 0).length}</div>
                  <div className="text-green-100 text-sm">Active Bowlers</div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">{teams.length}</div>
                  <div className="text-green-100 text-sm">Teams</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-8">
          {/* Stats Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-600 to-blue-600 rounded-xl p-6 shadow-xl border border-green-500 border-opacity-30">
              <div className="flex items-center justify-between mb-2">
                <div className="text-green-100 text-sm font-medium">Total Wickets</div>
                <svg className="w-5 h-5 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-white">
                {players.reduce((sum, p) => sum + (p.stats?.wickets || 0), 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl p-6 shadow-xl border border-blue-500 border-opacity-30">
              <div className="flex items-center justify-between mb-2">
                <div className="text-blue-100 text-sm font-medium">Best Economy</div>
                <svg className="w-5 h-5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-white">
                {Math.min(...players.filter(p => p.stats?.economy && p.stats?.economy !== '').map(p => parseFloat(p.stats.economy) || Infinity), 99.99).toFixed(2)}
              </div>
            </div>
            <div className="bg-gradient-to-br from-cyan-600 to-teal-600 rounded-xl p-6 shadow-xl border border-cyan-500 border-opacity-30">
              <div className="flex items-center justify-between mb-2">
                <div className="text-cyan-100 text-sm font-medium">5-Wicket Hauls</div>
                <svg className="w-5 h-5 text-cyan-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-white">
                {players.reduce((sum, p) => sum + (p.stats?.fiveWickets || 0), 0)}
              </div>
            </div>
            <div className="bg-gradient-to-br from-teal-600 to-green-600 rounded-xl p-6 shadow-xl border border-teal-500 border-opacity-30">
              <div className="flex items-center justify-between mb-2">
                <div className="text-teal-100 text-sm font-medium">Maiden Overs</div>
                <svg className="w-5 h-5 text-teal-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-white">
                {players.reduce((sum, p) => sum + (p.stats?.maidens || 0), 0)}
              </div>
            </div>
          </div>

      {playersByTeam.length === 0 ? (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-16 text-center border border-gray-700">
          <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">No Bowling Statistics Available</h3>
          <p className="text-gray-400 text-lg mb-6">Players will appear here once they are added to teams with bowling statistics</p>
          <div className="flex justify-center">
            <a href="/ipl-admin-2026/players" className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Players</span>
            </a>
          </div>
        </div>
      ) : (
        {playersByTeam.map(({ team, players: teamPlayers }) => (
          <div key={team.id} className="mb-8">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg border border-green-400 border-opacity-30">
                    {team.shortName}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{team.name}</h2>
                    <p className="text-gray-400 text-sm mt-1">{teamPlayers.length} players • {teamPlayers.filter(p => p.stats?.bowlingInnings > 0).length} active bowlers</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedTeam(team);
                    setShowTeamPanel(true);
                  }}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2"
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
                <p className="text-gray-400">Click "View Team Panel" to see detailed bowling statistics for all {teamPlayers.length} players</p>
              </div>
            </div>
          </div>
        ))}
      )}

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
                <label className="block text-sm font-medium text-gray-300 mb-2">Bowling Innings</label>
                <input
                  type="number"
                  value={editForm.stats.bowlingInnings}
                  onChange={(e) => handleFormChange('stats.bowlingInnings', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Balls</label>
                <input
                  type="number"
                  value={editForm.stats.balls}
                  onChange={(e) => handleFormChange('stats.balls', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Maidens</label>
                <input
                  type="number"
                  value={editForm.stats.maidens}
                  onChange={(e) => handleFormChange('stats.maidens', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Wickets</label>
                <input
                  type="number"
                  value={editForm.stats.wickets}
                  onChange={(e) => handleFormChange('stats.wickets', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Runs Conceded</label>
                <input
                  type="number"
                  value={editForm.stats.runsConceded}
                  onChange={(e) => handleFormChange('stats.runsConceded', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Bowling Average</label>
                <input
                  type="text"
                  value={editForm.stats.bowlingAverage}
                  onChange={(e) => handleFormChange('stats.bowlingAverage', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Bowling Strike Rate</label>
                <input
                  type="text"
                  value={editForm.stats.bowlingStrikeRate}
                  onChange={(e) => handleFormChange('stats.bowlingStrikeRate', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Economy</label>
                <input
                  type="text"
                  value={editForm.stats.economy}
                  onChange={(e) => handleFormChange('stats.economy', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Best Bowling</label>
                <input
                  type="text"
                  value={editForm.stats.bestBowling}
                  onChange={(e) => handleFormChange('stats.bestBowling', e.target.value)}
                  placeholder="e.g., 2/25"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">5-Wicket Hauls</label>
                <input
                  type="number"
                  value={editForm.stats.fiveWickets}
                  onChange={(e) => handleFormChange('stats.fiveWickets', parseInt(e.target.value) || 0)}
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
            <div className="bg-gradient-to-r from-green-600 to-blue-600 p-6 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white bg-opacity-20 backdrop-blur rounded-full flex items-center justify-center text-white font-bold text-2xl border-2 border-white border-opacity-30">
                    {selectedTeam?.shortName}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">{selectedTeam?.name}</h2>
                    <p className="text-green-100 text-sm mt-1">Squad Management</p>
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
                      <div key={player.id} className="group relative bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl p-6 hover:from-gray-600 hover:to-gray-700 transition-all duration-300 transform hover:scale-105 hover:shadow-xl border border-gray-600 hover:border-green-500">
                        {/* Player Avatar */}
                        <div className="flex items-center mb-4">
                          <div className="relative">
                            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                              {player.name.charAt(0)}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">{player.jerseyNumber || '#1'}</span>
                            </div>
                          </div>
                          <div className="ml-4 flex-1">
                            <h3 className="text-white font-semibold text-lg group-hover:text-green-300 transition-colors">{player.name}</h3>
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
                            <div className="text-green-400 text-2xl font-bold">{player.stats?.wickets || 0}</div>
                            <div className="text-gray-400 text-xs">Wickets</div>
                          </div>
                          <div className="bg-gray-900 bg-opacity-50 rounded-lg p-3 text-center">
                            <div className="text-yellow-400 text-2xl font-bold">{player.stats?.bowlingAverage || '-'}</div>
                            <div className="text-gray-400 text-xs">Average</div>
                          </div>
                          <div className="bg-gray-900 bg-opacity-50 rounded-lg p-3 text-center">
                            <div className="text-purple-400 text-2xl font-bold">{player.stats?.economy || '-'}</div>
                            <div className="text-gray-400 text-xs">Economy</div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <button
                          onClick={() => handleEditPlayer(player)}
                          className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
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

export default BowlingStatsPage;
