'use client';

import { useState, useEffect } from 'react';
import { useAdminData } from '@/contexts/AdminDataContext';
import AdminSidebar from '@/components/admin/AdminSidebar';

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
      <AdminSidebar />
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-white mb-2">Bowling Statistics</h1>
        <p className="text-gray-400 mb-8">Manage player bowling statistics by team</p>

      {playersByTeam.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">No players found</p>
          <p className="text-gray-500 mt-2">Players will appear here once they are added to teams</p>
        </div>
      ) : (
        playersByTeam.map(({ team, players: teamPlayers }) => (
          <div key={team.id} className="mb-8">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {team.shortName}
              </div>
              <h2 className="text-2xl font-bold text-white ml-4">{team.name}</h2>
              <button
                onClick={() => {
                  setSelectedTeam(team);
                  setShowTeamPanel(true);
                }}
                className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                View Team Panel
              </button>
            </div>

            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-700">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Player</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Age</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Matches</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Innings</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Balls</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Maidens</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Wickets</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Runs</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Avg</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">SR</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Eco</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Best</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">5W</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {teamPlayers.map((player) => (
                      <tr key={player.id} className="hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {player.name.charAt(0)}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-white">{player.name}</div>
                              <div className="text-sm text-gray-400">#{player.jerseyNumber}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {player.role}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {player.age || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {player.stats?.matches || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {player.stats?.bowlingInnings || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {player.stats?.balls || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {player.stats?.maidens || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {player.stats?.wickets || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {player.stats?.runsConceded || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {player.stats?.bowlingAverage || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {player.stats?.bowlingStrikeRate || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {player.stats?.economy || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {player.stats?.bestBowling || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {player.stats?.fiveWickets || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          <button
                            onClick={() => handleEditPlayer(player)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                {selectedTeam?.name} - Players
              </h2>
              <button
                onClick={() => setShowTeamPanel(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {players
                .filter(player => player.teamId === selectedTeam?.id)
                .map((player) => (
                  <div key={player.id} className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors">
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        {player.name.charAt(0)}
                      </div>
                      <div className="ml-3">
                        <div className="text-white font-medium">{player.name}</div>
                        <div className="text-gray-400 text-sm">#{player.jerseyNumber} • {player.role}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between text-gray-300">
                        <span>Matches:</span>
                        <span>{player.stats?.matches || 0}</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Wickets:</span>
                        <span>{player.stats?.wickets || 0}</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Average:</span>
                        <span>{player.stats?.bowlingAverage || '-'}</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Economy:</span>
                        <span>{player.stats?.economy || '-'}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleEditPlayer(player)}
                      className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors"
                    >
                      Edit Stats
                    </button>
                  </div>
                ))}
            </div>
            
            {players.filter(player => player.teamId === selectedTeam?.id).length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-400">No players found in this team</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  </div>
  );
};

export default BowlingStatsPage;
