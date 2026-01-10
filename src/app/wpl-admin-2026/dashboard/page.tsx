'use client';

import { useState, useEffect } from 'react';
import { Edit2, Save, X, Trash2, Plus } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  teamId: number;
  role: string;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
}

interface Playing11 {
  matchId: string;
  team1Players: string[];
  team2Players: string[];
  team1Captain: string;
  team1ViceCaptain: string;
  team2Captain: string;
  team2ViceCaptain: string;
}

interface Match {
  id: string;
  team1: { id: number; name: string };
  team2: { id: number; name: string };
  venue: string;
  date: string;
  time: string;
  status: string;
}

export default function WPLAdminDashboard() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [playing11, setPlaying11] = useState<Playing11 | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [activeTab, setActiveTab] = useState('matches');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Playing 11 selection
  const [team1Selected, setTeam1Selected] = useState<string[]>([]);
  const [team2Selected, setTeam2Selected] = useState<string[]>([]);
  const [team1Captain, setTeam1Captain] = useState('');
  const [team1ViceCaptain, setTeam1ViceCaptain] = useState('');
  const [team2Captain, setTeam2Captain] = useState('');
  const [team2ViceCaptain, setTeam2ViceCaptain] = useState('');
  
  // Edit modes
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  useEffect(() => {
    if (activeTab === 'matches') fetchMatches();
    if (activeTab === 'players') fetchPlayers();
  }, [activeTab]);

  // Fetch WPL matches from KV
  const fetchMatches = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/matches?league=wpl');
      const data = await res.json();
      setMatches(Array.isArray(data) ? data : []);
      setMessage('✓ Matches loaded');
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      console.error('Error fetching matches:', err);
      setMessage('✗ Error loading matches');
    }
    setLoading(false);
  };

  // Fetch WPL players
  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/players?league=wpl');
      const data = await res.json();
      setPlayers(Array.isArray(data) ? data : []);
      setMessage('✓ Players loaded');
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      console.error('Error fetching players:', err);
      setMessage('✗ Error loading players');
    }
    setLoading(false);
  };

  // Fetch playing 11 for selected match
  const fetchPlaying11 = async (match: Match) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/playing11?matchId=${match.id}`);
      const data = await res.json();
      setPlaying11(data || null);

      if (data) {
        setTeam1Selected(data.team1Players || []);
        setTeam2Selected(data.team2Players || []);
        setTeam1Captain(data.team1Captain || '');
        setTeam1ViceCaptain(data.team1ViceCaptain || '');
        setTeam2Captain(data.team2Captain || '');
        setTeam2ViceCaptain(data.team2ViceCaptain || '');
      } else {
        setTeam1Selected([]);
        setTeam2Selected([]);
        setTeam1Captain('');
        setTeam1ViceCaptain('');
        setTeam2Captain('');
        setTeam2ViceCaptain('');
      }

      setSelectedMatch(match);
      setActiveTab('playing11');
      setMessage('✓ Playing 11 loaded');
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      console.error('Error fetching playing 11:', err);
      setMessage('✗ Error loading playing 11');
    }
    setLoading(false);
  };

  // Save playing 11
  const savePlaying11 = async () => {
    if (!selectedMatch) return;

    if (team1Selected.length !== 11 || team2Selected.length !== 11) {
      setMessage('✗ Each team must have exactly 11 players');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        matchId: selectedMatch.id,
        team1Players: team1Selected,
        team2Players: team2Selected,
        team1Captain,
        team1ViceCaptain,
        team2Captain,
        team2ViceCaptain,
      };

      const res = await fetch('/api/playing11', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMessage('✓ Playing 11 saved successfully');
        setTimeout(() => setMessage(''), 2000);
      } else {
        setMessage('✗ Error saving playing 11');
      }
    } catch (err) {
      console.error('Error saving playing 11:', err);
      setMessage('✗ Error saving playing 11');
    }
    setLoading(false);
  };

  // Toggle player selection
  const togglePlayerSelection = (playerId: string, team: 1 | 2) => {
    if (team === 1) {
      setTeam1Selected(prev =>
        prev.includes(playerId)
          ? prev.filter(id => id !== playerId)
          : prev.length < 11
          ? [...prev, playerId]
          : prev
      );
    } else {
      setTeam2Selected(prev =>
        prev.includes(playerId)
          ? prev.filter(id => id !== playerId)
          : prev.length < 11
          ? [...prev, playerId]
          : prev
      );
    }
  };

  const getTeamPlayers = (teamId: number) => {
    return players.filter(p => p.teamId === teamId);
  };

  const getPlayerName = (playerId: string) => {
    return players.find(p => p.id === playerId)?.name || playerId;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-8">
              <GradientText className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400">
                WPL Admin Dashboard
              </GradientText>
              <p className="text-gray-300 text-lg">
                Women's Premier League Administration Panel
              </p>
            </div>
          </AnimatedSection>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <AnimatedSection delay={0.1}>
              <motion.div
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-400/20"
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-600/20 rounded-lg">
                    <Users className="text-purple-400" size={24} />
                  </div>
                  <span className="text-xs text-purple-300 bg-purple-600/20 px-2 py-1 rounded-full">
                    +12%
                  </span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stats.totalStories}</div>
                <div className="text-gray-300 text-sm">Total Stories</div>
              </motion.div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <motion.div
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-400/20"
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-600/20 rounded-lg">
                    <Calendar className="text-yellow-400" size={24} />
                  </div>
                  <span className="text-xs text-yellow-300 bg-yellow-600/20 px-2 py-1 rounded-full">
                    {stats.pendingStories}
                  </span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stats.pendingStories}</div>
                <div className="text-gray-300 text-sm">Pending Review</div>
              </motion.div>
            </AnimatedSection>

            <AnimatedSection delay={0.3}>
              <motion.div
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-400/20"
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-600/20 rounded-lg">
                    <Trophy className="text-green-400" size={24} />
                  </div>
                  <span className="text-xs text-green-300 bg-green-600/20 px-2 py-1 rounded-full">
                    {stats.featuredStories}
                  </span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stats.featuredStories}</div>
                <div className="text-gray-300 text-sm">Featured Stories</div>
              </motion.div>
            </AnimatedSection>

            <AnimatedSection delay={0.4}>
              <motion.div
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-400/20"
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-600/20 rounded-lg">
                    <TrendingUp className="text-blue-400" size={24} />
                  </div>
                  <span className="text-xs text-blue-300 bg-blue-600/20 px-2 py-1 rounded-full">
                    +28%
                  </span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stats.activeUsers}</div>
                <div className="text-gray-300 text-sm">Active Users</div>
              </motion.div>
            </AnimatedSection>
          </div>

          {/* Engagement Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <AnimatedSection delay={0.5}>
              <motion.div
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-400/20"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Engagement Overview</h3>
                  <BarChart3 className="text-purple-400" size={20} />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Eye className="text-gray-400" size={16} />
                      <span className="text-gray-300">Total Views</span>
                    </div>
                    <span className="text-white font-semibold">{stats.totalViews.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Heart className="text-gray-400" size={16} />
                      <span className="text-gray-300">Total Likes</span>
                    </div>
                    <span className="text-white font-semibold">{stats.totalLikes.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="text-gray-400" size={16} />
                      <span className="text-gray-300">Total Comments</span>
                    </div>
                    <span className="text-white font-semibold">{stats.totalComments.toLocaleString()}</span>
                  </div>
                </div>
              </motion.div>
            </AnimatedSection>

            <AnimatedSection delay={0.6}>
              <motion.div
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-400/20"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Story Status</h3>
                  <Star className="text-purple-400" size={20} />
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">Approved</span>
                      <span className="text-white">{stats.approvedStories}</span>
                    </div>
                    <div className="w-full bg-purple-800/30 rounded-full h-2">
                      <div className="bg-green-400 h-2 rounded-full" style={{ width: '85%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">Pending</span>
                      <span className="text-white">{stats.pendingStories}</span>
                    </div>
                    <div className="w-full bg-purple-800/30 rounded-full h-2">
                      <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '15%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">Featured</span>
                      <span className="text-white">{stats.featuredStories}</span>
                    </div>
                    <div className="w-full bg-purple-800/30 rounded-full h-2">
                      <div className="bg-purple-400 h-2 rounded-full" style={{ width: '8%' }} />
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatedSection>

            <AnimatedSection delay={0.7}>
              <motion.div
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-400/20"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
                  <TrendingUp className="text-purple-400" size={20} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    className="p-3 bg-purple-600/20 rounded-lg text-purple-300 hover:bg-purple-600/30"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Review Stories
                  </motion.button>
                  <motion.button
                    className="p-3 bg-purple-600/20 rounded-lg text-purple-300 hover:bg-purple-600/30"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Update Venues
                  </motion.button>
                </div>
              </motion.div>
            </AnimatedSection>
          </div>

          {/* Recent Activity */}
          <AnimatedSection delay={0.8}>
            <motion.div
              className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-400/20"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
                <TrendingUp className="text-purple-400" size={20} />
              </div>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <motion.div
                    key={activity.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-purple-400/10"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium">{activity.title}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          activity.status === 'approved' ? 'bg-green-400/20 text-green-400' :
                          activity.status === 'pending' ? 'bg-yellow-400/20 text-yellow-400' :
                          'bg-purple-400/20 text-purple-400'
                        }`}>
                          {activity.status}
                        </span>
                      </div>
                      <div className="text-gray-300 text-sm">
                        by {activity.author} • {activity.time}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
}
