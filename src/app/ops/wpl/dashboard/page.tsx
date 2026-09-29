'use client';

import { useState, useEffect } from 'react';
import AnimatedSection from '@/components/ui/AnimatedSection';
import GradientText from '@/components/ui/GradientText';
import WPLAdminSidebarNew from '@/components/admin/WPLAdminSidebarNew';

interface Player {
  id: string;
  name: string;
  teamId: number;
  role: string;
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
  const [activeTab, setActiveTab] = useState('matches');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (activeTab === 'matches') fetchMatches();
    if (activeTab === 'players') fetchPlayers();
  }, [activeTab]);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/matches?league=wpl');
      const data = await res.json();
      setMatches(data || []);
    } catch (err) {
      console.error('Error fetching matches:', err);
      setMessage('✗ Error fetching WPL matches');
    }
    setLoading(false);
  };

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/players?league=wpl');
      const data = await res.json();
      setPlayers(data || []);
    } catch (err) {
      console.error('Error fetching players:', err);
      setMessage('✗ Error fetching WPL players');
    }
    setLoading(false);
  };

  const messageClass = message.includes('✓') 
    ? 'bg-green-600/20 text-green-400 border border-green-400/30'
    : 'bg-red-600/20 text-red-400 border border-red-400/30';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <WPLAdminSidebarNew />
      <div className="lg:ml-64 p-4 md:p-8">
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

        {message && (
          <div className={`mb-6 p-4 rounded-lg text-center ${messageClass}`}>
            {message}
          </div>
        )}

        <AnimatedSection delay={0.1}>
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            <button
              onClick={() => setActiveTab('matches')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'matches'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              Matches
            </button>
            <button
              onClick={() => setActiveTab('players')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'players'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              Players
            </button>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.2}>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-400/20">
            {activeTab === 'matches' && (
              <div>
                <h2 className="text-2xl font-bold mb-6 text-white">WPL Matches</h2>
                {loading ? (
                  <div className="text-center py-8 text-gray-400">Loading matches...</div>
                ) : matches.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">No WPL matches found</div>
                ) : (
                  <div className="space-y-4">
                    {matches.map((match) => (
                      <div key={match.id} className="bg-white/5 rounded-lg p-4 border border-purple-400/10">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-white">
                              {match.team1.name} vs {match.team2.name}
                            </div>
                            <div className="text-gray-400 text-sm">
                              {match.venue} • {match.date} • {match.time}
                            </div>
                          </div>
                          <div className="text-gray-400 text-sm">
                            {match.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'players' && (
              <div>
                <h2 className="text-2xl font-bold mb-6 text-white">WPL Players</h2>
                {loading ? (
                  <div className="text-center py-8 text-gray-400">Loading players...</div>
                ) : players.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">No WPL players found</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {players.map((player) => (
                      <div key={player.id} className="bg-white/5 rounded-lg p-4 border border-purple-400/10">
                        <div className="font-semibold text-white">{player.name}</div>
                        <div className="text-gray-400 text-sm">{player.role}</div>
                        <div className="text-purple-400 text-sm">Team {player.teamId}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </AnimatedSection>
      </div>
      </div>
    </div>
  );
}
