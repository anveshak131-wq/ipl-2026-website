"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import BallEntryPanel from '@/components/admin/live-score/BallEntryPanel';
import AuroraBackground from '@/components/ui/AuroraBackground';
import { Match, Player } from '@/types';
import { LiveScoreState, BallEvent } from '@/hooks/useLiveScore';
import { api } from '@/lib/data';
import { LoadingSpinner } from '@/components/admin/animations';
import { Activity } from 'lucide-react';

const LEAGUE = 'ipl' as const;

export default function AdminIplLiveScorePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');

  const [initialLiveState, setInitialLiveState] = useState<LiveScoreState | undefined>(undefined);

  const getLocalStorageKeyForMatch = (matchId: string) => `liveScore_${LEAGUE}_${matchId}`;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('adminToken') || 
                  localStorage.getItem('auth_token') ||
                  localStorage.getItem('authToken');
    if (!token) {
      router.push('/admin/ipl');
      return;
    }
    setIsAuthenticated(true);
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadData = async () => {
      try {
        const [matchesData, playersData] = await Promise.all([
          api.getMatches(LEAGUE),
          api.getPlayers(undefined, LEAGUE),
        ]);

        setMatches(matchesData || []);
        setPlayers(playersData || []);

        const savedMatchId = localStorage.getItem('ipl-live-score-matchId');
        const defaultMatch = (matchesData && matchesData.length > 0)
          ? matchesData.find((m) => m.id === savedMatchId) ||
            matchesData.find((m) => m.status === 'live') ||
            matchesData.find((m) => m.status === 'upcoming') ||
            matchesData[0]
          : null;

        if (defaultMatch) {
          setSelectedMatchId(defaultMatch.id);
        }
      } catch (err) {
        console.error('[AdminIplLiveScore] Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated]);

  const selectedMatch = useMemo(
    () => matches.find((m) => m.id === selectedMatchId) || null,
    [matches, selectedMatchId]
  );

  useEffect(() => {
    if (!selectedMatchId || !selectedMatch) {
      setInitialLiveState(undefined);
      return;
    }

    const localKey = getLocalStorageKeyForMatch(selectedMatchId);
    const localData = localStorage.getItem(localKey);

    let parsedLocal: any | undefined = undefined;
    if (localData) {
      try {
        parsedLocal = JSON.parse(localData);
      } catch (e) {
        console.error('[AdminIplLiveScore] Error parsing localStorage data:', e);
      }
    }

    const matchToss = selectedMatch.matchState?.toss
      ? { winner: selectedMatch.matchState.toss.winner, decision: selectedMatch.matchState.toss.decision }
      : undefined;

    const matchImpactPlayer = (selectedMatch as any).impactPlayer;

    const merged: any = {
      ...(parsedLocal || {}),
      ...(parsedLocal?.toss ? {} : matchToss ? { toss: matchToss } : {}),
      ...(parsedLocal?.matchState ? {} : selectedMatch.matchState ? { matchState: selectedMatch.matchState } : {}),
      ...(parsedLocal?.impactPlayer ? {} : matchImpactPlayer ? { impactPlayer: matchImpactPlayer } : {}),
    };

    const hasAnyInitial =
      Boolean(parsedLocal) ||
      Boolean(matchToss) ||
      Boolean(selectedMatch.matchState) ||
      Boolean(matchImpactPlayer);

    setInitialLiveState(hasAnyInitial ? (merged as LiveScoreState) : undefined);
  }, [selectedMatchId, selectedMatch]);

  useEffect(() => {
    if (!selectedMatchId || !isAuthenticated) return;

    const refreshMatchData = async () => {
      try {
        const updatedMatches = await api.getMatches(LEAGUE);
        setMatches(updatedMatches || []);
      } catch (err) {
        console.error('[AdminIplLiveScore] Error refreshing match data:', err);
      }
    };

    refreshMatchData();
    const interval = setInterval(refreshMatchData, 10000);
    return () => clearInterval(interval);
  }, [selectedMatchId, isAuthenticated]);

  const handleSaveLiveScore = async (state: LiveScoreState) => {
    if (!selectedMatch) return;

    try {
      const localKey = getLocalStorageKeyForMatch(selectedMatch.id);
      const fullStateToSave = {
        ...state,
        lastUpdated: new Date().toISOString(),
        matchId: selectedMatch.id,
      };
      localStorage.setItem(localKey, JSON.stringify(fullStateToSave));

      const token = localStorage.getItem('adminToken') || 
                  localStorage.getItem('auth_token') ||
                  localStorage.getItem('authToken');

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
        currentBatter: state.currentBatter ? {
          name: state.currentBatter.name,
          runs: state.currentBatter.runs,
          balls: state.currentBatter.balls,
        } : undefined,
        currentBowler: state.currentBowler ? {
          name: state.currentBowler.name,
          runs: state.currentBowler.runs,
          balls: state.currentBowler.balls,
        } : undefined,
        commentary: (state.ballHistory && Array.isArray(state.ballHistory))
          ? state.ballHistory.slice(-10).map((ball: any) => {
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
    } catch (error) {
      console.error('[AdminIplLiveScore] Error saving score:', error);
    }
  };

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

  const bgStyle = { background: '#0B0F13' };
  const spinnerColor = '#FFD700';
  const headerGradient = 'linear-gradient(to right, white, #93C5FD, #67E8F9)';

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

  if (error) {
    return (
      <div className="flex min-h-screen" style={bgStyle}>
        <AuroraBackground />
        <main className="flex-1 relative z-20 p-8 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2 text-white">Error</h2>
            <p className="text-gray-400">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="flex min-h-screen" style={bgStyle}>
        <AuroraBackground />

        <main className="flex-1 relative z-20 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <Activity className="w-8 h-8 text-cyan-300" />
                <h1
                  className="text-4xl font-bold"
                  style={{
                    background: headerGradient,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Live Score
                </h1>
              </div>
              <p className="text-gray-400">Create and manage IPL match scorecards</p>
            </div>

            <div className="rounded-2xl p-6 md:p-8 backdrop-blur-xl border flex flex-col items-center gap-4"
              style={{ background: 'rgba(30, 41, 59, 0.6)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
              <div className="text-lg font-medium text-white">
                {matches.length} IPL matches available • {players.length} IPL players loaded
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/admin/ipl/matchday')}
                  className="px-4 py-2 rounded-lg font-semibold text-white bg-cyan-600 hover:bg-cyan-700 transition-colors"
                >
                  Create Match
                </button>

                <button
                  onClick={() => router.push('/admin/ipl/players')}
                  className="px-4 py-2 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Import Players
                </button>
              </div>

              <p className="text-sm mt-2 text-gray-400">
                You can create a match or import players to get started with live scoring.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const matchToss = selectedMatch?.matchState?.toss;
  const hasPlaying11 =
    Boolean(selectedMatch?.playing11?.team1?.length) &&
    Boolean(selectedMatch?.playing11?.team2?.length);

  return (
    <>
      <AuroraBackground />

      <main className="flex-1 relative z-20 p-4 md:p-8 overflow-y-auto" style={{ position: 'relative', zIndex: 20 }}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-8 h-8 text-cyan-300" />
              <h1
                className="text-4xl font-bold"
                style={{
                  background: headerGradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Live Score
              </h1>
            </div>
            <p className="text-gray-400">Record ball-by-ball live cricket scores (IPL)</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-white">
              Select Match
            </label>
            <select
              value={selectedMatchId}
              onChange={(e) => {
                setSelectedMatchId(e.target.value);
                localStorage.setItem('ipl-live-score-matchId', e.target.value);
              }}
              className="w-full md:w-96 px-4 py-3 rounded-lg text-white text-sm focus:outline-none transition-colors"
              style={{
                background: '#0F172A',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              {matches.map((match) => (
                <option key={match.id} value={match.id}>
                  {match.team1?.shortName || match.team1?.name || 'Team 1'} vs {match.team2?.shortName || match.team2?.name || 'Team 2'}
                </option>
              ))}
            </select>
          </div>

          {selectedMatch && matchToss && (
            <div
              className="rounded-2xl p-4 md:p-6 backdrop-blur-xl border mb-6"
              style={{
                background: 'rgba(30, 41, 59, 0.6)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-400">
                  🪙 Toss (from Scorecard):
                </div>
                <div className="font-semibold text-white">
                  {matchToss.winner === 'team1' ? selectedMatch.team1?.name : selectedMatch.team2?.name} won and elected to {matchToss.decision}
                </div>
                <div className="ml-auto">
                  <a
                    href="/admin/ipl/scorecard"
                    className="text-xs px-3 py-1.5 rounded-lg transition-colors hover:opacity-80 bg-cyan-600 text-white"
                  >
                    Edit in Scorecard
                  </a>
                </div>
              </div>
            </div>
          )}

          {selectedMatch && !matchToss && (
            <div
              className="rounded-2xl p-4 md:p-6 backdrop-blur-xl border mb-6"
              style={{
                background: 'rgba(234, 179, 8, 0.1)',
                borderColor: 'rgba(234, 179, 8, 0.3)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="text-sm text-yellow-300">
                  ⚠️ Toss not set yet - Set it in Scorecard first
                </div>
                <div className="ml-auto">
                  <a
                    href="/admin/ipl/scorecard"
                    className="text-xs px-3 py-1.5 rounded-lg transition-colors hover:opacity-80 bg-yellow-500 text-black font-semibold"
                  >
                    Set in Scorecard
                  </a>
                </div>
              </div>
            </div>
          )}

          {selectedMatch && !hasPlaying11 && (
            <div
              className="rounded-2xl p-4 md:p-6 backdrop-blur-xl border mb-6"
              style={{
                background: 'rgba(59, 130, 246, 0.08)',
                borderColor: 'rgba(59, 130, 246, 0.25)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="text-sm text-blue-200">
                  ⚠️ Playing 11 not set yet - IPL live scoring works best with Playing 11 + Impact Player configured
                </div>
                <div className="ml-auto">
                  <a
                    href="/admin/ipl/playing-11"
                    className="text-xs px-3 py-1.5 rounded-lg transition-colors hover:opacity-80 bg-blue-600 text-white"
                  >
                    Set Playing 11
                  </a>
                </div>
              </div>
            </div>
          )}

          {selectedMatch && (
            <div
              className="rounded-2xl p-6 md:p-8 backdrop-blur-xl border"
              style={{
                background: 'rgba(30, 41, 59, 0.4)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <BallEntryPanel
                matchId={selectedMatch.id || ''}
                team1Name={selectedMatch.team1?.shortName || selectedMatch.team1?.name || 'Team 1'}
                team2Name={selectedMatch.team2?.shortName || selectedMatch.team2?.name || 'Team 2'}
                team1Id={selectedMatch.team1?.id || ''}
                team2Id={selectedMatch.team2?.id || ''}
                onSave={handleSaveLiveScore}
                players={players.filter(
                  (p) => p.teamId === selectedMatch.team1?.id || p.teamId === selectedMatch.team2?.id
                )}
                league={LEAGUE}
                initialBatter={
                  selectedMatch.playing11?.team1?.[0]
                    ? {
                        id: selectedMatch.playing11.team1[0],
                        name: players.find(p => p.id === selectedMatch.playing11?.team1?.[0])?.name || 'Batter',
                      }
                    : { id: '', name: 'Select Batter' }
                }
                initialBowler={
                  selectedMatch.playing11?.team2?.[0]
                    ? {
                        id: selectedMatch.playing11.team2[0],
                        name: players.find(p => p.id === selectedMatch.playing11?.team2?.[0])?.name || 'Bowler',
                      }
                    : { id: '', name: 'Select Bowler' }
                }
                playing11={selectedMatch.playing11}
                venue={selectedMatch.venue || ''}
                date={selectedMatch.date?.split('T')[0] || new Date().toISOString().split('T')[0]}
                time={selectedMatch.time || '19:30'}
                isEveningMatch={selectedMatch.isEveningMatch !== false}
                toss={(selectedMatch.matchState?.toss || undefined) as any}
                weather={selectedMatch.weather as any}
                pitchReport={(selectedMatch as any).pitchReport || ''}
                headToHead={(selectedMatch as any).headToHead}
                resultType={selectedMatch.resultType}
                isPlayoff={Boolean(selectedMatch.playoffType)}
                initialState={initialLiveState}
              />
            </div>
          )}
        </div>
      </main>
    </>
  );
}
