'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';

// Mark this page as dynamic to prevent pre-rendering
// Note: Removed for static export compatibility
import { Match, Team } from '@/types';
import { api } from '@/lib/data';

export default function AdminMatches() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    venue: '',
    team1Id: '',
    team2Id: '',
    status: 'upcoming' as 'upcoming' | 'live' | 'completed'
  });

  useEffect(() => {
    // Check authentication on client side only
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          router.push('/admin');
          return;
        }
        setIsAuthenticated(true);
        fetchInitialData();
      } catch (error) {
        // localStorage not available, redirect to login
        router.push('/admin');
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchInitialData = async () => {
    try {
      const [matchesData, teamsData] = await Promise.all([
        api.getMatches(),
        api.getTeams()
      ]);
      setMatches(matchesData);
      setTeams(teamsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('Failed to load matches');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      date: '',
      time: '',
      venue: '',
      team1Id: '',
      team2Id: '',
      status: 'upcoming'
    });
    setEditingId(null);
    setShowForm(false);
    setError(null);
  };

  const handleEdit = (match: Match) => {
    setFormData({
      date: match.date,
      time: match.time,
      venue: match.venue,
      team1Id: match.team1.id,
      team2Id: match.team2.id,
      status: match.status
    });
    setEditingId(match.id);
    setShowForm(true);
    setError(null);
  };

  const handleDelete = async (matchId: string) => {
    if (!confirm('Are you sure you want to delete this match?')) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      await api.deleteMatch(matchId);
      setMatches(matches.filter(m => m.id !== matchId));
      setSuccess('Match deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to delete match:', error);
      setError('Failed to delete match');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.time || !formData.venue || !formData.team1Id || !formData.team2Id) {
      setError('All fields are required');
      return;
    }

    if (formData.team1Id === formData.team2Id) {
      setError('Teams must be different');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      if (editingId) {
        // Update existing match
        const updatedMatch = await api.updateMatch(editingId, formData);
        setMatches(matches.map(m => m.id === editingId ? updatedMatch : m));
        setSuccess('Match updated successfully');
      } else {
        // Create new match
        const newMatch = await api.createMatch(formData);
        setMatches([...matches, newMatch]);
        setSuccess('Match created successfully');
      }

      resetForm();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to save match:', error);
      setError(editingId ? 'Failed to update match' : 'Failed to create match');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen bg-ipl-dark">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-ipl-dark">
        <AdminSidebar currentPage="/admin/matches" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Loading matches...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-ipl-dark">
      <AdminSidebar currentPage="/admin/matches" />
      
      <div className="flex-1">
        <div className="p-8">
          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400">
              {success}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
              {error}
            </div>
          )}

          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">
              Manage Matches
            </h1>
            <button 
              onClick={() => !showForm ? setShowForm(true) : resetForm()}
              className="ipl-button"
            >
              {showForm ? 'Cancel' : 'Add New Match'}
            </button>
          </div>

          {/* Match Form */}
          {showForm && (
            <div className="glass-effect rounded-xl p-8 mb-8">
              <h2 className="text-2xl font-bold text-white mb-6">
                {editingId ? 'Edit Match' : 'Add New Match'}
              </h2>
              
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-ipl-gold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-ipl-gold"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Venue
                  </label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) => setFormData({...formData, venue: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-ipl-gold"
                    placeholder="e.g., M. A. Chidambaram Stadium, Chennai"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Team 1
                  </label>
                  <select
                    value={formData.team1Id}
                    onChange={(e) => setFormData({...formData, team1Id: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-ipl-gold"
                    required
                  >
                    <option value="">Select Team</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>
                        {team.shortName} - {team.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Team 2
                  </label>
                  <select
                    value={formData.team2Id}
                    onChange={(e) => setFormData({...formData, team2Id: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-ipl-gold"
                    required
                  >
                    <option value="">Select Team</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>
                        {team.shortName} - {team.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as 'upcoming' | 'live' | 'completed'})}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-ipl-gold"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="live">Live</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="md:col-span-2 flex space-x-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 ipl-button disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : editingId ? 'Update Match' : 'Create Match'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 glass-effect text-white font-semibold py-3 px-6 rounded-lg hover:bg-white/20 transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Matches Table */}
          <div className="glass-effect rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Teams
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Venue
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {matches.map((match) => (
                    <tr key={match.id} className="hover:bg-white/5">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {match.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {match.team1.shortName} vs {match.team2.shortName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {match.venue}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          match.status === 'live' 
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : match.status === 'completed'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {match.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleEdit(match)}
                            className="text-ipl-gold hover:text-ipl-purple transition-colors disabled:opacity-50"
                            disabled={isSubmitting}
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(match.id)}
                            className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                            disabled={isSubmitting}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {matches.length === 0 && !showForm && (
            <div className="mt-8 text-center">
              <div className="glass-effect rounded-xl p-8 max-w-2xl mx-auto">
                <h3 className="text-xl font-semibold text-white mb-4">
                  No Matches Yet
                </h3>
                <p className="text-gray-300 mb-6">
                  Get started by adding your first match.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
