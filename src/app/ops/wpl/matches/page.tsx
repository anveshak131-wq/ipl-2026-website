'use client';

import { useState, useEffect } from 'react';
import AnimatedSection from '@/components/ui/AnimatedSection';
import { Calendar, MapPin, Clock, Plus, Edit, Trash2, CheckCircle, RotateCcw } from 'lucide-react';
import { api } from '@/lib/data';
import { Match } from '@/types';

export default function WPLMatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);

  const [formData, setFormData] = useState({
    team1Id: '',
    team2Id: '',
    venue: '',
    date: '',
    time: '',
    status: 'upcoming' as 'upcoming' | 'live' | 'completed'
  });

  useEffect(() => {
    fetchMatches();
    fetchTeams();
  }, []);

  // Auto-create RCB-W final match
  useEffect(() => {
    const createFinalMatch = async () => {
      if (teams.length === 0) return;
      
      const rcbTeam = teams.find(t => t.shortName === 'RCB-W' || t.name.includes('Royal Challengers Bangalore'));
      if (!rcbTeam) return;
      
      // Check if final match already exists
      const finalMatchExists = matches.some(m => 
        (m.team1Id === rcbTeam.id || m.team2Id === rcbTeam.id) && 
        m.date === '2026-02-05'
      );
      
      if (finalMatchExists) return;
      
      // Create final match data
      const finalMatch = {
        team1Id: rcbTeam.id,
        team2Id: 'tbd', // To be determined
        venue: 'M. Chinnaswamy Stadium, Bangalore',
        date: '2026-02-05',
        time: '19:30',
        status: 'upcoming' as const,
        league: 'wpl',
        matchType: 'final'
      };
      
      try {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
        if (!token) return;
        
        const response = await fetch('/api/matches', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(finalMatch)
        });
        
        if (response.ok) {
          const newMatch = await response.json();
          setMatches(prev => [...prev, newMatch]);
          console.log('RCB-W Final match created successfully!');
        }
      } catch (error) {
        console.log('Could not create final match, but continuing...');
      }
    };
    
    if (teams.length > 0 && matches.length >= 0) {
      createFinalMatch();
    }
  }, [teams, matches]);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      // Fetch WPL matches from API
      const wplMatches = await api.getMatches('wpl');
      setMatches(wplMatches);
    } catch (error) {
      console.error('Error fetching WPL matches:', error);
      setMessage('Failed to fetch matches');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams?league=wpl');
      if (response.ok) {
        const wplTeams = await response.json();
        setTeams(wplTeams);
      }
    } catch (error) {
      console.error('Error fetching WPL teams:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      
      if (editingMatch) {
        // Update existing match
        const response = await fetch('/api/matches', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            id: editingMatch.id,
            team1Id: formData.team1Id,
            team2Id: formData.team2Id,
            venue: formData.venue,
            date: formData.date,
            time: formData.time,
            status: formData.status
          })
        });

        if (response.ok) {
          const updatedMatch = await response.json();
          setMatches(matches.map(m => m.id === editingMatch.id ? updatedMatch : m));
          setMessage('Match updated successfully!');
        } else {
          const error = await response.json();
          setMessage(`Error: ${error.error || 'Failed to update match'}`);
        }
      } else {
        // Create new match
        const response = await fetch('/api/matches', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            team1Id: formData.team1Id,
            team2Id: formData.team2Id,
            venue: formData.venue,
            date: formData.date,
            time: formData.time,
            status: formData.status,
            league: 'wpl'
          })
        });

        if (response.ok) {
          const newMatch = await response.json();
          setMatches([...matches, newMatch]);
          setMessage('Match created successfully!');
        } else {
          const error = await response.json();
          setMessage(`Error: ${error.error || 'Failed to create match'}`);
        }
      }
      
      setShowForm(false);
      setEditingMatch(null);
      setFormData({
        team1Id: '',
        team2Id: '',
        venue: '',
        date: '',
        time: '',
        status: 'upcoming'
      });
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving match:', error);
      setMessage('Failed to save match');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (match: Match) => {
    setEditingMatch(match);
    setFormData({
      team1Id: match.team1.id,
      team2Id: match.team2.id,
      venue: match.venue,
      date: match.date,
      time: match.time,
      status: match.status
    });
    setShowForm(true);
  };

  const handleDelete = async (matchId: string) => {
    if (!confirm('Are you sure you want to delete this match?')) return;
    
    setLoading(true);
    try {
      setMatches(matches.filter(m => m.id !== matchId));
      setMessage('Match deleted successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to delete match');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteMatch = async (matchId: string) => {
    if (!confirm('Mark this match as completed?')) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
      const response = await fetch('/api/matches', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: matchId,
          status: 'completed'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update match');
      }

      // Update local state
      setMatches(matches.map(m => 
        m.id === matchId ? { ...m, status: 'completed' as const } : m
      ));
      setMessage('Match marked as completed!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating match:', error);
      setMessage('Failed to update match status');
    } finally {
      setLoading(false);
    }
  };

  const handleRedoMatch = async (matchId: string) => {
    if (!confirm('Revert match to upcoming status?')) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
      const response = await fetch('/api/matches', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: matchId,
          status: 'upcoming'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update match');
      }

      // Update local state
      setMatches(matches.map(m => 
        m.id === matchId ? { ...m, status: 'upcoming' as const } : m
      ));
      setMessage('Match status reverted to upcoming!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating match:', error);
      setMessage('Failed to update match status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900">
      <div className="lg:ml-64 p-6">
      <AnimatedSection>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">WPL Matches Management</h1>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors"
          >
            <Plus size={20} />
            <span>Add Match</span>
          </button>
        </div>
        
        {message && (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 mb-6">
            {message}
          </div>
        )}

        {showForm && (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              {editingMatch ? 'Edit Match' : 'Add New Match'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Team 1</label>
                  <select
                    value={formData.team1Id}
                    onChange={(e) => setFormData({...formData, team1Id: e.target.value})}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                    required
                  >
                    <option value="">Select Team 1</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">Team 2</label>
                  <select
                    value={formData.team2Id}
                    onChange={(e) => setFormData({...formData, team2Id: e.target.value})}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                    required
                  >
                    <option value="">Select Team 2</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">Venue</label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => setFormData({...formData, venue: e.target.value})}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                  placeholder="Enter venue"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">Time</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as 'upcoming' | 'live' | 'completed'})}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="live">Live</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingMatch(null);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingMatch ? 'Update Match' : 'Create Match')}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-white text-center">Loading matches...</div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => (
              <div key={match.id} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-white">{match.team1.shortName}</div>
                      <div className="text-sm text-gray-300">{match.team1.name}</div>
                    </div>
                    
                    <div className="text-white">vs</div>
                    
                    <div className="text-center">
                      <div className="text-lg font-semibold text-white">{match.team2.shortName}</div>
                      <div className="text-sm text-gray-300">{match.team2.name}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <div className="flex items-center text-gray-300 text-sm mb-1">
                        <Calendar size={16} className="mr-1" />
                        {match.date}
                      </div>
                      <div className="flex items-center text-gray-300 text-sm mb-1">
                        <Clock size={16} className="mr-1" />
                        {match.time}
                      </div>
                      <div className="flex items-center text-gray-300 text-sm">
                        <MapPin size={16} className="mr-1" />
                        {match.venue}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        match.status === 'live' ? 'bg-red-500 text-white' :
                        match.status === 'completed' ? 'bg-green-500 text-white' :
                        'bg-blue-500 text-white'
                      }`}>
                        {match.status}
                      </span>
                      
                      {match.status !== 'completed' && (
                        <button
                          onClick={() => handleCompleteMatch(match.id)}
                          className="p-2 text-green-400 hover:text-green-300 transition-colors"
                          title="Mark as Complete"
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                      
                      {match.status === 'completed' && (
                        <button
                          onClick={() => handleRedoMatch(match.id)}
                          className="p-2 text-yellow-400 hover:text-yellow-300 transition-colors"
                          title="Redo Match"
                        >
                          <RotateCcw size={16} />
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleEdit(match)}
                        className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      
                      <button
                        onClick={() => handleDelete(match.id)}
                        className="p-2 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </AnimatedSection>
      </div>
    </div>
  );
}
