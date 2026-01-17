'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import BallEntryPanel from '@/components/admin/live-score/BallEntryPanel';
import AuroraBackground from '@/components/ui/AuroraBackground';
import { Match, Player } from '@/types';
import { LiveScoreState, BallEvent } from '@/hooks/useLiveScore';
import { api } from '@/lib/data';
import { LoadingSpinner } from '@/components/admin/animations';
import { useLeague } from '@/contexts/LeagueContext';
import { WPLColors } from '@/lib/wplColors';
import MatchStatusBadge from '@/components/admin/live-score/MatchStatusBadge';
import AutoSaveIndicator from '@/components/admin/live-score/AutoSaveIndicator';

export default function AdminLiveScorePage() {
  const router = useRouter();
  const { currentLeague } = useLeague();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [liveScoreState, setLiveScoreState] = useState<LiveScoreState | undefined>(undefined);
  const [isScoreLoading, setIsScoreLoading] = useState(false);

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

  // Load matches and players
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadData = async () => {
      try {
        const [matchesData, playersData] = await Promise.all([
          api.getMatches(currentLeague),
          api.getPlayers(undefined, currentLeague),
        ]);
        setMatches(matchesData);
        setPlayers(playersData);

        // Auto-select first live or upcoming match
        if (!selectedMatchId && matchesData && Array.isArray(matchesData) && matchesData.length > 0) {
          const preferred =
            matchesData.find((m) => m.status === 'live') ||
            matchesData.find((m) => m.status === 'upcoming') ||
            matchesData[0];
          if (preferred) {
            setSelectedMatchId(preferred.id);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, [isAuthenticated, currentLeague]);

  const selectedMatch = useMemo(
    () => {
      if (!matches || !Array.isArray(matches)) return null;
      return matches.find((m) => m.id === selectedMatchId) || null;
    },
    [matches, selectedMatchId]
  );

  // Helper to get localStorage key for a match
  const getLocalStorageKey = (matchId: string) => `liveScore_${currentLeague}_${matchId}`;

  // Fetch live score when match is selected - prioritize localStorage
  useEffect(() => {
    if (!selectedMatchId) {
      setLiveScoreState(undefined);
      return;
    }

    const fetchLiveScore = async () => {
      setIsScoreLoading(true);
      try {
        // First, try to load from localStorage (has full state including ballHistory)
        const localKey = getLocalStorageKey(selectedMatchId);
        const localData = localStorage.getItem(localKey);
        
        if (localData) {
          try {
            const parsedLocal = JSON.parse(localData);
            console.log('[LiveScore] Loaded from localStorage:', parsedLocal);
            setLiveScoreState(parsedLocal);
            setIsScoreLoading(false);
            
            // Also fetch from API to check if there's newer data
            const response = await fetch(`/api/live-score?matchId=${selectedMatchId}`);
            if (response.ok) {
              const apiData = await response.json();
              // Only use API data if localStorage is empty/incomplete
              if (!parsedLocal.ballHistory || parsedLocal.ballHistory.length === 0) {
                setLiveScoreState(apiData);
              }
            }
            return;
          } catch (e) {
            console.error('Error parsing localStorage data:', e);
          }
        }
        
        // Fallback: fetch from API
        const response = await fetch(`/api/live-score?matchId=${selectedMatchId}`);
        if (response.ok) {
          const data = await response.json();
          setLiveScoreState(data);
        }
      } catch (error) {
        console.error('Error fetching live score:', error);
      } finally {
        setIsScoreLoading(false);
      }
    };

    fetchLiveScore();
  }, [selectedMatchId, currentLeague]);

  const handleSave = async (state: LiveScoreState) => {
    if (!selectedMatch) return;

    setSaveStatus('saving');
    try {
      // First, save the full state to localStorage for persistence across refreshes
      const localKey = getLocalStorageKey(selectedMatch.id);
      const fullStateToSave = {
        ...state,
        lastUpdated: new Date().toISOString(),
        matchId: selectedMatch.id,
      };
      localStorage.setItem(localKey, JSON.stringify(fullStateToSave));
      console.log('[LiveScore] Saved full state to localStorage');

      const token = localStorage.getItem('adminToken');

      // Convert state to API format
      const extendedState = state as any;

      const scoreUpdate = {
        team1: {
          name: selectedMatch.team1.shortName || selectedMatch.team1.name,
          runs: state.team1.runs,
          wickets: state.team1.wickets,
          overs: ballsToOvers(state.team1.balls),
        },
        team2: {
          name: selectedMatch.team2.shortName || selectedMatch.team2.name,
          runs: state.team2.runs,
          wickets: state.team2.wickets,
          overs: ballsToOvers(state.team2.balls),
        },
        currentBatter: state.currentBatter
          ? {
              name: state.currentBatter.name,
              runs: state.currentBatter.runs,
              balls: state.currentBatter.balls,
            }
          : undefined,
        currentBowler: state.currentBowler
          ? {
              name: state.currentBowler.name,
              runs: state.currentBowler.runs,
              balls: state.currentBowler.balls,
            }
          : undefined,
        commentary: (state.ballHistory && Array.isArray(state.ballHistory))
          ? state.ballHistory
              .slice(-10)
              .map((ball: any) => {
                const totalBalls = Math.floor(state.currentOver) * 6 + Math.round((state.currentOver % 1) * 10);
                const over = Math.floor(totalBalls / 6);
                const ballInOver = totalBalls % 6;
                return `Over ${over}.${ballInOver}: ${getBallDescription(ball)}`;
              })
          : [],
        status: 'Live',
        innings: state.innings,
        battingTeam: state.battingTeam,
        toss: state.toss,
        playing11: selectedMatch.playing11,
        strategicTimeout: extendedState.strategicTimeout,
        drsReviews: extendedState.drsReviews,
        impactPlayer: extendedState.impactPlayer,
        superOver: extendedState.superOver,
        ballChanged: extendedState.ballChanged,
        isEveningMatch: extendedState.isEveningMatch,
        matchState: state.matchState,
      };

      const response = await fetch('/api/live-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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

  function getBallDescription(ball: BallEvent): string {
    if (typeof ball.type === 'number') {
      return `${ball.type} run${ball.type === 1 ? '' : 's'}`;
    }
    switch (ball.type) {
      case 'W':
        return `WICKET! ${ball.dismissalType || 'out'}`;
      case 'WD':
        return 'Wide';
      case 'NB':
        return 'No-ball';
      case 'B':
        return 'Bye';
      case 'LB':
        return 'Leg-bye';
      default:
        return 'Ball';
    }
  }

  const isWPL = currentLeague === 'wpl';
  const bgStyle = isWPL
    ? {
        background: `linear-gradient(to bottom, ${WPLColors.base}, ${WPLColors.gradientStart}66, ${WPLColors.gradientMid}33, ${WPLColors.base})`,
      }
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
    <>
      <AuroraBackground />

      <main className="flex-1 relative z-10 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <h1
                    className="text-4xl font-bold"
                    style={{
                      background: headerGradient,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    Live Score Management
                  </h1>
                  {selectedMatch && <MatchStatusBadge status={selectedMatch.status} league={currentLeague} />}
                </div>
                <div className="flex items-center gap-4">
                  <p style={{ color: isWPL ? WPLColors.textSecondary : '#9CA3AF' }}>
                    Record ball-by-ball updates. All changes save automatically.
                  </p>
                  <AutoSaveIndicator status={saveStatus} league={currentLeague} />
                </div>
              </div>
            </div>

            {/* Match Selector */}
            <div
              className="rounded-2xl p-4 backdrop-blur-xl border"
              style={
                isWPL
                  ? {
                      background: WPLColors.purpleRGBA[10],
                      borderColor: WPLColors.purpleRGBA[30],
                    }
                  : {
                      background: 'rgba(30, 41, 59, 0.6)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    }
              }
            >
              <label
                htmlFor="match-selector"
                className="block text-sm font-semibold mb-2"
                style={{ color: isWPL ? WPLColors.textMuted : '#9CA3AF' }}
              >
                Select Match
              </label>
              <select
                id="match-selector"
                name="match-selector"
                value={selectedMatchId}
                onChange={(e) => setSelectedMatchId(e.target.value)}
                className="w-full md:w-96 px-4 py-3 rounded-lg text-white text-sm focus:outline-none transition-colors"
                style={
                  isWPL
                    ? {
                        background: WPLColors.purpleRGBA[20],
                        border: `1px solid ${WPLColors.purpleRGBA[30]}`,
                      }
                    : {
                        background: '#0F172A',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }
                }
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = isWPL ? WPLColors.purpleRGBA[50] : '#3B82F6';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = isWPL ? WPLColors.purpleRGBA[30] : 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <option value="">Select a match...</option>
                {matches && Array.isArray(matches) ? (
                  matches
                    .filter((m) => m.status === 'live' || m.status === 'upcoming')
                    .map((match) => (
                      <option key={match.id} value={match.id}>
                        {match.team1.shortName} vs {match.team2.shortName} · {new Date(match.date).toLocaleDateString()}{' '}
                        {match.time}
                      </option>
                    ))
                ) : (
                  <option disabled>No matches available</option>
                )}
              </select>
            </div>
          </div>

          {/* Content Area */}
          {selectedMatch ? (
            <div
              className="rounded-2xl p-6 md:p-8 backdrop-blur-xl border"
              style={
                isWPL
                  ? {
                      background: WPLColors.purpleRGBA[10],
                      borderColor: WPLColors.purpleRGBA[30],
                    }
                  : {
                      background: 'rgba(30, 41, 59, 0.4)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    }
              }
            >
              {isScoreLoading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner size="lg" color={spinnerColor} />
                </div>
              ) : (
                <BallEntryPanel
                  key={selectedMatch.id}
                  matchId={selectedMatch.id}
                  team1Name={selectedMatch.team1.shortName || selectedMatch.team1.name}
                  team2Name={selectedMatch.team2.shortName || selectedMatch.team2.name}
                  team1Id={selectedMatch.team1.id}
                  team2Id={selectedMatch.team2.id}
                  onSave={handleSave}
                  players={players.filter(
                    (p) => p.teamId === selectedMatch.team1.id || p.teamId === selectedMatch.team2.id
                  )}
                  league={currentLeague}
                  playing11={selectedMatch.playing11}
                  initialState={liveScoreState}
                />
              )}
            </div>
          ) : (
            <div
              className="rounded-2xl p-12 text-center backdrop-blur-xl border"
              style={
                isWPL
                  ? {
                      background: WPLColors.purpleRGBA[10],
                      borderColor: WPLColors.purpleRGBA[30],
                    }
                  : {
                      background: 'rgba(30, 41, 59, 0.4)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    }
              }
            >
              <p className="text-lg" style={{ color: isWPL ? WPLColors.textSecondary : '#9CA3AF' }}>
                Please select a match to start scoring
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
