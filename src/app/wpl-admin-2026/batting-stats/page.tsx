'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import WPLAdminSidebarNew from '@/components/admin/WPLAdminSidebarNew';
import { Search, Edit2, X, TrendingUp, Award, Target, Zap, ChevronDown, ChevronUp, SortAsc, SortDesc, User, Shirt, BarChart3, Hash, Activity, LayoutGrid, Table2, Save } from 'lucide-react';
import { api } from '@/lib/data';
import { Player, Match } from '@/types';

const WPLBattingStatsPage = () => {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [liveScores, setLiveScores] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [sortField, setSortField] = useState<string>('runs');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'teams'>('table');
  const [savingStats, setSavingStats] = useState(false);
  const [statsFromScorecard, setStatsFromScorecard] = useState(false);

  const [editForm, setEditForm] = useState({
    matches: '',
    runs: '',
    highest: '',
    fours: '',
    sixes: '',
    fifties: '',
    hundreds: '',
    average: '',
    strikeRate: ''
  });

  const [loadedFromStatsAPI, setLoadedFromStatsAPI] = useState(false);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
        if (!token) {
          router.push('/wpl-admin-2026');
          return;
        }

        const response = await fetch(`/api/auth?action=verify&token=${token}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          router.push('/wpl-admin-2026');
          return;
        }

        const role = data.user?.role;
        setUserRole(role);

        if (role !== 'admin' && role !== 'super_admin' && role !== 'players_admin') {
          alert('Access denied. Admin privileges required.');
          router.push('/wpl-admin-2026');
          return;
        }

        setIsCheckingAuth(false);
      } catch (error) {
        console.error('Auth error:', error);
        router.push('/wpl-admin-2026');
      }
    };

    checkAuth();
  }, [router]);

  // Load players, matches, and live scores
  useEffect(() => {
    const loadData = async () => {
      if (isCheckingAuth) return;

      try {
        setLoading(true);

        // Try to load stats from statistics API first
        try {
          const statsResponse = await fetch('/api/stats?league=wpl&type=batting');
          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            console.log('Stats API response:', statsData);
            if (statsData.battingStats && statsData.battingStats.length > 0) {
              console.log('Loaded', statsData.battingStats.length, 'batting stats from statistics API');
              // Convert stats to player format
              setPlayers(statsData.battingStats.map((stat: any) => ({
                id: stat.playerId,
                name: stat.playerName,
                teamId: '', // Not critical for display
                role: 'Batsman' as const,
                age: 0,
                nationality: '',
                jerseyNumber: 0,
                isCaptain: false,
                bowlingStyle: '',
                battingStyle: '',
                league: 'wpl' as const,
                stats: {
                  matches: stat.matches,
                  runs: stat.runs,
                  highest: stat.highestScore,
                  fours: stat.fours,
                  sixes: stat.sixes,
                  fifties: stat.fifties,
                  hundreds: stat.hundreds,
                  average: stat.average,
                  strikeRate: stat.strikeRate,
                  wickets: 0,
                  economy: 0,
                  bowlingAverage: 0,
                  bestBowling: '0/0',
                }
              })));
              setLoadedFromStatsAPI(true);
              setLoading(false);
              return;
            } else {
              console.log('No batting stats found in API response');
            }
          }
        } catch (err) {
          console.error('Statistics API error:', err);
        }

        // Fallback to old method
        // Load WPL players and matches
        const [playersData, matchesData] = await Promise.all([
          api.getPlayers(undefined, 'wpl').catch(() => []),
          api.getMatches('wpl').catch(() => [])
        ]);

        setPlayers(playersData || []);
        setMatches(matchesData || []);

        // Load live scores for all live/completed matches
        const scores: Record<string, any> = {};
        const completedMatches = (matchesData || []).filter(m => m.status === 'live' || m.status === 'completed');

        for (const match of completedMatches) {
          try {
            const scoreRes = await fetch(`/api/live-score?matchId=${encodeURIComponent(match.id)}`);
            if (scoreRes.ok) {
              scores[match.id] = await scoreRes.json();
            }
          } catch (err) {
            console.error('Error loading live score for match', match.id, err);
          }
        }

        setLiveScores(scores);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isCheckingAuth]);

  // Calculate player stats from live scores
  const playerStatsMap = useMemo(() => {
    // Skip if loaded from scorecard stats API
    if (loadedFromStatsAPI) {
      return {};
    }

    const statsMap: Record<string, any> = {};

    matches.forEach((match) => {
      const liveScore = liveScores[match.id];
      if (!liveScore) return;

      // Team 1 batting stats
      if (liveScore.commentary && Array.isArray(liveScore.commentary)) {
        liveScore.commentary.forEach((entry: any) => {
          if (entry.batter && entry.battingTeam === 'team1') {
            if (!statsMap[entry.batter]) {
              statsMap[entry.batter] = {
                matches: 0,
                runs: 0,
                balls: 0,
                highest: 0,
                fours: 0,
                sixes: 0,
                fifties: 0,
                hundreds: 0,
                dismissals: 0
              };
            }

            if (!statsMap[entry.batter].matchIds) statsMap[entry.batter].matchIds = new Set();
            statsMap[entry.batter].matchIds.add(match.id);

            if (entry.runs !== undefined) {
              statsMap[entry.batter].runs += entry.runs;
              statsMap[entry.batter].balls += 1;
            }

            if (entry.sixes) statsMap[entry.batter].sixes += 1;
            if (entry.fours) statsMap[entry.batter].fours += 1;

            if (entry.isWicket) {
              statsMap[entry.batter].dismissals += 1;
            }
          }

          // Team 2 batting stats
          if (entry.batter && entry.battingTeam === 'team2') {
            if (!statsMap[entry.batter]) {
              statsMap[entry.batter] = {
                matches: 0,
                runs: 0,
                balls: 0,
                highest: 0,
                fours: 0,
                sixes: 0,
                fifties: 0,
                hundreds: 0,
                dismissals: 0
              };
            }

            if (!statsMap[entry.batter].matchIds) statsMap[entry.batter].matchIds = new Set();
            statsMap[entry.batter].matchIds.add(match.id);

            if (entry.runs !== undefined) {
              statsMap[entry.batter].runs += entry.runs;
              statsMap[entry.batter].balls += 1;
            }

            if (entry.sixes) statsMap[entry.batter].sixes += 1;
            if (entry.fours) statsMap[entry.batter].fours += 1;

            if (entry.isWicket) {
              statsMap[entry.batter].dismissals += 1;
            }
          }
        });
      }
    });

    // Calculate derived stats
    Object.keys(statsMap).forEach((playerId) => {
      const stats = statsMap[playerId];
      stats.matches = stats.matchIds?.size || 0;

      // Calculate average (runs / dismissals, with a minimum of 1 dismissal)
      const validDismissals = Math.max(stats.dismissals, 1);
      stats.average = (stats.runs / validDismissals).toFixed(2);

      // Calculate strike rate
      stats.strikeRate = stats.balls > 0 ? ((stats.runs * 100) / stats.balls).toFixed(2) : '0.00';

      // Update highest, fifties, hundreds based on runs
      if (stats.runs >= 100) {
        stats.hundreds = 1;
      } else if (stats.runs >= 50) {
        stats.fifties = 1;
      }

      delete stats.matchIds;
    });

    return statsMap;
  }, [matches, liveScores]);

  // Filter and sort players
  const filteredPlayers = useMemo(() => {
    // If loaded from stats API, use player.stats directly
    if (loadedFromStatsAPI) {
      let filtered = players.filter((p) => {
        const matchesSearch =
          p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTeam = selectedTeam === 'all' || p.teamId === selectedTeam;
        return matchesSearch && matchesTeam;
      });

      // Sort by stats
      filtered.sort((a, b) => {
        let aVal = (a.stats as any)[sortField] || 0;
        let bVal = (b.stats as any)[sortField] || 0;

        if (typeof aVal === 'string') aVal = parseFloat(aVal) || 0;
        if (typeof bVal === 'string') bVal = parseFloat(bVal) || 0;

        return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
      });

      return filtered;
    }

    // Original logic for live scores
    let filtered = players.filter((p) => {
      const hasStats = playerStatsMap[p.id];
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.jerseyNumber.toString().includes(searchQuery);
      const matchesTeam = selectedTeam === 'all' || p.teamId === selectedTeam;

      return hasStats && matchesSearch && matchesTeam;
    });

    // Sort
    filtered.sort((a, b) => {
      const aStats = playerStatsMap[a.id] || {};
      const bStats = playerStatsMap[b.id] || {};
      let aVal = aStats[sortField] || 0;
      let bVal = bStats[sortField] || 0;

      if (typeof aVal === 'string') aVal = parseFloat(aVal) || 0;
      if (typeof bVal === 'string') bVal = parseFloat(bVal) || 0;

      return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
    });

    return filtered;
  }, [players, playerStatsMap, searchQuery, selectedTeam, sortField, sortDirection, loadedFromStatsAPI]);

  const handleEditPlayer = (player: Player) => {
    const stats = playerStatsMap[player.id] || {};
    setEditingPlayer(player.id);
    setEditForm({
      matches: stats.matches?.toString() || '',
      runs: stats.runs?.toString() || '',
      highest: stats.highest?.toString() || '',
      fours: stats.fours?.toString() || '',
      sixes: stats.sixes?.toString() || '',
      fifties: stats.fifties?.toString() || '',
      hundreds: stats.hundreds?.toString() || '',
      average: stats.average?.toString() || '',
      strikeRate: stats.strikeRate?.toString() || ''
    });
    setShowEditModal(true);
  };

  const handleSavePlayer = async () => {
    if (!editingPlayer) return;

    try {
      setSavingStats(true);

      const player = players.find((p) => p.id === editingPlayer);
      if (!player) return;

      // Parse and validate form values
      const statsUpdate = {
        matches: parseInt(editForm.matches) || 0,
        runs: parseInt(editForm.runs) || 0,
        highest: parseInt(editForm.highest) || 0,
        fours: parseInt(editForm.fours) || 0,
        sixes: parseInt(editForm.sixes) || 0,
        fifties: parseInt(editForm.fifties) || 0,
        hundreds: parseInt(editForm.hundreds) || 0,
        average: parseFloat(editForm.average) || 0,
        strikeRate: parseFloat(editForm.strikeRate) || 0,
        wickets: player.stats?.wickets || 0,
        bowlingAverage: player.stats?.bowlingAverage || 0,
        economy: player.stats?.economy || 0,
        bestBowling: player.stats?.bestBowling || ''
      };

      const updatedPlayer: Player = {
        ...player,
        stats: statsUpdate as any
      };

      const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
      const response = await fetch('/api/players', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updatedPlayer)
      });

      if (!response.ok) {
        throw new Error('Failed to save player stats');
      }

      // Update local players list
      setPlayers((prev) =>
        prev.map((p) => (p.id === editingPlayer ? updatedPlayer : p))
      );

      setShowEditModal(false);
      setEditingPlayer(null);
      alert('Batting stats updated successfully!');
    } catch (error) {
      console.error('Error saving player:', error);
      alert('Error saving player stats. Please try again.');
    } finally {
      setSavingStats(false);
    }
  };

  if (isCheckingAuth || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 to-purple-800">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  const teams = [...new Set(players.map((p) => p.teamId))];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900">
      <WPLAdminSidebarNew />

      <main className="flex-1 p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <BarChart3 className="w-10 h-10 text-purple-300" />
            WPL Batting Statistics
          </h1>
          <p className="text-purple-200">2026 Season - Auto-calculated from live scores</p>
        </div>

        {/* Controls */}
        <div className="bg-purple-800/30 backdrop-blur-md rounded-lg p-4 mb-6 border border-purple-600/30">
          <div className="flex gap-4 flex-wrap items-center">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-purple-300" />
                <input
                  type="text"
                  placeholder="Search player name or jersey number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-purple-700/50 border border-purple-500/50 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>

            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="px-4 py-2 bg-purple-700/50 border border-purple-500/50 rounded-lg text-white focus:outline-none focus:border-purple-400"
            >
              <option value="all">All Teams</option>
              {teams.map((teamId) => (
                <option key={teamId} value={teamId}>
                  {teamId}
                </option>
              ))}
            </select>

            <button
              onClick={() => setViewMode(viewMode === 'table' ? 'teams' : 'table')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
            >
              {viewMode === 'table' ? <LayoutGrid className="w-4 h-4" /> : <Table2 className="w-4 h-4" />}
              {viewMode === 'table' ? 'Teams View' : 'Table View'}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-purple-800/30 backdrop-blur-md rounded-lg border border-purple-600/30 overflow-hidden">
          <table className="w-full">
            <thead className="bg-purple-900/50 border-b border-purple-600/30">
              <tr>
                <th className="px-4 py-3 text-left text-purple-200 font-semibold">Player</th>
                <th className="px-4 py-3 text-center text-purple-200 font-semibold cursor-pointer" onClick={() => setSortField('matches')}>
                  Matches {sortField === 'matches' && (sortDirection === 'desc' ? <SortDesc className="inline w-4 h-4" /> : <SortAsc className="inline w-4 h-4" />)}
                </th>
                <th className="px-4 py-3 text-center text-purple-200 font-semibold cursor-pointer" onClick={() => setSortField('runs')}>
                  Runs {sortField === 'runs' && (sortDirection === 'desc' ? <SortDesc className="inline w-4 h-4" /> : <SortAsc className="inline w-4 h-4" />)}
                </th>
                <th className="px-4 py-3 text-center text-purple-200 font-semibold">Average</th>
                <th className="px-4 py-3 text-center text-purple-200 font-semibold">SR</th>
                <th className="px-4 py-3 text-center text-purple-200 font-semibold">4s</th>
                <th className="px-4 py-3 text-center text-purple-200 font-semibold">6s</th>
                <th className="px-4 py-3 text-center text-purple-200 font-semibold">50s</th>
                <th className="px-4 py-3 text-center text-purple-200 font-semibold">100s</th>
                <th className="px-4 py-3 text-center text-purple-200 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-600/20">
              {filteredPlayers.map((player) => {
                const stats = loadedFromStatsAPI ? player.stats : (playerStatsMap[player.id] || {});
                return (
                  <tr key={player.id} className="hover:bg-purple-700/20 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">
                      <div className="flex items-center gap-2">
                        <Shirt className="w-4 h-4 text-purple-300" />
                        {player.name} {player.jerseyNumber > 0 && <span className="text-purple-300">#{player.jerseyNumber}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-purple-100">{stats.matches || 0}</td>
                    <td className="px-4 py-3 text-center text-purple-100 font-semibold">{stats.runs || 0}</td>
                    <td className="px-4 py-3 text-center text-purple-100">{stats.average || '0.00'}</td>
                    <td className="px-4 py-3 text-center text-purple-100">{stats.strikeRate || '0.00'}</td>
                    <td className="px-4 py-3 text-center text-purple-100">{stats.fours || 0}</td>
                    <td className="px-4 py-3 text-center text-purple-100">{stats.sixes || 0}</td>
                    <td className="px-4 py-3 text-center text-purple-100">{stats.fifties || 0}</td>
                    <td className="px-4 py-3 text-center text-purple-100">{stats.hundreds || 0}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleEditPlayer(player)}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-purple-600 hover:bg-purple-500 rounded text-white text-sm transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-purple-900 rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto border border-purple-600">
              <div className="sticky top-0 flex items-center justify-between p-4 bg-purple-950 border-b border-purple-600">
                <h2 className="text-xl font-bold text-white">Edit Batting Stats</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingPlayer(null);
                  }}
                  className="text-purple-300 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-purple-200 text-sm font-medium mb-1">Matches</label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.matches}
                      onChange={(e) => setEditForm({ ...editForm, matches: e.target.value })}
                      className="w-full px-3 py-2 bg-purple-700/50 border border-purple-500/50 rounded text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-purple-200 text-sm font-medium mb-1">Runs</label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.runs}
                      onChange={(e) => setEditForm({ ...editForm, runs: e.target.value })}
                      className="w-full px-3 py-2 bg-purple-700/50 border border-purple-500/50 rounded text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-purple-200 text-sm font-medium mb-1">Highest</label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.highest}
                      onChange={(e) => setEditForm({ ...editForm, highest: e.target.value })}
                      className="w-full px-3 py-2 bg-purple-700/50 border border-purple-500/50 rounded text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-purple-200 text-sm font-medium mb-1">Fours</label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.fours}
                      onChange={(e) => setEditForm({ ...editForm, fours: e.target.value })}
                      className="w-full px-3 py-2 bg-purple-700/50 border border-purple-500/50 rounded text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-purple-200 text-sm font-medium mb-1">Sixes</label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.sixes}
                      onChange={(e) => setEditForm({ ...editForm, sixes: e.target.value })}
                      className="w-full px-3 py-2 bg-purple-700/50 border border-purple-500/50 rounded text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-purple-200 text-sm font-medium mb-1">Strike Rate</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editForm.strikeRate}
                      onChange={(e) => setEditForm({ ...editForm, strikeRate: e.target.value })}
                      className="w-full px-3 py-2 bg-purple-700/50 border border-purple-500/50 rounded text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-purple-200 text-sm font-medium mb-1">Average</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editForm.average}
                      onChange={(e) => setEditForm({ ...editForm, average: e.target.value })}
                      className="w-full px-3 py-2 bg-purple-700/50 border border-purple-500/50 rounded text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-purple-200 text-sm font-medium mb-1">Fifties</label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.fifties}
                      onChange={(e) => setEditForm({ ...editForm, fifties: e.target.value })}
                      className="w-full px-3 py-2 bg-purple-700/50 border border-purple-500/50 rounded text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-purple-200 text-sm font-medium mb-1">Hundreds</label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.hundreds}
                      onChange={(e) => setEditForm({ ...editForm, hundreds: e.target.value })}
                      className="w-full px-3 py-2 bg-purple-700/50 border border-purple-500/50 rounded text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 flex gap-2 p-4 bg-purple-950 border-t border-purple-600">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingPlayer(null);
                  }}
                  className="flex-1 px-4 py-2 bg-purple-700 hover:bg-purple-600 rounded-lg text-white font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePlayer}
                  disabled={savingStats}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {savingStats ? 'Saving...' : 'Save Stats'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default WPLBattingStatsPage;
