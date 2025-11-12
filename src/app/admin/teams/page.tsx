'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';

// Mark this page as dynamic to prevent pre-rendering
export const dynamic = 'force-dynamic';
import { Team } from '@/types';
import { api } from '@/lib/data';

export default function AdminTeams() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    logo: '',
    description: '',
    colors: {
      primary: '#6B46C1',
      secondary: '#FFD700'
    }
  });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin');
      return;
    }
    setIsAuthenticated(true);
    fetchTeams();
  }, [router]);

  const fetchTeams = async () => {
    try {
      const teamsData = await api.getTeams();
      setTeams(teamsData);
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTeam = () => {
    setEditingTeam(null);
    setFormData({
      name: '',
      shortName: '',
      logo: '',
      description: '',
      colors: {
        primary: '#6B46C1',
        secondary: '#FFD700'
      }
    });
    setShowForm(true);
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      shortName: team.shortName,
      logo: team.logo,
      description: team.description,
      colors: team.colors
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Send to API
    console.log('Submitting team:', formData);
    setShowForm(false);
  };

  const handleDeleteTeam = (teamId: string) => {
    if (confirm('Are you sure you want to delete this team?')) {
      // TODO: Send delete request to API
      setTeams(teams.filter(t => t.id !== teamId));
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-ipl-dark">
        <AdminSidebar currentPage="/admin/teams" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-ipl-dark">
      <AdminSidebar currentPage="/admin/teams" />
      
      <div className="flex-1">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">
              Manage Teams
            </h1>
            <button 
              onClick={handleAddTeam}
              className="ipl-button"
            >
              Add New Team
            </button>
          </div>

          {/* Teams Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {teams.map((team) => (
              <div key={team.id} className="glass-effect rounded-xl p-6 hover:shadow-xl transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      {team.name}
                    </h3>
                    <p className="text-ipl-gold font-semibold">
                      {team.shortName}
                    </p>
                  </div>
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{background: `linear-gradient(135deg, ${team.colors.primary} 0%, ${team.colors.secondary} 100%)`}}
                  >
                    {team.shortName.substring(0, 2)}
                  </div>
                </div>

                <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                  {team.description}
                </p>

                <div className="flex items-center space-x-2 mb-4">
                  <div 
                    className="w-6 h-6 rounded border-2"
                    style={{borderColor: team.colors.primary, backgroundColor: team.colors.primary}}
                  />
                  <span className="text-xs text-gray-400">{team.colors.primary}</span>
                </div>

                <div className="flex space-x-2 pt-4 border-t border-white/10">
                  <button 
                    onClick={() => handleEditTeam(team)}
                    className="flex-1 text-ipl-gold hover:text-ipl-purple transition-colors font-medium py-2"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteTeam(team.id)}
                    className="flex-1 text-red-400 hover:text-red-300 transition-colors font-medium py-2"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Team Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="glass-effect rounded-xl max-w-2xl w-full">
                <div className="p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">
                      {editingTeam ? 'Edit Team' : 'Add New Team'}
                    </h2>
                    <button 
                      onClick={() => setShowForm(false)}
                      className="text-gray-400 hover:text-white text-2xl"
                    >
                      ×
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Team Name
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                          placeholder="e.g., Royal Challengers Bengaluru"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Short Name
                        </label>
                        <input
                          type="text"
                          value={formData.shortName}
                          onChange={(e) => setFormData({...formData, shortName: e.target.value.toUpperCase()})}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                          placeholder="e.g., RCB"
                          maxLength={4}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Logo URL
                        </label>
                        <input
                          type="text"
                          value={formData.logo}
                          onChange={(e) => setFormData({...formData, logo: e.target.value})}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                          placeholder="Enter logo URL"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Primary Color
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={formData.colors.primary}
                            onChange={(e) => setFormData({...formData, colors: {...formData.colors, primary: e.target.value}})}
                            className="w-12 h-10 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={formData.colors.primary}
                            onChange={(e) => setFormData({...formData, colors: {...formData.colors, primary: e.target.value}})}
                            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                            placeholder="#6B46C1"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Secondary Color
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={formData.colors.secondary}
                            onChange={(e) => setFormData({...formData, colors: {...formData.colors, secondary: e.target.value}})}
                            className="w-12 h-10 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={formData.colors.secondary}
                            onChange={(e) => setFormData({...formData, colors: {...formData.colors, secondary: e.target.value}})}
                            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                            placeholder="#FFD700"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                        placeholder="Enter team description"
                        rows={3}
                        required
                      />
                    </div>

                    {/* Color Preview */}
                    <div className="p-4 bg-white/5 rounded-lg">
                      <p className="text-sm text-gray-400 mb-3">Color Preview</p>
                      <div 
                        className="h-20 rounded-lg flex items-center justify-center text-white font-bold text-2xl"
                        style={{background: `linear-gradient(135deg, ${formData.colors.primary} 0%, ${formData.colors.secondary} 100%)`}}
                      >
                        {formData.shortName || 'TEAM'}
                      </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex space-x-4 pt-6 border-t border-white/10">
                      <button
                        type="submit"
                        className="ipl-button flex-1"
                      >
                        {editingTeam ? 'Update Team' : 'Add Team'}
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
