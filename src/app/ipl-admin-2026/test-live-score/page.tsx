'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import BallEntryPanel from '@/components/admin/live-score/BallEntryPanel';
import AuroraBackground from '@/components/ui/AuroraBackground';
import { Match, Player, Team } from '@/types';
import { api } from '@/lib/data';
import { LoadingSpinner } from '@/components/admin/animations';
import { CheckCircle2, AlertCircle, Users, Save, X, TestTube, RefreshCw } from 'lucide-react';
import { useLeague } from '@/contexts/LeagueContext';
import { WPLColors } from '@/lib/wplColors';

export default function TestLiveScorePage() {
  const router = useRouter();
  const { currentLeague } = useLeague();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'playing11' | 'livescore'>('playing11');
  const [team1Playing11, setTeam1Playing11] = useState<string[]>([]);
  const [team2Playing11, setTeam2Playing11] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check authentication
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/ipl-admin-2026');
        return;
      }
      setIsAuthenticated(true);
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  // Load matches, players, and teams
  const loadData = useCallback(async (showLoading = false) => {
    if (!isAuthenticated) return;

    if (showLoading) {
      setIsRefreshing(true);
    }

    try {
      const [matchesData, playersData, teamsData] = await Promise.all([
        api.getMatches(currentLeague),
        api.getPlayers(currentLeague),
        api.getTeams(currentLeague),
      ]);
      setMatches(matchesData);
      setPlayers(playersData);
      setTeams(teamsData);
      
      // Debug: Log players data from KV
      console.log('Players loaded from KV (test page):', {
        total: playersData.length,
        league: currentLeague,
        playersByLeague: playersData.filter(p => p.league === currentLeague).length,
        samplePlayer: playersData[0] ? {
          id: playersData[0].id,
          name: playersData[0].name,
          teamId: playersData[0].teamId,
          league: playersData[0].league,
          idType: typeof playersData[0].id,
          teamIdType: typeof playersData[0].teamId
        } : null
      });

      // Auto-select first upcoming or live match (only if no match is currently selected)
      setSelectedMatchId(prev => {
        if (prev && matchesData.find(m => m.id === prev)) {
          return prev; // Keep current selection if it still exists
        }
        if (matchesData.length > 0) {
          const preferred =
            matchesData.find((m) => m.status === 'live') ||
            matchesData.find((m) => m.status === 'upcoming') ||
            matchesData[0];
          return preferred?.id || '';
        }
        return prev;
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      if (showLoading) {
        setIsRefreshing(false);
      }
    }
  }, [isAuthenticated, currentLeague]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh players when page becomes visible (user switches back to tab)
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Reload players when tab becomes visible (in case they were updated in another tab)
        loadData(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, currentLeague]);

  const selectedMatch = useMemo(
    () => matches.find((m) => m.id === selectedMatchId) || null,
    [matches, selectedMatchId]
  );

  // Load existing playing 11 when match is selected
  useEffect(() => {
    if (selectedMatch) {
      const existingTeam1 = (selectedMatch as any).playing11?.team1 || [];
      const existingTeam2 = (selectedMatch as any).playing11?.team2 || [];
      setTeam1Playing11(existingTeam1);
      setTeam2Playing11(existingTeam2);
    } else {
      setTeam1Playing11([]);
      setTeam2Playing11([]);
    }
  }, [selectedMatch]);

  // Get ALL players from each team's squad (no restrictions in test mode)
  const team1Players = useMemo(() => {
    if (!selectedMatch) {
      console.log('No selected match for team1Players (test)');
      return [];
    }
    // Filter by teamId and league to get all squad players
    const filtered = players.filter(p => {
      const matchesTeam = p.teamId === selectedMatch.team1.id;
      const matchesLeague = p.league === selectedMatch.league;
      return matchesTeam && matchesLeague;
    });
    console.log('Team 1 players filtered (test):', {
      totalPlayers: players.length,
      team1Id: selectedMatch.team1.id,
      league: selectedMatch.league,
      filteredCount: filtered.length,
      playerIds: filtered.map(p => p.id)
    });
    return filtered;
  }, [players, selectedMatch]);

  const team2Players = useMemo(() => {
    if (!selectedMatch) {
      console.log('No selected match for team2Players (test)');
      return [];
    }
    // Filter by teamId and league to get all squad players
    const filtered = players.filter(p => {
      const matchesTeam = p.teamId === selectedMatch.team2.id;
      const matchesLeague = p.league === selectedMatch.league;
      return matchesTeam && matchesLeague;
    });
    console.log('Team 2 players filtered (test):', {
      totalPlayers: players.length,
      team2Id: selectedMatch.team2.id,
      league: selectedMatch.league,
      filteredCount: filtered.length,
      playerIds: filtered.map(p => p.id)
    });
    return filtered;
  }, [players, selectedMatch]);

  const togglePlayer = (team: 'team1' | 'team2', playerId: string) => {
    console.log('togglePlayer called:', { team, playerId });
    if (team === 'team1') {
      setTeam1Playing11(prev => {
        if (prev.includes(playerId)) {
          const newList = prev.filter(id => id !== playerId);
          console.log('Team 1 - Removed player, new list:', newList);
          return newList;
        } else {
          if (prev.length >= 11) {
            alert('Maximum 11 players allowed for Team 1');
            return prev;
          }
          const newList = [...prev, playerId];
          console.log('Team 1 - Added player, new list:', newList);
          return newList;
        }
      });
    } else {
      setTeam2Playing11(prev => {
        if (prev.includes(playerId)) {
          const newList = prev.filter(id => id !== playerId);
          console.log('Team 2 - Removed player, new list:', newList);
          return newList;
        } else {
          if (prev.length >= 11) {
            alert('Maximum 11 players allowed for Team 2');
            return prev;
          }
          const newList = [...prev, playerId];
          console.log('Team 2 - Added player, new list:', newList);
          return newList;
        }
      });
    }
  };

  const handleSavePlaying11 = async () => {
    if (!selectedMatch) return;

    if (team1Playing11.length !== 11 || team2Playing11.length !== 11) {
      alert('Please select exactly 11 players for each team');
      return;
    }

    setSaveStatus('saving');
    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(`/api/matches?id=${selectedMatch.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: selectedMatch.id,
          date: selectedMatch.date,
          time: selectedMatch.time,
          venue: selectedMatch.venue,
          team1Id: selectedMatch.team1.id,
          team2Id: selectedMatch.team2.id,
          status: selectedMatch.status,
          league: selectedMatch.league,
          playing11: {
            team1: team1Playing11,
            team2: team2Playing11,
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save playing 11');
      }

      const updatedMatchData = await response.json();
      setMatches(prev => prev.map(m => 
        m.id === selectedMatch.id ? updatedMatchData as Match : m
      ));

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      
      // Auto-switch to live score tab after saving
      if (team1Playing11.length === 11 && team2Playing11.length === 11) {
        setTimeout(() => setActiveTab('livescore'), 2500);
      }
    } catch (error) {
      console.error('Error saving playing 11:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleSaveLiveScore = async (state: any) => {
    if (!selectedMatch) return;

    setSaveStatus('saving');
    try {
      const token = localStorage.getItem('adminToken');
      
      const scoreUpdate = {
        team1: {
          name: state.team1.name,
          runs: state.team1.runs,
          wickets: state.team1.wickets,
          overs: ballsToOvers(state.team1.balls),
        },
        team2: {
          name: state.team2.name,
          runs: state.team2.runs,
          wickets: state.team2.wickets,
          overs: ballsToOvers(state.team2.balls),
        },
        currentBatter: {
          name: state.currentBatter.name,
          runs: state.currentBatter.runs,
          balls: state.currentBatter.balls,
        },
        currentBowler: {
          name: state.currentBowler.name,
          runs: state.currentBowler.runs,
          balls: state.currentBowler.balls,
        },
        commentary: state.ballHistory.slice(-10).map((ball: any) => {
          const over = Math.floor(ballsToOvers(state.team1.balls + state.team2.balls));
          const ballInOver = (state.team1.balls + state.team2.balls) % 6;
          return `Over ${over}.${ballInOver}: ${getBallDescription(ball)}`;
        }),
        status: 'Live',
        innings: state.innings,
        battingTeam: state.battingTeam,
      };

      const response = await fetch('/api/live-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          matchId: selectedMatch.id,
          scoreUpdate,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save score');
      }

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving score:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      throw error;
    }
  };

  // Helper functions
  function ballsToOvers(balls: number): number {
    const whole = Math.floor(balls / 6);
    const rem = balls % 6;
    return parseFloat(`${whole}.${rem}`);
  }

  function getBallDescription(ball: any): string {
    if (typeof ball.type === 'number') {
      return `${ball.type} run${ball.type === 1 ? '' : 's'}`;
    }
    switch (ball.type) {
      case 'W': return `WICKET! ${ball.dismissalType || 'out'}`;
      case 'WD': return 'Wide';
      case 'NB': return 'No-ball';
      case 'B': return 'Bye';
      case 'LB': return 'Leg-bye';
      default: return 'Ball';
    }
  }

  const isWPL = currentLeague === 'wpl';
  const bgStyle = isWPL 
    ? { background: `linear-gradient(to bottom, ${WPLColors.base}, ${WPLColors.gradientStart}66, ${WPLColors.gradientMid}33, ${WPLColors.base})` }
    : { background: '#0B0F13' };
  const spinnerColor = isWPL ? WPLColors.pink : '#FFD700';
  const headerGradient = isWPL
    ? `linear-gradient(to right, ${WPLColors.textPrimary}, ${WPLColors.purple}, ${WPLColors.pink})`
    : 'linear-gradient(to right, white, #93C5FD, #67E8F9)';

  if (isLoading) {
    return (
      <div className="flex min-h-screen" style={bgStyle}>
        <AuroraBackground />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" color={spinnerColor} />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen" style={bgStyle}>
      <AuroraBackground />
      <AdminSidebar currentPage="/ipl-admin-2026/test-live-score" />
      
      <main className="flex-1 relative z-20 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <TestTube className="w-8 h-8" style={{ color: isWPL ? WPLColors.pink : '#60A5FA' }} />
                  <h1 
                    className="text-4xl font-bold"
                    style={{
                      background: headerGradient,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    Test Live Score & Playing 11
                  </h1>
                </div>
                <p style={{ color: isWPL ? WPLColors.textSecondary : '#9CA3AF' }}>
                  Test both playing 11 selection and live score entry in one place
                </p>
              </div>
              {saveStatus === 'saved' && (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 font-semibold">Saved!</span>
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <span className="text-red-400 font-semibold">Save Failed</span>
                </div>
              )}
              <button
                onClick={() => loadData(true)}
                disabled={isRefreshing}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all
                  ${isWPL
                    ? 'bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300'
                    : 'bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300'
                  }
                  ${isRefreshing ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
                `}
                title="Refresh players data"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {/* Match Selector */}
            <div 
              className="rounded-2xl p-4 backdrop-blur-xl border mb-6"
              style={isWPL ? {
                background: WPLColors.purpleRGBA[10],
                borderColor: WPLColors.purpleRGBA[30],
              } : {
                background: 'rgba(30, 41, 59, 0.6)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <label 
                className="block text-sm font-semibold mb-2"
                style={{ color: isWPL ? WPLColors.textMuted : '#9CA3AF' }}
              >
                Select Match
              </label>
              <select
                value={selectedMatchId}
                onChange={(e) => setSelectedMatchId(e.target.value)}
                className="w-full md:w-96 px-4 py-3 rounded-lg text-white text-sm focus:outline-none transition-colors"
                style={isWPL ? {
                  background: WPLColors.purpleRGBA[20],
                  border: `1px solid ${WPLColors.purpleRGBA[30]}`,
                } : {
                  background: '#0F172A',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = isWPL ? WPLColors.purpleRGBA[50] : '#3B82F6';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = isWPL ? WPLColors.purpleRGBA[30] : 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <option value="">Select a match...</option>
                {/* Test page: Show ALL matches (no time restrictions) */}
                {matches.map((match) => (
                  <option key={match.id} value={match.id}>
                    {match.team1.shortName} vs {match.team2.shortName} · {new Date(match.date).toLocaleDateString()} {match.time} ({match.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Tab Navigation */}
            {selectedMatch && (
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => setActiveTab('playing11')}
                  className={`
                    px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2
                    ${activeTab === 'playing11'
                      ? isWPL
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                        : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                      : 'bg-slate-700/50 text-gray-400 hover:bg-slate-700'
                    }
                  `}
                >
                  <Users className="w-5 h-5" />
                  Playing 11
                  {team1Playing11.length === 11 && team2Playing11.length === 11 && (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('livescore')}
                  className={`
                    px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2
                    ${activeTab === 'livescore'
                      ? isWPL
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                        : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                      : 'bg-slate-700/50 text-gray-400 hover:bg-slate-700'
                    }
                  `}
                >
                  <TestTube className="w-5 h-5" />
                  Live Score
                  {team1Playing11.length === 11 && team2Playing11.length === 11 && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">Playing 11 Set</span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Content Area */}
          {selectedMatch ? (
            <div className="space-y-6">
              {activeTab === 'playing11' ? (
                /* Playing 11 Selection */
                <div className="space-y-6">
                  {/* Team 1 Selection */}
                  <div 
                    className="rounded-2xl p-6 backdrop-blur-xl border"
                    style={isWPL ? {
                      background: WPLColors.purpleRGBA[10],
                      borderColor: WPLColors.purpleRGBA[30],
                    } : {
                      background: 'rgba(30, 41, 59, 0.4)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-1">
                          {selectedMatch.team1.shortName || selectedMatch.team1.name}
                        </h2>
                        <p className="text-sm" style={{ color: isWPL ? WPLColors.textMuted : '#9CA3AF' }}>
                          Select 11 players from squad ({team1Players.length} available)
                        </p>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{
                        background: team1Playing11.length === 11 
                          ? 'rgba(34, 197, 94, 0.2)' 
                          : 'rgba(251, 191, 36, 0.2)',
                        border: `1px solid ${team1Playing11.length === 11 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`
                      }}>
                        <Users className="w-5 h-5" style={{ color: team1Playing11.length === 11 ? '#22C55E' : '#FBBF24' }} />
                        <span className="font-bold" style={{ color: team1Playing11.length === 11 ? '#22C55E' : '#FBBF24' }}>
                          {team1Playing11.length} / 11
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {team1Players.length === 0 ? (
                        <div className="col-span-full text-center py-8 text-gray-400">
                          No players found for {selectedMatch.team1.name}. Please ensure players are assigned to this team.
                        </div>
                      ) : (
                        team1Players.map((player) => {
                          const isSelected = team1Playing11.includes(player.id);
                          return (
                            <button
                              key={player.id}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Button clicked for player:', player.name, player.id);
                                togglePlayer('team1', player.id);
                              }}
                              type="button"
                              className={`
                                p-4 rounded-xl border-2 transition-all text-left cursor-pointer
                                ${isSelected
                                  ? isWPL
                                    ? 'bg-purple-600/30 border-purple-500/50'
                                    : 'bg-blue-600/30 border-blue-500/50'
                                  : 'bg-slate-700/50 border-slate-600/50 hover:border-slate-500/50'
                                }
                              `}
                              style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto' }}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-semibold text-white">{player.name}</div>
                                {isSelected && (
                                  <CheckCircle2 className="w-5 h-5" style={{ color: isWPL ? WPLColors.pink : '#60A5FA' }} />
                                )}
                              </div>
                              <div className="text-xs" style={{ color: isWPL ? WPLColors.textMuted : '#9CA3AF' }}>
                                {player.role} • #{player.jerseyNumber}
                                {player.isCaptain && ' • Captain'}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Team 2 Selection */}
                  <div 
                    className="rounded-2xl p-6 backdrop-blur-xl border"
                    style={isWPL ? {
                      background: WPLColors.purpleRGBA[10],
                      borderColor: WPLColors.purpleRGBA[30],
                    } : {
                      background: 'rgba(30, 41, 59, 0.4)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-1">
                          {selectedMatch.team2.shortName || selectedMatch.team2.name}
                        </h2>
                        <p className="text-sm" style={{ color: isWPL ? WPLColors.textMuted : '#9CA3AF' }}>
                          Select 11 players from squad ({team2Players.length} available)
                        </p>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{
                        background: team2Playing11.length === 11 
                          ? 'rgba(34, 197, 94, 0.2)' 
                          : 'rgba(251, 191, 36, 0.2)',
                        border: `1px solid ${team2Playing11.length === 11 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`
                      }}>
                        <Users className="w-5 h-5" style={{ color: team2Playing11.length === 11 ? '#22C55E' : '#FBBF24' }} />
                        <span className="font-bold" style={{ color: team2Playing11.length === 11 ? '#22C55E' : '#FBBF24' }}>
                          {team2Playing11.length} / 11
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {team2Players.length === 0 ? (
                        <div className="col-span-full text-center py-8 text-gray-400">
                          No players found for {selectedMatch.team2.name}. Please ensure players are assigned to this team.
                        </div>
                      ) : (
                        team2Players.map((player) => {
                          const isSelected = team2Playing11.includes(player.id);
                          return (
                            <button
                              key={player.id}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Button clicked for player:', player.name, player.id);
                                togglePlayer('team2', player.id);
                              }}
                              type="button"
                              className={`
                                p-4 rounded-xl border-2 transition-all text-left cursor-pointer
                                ${isSelected
                                  ? isWPL
                                    ? 'bg-purple-600/30 border-purple-500/50'
                                    : 'bg-blue-600/30 border-blue-500/50'
                                  : 'bg-slate-700/50 border-slate-600/50 hover:border-slate-500/50'
                                }
                              `}
                              style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto' }}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-semibold text-white">{player.name}</div>
                                {isSelected && (
                                  <CheckCircle2 className="w-5 h-5" style={{ color: isWPL ? WPLColors.pink : '#60A5FA' }} />
                                )}
                              </div>
                              <div className="text-xs" style={{ color: isWPL ? WPLColors.textMuted : '#9CA3AF' }}>
                                {player.role} • #{player.jerseyNumber}
                                {player.isCaptain && ' • Captain'}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={handleSavePlaying11}
                      disabled={team1Playing11.length !== 11 || team2Playing11.length !== 11 || saveStatus === 'saving'}
                      className={`
                        px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all
                        ${team1Playing11.length === 11 && team2Playing11.length === 11
                          ? isWPL
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl'
                            : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl'
                          : 'bg-slate-700 text-gray-400 cursor-not-allowed'
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                    >
                      <Save className="w-5 h-5" />
                      {saveStatus === 'saving' ? 'Saving...' : 'Save Playing 11'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Live Score Entry */
                <div 
                  className="rounded-2xl p-6 md:p-8 backdrop-blur-xl border"
                  style={isWPL ? {
                    background: WPLColors.purpleRGBA[10],
                    borderColor: WPLColors.purpleRGBA[30],
                  } : {
                    background: 'rgba(30, 41, 59, 0.4)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                  }}
                >
                  {/* Test page: Always allow live score, but use playing11 if available */}
                  <BallEntryPanel
                    matchId={selectedMatch.id}
                    team1Name={selectedMatch.team1.shortName || selectedMatch.team1.name}
                    team2Name={selectedMatch.team2.shortName || selectedMatch.team2.name}
                    team1Id={selectedMatch.team1.id}
                    team2Id={selectedMatch.team2.id}
                    onSave={handleSaveLiveScore}
                    players={players.filter(p => 
                      p.teamId === selectedMatch.team1.id || p.teamId === selectedMatch.team2.id
                    )}
                    league={currentLeague}
                    playing11={
                      team1Playing11.length === 11 && team2Playing11.length === 11
                        ? {
                            team1: team1Playing11,
                            team2: team2Playing11,
                          }
                        : undefined // Test page: Allow all players if playing11 not set
                    }
                  />
                  {team1Playing11.length !== 11 || team2Playing11.length !== 11 ? (
                    <div 
                      className="mt-4 p-4 rounded-xl border"
                      style={isWPL ? {
                        background: WPLColors.purpleRGBA[10],
                        borderColor: WPLColors.purpleRGBA[30],
                      } : {
                        background: 'rgba(59, 130, 246, 0.1)',
                        borderColor: 'rgba(59, 130, 246, 0.3)',
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 mt-0.5" style={{ color: isWPL ? WPLColors.pink : '#60A5FA' }} />
                        <div>
                          <p className="text-sm font-semibold text-white mb-1">Test Mode: Full Access</p>
                          <p className="text-xs" style={{ color: isWPL ? WPLColors.textMuted : '#9CA3AF' }}>
                            All players are available for testing. Set playing 11 to test the filtered player selection.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="mt-4 p-4 rounded-xl border"
                      style={isWPL ? {
                        background: 'rgba(34, 197, 94, 0.1)',
                        borderColor: 'rgba(34, 197, 94, 0.3)',
                      } : {
                        background: 'rgba(34, 197, 94, 0.1)',
                        borderColor: 'rgba(34, 197, 94, 0.3)',
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 mt-0.5 text-green-400" />
                        <div>
                          <p className="text-sm font-semibold text-green-400 mb-1">Playing 11 Active</p>
                          <p className="text-xs text-green-300/80">
                            Only players from the selected playing 11 are available for selection.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div 
              className="rounded-2xl p-12 text-center backdrop-blur-xl border"
              style={isWPL ? {
                background: WPLColors.purpleRGBA[10],
                borderColor: WPLColors.purpleRGBA[30],
              } : {
                background: 'rgba(30, 41, 59, 0.4)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <p style={{ color: isWPL ? WPLColors.textSecondary : '#9CA3AF' }} className="text-lg">
                Please select a match to start testing
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

