'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AuroraBackground from '@/components/ui/AuroraBackground';
import { Match, Player, Team } from '@/types';
import { api } from '@/lib/data';
import { LoadingSpinner } from '@/components/admin/animations';
import { CheckCircle2, AlertCircle, Users, Save, X, RefreshCw } from 'lucide-react';
import { useLeague } from '@/contexts/LeagueContext';
import { WPLColors } from '@/lib/wplColors';

export default function Playing11Page() {
  const router = useRouter();
  const { currentLeague } = useLeague();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
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
                api.getPlayers(undefined, currentLeague),
                api.getTeams(currentLeague),
              ]);
      setMatches(matchesData);
      setPlayers(playersData);
      setTeams(teamsData);
      
      // Debug: Log players data from KV
      console.log('=== PLAYERS LOADED FROM KV (playing-11) ===');
      console.log('Total players loaded:', playersData.length);
      console.log('Current league:', currentLeague);
      console.log('All players:', playersData.map(p => ({
        id: p.id,
        name: p.name,
        teamId: p.teamId,
        teamIdType: typeof p.teamId,
        league: p.league,
        leagueType: typeof p.league
      })));
      
      const playersByLeague = playersData.filter(p => {
        const playerLeague = p.league || 'ipl';
        return playerLeague === currentLeague;
      });
      console.log(`Players for ${currentLeague}:`, playersByLeague.length);
      console.log('Players by league:', playersByLeague.map(p => ({
        id: p.id,
        name: p.name,
        teamId: p.teamId,
        league: p.league
      })));
      
      if (playersData.length === 0) {
        console.warn('⚠️ No players found in KV storage at all!');
        console.warn('Please check if players exist in Workers KV storage.');
      } else if (playersByLeague.length === 0) {
        console.warn(`⚠️ No players found for league: ${currentLeague}`);
        const uniqueLeagues = Array.from(new Set(playersData.map(p => p.league || 'ipl')));
        console.warn('Players in KV have leagues:', uniqueLeagues);
      }

      // Auto-select first upcoming match if none selected (preserve current selection if it exists)
      setSelectedMatchId(prev => {
        if (prev && matchesData.find(m => m.id === prev)) {
          return prev; // Keep current selection if it still exists
        }
        if (matchesData.length > 0) {
          const preferred =
            matchesData.find((m) => m.status === 'upcoming') ||
            matchesData.find((m) => m.status === 'live') ||
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
  }, [isAuthenticated, currentLeague, loadData]);

  const selectedMatch = useMemo(
    () => matches.find((m) => m.id === selectedMatchId) || null,
    [matches, selectedMatchId]
  );

  // Load existing playing 11 when match is selected
  useEffect(() => {
    if (selectedMatch) {
      // Load from match data if available
      const existingTeam1 = (selectedMatch as any).playing11?.team1 || [];
      const existingTeam2 = (selectedMatch as any).playing11?.team2 || [];
      setTeam1Playing11(existingTeam1);
      setTeam2Playing11(existingTeam2);
    } else {
      setTeam1Playing11([]);
      setTeam2Playing11([]);
    }
  }, [selectedMatch]);

  // Get ALL players from each team's squad (no restrictions)
  const team1Players = useMemo(() => {
    if (!selectedMatch) {
      console.log('No selected match for team1Players');
      return [];
    }
    
    console.log('=== FILTERING TEAM 1 PLAYERS ===');
    console.log('Selected match:', {
      id: selectedMatch.id,
      team1Id: selectedMatch.team1.id,
      team1IdType: typeof selectedMatch.team1.id,
      team1Name: selectedMatch.team1.name,
      league: selectedMatch.league,
      leagueType: typeof selectedMatch.league
    });
    console.log('Total players available:', players.length);
    
    // Filter by teamId and league to get all squad players
    // Try both string and number comparison for teamId
    const filtered = players.filter(p => {
      const playerTeamId = String(p.teamId);
      const matchTeamId = String(selectedMatch.team1.id);
      const playerLeague = p.league || 'ipl';
      const matchLeague = selectedMatch.league || 'ipl';
      
      const matchesTeam = playerTeamId === matchTeamId;
      const matchesLeague = playerLeague === matchLeague;
      
      if (!matchesTeam || !matchesLeague) {
        console.log('Player filtered out:', {
          playerName: p.name,
          playerTeamId: p.teamId,
          playerTeamIdString: playerTeamId,
          matchTeamId: selectedMatch.team1.id,
          matchTeamIdString: matchTeamId,
          playerLeague: playerLeague,
          matchLeague: matchLeague,
          matchesTeam,
          matchesLeague
        });
      }
      return matchesTeam && matchesLeague;
    });
    
    console.log('Team 1 players filtered result:', {
      totalPlayers: players.length,
      team1Id: selectedMatch.team1.id,
      team1IdString: String(selectedMatch.team1.id),
      league: selectedMatch.league,
      filteredCount: filtered.length,
      playerIds: filtered.map(p => p.id),
      playerNames: filtered.map(p => p.name)
    });
    
    return filtered;
  }, [players, selectedMatch]);

  const team2Players = useMemo(() => {
    if (!selectedMatch) {
      console.log('No selected match for team2Players');
      return [];
    }
    
    console.log('=== FILTERING TEAM 2 PLAYERS ===');
    console.log('Selected match:', {
      id: selectedMatch.id,
      team2Id: selectedMatch.team2.id,
      team2IdType: typeof selectedMatch.team2.id,
      team2Name: selectedMatch.team2.name,
      league: selectedMatch.league,
      leagueType: typeof selectedMatch.league
    });
    console.log('Total players available:', players.length);
    
    // Filter by teamId and league to get all squad players
    // Try both string and number comparison for teamId
    const filtered = players.filter(p => {
      const playerTeamId = String(p.teamId);
      const matchTeamId = String(selectedMatch.team2.id);
      const playerLeague = p.league || 'ipl';
      const matchLeague = selectedMatch.league || 'ipl';
      
      const matchesTeam = playerTeamId === matchTeamId;
      const matchesLeague = playerLeague === matchLeague;
      
      if (!matchesTeam || !matchesLeague) {
        console.log('Player filtered out:', {
          playerName: p.name,
          playerTeamId: p.teamId,
          playerTeamIdString: playerTeamId,
          matchTeamId: selectedMatch.team2.id,
          matchTeamIdString: matchTeamId,
          playerLeague: playerLeague,
          matchLeague: matchLeague,
          matchesTeam,
          matchesLeague
        });
      }
      return matchesTeam && matchesLeague;
    });
    
    console.log('Team 2 players filtered result:', {
      totalPlayers: players.length,
      team2Id: selectedMatch.team2.id,
      team2IdString: String(selectedMatch.team2.id),
      league: selectedMatch.league,
      filteredCount: filtered.length,
      playerIds: filtered.map(p => p.id),
      playerNames: filtered.map(p => p.name)
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

  const handleSave = async () => {
    if (!selectedMatch) return;

    if (team1Playing11.length !== 11 || team2Playing11.length !== 11) {
      alert('Please select exactly 11 players for each team');
      return;
    }

    setSaveStatus('saving');
    try {
      const token = localStorage.getItem('adminToken');
      
      // Update match with playing 11
      // Use the match update API format
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

      // Update local matches state
      const updatedMatchData = await response.json();
      setMatches(prev => prev.map(m => 
        m.id === selectedMatch.id ? updatedMatchData as Match : m
      ));

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving playing 11:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

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
      <AdminSidebar currentPage="/ipl-admin-2026/playing-11" />
      
      <main className="flex-1 relative z-20 p-4 md:p-8 overflow-y-auto" style={{ position: 'relative', zIndex: 20 }}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 
                  className="text-4xl font-bold mb-2"
                  style={{
                    background: headerGradient,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Playing 11 Selection
                </h1>
                <p style={{ color: isWPL ? WPLColors.textSecondary : '#9CA3AF' }}>
                  Select 11 players for each team before the match starts (after toss decision)
                </p>
              </div>
              <div className="flex items-center gap-3">
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
                {matches
                  .filter(m => m.status === 'upcoming' || m.status === 'live')
                  .map((match) => (
                    <option key={match.id} value={match.id}>
                      {match.team1.shortName} vs {match.team2.shortName} · {new Date(match.date).toLocaleDateString()} {match.time}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Playing 11 Selection */}
          {selectedMatch ? (
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
                    <div className="col-span-full text-center py-8 px-4 rounded-xl border-2 border-dashed" style={isWPL ? {
                      background: WPLColors.purpleRGBA[10],
                      borderColor: WPLColors.purpleRGBA[30],
                    } : {
                      background: 'rgba(30, 41, 59, 0.2)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    }}>
                      <AlertCircle className="w-12 h-12 mx-auto mb-3" style={{ color: isWPL ? WPLColors.pink : '#60A5FA' }} />
                      <p className="text-lg font-semibold text-white mb-2">No Players Found</p>
                      <p className="text-sm mb-4" style={{ color: isWPL ? WPLColors.textMuted : '#9CA3AF' }}>
                        No players found for {selectedMatch.team1.name} in {currentLeague.toUpperCase()}.
                      </p>
                      <p className="text-xs mb-4" style={{ color: isWPL ? WPLColors.textMuted : '#9CA3AF' }}>
                        Please add players in the <strong>Admin Players</strong> page and ensure they are assigned to this team.
                      </p>
                      <button
                        onClick={() => loadData(true)}
                        className={`
                          px-4 py-2 rounded-lg font-semibold transition-all
                          ${isWPL
                            ? 'bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300'
                            : 'bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300'
                          }
                        `}
                      >
                        <RefreshCw className="w-4 h-4 inline mr-2" />
                        Refresh Players
                      </button>
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
                          style={{ position: 'relative', zIndex: 10 }}
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
                    <div className="col-span-full text-center py-8 px-4 rounded-xl border-2 border-dashed" style={isWPL ? {
                      background: WPLColors.purpleRGBA[10],
                      borderColor: WPLColors.purpleRGBA[30],
                    } : {
                      background: 'rgba(30, 41, 59, 0.2)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    }}>
                      <AlertCircle className="w-12 h-12 mx-auto mb-3" style={{ color: isWPL ? WPLColors.pink : '#60A5FA' }} />
                      <p className="text-lg font-semibold text-white mb-2">No Players Found</p>
                      <p className="text-sm mb-4" style={{ color: isWPL ? WPLColors.textMuted : '#9CA3AF' }}>
                        No players found for {selectedMatch.team2.name} in {currentLeague.toUpperCase()}.
                      </p>
                      <p className="text-xs mb-4" style={{ color: isWPL ? WPLColors.textMuted : '#9CA3AF' }}>
                        Please add players in the <strong>Admin Players</strong> page and ensure they are assigned to this team.
                      </p>
                      <button
                        onClick={() => loadData(true)}
                        className={`
                          px-4 py-2 rounded-lg font-semibold transition-all
                          ${isWPL
                            ? 'bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300'
                            : 'bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300'
                          }
                        `}
                      >
                        <RefreshCw className="w-4 h-4 inline mr-2" />
                        Refresh Players
                      </button>
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
                          style={{ position: 'relative', zIndex: 10 }}
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
                  onClick={handleSave}
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
                Please select a match to select playing 11
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

