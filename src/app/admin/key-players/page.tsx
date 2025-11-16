'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Team, Player, KeyPlayers } from '@/types';

export default function AdminKeyPlayersPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamPlayers, setTeamPlayers] = useState<Player[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState<KeyPlayers>({
    teamId: '',
    powerHitterIds: [],
    anchorIds: [],
    finisherIds: [],
    strikeBowlerIds: [],
    deathSpecialistIds: [],
    allRoundXFactorIds: [],
  });

  // Check authentication
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/admin');
        return;
      }
    };
    checkAuth();
  }, [router]);

  // Fetch teams and players
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teamsRes, playersRes] = await Promise.all([
          fetch('/api/teams'),
          fetch('/api/players'),
        ]);

        if (teamsRes.ok) {
          const teamsData = await teamsRes.json();
          setTeams(teamsData);
        }

        if (playersRes.ok) {
          const playersData = await playersRes.json();
          setPlayers(playersData);
        }
      } catch (error) {
        console.error('Error fetching teams/players:', error);
      }
    };

    fetchData();
  }, []);

  // Update teamPlayers when team or players change
  useEffect(() => {
    if (!selectedTeamId) {
      setTeamPlayers([]);
      return;
    }
    const filtered = players.filter((p) => p.teamId === selectedTeamId);
    setTeamPlayers(filtered);
  }, [selectedTeamId, players]);

  // Fetch key players when team is selected
  useEffect(() => {
    if (!selectedTeamId) return;

    const fetchKeyPlayers = async () => {
      try {
        const res = await fetch(`/api/key-players?teamId=${selectedTeamId}`);
        if (res.ok) {
          const raw: any = await res.json();
          if (raw) {
            const normalized: KeyPlayers = {
              teamId: raw.teamId || selectedTeamId,
              powerHitterIds: raw.powerHitterIds || (raw.powerHitterId ? [raw.powerHitterId] : []),
              anchorIds: raw.anchorIds || (raw.anchorId ? [raw.anchorId] : []),
              finisherIds: raw.finisherIds || (raw.finisherId ? [raw.finisherId] : []),
              strikeBowlerIds: raw.strikeBowlerIds || (raw.strikeBowlerId ? [raw.strikeBowlerId] : []),
              deathSpecialistIds: raw.deathSpecialistIds || (raw.deathSpecialistId ? [raw.deathSpecialistId] : []),
              allRoundXFactorIds: raw.allRoundXFactorIds || (raw.allRoundXFactorId ? [raw.allRoundXFactorId] : []),
            };
            setFormData(normalized);
          } else {
            setFormData({
              teamId: selectedTeamId,
              powerHitterIds: [],
              anchorIds: [],
              finisherIds: [],
              strikeBowlerIds: [],
              deathSpecialistIds: [],
              allRoundXFactorIds: [],
            });
          }
        }
      } catch (error) {
        console.error('Error fetching key players:', error);
      }
    };

    fetchKeyPlayers();
  }, [selectedTeamId]);

  const handleTeamChange = (teamId: string) => {
    setSelectedTeamId(teamId);
    setMessage(null);
  };

  const handleRoleChange = (field: keyof KeyPlayers, values: string[]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: values.length ? values : [],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId) {
      setMessage({ type: 'error', text: 'Please select a team' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('auth_token');
      const payload: KeyPlayers = {
        teamId: selectedTeamId,
        powerHitterIds: formData.powerHitterIds && formData.powerHitterIds.length ? formData.powerHitterIds : undefined,
        anchorIds: formData.anchorIds && formData.anchorIds.length ? formData.anchorIds : undefined,
        finisherIds: formData.finisherIds && formData.finisherIds.length ? formData.finisherIds : undefined,
        strikeBowlerIds: formData.strikeBowlerIds && formData.strikeBowlerIds.length ? formData.strikeBowlerIds : undefined,
        deathSpecialistIds: formData.deathSpecialistIds && formData.deathSpecialistIds.length ? formData.deathSpecialistIds : undefined,
        allRoundXFactorIds: formData.allRoundXFactorIds && formData.allRoundXFactorIds.length ? formData.allRoundXFactorIds : undefined,
      };

      const res = await fetch('/api/key-players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Key players updated successfully!' });
      } else {
        const errorData = await res.json();
        setMessage({ type: 'error', text: errorData.message || 'Failed to update key players' });
      }
    } catch (error) {
      console.error('Error updating key players:', error);
      setMessage({ type: 'error', text: 'An error occurred while updating' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <AdminSidebar currentPage="/admin/key-players" />

      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Key Players Management</h1>
            <p className="text-gray-400 text-sm">
              Select key roles like power hitter, finisher, and strike bowler for each team. All fields are optional.
            </p>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-500/10 border border-green-500/50 text-green-400'
                  : 'bg-red-500/10 border border-red-500/50 text-red-400'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-white/10 space-y-6"
          >
            {/* Team Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Team <span className="text-red-400">*</span>
              </label>
              <select
                value={selectedTeamId}
                onChange={(e) => handleTeamChange(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white focus:outline-none focus:border-ipl-gold"
                required
              >
                <option value="">-- Select a team --</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.shortName})
                  </option>
                ))}
              </select>
            </div>

            {selectedTeamId && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Power hitter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Power hitter</label>
                    <select
                      multiple
                      value={formData.powerHitterIds || []}
                      onChange={(e) =>
                        handleRoleChange(
                          'powerHitterIds',
                          Array.from(e.target.selectedOptions).map((opt) => opt.value)
                        )
                      }
                      className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white focus:outline-none focus:border-ipl-gold text-sm"
                    >
                      {teamPlayers.map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.name} ({player.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Anchor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Anchor</label>
                    <select
                      multiple
                      value={formData.anchorIds || []}
                      onChange={(e) =>
                        handleRoleChange(
                          'anchorIds',
                          Array.from(e.target.selectedOptions).map((opt) => opt.value)
                        )
                      }
                      className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white focus:outline-none focus:border-ipl-gold text-sm"
                    >
                      {teamPlayers.map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.name} ({player.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Finisher */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Finisher</label>
                    <select
                      multiple
                      value={formData.finisherIds || []}
                      onChange={(e) =>
                        handleRoleChange(
                          'finisherIds',
                          Array.from(e.target.selectedOptions).map((opt) => opt.value)
                        )
                      }
                      className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white focus:outline-none focus:border-ipl-gold text-sm"
                    >
                      {teamPlayers.map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.name} ({player.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Strike bowler */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Strike bowler</label>
                    <select
                      multiple
                      value={formData.strikeBowlerIds || []}
                      onChange={(e) =>
                        handleRoleChange(
                          'strikeBowlerIds',
                          Array.from(e.target.selectedOptions).map((opt) => opt.value)
                        )
                      }
                      className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white focus:outline-none focus:border-ipl-gold text-sm"
                    >
                      {teamPlayers.map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.name} ({player.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Death specialist */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Death specialist</label>
                    <select
                      multiple
                      value={formData.deathSpecialistIds || []}
                      onChange={(e) =>
                        handleRoleChange(
                          'deathSpecialistIds',
                          Array.from(e.target.selectedOptions).map((opt) => opt.value)
                        )
                      }
                      className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white focus:outline-none focus:border-ipl-gold text-sm"
                    >
                      {teamPlayers.map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.name} ({player.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* X-factor all-rounder */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">X-factor all-rounder</label>
                    <select
                      multiple
                      value={formData.allRoundXFactorIds || []}
                      onChange={(e) =>
                        handleRoleChange(
                          'allRoundXFactorIds',
                          Array.from(e.target.selectedOptions).map((opt) => opt.value)
                        )
                      }
                      className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white focus:outline-none focus:border-ipl-gold text-sm"
                    >
                      {teamPlayers.map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.name} ({player.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-ipl-gold to-yellow-600 text-slate-900 font-semibold rounded-lg hover:shadow-lg hover:shadow-ipl-gold/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving...' : 'Save Key Players'}
                  </button>
                </div>
              </>
            )}
          </form>

          {/* Helper Text */}
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-300 mb-2">Note:</h3>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• All key player roles are optional.</li>
              <li>• Only selected roles will appear on the public team page.</li>
              <li>• Use this page to override any automatic tags like power hitter or strike bowler.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
