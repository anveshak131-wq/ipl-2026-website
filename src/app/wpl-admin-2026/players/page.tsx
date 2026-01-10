'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Player, Team } from '@/types';
import { api } from '@/lib/data';
import { WPLColors } from '@/lib/wplColors';
import AuroraBackground from '@/components/ui/AuroraBackground';
import { LoadingSpinner } from '@/components/admin/animations';
import { Edit2, Save, X, Users } from 'lucide-react';

export default function WPLPlayersManagementPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editedTeamId, setEditedTeamId] = useState('');

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/wpl-admin-2026');
      return;
    }
    setIsAuthenticated(true);
  }, [router]);

  // Load data
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadData = async () => {
      try {
        const [playersData, teamsData] = await Promise.all([
          api.getPlayers(undefined, 'wpl'),
          api.getTeams('wpl'),
        ]);
        setPlayers(playersData || []);
        setTeams(teamsData || []);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setIsLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated]);

  const handleEdit = (player: Player) => {
    setEditingPlayer(player);
    setEditedTeamId(player.teamId || '');
  };

  const handleSave = async () => {
    if (!editingPlayer || !editedTeamId) return;

    try {
      const token = localStorage.getItem('adminToken');
      const updatedPlayerData = {
        ...editingPlayer,
        teamId: editedTeamId,
        isCaptain: editingPlayer.isCaptain || false,
      };

      const response = await fetch('/api/players', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedPlayerData),
      });

      if (response.ok) {
        const updatedPlayer = await response.json();
        setPlayers(players.map(p => p.id === editingPlayer.id ? updatedPlayer : p));
        setEditingPlayer(null);
        alert('Player updated successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to save player'}`);
      }
    } catch (error) {
      console.error('Error saving player:', error);
      alert('Error saving player');
    }
  };

  const handleCancel = () => {
    setEditingPlayer(null);
  };

  const filteredPlayers = players.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const bgStyle = {
    background: `linear-gradient(to bottom, ${WPLColors.base}, ${WPLColors.gradientStart}66, ${WPLColors.gradientMid}33, ${WPLColors.base})`
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen" style={bgStyle}>
        <AuroraBackground />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" color={WPLColors.pink} />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen" style={bgStyle}>
      <AuroraBackground />
      <AdminSidebar currentPage="/wpl-admin-2026/players" />
      
      <main className="flex-1 relative z-20 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-8 h-8" style={{ color: WPLColors.pink }} />
              <h1 
                className="text-4xl font-bold"
                style={{
                  background: `linear-gradient(to right, ${WPLColors.textPrimary}, ${WPLColors.purple}, ${WPLColors.pink})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Players Management
              </h1>
            </div>
            <p style={{ color: WPLColors.textSecondary }}>
              Edit player team assignments and captain status
            </p>
          </div>

          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 rounded-lg text-white text-sm focus:outline-none"
              style={{
                background: WPLColors.purpleRGBA[20],
                border: `1px solid ${WPLColors.purpleRGBA[30]}`,
              }}
            />
          </div>

          {/* Players Table */}
          <div 
            className="rounded-2xl overflow-hidden backdrop-blur-xl border"
            style={{
              background: WPLColors.purpleRGBA[10],
              borderColor: WPLColors.purpleRGBA[30],
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${WPLColors.purpleRGBA[30]}` }}>
                    <th className="px-6 py-3 text-left font-semibold" style={{ color: WPLColors.textPrimary }}>Player Name</th>
                    <th className="px-6 py-3 text-left font-semibold" style={{ color: WPLColors.textPrimary }}>Role</th>
                    <th className="px-6 py-3 text-left font-semibold" style={{ color: WPLColors.textPrimary }}>Current Team</th>
                    <th className="px-6 py-3 text-left font-semibold" style={{ color: WPLColors.textPrimary }}>Captain</th>
                    <th className="px-6 py-3 text-center font-semibold" style={{ color: WPLColors.textPrimary }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.map((player) => {
                    const currentTeam = teams.find(t => t.id === player.teamId);
                    const isEditing = editingPlayer?.id === player.id;

                    return (
                      <tr key={player.id} style={{ borderBottom: `1px solid ${WPLColors.purpleRGBA[30]}` }}>
                        <td className="px-6 py-4" style={{ color: WPLColors.textSecondary }}>{player.name}</td>
                        <td className="px-6 py-4" style={{ color: WPLColors.textSecondary }}>{player.role}</td>
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <select
                              value={editedTeamId}
                              onChange={(e) => setEditedTeamId(e.target.value)}
                              className="px-3 py-2 rounded text-sm text-white"
                              style={{
                                background: WPLColors.purpleRGBA[30],
                                border: `1px solid ${WPLColors.pink}`,
                              }}
                            >
                              <option value="">Select Team</option>
                              {teams.map((team) => (
                                <option key={team.id} value={team.id}>
                                  {team.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span style={{ color: WPLColors.pink }}>
                              {currentTeam?.name || 'Unassigned'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4" style={{ color: WPLColors.textSecondary }}>
                          {player.isCaptain ? '👑 Yes' : 'No'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {isEditing ? (
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={handleSave}
                                className="p-2 rounded hover:opacity-80 transition-opacity"
                                style={{ background: WPLColors.pink }}
                              >
                                <Save className="w-4 h-4 text-white" />
                              </button>
                              <button
                                onClick={handleCancel}
                                className="p-2 rounded hover:opacity-80 transition-opacity"
                                style={{ background: WPLColors.purpleRGBA[50] }}
                              >
                                <X className="w-4 h-4 text-white" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEdit(player)}
                              className="p-2 rounded hover:opacity-80 transition-opacity"
                              style={{ background: WPLColors.purple }}
                            >
                              <Edit2 className="w-4 h-4 text-white" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {filteredPlayers.length === 0 && (
            <div className="text-center py-8">
              <p style={{ color: WPLColors.textSecondary }}>No players found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
