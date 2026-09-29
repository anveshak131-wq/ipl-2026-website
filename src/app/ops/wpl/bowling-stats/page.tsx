'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import WPLAdminSidebarNew from '@/components/admin/WPLAdminSidebarNew';
import { Search, Edit2, X, TrendingUp, Award, Target, Zap, ChevronDown, ChevronUp, SortAsc, SortDesc, User, Shirt, BarChart3, Hash, Activity, LayoutGrid, Table2, Save } from 'lucide-react';
import { api } from '@/lib/data';
import { Player, Match } from '@/types';

const WPLBowlingStatsPage = () => {
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
  const [sortField, setSortField] = useState<string>('wickets');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'teams'>('table');
  const [savingStats, setSavingStats] = useState(false);
  const [loadedFromStatsAPI, setLoadedFromStatsAPI] = useState(false);

  const [editForm, setEditForm] = useState({
    matches: '',
    wickets: '',
    runs: '',
    overs: '',
    economy: '',
    bowlingAverage: '',
    bestBowling: ''
  });

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
        if (!token) {
          router.push('/ops/wpl');
          return;
        }

        const response = await fetch(`/api/auth?action=verify&token=${token}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          router.push('/ops/wpl');
          return;
        }

        const role = data.user?.role;
        setUserRole(role);

        if (role !== 'admin' && role !== 'super_admin' && role !== 'players_admin') {
          alert('Access denied. Admin privileges required.');
          router.push('/ops/wpl');
          return;
        }

        setIsCheckingAuth(false);
      } catch (error) {
        console.error('Auth error:', error);
        router.push('/ops/wpl');
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
          const statsResponse = await fetch('/api/stats?league=wpl&type=bowling');
          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            if (statsData.bowlingStats && statsData.bowlingStats.length > 0) {
              console.log('Loaded stats from statistics API');
              setLoadedFromStatsAPI(true);
              // Convert stats to player format
              setPlayers(statsData.bowlingStats.map((stat: any) => ({
                id: stat.playerId,
                name: stat.playerName,
                stats: {
                  matches: stat.matches,
                  runs: 0,
                  wickets: stat.wickets,
                  economy: stat.economy,
                  average: stat.average,
                  strikeRate: stat.strikeRate,
                  bestBowling: stat.bestBowling,
                  highest: 0,
                  fours: 0,
                  sixes: 0,
                  fifties: 0,
                  hundreds: 0,
                }
              })));
              setLoading(false);
              return;
            }
          }
        } catch (err) {
          console.log('Statistics API not available, falling back to live scores');
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

      // Parse overs and balls
      const oversNumber = liveScore.team1?.overs || 0;
      const totalBalls = Math.floor(oversNumber) * 6 + Math.round((oversNumber % 1) * 10);

      // Bowling stats from commentary
      if (liveScore.commentary && Array.isArray(liveScore.commentary)) {
        liveScore.commentary.forEach((entry: any) => {
          if (entry.bowler) {
            if (!statsMap[entry.bowler]) {
              statsMap[entry.bowler] = {
                matches: 0,
                wickets: 0,
                runs: 0,
                balls: 0,
                overs: 0,
                matchIds: new Set()
              };
            }

            statsMap[entry.bowler].matchIds.add(match.id);

            if (entry.runsInBall !== undefined) {
              statsMap[entry.bowler].runs += entry.runsInBall;
              statsMap[entry.bowler].balls += 1;
            }

            if (entry.isWicket) {
              statsMap[entry.bowler].wickets += 1;
            }
          }
        });
      }
    });

    // Calculate derived stats
    Object.keys(statsMap).forEach((playerId) => {
      const stats = statsMap[playerId];
      stats.matches = stats.matchIds.size;

      // Calculate overs (balls / 6)
      stats.overs = (stats.balls / 6).toFixed(1);

      // Calculate economy (runs per over)
      const oversFloat = stats.balls / 6;
      stats.economy = oversFloat > 0 ? (stats.runs / oversFloat).toFixed(2) : '0.00';

      // Calculate bowling average (runs per wicket)
      const validWickets = Math.max(stats.wickets, 1);
      stats.bowlingAverage = (stats.runs / validWickets).toFixed(2);

      // Best bowling (format: wickets/runs - simplified from current match)
      stats.bestBowling = stats.wickets > 0 ? `${stats.wickets}/${stats.runs}` : '0/0';

      delete stats.matchIds;
    });

    return statsMap;
  }, [matches, liveScores]);

  // Filter and sort players
  const filteredPlayers = useMemo(() => {
    let filtered = players.filter((p) => {
      // If loaded from stats API, use player.stats directly
      const hasStats = loadedFromStatsAPI ? (p.stats && p.stats.wickets > 0) : playerStatsMap[p.id];
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.jerseyNumber.toString().includes(searchQuery);
      const matchesTeam = selectedTeam === 'all' || p.teamId === selectedTeam;

      return hasStats && matchesSearch && matchesTeam;
    });

    // Sort
    filtered.sort((a, b) => {
      const aStats = loadedFromStatsAPI ? (a.stats || {}) : (playerStatsMap[a.id] || {});
      const bStats = loadedFromStatsAPI ? (b.stats || {}) : (playerStatsMap[b.id] || {});
      let aVal = aStats[sortField] || 0;
      let bVal = bStats[sortField] || 0;

      if (typeof aVal === 'string') aVal = parseFloat(aVal) || 0;
      if (typeof bVal === 'string') bVal = parseFloat(bVal) || 0;

      return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
    });

    return filtered;
  }, [players, playerStatsMap, searchQuery, selectedTeam, sortField, sortDirection, loadedFromStatsAPI]);

  const handleEditPlayer = (player: Player) => {
    const stats = loadedFromStatsAPI ? (player.stats || {}) : (playerStatsMap[player.id] || {});
    setEditingPlayer(player.id);
    setEditForm({
      matches: stats.matches?.toString() || '',
      wickets: stats.wickets?.toString() || '',
      runs: stats.runs?.toString() || '',
      overs: stats.overs?.toString() || '',
      economy: stats.economy?.toString() || '',
      bowlingAverage: stats.bowlingAverage?.toString() || '',
      bestBowling: stats.bestBowling?.toString() || ''
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
        wickets: parseInt(editForm.wickets) || 0,
        economy: parseFloat(editForm.economy) || 0,
        bowlingAverage: parseFloat(editForm.bowlingAverage) || 0,
        bestBowling: editForm.bestBowling || '0/0',
        strikeRate: player.stats?.strikeRate || 0,
        average: player.stats?.average || 0,
        fours: player.stats?.fours || 0,
        sixes: player.stats?.sixes || 0,
        fifties: player.stats?.fifties || 0,
        hundreds: player.stats?.hundreds || 0,
        highest: player.stats?.highest || 0
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
      alert('Bowling stats updated successfully!');
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
            WPL Bowling Statistics
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
                <th className="px-4 py-3 text-center text-purple-200 font-semibold cursor-pointer" onClick={() => setSortField('wickets')}>
                  Wickets {sortField === 'wickets' && (sortDirection === 'desc' ? <SortDesc className="inline w-4 h-4" /> : <SortAsc className="inline w-4 h-4" />)}
                </th>
                <th className="px-4 py-3 text-center text-purple-200 font-semibold">Runs</th>
                <th className="px-4 py-3 text-center text-purple-200 font-semibold">Overs</th>
                <th className="px-4 py-3 text-center text-purple-200 font-semibold">Economy</th>
                <th className="px-4 py-3 text-center text-purple-200 font-semibold">Avg</th>
                <th className="px-4 py-3 text-center text-purple-200 font-semibold">Best</th>
                <th className="px-4 py-3 text-center text-purple-200 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-600/20">
              {filteredPlayers.map((player) => {
                const stats = loadedFromStatsAPI ? (player.stats || {}) : (playerStatsMap[player.id] || {});
                return (
                  <tr key={player.id} className="hover:bg-purple-700/20 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">
                      <div className="flex items-center gap-2">
                        <Shirt className="w-4 h-4 text-purple-300" />
                        {player.name} <span className="text-purple-300">#{player.jerseyNumber}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-purple-100">{stats.matches || 0}</td>
                    <td className="px-4 py-3 text-center text-purple-100 font-semibold">{stats.wickets || 0}</td>
                    <td className="px-4 py-3 text-center text-purple-100">{stats.runs || 0}</td>
                    <td className="px-4 py-3 text-center text-purple-100">{stats.overs || '0.0'}</td>
                    <td className="px-4 py-3 text-center text-purple-100">{stats.economy || '0.00'}</td>
                    <td className="px-4 py-3 text-center text-purple-100">{stats.bowlingAverage || '0.00'}</td>
                    <td className="px-4 py-3 text-center text-purple-100">{stats.bestBowling || '0/0'}</td>
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
                <h2 className="text-xl font-bold text-white">Edit Bowling Stats</h2>
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
                    <label className="block text-purple-200 text-sm font-medium mb-1">Wickets</label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.wickets}
                      onChange={(e) => setEditForm({ ...editForm, wickets: e.target.value })}
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
                    <label className="block text-purple-200 text-sm font-medium mb-1">Overs</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={editForm.overs}
                      onChange={(e) => setEditForm({ ...editForm, overs: e.target.value })}
                      className="w-full px-3 py-2 bg-purple-700/50 border border-purple-500/50 rounded text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-purple-200 text-sm font-medium mb-1">Economy</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editForm.economy}
                      onChange={(e) => setEditForm({ ...editForm, economy: e.target.value })}
                      className="w-full px-3 py-2 bg-purple-700/50 border border-purple-500/50 rounded text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-purple-200 text-sm font-medium mb-1">Bowling Avg</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editForm.bowlingAverage}
                      onChange={(e) => setEditForm({ ...editForm, bowlingAverage: e.target.value })}
                      className="w-full px-3 py-2 bg-purple-700/50 border border-purple-500/50 rounded text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-purple-200 text-sm font-medium mb-1">Best Bowling (e.g., 3/24)</label>
                    <input
                      type="text"
                      value={editForm.bestBowling}
                      onChange={(e) => setEditForm({ ...editForm, bestBowling: e.target.value })}
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

export default WPLBowlingStatsPage;
