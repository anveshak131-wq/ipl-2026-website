'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
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
import { AlertCircle } from 'lucide-react';

export default function WPLAdminLiveScorePage() {
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
  const [missingPlaying11Error, setMissingPlaying11Error] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Check authentication
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/wpl-admin-2026');
        return;
      }
      setIsAuthenticated(true);
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  // Restore selected match ID from localStorage on mount and load data
  useEffect(() => {
    if (!isAuthenticated || hasInitialized) return;

    const initializeData = async () => {
      try {
        // Get saved match ID from localStorage
        const savedMatchId = typeof window !== 'undefined' ? localStorage.getItem('wpl-live-score-matchId') : null;

        // Load all data
        const [matchesData, playersData] = await Promise.all([
          api.getMatches('wpl'),
          api.getPlayers(undefined, 'wpl'),
        ]);
        
        setMatches(matchesData);
        setPlayers(playersData);

        // Determine which match to select
        let targetMatchId = savedMatchId;
        
        // Validate saved match still exists
        if (targetMatchId && Array.isArray(matchesData)) {
          const matchExists = matchesData.some(m => m.id === targetMatchId);
          if (!matchExists) {
            // Saved match no longer exists
            targetMatchId = null;
          }
        }

        // If no valid saved match, select first available live or upcoming
        if (!targetMatchId && matchesData && Array.isArray(matchesData) && matchesData.length > 0) {
          const preferred =
            matchesData.find((m) => m.status === 'live') ||
            matchesData.find((m) => m.status === 'upcoming') ||
            matchesData[0];
          if (preferred) {
            targetMatchId = preferred.id;
          }
        }

        // Set the selected match
        if (targetMatchId) {
          setSelectedMatchId(targetMatchId);
          if (typeof window !== 'undefined') {
            localStorage.setItem('wpl-live-score-matchId', targetMatchId);
          }
        }

        setHasInitialized(true);
      } catch (error) {
        console.error('Error initializing live-score page:', error);
        setHasInitialized(true);
      }
    };

    initializeData();
  }, [isAuthenticated, hasInitialized]);

  const selectedMatch = useMemo(
    () => {
      if (!matches || !Array.isArray(matches)) return null;
      return matches.find((m) => m.id === selectedMatchId) || null;
    },
    [matches, selectedMatchId]
  );

  // Check if playing11 is set when selecting a live/upcoming match
  useEffect(() => {
    if (selectedMatch && selectedMatch.status !== 'completed') {
      const hasPlaying11 = selectedMatch.playing11 && 
        selectedMatch.playing11.team1 && 
        Array.isArray(selectedMatch.playing11.team1) &&
        selectedMatch.playing11.team1.length === 11 &&
        selectedMatch.playing11.team2 &&
        Array.isArray(selectedMatch.playing11.team2) &&
        selectedMatch.playing11.team2.length === 11;
      
      setMissingPlaying11Error(!hasPlaying11);
    } else {
      setMissingPlaying11Error(false);
    }
  }, [selectedMatch]);

  // Fetch live score when match is selected
  useEffect(() => {
    if (!selectedMatchId || !hasInitialized) {
      setLiveScoreState(undefined);
      return;
    }

    const fetchLiveScore = async () => {
      setIsScoreLoading(true);
      try {
        // Small delay to let page settle
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const response = await fetch(`/api/live-score?matchId=${selectedMatchId}`);
        if (response.ok) {
          const data = await response.json();
          setLiveScoreState(data);
          console.log('[WPL Live-Score] Successfully loaded state:', data);
        } else {
          console.warn('[WPL Live-Score] API returned non-ok status:', response.status);
          // It's ok if no data exists yet, just continue
          setLiveScoreState(undefined);
        }
      } catch (error) {
        console.error('[WPL Live-Score] Error fetching live score:', error);
        setLiveScoreState(undefined);
      } finally {
        setIsScoreLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchLiveScore();
    }, 0);

    return () => clearTimeout(timer);
  }, [selectedMatchId, hasInitialized]);

  const handleSave = async (state: LiveScoreState) => {
    if (!selectedMatch) return;

    setSaveStatus('saving');
    try {
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

  const bgStyle = {
    background: `linear-gradient(to bottom, ${WPLColors.base}, ${WPLColors.gradientStart}66, ${WPLColors.gradientMid}33, ${WPLColors.base})`,
  };
  const spinnerColor = WPLColors.pink;
  const headerGradient = `linear-gradient(to right, ${WPLColors.textPrimary}, ${WPLColors.purple}, ${WPLColors.pink})`;

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
      <AdminSidebar currentPage="/wpl-admin-2026/live-score" />

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
                  {selectedMatch && <MatchStatusBadge status={selectedMatch.status} league="wpl" />}
                </div>
                <div className="flex items-center gap-4">
                  <p style={{ color: WPLColors.textSecondary }}>
                    Record ball-by-ball updates. All changes save automatically.
                  </p>
                  <AutoSaveIndicator status={saveStatus} league="wpl" />
                </div>
              </div>
            </div>

            {/* Match Selector */}
            <div
              className="rounded-2xl p-4 backdrop-blur-xl border"
              style={{
                background: WPLColors.purpleRGBA[10],
                borderColor: WPLColors.purpleRGBA[30],
              }}
            >
              <label
                htmlFor="match-selector"
                className="block text-sm font-semibold mb-2"
                style={{ color: WPLColors.textMuted }}
              >
                Select Match
              </label>
              <select
                id="match-selector"
                name="match-selector"
                value={selectedMatchId}
                onChange={(e) => {
                  setSelectedMatchId(e.target.value);
                  localStorage.setItem('wpl-live-score-matchId', e.target.value);
                }}
                className="w-full md:w-96 px-4 py-3 rounded-lg text-white text-sm focus:outline-none transition-colors"
                style={{
                  background: WPLColors.purpleRGBA[20],
                  border: `1px solid ${WPLColors.purpleRGBA[30]}`,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = WPLColors.purpleRGBA[50];
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = WPLColors.purpleRGBA[30];
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

          {/* Playing 11 Missing Warning */}
          {missingPlaying11Error && (
            <div
              className="rounded-xl p-4 mb-6 border flex items-start gap-3"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                borderColor: 'rgba(239, 68, 68, 0.3)',
              }}
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-200 mb-1">Playing 11 Not Set</h3>
                <p style={{ color: WPLColors.textSecondary }} className="text-sm">
                  Please set the Playing 11 for both teams before starting live scoring.{' '}
                  <button
                    onClick={() => router.push('/wpl-admin-2026/playing-11')}
                    className="underline hover:text-red-300 transition-colors font-medium"
                  >
                    Go to Playing 11
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* Content Area */}
          {selectedMatch ? (
            <div
              className="rounded-2xl p-6 md:p-8 backdrop-blur-xl border"
              style={{
                background: WPLColors.purpleRGBA[10],
                borderColor: WPLColors.purpleRGBA[30],
              }}
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
                  league="wpl"
                  playing11={selectedMatch.playing11}
                  initialState={liveScoreState}
                />
              )}
            </div>
          ) : (
            <div
              className="rounded-2xl p-12 text-center backdrop-blur-xl border"
              style={{
                background: WPLColors.purpleRGBA[10],
                borderColor: WPLColors.purpleRGBA[30],
              }}
            >
              <p className="text-lg" style={{ color: WPLColors.textSecondary }}>
                Please select a match to start scoring
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
