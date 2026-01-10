'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import BallEntryPanel from '@/components/admin/live-score/BallEntryPanel';
import AuroraBackground from '@/components/ui/AuroraBackground';
import { LiveScoreState } from '@/hooks/useLiveScore';
import { LoadingSpinner } from '@/components/admin/animations';
import { Activity } from 'lucide-react';
import { useLeague } from '@/contexts/LeagueContext';
import { WPLColors } from '@/lib/wplColors';
import { Player, Match } from '@/types';
import { api } from '@/lib/data';

export default function WPLLiveScorePage() {
  // Immediate console log on render
  if (typeof window !== 'undefined') {
    console.log('[WPLLiveScore] Page rendering', new Date().toISOString());
  }

  const router = useRouter();
  const { currentLeague } = useLeague();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');

  // Step 1: Check authentication
  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('[WPLLiveScore] Checking authentication...');
    const token = localStorage.getItem('adminToken');
    
    if (!token) {
      console.log('[WPLLiveScore] No token found, redirecting...');
      router.push('/wpl-admin-2026');
      return;
    }

    console.log('[WPLLiveScore] Token found, authenticated');
    setIsAuthenticated(true);
  }, [router]);

  // Step 2: Load data after authentication confirmed
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadData = async () => {
      try {
        console.log('[WPLLiveScore] Loading matches and players...');
        
        const [matchesData, playersData] = await Promise.all([
          api.getMatches('wpl'),
          api.getPlayers(undefined, 'wpl'),
        ]);

        console.log('[WPLLiveScore] Data loaded successfully', {
          matches: matchesData?.length || 0,
          players: playersData?.length || 0,
        });

        setMatches(matchesData || []);
        setPlayers(playersData || []);

        // Select first match or saved match
        const savedMatchId = localStorage.getItem('wpl-live-score-matchId');
        const defaultMatch = (matchesData && matchesData.length > 0) 
          ? matchesData.find(m => m.id === savedMatchId) || matchesData[0]
          : null;

        if (defaultMatch) {
          setSelectedMatchId(defaultMatch.id);
        }

        setIsLoading(false);
      } catch (err) {
        console.error('[WPLLiveScore] Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setIsLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated]);

  const selectedMatch = matches.find(m => m.id === selectedMatchId);

  const handleSaveLiveScore = async (state: LiveScoreState) => {
    if (!selectedMatch) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/live-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          matchId: selectedMatch.id,
          scoreUpdate: {
            team1: {
              name: selectedMatch.team1?.shortName || selectedMatch.team1?.name || 'Team 1',
              runs: state.team1?.runs || 0,
              wickets: state.team1?.wickets || 0,
              overs: Math.floor((state.team1?.balls || 0) / 6) + '.' + ((state.team1?.balls || 0) % 6),
            },
            team2: {
              name: selectedMatch.team2?.shortName || selectedMatch.team2?.name || 'Team 2',
              runs: state.team2?.runs || 0,
              wickets: state.team2?.wickets || 0,
              overs: Math.floor((state.team2?.balls || 0) / 6) + '.' + ((state.team2?.balls || 0) % 6),
            },
            currentBatter: state.currentBatter,
            currentBowler: state.currentBowler,
            status: 'Live',
            innings: state.innings,
            battingTeam: state.battingTeam,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save score');
      }
    } catch (err) {
      console.error('[WPLLiveScore] Error saving score:', err);
    }
  };

  // Styles
  const bgStyle = {
    background: `linear-gradient(to bottom, ${WPLColors.base}, ${WPLColors.gradientStart}66, ${WPLColors.gradientMid}33, ${WPLColors.base})`
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen" style={bgStyle}>
        <AuroraBackground />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" color={WPLColors.pink} />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-screen" style={bgStyle}>
        <AuroraBackground />
        <AdminSidebar currentPage="/wpl-admin-2026/live-score" />
        <main className="flex-1 relative z-20 p-8 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2" style={{ color: WPLColors.textPrimary }}>Error</h2>
            <p style={{ color: WPLColors.textSecondary }}>{error}</p>
          </div>
        </main>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // No matches
  if (matches.length === 0) {
    return (
      <div className="flex min-h-screen" style={bgStyle}>
        <AuroraBackground />
        <AdminSidebar currentPage="/wpl-admin-2026/live-score" />
        <main className="flex-1 relative z-20 p-8 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2" style={{ color: WPLColors.textPrimary }}>No Matches</h2>
            <p style={{ color: WPLColors.textSecondary }}>No WPL matches available</p>
          </div>
        </main>
      </div>
    );
  }

  // Main render
  return (
    <div className="flex min-h-screen" style={bgStyle}>
      <AuroraBackground />
      <AdminSidebar currentPage="/wpl-admin-2026/live-score" />
      
      <main className="flex-1 relative z-20 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-8 h-8" style={{ color: WPLColors.pink }} />
              <h1 
                className="text-4xl font-bold"
                style={{
                  background: `linear-gradient(to right, ${WPLColors.textPrimary}, ${WPLColors.purple}, ${WPLColors.pink})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Live Score
              </h1>
            </div>
            <p style={{ color: WPLColors.textSecondary }}>
              Record ball-by-ball live cricket scores
            </p>
          </div>

          {/* Match Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2" style={{ color: WPLColors.textPrimary }}>
              Select Match
            </label>
            <select
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
            >
              {matches.map((match) => (
                <option key={match.id} value={match.id}>
                  {match.team1?.shortName || match.team1?.name || 'Team 1'} vs {match.team2?.shortName || match.team2?.name || 'Team 2'}
                </option>
              ))}
            </select>
          </div>

          {/* Live Score Panel */}
          {selectedMatch && (
            <div 
              className="rounded-2xl p-6 md:p-8 backdrop-blur-xl border"
              style={{
                background: WPLColors.purpleRGBA[10],
                borderColor: WPLColors.purpleRGBA[30],
              }}
            >
              <BallEntryPanel
                matchId={selectedMatch.id || ''}
                team1Name={selectedMatch.team1?.shortName || selectedMatch.team1?.name || 'Team 1'}
                team2Name={selectedMatch.team2?.shortName || selectedMatch.team2?.name || 'Team 2'}
                team1Id={selectedMatch.team1?.id || ''}
                team2Id={selectedMatch.team2?.id || ''}
                onSave={handleSaveLiveScore}
                players={players}
                league={currentLeague}
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
                isTestPage={true}
                venue={selectedMatch.venue || ''}
                date={selectedMatch.date?.split('T')[0] || new Date().toISOString().split('T')[0]}
                time={selectedMatch.time || '19:30'}
                isEveningMatch={selectedMatch.isEveningMatch !== false}
                toss={selectedMatch.toss}
                weather={selectedMatch.weather}
                pitchReport={selectedMatch.pitchReport || ''}
                headToHead={selectedMatch.headToHead}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
