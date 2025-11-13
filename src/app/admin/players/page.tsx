'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Player, Team } from '@/types';
import { api } from '@/lib/data';

// Mark this page as dynamic to prevent pre-rendering
// Note: Removed for static export compatibility

export default function AdminPlayers() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    role: 'Batsman' | 'Bowler' | 'All-rounder' | 'Wicket-keeper';
    teamId: string;
    age: string;
    nationality: string;
    photo: string;
    jerseyNumber: string;
    bio: string;
    stats: {
      matches: string;
      runs: string;
      wickets: string;
      average: string;
      strikeRate: string;
      economy: string;
      highest: string;
      fours: string;
      sixes: string;
      fifties: string;
      hundreds: string;
      bestBowling: string;
    };
  }>({
    name: '',
    role: 'Batsman',
    teamId: '',
    age: '',
    nationality: '',
    photo: '',
    jerseyNumber: '',
    bio: '',
    stats: {
      matches: '',
      runs: '',
      wickets: '',
      average: '',
      strikeRate: '',
      economy: '',
      highest: '',
      fours: '',
      sixes: '',
      fifties: '',
      hundreds: '',
      bestBowling: ''
    }
  });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin');
      return;
    }
    setIsAuthenticated(true);
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const playersData = await api.getPlayers();
      const teamsData = await api.getTeams();
      setPlayers(playersData);
      setTeams(teamsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPlayer = () => {
    setEditingPlayer(null);
    setFormData({
      name: '',
      role: 'Batsman',
      teamId: '',
      age: '',
      nationality: '',
      photo: '',
      jerseyNumber: '',
      bio: '',
      stats: {
        matches: '',
        runs: '',
        wickets: '',
        average: '',
        strikeRate: '',
        economy: '',
        highest: '',
        fours: '',
        sixes: '',
        fifties: '',
        hundreds: '',
        bestBowling: ''
      }
    });
    setShowForm(true);
  };

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setFormData({
      name: player.name,
      role: player.role,
      teamId: player.teamId,
      age: player.age.toString(),
      nationality: player.nationality,
      photo: player.photo,
      jerseyNumber: player.jerseyNumber.toString(),
      bio: player.bio,
      stats: {
        matches: player.stats.matches.toString(),
        runs: player.stats.runs.toString(),
        wickets: player.stats.wickets.toString(),
        average: player.stats.average.toString(),
        strikeRate: player.stats.strikeRate.toString(),
        economy: player.stats.economy.toString(),
        highest: player.stats.highest.toString(),
        fours: player.stats.fours.toString(),
        sixes: player.stats.sixes.toString(),
        fifties: player.stats.fifties.toString(),
        hundreds: player.stats.hundreds.toString(),
        bestBowling: player.stats.bestBowling
      }
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Send to API
    console.log('Submitting player:', formData);
    setShowForm(false);
    // In real app, would refresh players list
  };

  const handleDeletePlayer = (playerId: string) => {
    if (confirm('Are you sure you want to delete this player?')) {
      // TODO: Send delete request to API
      setPlayers(players.filter(p => p.id !== playerId));
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-ipl-dark">
        <AdminSidebar currentPage="/admin/players" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-ipl-dark">
      <AdminSidebar currentPage="/admin/players" />
      
      <div className="flex-1">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">
              Manage Players
            </h1>
            <button 
              onClick={handleAddPlayer}
              className="ipl-button"
            >
              Add New Player
            </button>
          </div>

          {/* Players Table */}
          <div className="glass-effect rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Jersey
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Team
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Age
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Runs
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Wickets
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Avg
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      SR
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      4s/6s
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      50s/100s
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      BBM
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {players.map((player) => {
                    const team = teams.find(t => t.id === player.teamId);
                    return (
                      <tr key={player.id} className="hover:bg-white/5">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                          {player.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-ipl-gold/20 text-ipl-gold rounded-full font-bold text-xs">
                            {player.jerseyNumber || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-ipl-purple/20 text-ipl-purple border border-ipl-purple/30">
                            {player.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {team?.shortName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {player.age}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                          {player.stats.runs}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                          {player.stats.wickets}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                          {player.stats.average}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                          {player.stats.strikeRate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                          {player.stats.fours}/{player.stats.sixes}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                          {player.stats.fifties}/{player.stats.hundreds}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                          {player.stats.bestBowling || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleEditPlayer(player)}
                              className="text-ipl-gold hover:text-ipl-purple transition-colors"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeletePlayer(player.id)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Player Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="glass-effect rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">
                      {editingPlayer ? 'Edit Player' : 'Add New Player'}
                    </h2>
                    <button 
                      onClick={() => setShowForm(false)}
                      className="text-gray-400 hover:text-white text-2xl"
                    >
                      ×
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Player Name
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                          placeholder="Enter player name"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Role
                        </label>
                        <select
                          value={formData.role}
                          onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-ipl-gold"
                        >
                          <option value="Batsman">Batsman</option>
                          <option value="Bowler">Bowler</option>
                          <option value="All-rounder">All-rounder</option>
                          <option value="Wicket-keeper">Wicket-keeper</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Team
                        </label>
                        <select
                          value={formData.teamId}
                          onChange={(e) => setFormData({...formData, teamId: e.target.value})}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-ipl-gold"
                          required
                        >
                          <option value="">Select a team</option>
                          {teams.map(team => (
                            <option key={team.id} value={team.id}>
                              {team.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Age
                        </label>
                        <input
                          type="number"
                          value={formData.age}
                          onChange={(e) => setFormData({...formData, age: e.target.value})}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                          placeholder="Enter age"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Nationality
                        </label>
                        <input
                          type="text"
                          value={formData.nationality}
                          onChange={(e) => setFormData({...formData, nationality: e.target.value})}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                          placeholder="Enter nationality"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Jersey Number
                        </label>
                        <input
                          type="number"
                          value={formData.jerseyNumber}
                          onChange={(e) => setFormData({...formData, jerseyNumber: e.target.value})}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                          placeholder="Enter jersey number"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Photo URL
                        </label>
                        <input
                          type="text"
                          value={formData.photo}
                          onChange={(e) => setFormData({...formData, photo: e.target.value})}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                          placeholder="Enter photo URL"
                        />
                      </div>
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Bio
                      </label>
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({...formData, bio: e.target.value})}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                        placeholder="Enter player bio"
                        rows={3}
                      />
                    </div>

                    {/* Stats */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Player Statistics</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Matches
                          </label>
                          <input
                            type="number"
                            value={formData.stats.matches}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, matches: e.target.value}})}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Runs
                          </label>
                          <input
                            type="number"
                            value={formData.stats.runs}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, runs: e.target.value}})}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Wickets
                          </label>
                          <input
                            type="number"
                            value={formData.stats.wickets}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, wickets: e.target.value}})}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Average
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.stats.average}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, average: e.target.value}})}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Strike Rate
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.stats.strikeRate}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, strikeRate: e.target.value}})}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Economy
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.stats.economy}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, economy: e.target.value}})}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Highest Score
                          </label>
                          <input
                            type="number"
                            value={formData.stats.highest}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, highest: e.target.value}})}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Fours
                          </label>
                          <input
                            type="number"
                            value={formData.stats.fours}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, fours: e.target.value}})}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Sixes
                          </label>
                          <input
                            type="number"
                            value={formData.stats.sixes}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, sixes: e.target.value}})}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Fifties (50s)
                          </label>
                          <input
                            type="number"
                            value={formData.stats.fifties}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, fifties: e.target.value}})}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Hundreds (100s)
                          </label>
                          <input
                            type="number"
                            value={formData.stats.hundreds}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, hundreds: e.target.value}})}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                            placeholder="0"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Best Bowling (BBM)
                          </label>
                          <input
                            type="text"
                            value={formData.stats.bestBowling}
                            onChange={(e) => setFormData({...formData, stats: {...formData.stats, bestBowling: e.target.value}})}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                            placeholder="e.g., 4/21 or 3/45"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex space-x-4 pt-6 border-t border-white/10">
                      <button
                        type="submit"
                        className="ipl-button flex-1"
                      >
                        {editingPlayer ? 'Update Player' : 'Add Player'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="flex-1 glass-effect text-white font-semibold py-3 px-6 rounded-lg hover:bg-white/20 transition-all duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
