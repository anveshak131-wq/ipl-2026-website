'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';

interface LiveScoreData {
  matchId: string;
  team1: { name: string; runs: number; wickets: number; overs: number };
  team2: { name: string; runs: number; wickets: number; overs: number };
  currentBatter: { name: string; runs: number; balls: number };
  currentBowler: { name: string; runs: number; balls: number };
  commentary: string[];
  status: string;
  lastUpdated: string;
}

export default function AdminLiveScorePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [liveScore, setLiveScore] = useState<LiveScoreData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    team1Name: 'RCB',
    team1Runs: 0,
    team1Wickets: 0,
    team1Overs: 0,
    team2Name: 'CSK',
    team2Runs: 0,
    team2Wickets: 0,
    team2Overs: 0,
    batterName: '',
    batterRuns: 0,
    batterBalls: 0,
    bowlerName: '',
    bowlerRuns: 0,
    bowlerBalls: 0,
    commentary: '',
    status: 'Live',
  });

  // Check authentication
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/admin');
        return;
      }

      // For admin users, the token is stored in localStorage after login.
      // Trust that if the token exists, the user is authenticated.
      // (Admin tokens are base64-encoded payloads, not verified against KV.)
      setIsAuthenticated(true);
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  // Fetch current live score
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchLiveScore = async () => {
      try {
        const response = await fetch('/api/live-score?matchId=current');
        if (response.ok) {
          const liveScoreData = await response.json();
          setLiveScore(liveScoreData);
          setFormData({
            team1Name: liveScoreData.team1.name,
            team1Runs: liveScoreData.team1.runs,
            team1Wickets: liveScoreData.team1.wickets,
            team1Overs: liveScoreData.team1.overs,
            team2Name: liveScoreData.team2.name,
            team2Runs: liveScoreData.team2.runs,
            team2Wickets: liveScoreData.team2.wickets,
            team2Overs: liveScoreData.team2.overs,
            batterName: liveScoreData.currentBatter.name,
            batterRuns: liveScoreData.currentBatter.runs,
            batterBalls: liveScoreData.currentBatter.balls,
            bowlerName: liveScoreData.currentBowler.name,
            bowlerRuns: liveScoreData.currentBowler.runs,
            bowlerBalls: liveScoreData.currentBowler.balls,
            commentary: liveScoreData.commentary.length > 0 ? liveScoreData.commentary[0] : '',
            status: liveScoreData.status,
          });
        }
      } catch (error) {
        console.error('Error fetching live score:', error);
      }
    };

    fetchLiveScore();
  }, [isAuthenticated]);

  const handleSaveScore = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      const scoreUpdate = {
        team1: {
          name: formData.team1Name,
          runs: parseInt(formData.team1Runs.toString()),
          wickets: parseInt(formData.team1Wickets.toString()),
          overs: parseFloat(formData.team1Overs.toString()),
        },
        team2: {
          name: formData.team2Name,
          runs: parseInt(formData.team2Runs.toString()),
          wickets: parseInt(formData.team2Wickets.toString()),
          overs: parseFloat(formData.team2Overs.toString()),
        },
        currentBatter: {
          name: formData.batterName,
          runs: parseInt(formData.batterRuns.toString()),
          balls: parseInt(formData.batterBalls.toString()),
        },
        currentBowler: {
          name: formData.bowlerName,
          runs: parseInt(formData.bowlerRuns.toString()),
          balls: parseInt(formData.bowlerBalls.toString()),
        },
        commentary: formData.commentary
          ? [formData.commentary, ...(liveScore?.commentary || []).slice(0, 49)]
          : liveScore?.commentary || [],
        status: formData.status,
      };

      const response = await fetch('/api/live-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          matchId: 'current',
          scoreUpdate,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLiveScore(data.liveScore);
        setFormData({ ...formData, commentary: '' });
        alert('Score updated successfully!');
      } else {
        alert('Failed to update score');
      }
    } catch (error) {
      console.error('Error saving score:', error);
      alert('Error updating score');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-ipl-gold"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-900">
      <AdminSidebar />

      <main className="flex-grow">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold text-white mb-8">Live Score Management</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Score Update Form */}
            <div className="bg-slate-800/50 rounded-2xl border border-white/10 p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Update Score</h2>

              <form className="space-y-6">
                {/* Team 1 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-ipl-gold">Team 1</h3>
                  <input
                    type="text"
                    placeholder="Team Name"
                    value={formData.team1Name}
                    onChange={(e) => setFormData({ ...formData, team1Name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      type="number"
                      placeholder="Runs"
                      value={formData.team1Runs}
                      onChange={(e) => setFormData({ ...formData, team1Runs: parseInt(e.target.value) || 0 })}
                      className="px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                    />
                    <input
                      type="number"
                      placeholder="Wickets"
                      value={formData.team1Wickets}
                      onChange={(e) => setFormData({ ...formData, team1Wickets: parseInt(e.target.value) || 0 })}
                      className="px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                    />
                    <input
                      type="number"
                      placeholder="Overs"
                      step="0.1"
                      value={formData.team1Overs}
                      onChange={(e) => setFormData({ ...formData, team1Overs: parseFloat(e.target.value) || 0 })}
                      className="px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                    />
                  </div>
                </div>

                {/* Team 2 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-ipl-gold">Team 2</h3>
                  <input
                    type="text"
                    placeholder="Team Name"
                    value={formData.team2Name}
                    onChange={(e) => setFormData({ ...formData, team2Name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      type="number"
                      placeholder="Runs"
                      value={formData.team2Runs}
                      onChange={(e) => setFormData({ ...formData, team2Runs: parseInt(e.target.value) || 0 })}
                      className="px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                    />
                    <input
                      type="number"
                      placeholder="Wickets"
                      value={formData.team2Wickets}
                      onChange={(e) => setFormData({ ...formData, team2Wickets: parseInt(e.target.value) || 0 })}
                      className="px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                    />
                    <input
                      type="number"
                      placeholder="Overs"
                      step="0.1"
                      value={formData.team2Overs}
                      onChange={(e) => setFormData({ ...formData, team2Overs: parseFloat(e.target.value) || 0 })}
                      className="px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                    />
                  </div>
                </div>

                {/* Current Players */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-ipl-gold">Current Match</h3>
                  <input
                    type="text"
                    placeholder="Batter Name"
                    value={formData.batterName}
                    onChange={(e) => setFormData({ ...formData, batterName: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      placeholder="Batter Runs"
                      value={formData.batterRuns}
                      onChange={(e) => setFormData({ ...formData, batterRuns: parseInt(e.target.value) || 0 })}
                      className="px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                    />
                    <input
                      type="number"
                      placeholder="Batter Balls"
                      value={formData.batterBalls}
                      onChange={(e) => setFormData({ ...formData, batterBalls: parseInt(e.target.value) || 0 })}
                      className="px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="Bowler Name"
                    value={formData.bowlerName}
                    onChange={(e) => setFormData({ ...formData, bowlerName: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      placeholder="Bowler Runs"
                      value={formData.bowlerRuns}
                      onChange={(e) => setFormData({ ...formData, bowlerRuns: parseInt(e.target.value) || 0 })}
                      className="px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                    />
                    <input
                      type="number"
                      placeholder="Bowler Balls"
                      value={formData.bowlerBalls}
                      onChange={(e) => setFormData({ ...formData, bowlerBalls: parseInt(e.target.value) || 0 })}
                      className="px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                    />
                  </div>
                </div>

                {/* Commentary */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-ipl-gold">Add Commentary</h3>
                  <textarea
                    placeholder="Add ball-by-ball commentary..."
                    value={formData.commentary}
                    onChange={(e) => setFormData({ ...formData, commentary: e.target.value })}
                    maxLength={500}
                    rows={4}
                    className="w-full px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold resize-none"
                  />
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white focus:outline-none focus:border-ipl-gold"
                  >
                    <option>Live</option>
                    <option>Scheduled</option>
                    <option>Completed</option>
                    <option>Cancelled</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleSaveScore}
                  disabled={isSaving}
                  className="w-full px-6 py-3 bg-ipl-gold hover:bg-ipl-gold/90 text-black font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Update Live Score'}
                </button>
              </form>
            </div>

            {/* Live Preview */}
            <div className="bg-slate-800/50 rounded-2xl border border-white/10 p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Live Preview</h2>

              {liveScore && (
                <div className="space-y-6">
                  {/* Score Cards */}
                  <div className="space-y-3">
                    <div className="bg-gradient-to-br from-red-900/20 to-red-600/20 border border-red-500/30 rounded-lg p-4">
                      <p className="text-gray-400 text-sm">Team 1</p>
                      <h3 className="text-2xl font-bold text-white">{liveScore.team1.name}</h3>
                      <p className="text-3xl font-bold text-ipl-gold mt-2">
                        {liveScore.team1.runs}/{liveScore.team1.wickets} ({liveScore.team1.overs})
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-yellow-900/20 to-yellow-600/20 border border-yellow-500/30 rounded-lg p-4">
                      <p className="text-gray-400 text-sm">Team 2</p>
                      <h3 className="text-2xl font-bold text-white">{liveScore.team2.name}</h3>
                      <p className="text-3xl font-bold text-ipl-gold mt-2">
                        {liveScore.team2.runs}/{liveScore.team2.wickets} ({liveScore.team2.overs})
                      </p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="bg-slate-700/30 rounded-lg p-4 border border-white/5">
                    <p className="text-gray-400 text-sm">Match Status</p>
                    <p className="text-xl font-bold text-ipl-gold mt-1">{liveScore.status}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Last updated: {new Date(liveScore.lastUpdated).toLocaleString()}
                    </p>
                  </div>

                  {/* Recent Commentary */}
                  <div className="bg-slate-700/30 rounded-lg p-4 border border-white/5">
                    <p className="text-gray-400 text-sm mb-2">Recent Commentary</p>
                    <div className="max-h-32 overflow-y-auto space-y-2">
                      {liveScore.commentary && liveScore.commentary.length > 0 ? (
                        liveScore.commentary.slice(0, 5).map((comment, idx) => (
                          <p key={idx} className="text-sm text-gray-300 border-l-2 border-ipl-gold pl-2">
                            {comment}
                          </p>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No commentary yet</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
