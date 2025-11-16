'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Team, CoachingStaff } from '@/types';

export default function AdminCoachesPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState<CoachingStaff>({
    teamId: '',
    headCoach: '',
    mentor: '',
    battingCoach: '',
    bowlingCoach: '',
    fieldingCoach: '',
    physiotherapist: '',
    teamManager: '',
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

  // Fetch teams
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await fetch('/api/teams');
        if (res.ok) {
          const data = await res.json();
          setTeams(data);
        }
      } catch (error) {
        console.error('Error fetching teams:', error);
      }
    };
    fetchTeams();
  }, []);

  // Fetch coaching staff when team is selected
  useEffect(() => {
    if (!selectedTeamId) return;

    const fetchCoachingStaff = async () => {
      try {
        const res = await fetch(`/api/coaches?teamId=${selectedTeamId}`);
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setFormData(data);
          } else {
            // Reset form if no data exists for this team
            setFormData({
              teamId: selectedTeamId,
              headCoach: '',
              mentor: '',
              battingCoach: '',
              bowlingCoach: '',
              fieldingCoach: '',
              physiotherapist: '',
              teamManager: '',
            });
          }
        }
      } catch (error) {
        console.error('Error fetching coaching staff:', error);
      }
    };
    fetchCoachingStaff();
  }, [selectedTeamId]);

  const handleTeamChange = (teamId: string) => {
    setSelectedTeamId(teamId);
    setMessage(null);
  };

  const handleInputChange = (field: keyof CoachingStaff, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
      const res = await fetch('/api/coaches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ ...formData, teamId: selectedTeamId }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Coaching staff updated successfully!' });
      } else {
        const errorData = await res.json();
        setMessage({ type: 'error', text: errorData.message || 'Failed to update coaching staff' });
      }
    } catch (error) {
      console.error('Error updating coaching staff:', error);
      setMessage({ type: 'error', text: 'An error occurred while updating' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <AdminSidebar currentPage="/admin/coaches" />
      
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="mb-2 text-xs text-gray-400 flex items-center gap-1">
              <button
                type="button"
                onClick={() => router.push('/admin/dashboard')}
                className="hover:text-ipl-gold transition-colors"
              >
                Admin
              </button>
              <span className="text-gray-600">/</span>
              <button
                type="button"
                onClick={() => router.push('/admin/teams')}
                className="hover:text-ipl-gold transition-colors"
              >
                Competition
              </button>
              <span className="text-gray-600">/</span>
              <span className="text-gray-300">Coaching Staff</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Coaching Staff Management</h1>
            <p className="text-gray-400">Manage coaching staff for each team. All fields are optional.</p>
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
          <form onSubmit={handleSubmit} className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-white/10 space-y-6">
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
                  {/* Head Coach */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Head Coach
                    </label>
                    <input
                      type="text"
                      value={formData.headCoach}
                      onChange={(e) => handleInputChange('headCoach', e.target.value)}
                      placeholder="Andy Flower"
                      className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                    />
                  </div>

                  {/* Mentor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Mentor
                    </label>
                    <input
                      type="text"
                      value={formData.mentor}
                      onChange={(e) => handleInputChange('mentor', e.target.value)}
                      placeholder="Rahul Dravid"
                      className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                    />
                  </div>

                  {/* Batting Coach */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Batting Coach
                    </label>
                    <input
                      type="text"
                      value={formData.battingCoach}
                      onChange={(e) => handleInputChange('battingCoach', e.target.value)}
                      placeholder="Sanjay Bangar"
                      className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                    />
                  </div>

                  {/* Bowling Coach */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Bowling Coach
                    </label>
                    <input
                      type="text"
                      value={formData.bowlingCoach}
                      onChange={(e) => handleInputChange('bowlingCoach', e.target.value)}
                      placeholder="Dale Steyn"
                      className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                    />
                  </div>

                  {/* Fielding Coach */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Fielding Coach
                    </label>
                    <input
                      type="text"
                      value={formData.fieldingCoach}
                      onChange={(e) => handleInputChange('fieldingCoach', e.target.value)}
                      placeholder="Jonty Rhodes"
                      className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                    />
                  </div>

                  {/* Physiotherapist */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Physiotherapist
                    </label>
                    <input
                      type="text"
                      value={formData.physiotherapist}
                      onChange={(e) => handleInputChange('physiotherapist', e.target.value)}
                      placeholder="Dr. John Gloster"
                      className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                    />
                  </div>

                  {/* Team Manager */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Team Manager
                    </label>
                    <input
                      type="text"
                      value={formData.teamManager}
                      onChange={(e) => handleInputChange('teamManager', e.target.value)}
                      placeholder="Anil Kumble"
                      className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-ipl-gold to-yellow-600 text-slate-900 font-semibold rounded-lg hover:shadow-lg hover:shadow-ipl-gold/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving...' : 'Save Coaching Staff'}
                  </button>
                </div>
              </>
            )}
          </form>

          {/* Helper Text */}
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-300 mb-2">Note:</h3>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• All coaching staff fields are optional</li>
              <li>• Only filled fields will be displayed on the public team page</li>
              <li>• Leave a field empty to hide it from the end-user page</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
