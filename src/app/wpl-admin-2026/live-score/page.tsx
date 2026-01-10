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
  const router = useRouter();
  const { currentLeague } = useLeague();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
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
        const savedMatchId = typeof window !== 'undefined' ? localStorage.getItem('wpl-live-score-matchId') : null;
        const [matchesData, playersData] = await Promise.all([
          api.getMatches('wpl'),
          api.getPlayers(undefined, 'wpl'),
        ]);
        
        setMatches(matchesData);
        setPlayers(playersData);

        if (savedMatchId && Array.isArray(matchesData) && matchesData.some(m => m.id === savedMatchId)) {
          setSelectedMatchId(savedMatchId);
        } else if (matchesData && Array.isArray(matchesData) && matchesData.length > 0) {
          const preferred = matchesData.find(m => m.status === 'live') || matchesData.find(m => m.status === 'upcoming') || matchesData[0];
          if (preferred) {
            setSelectedMatchId(preferred.id);
          }
        }
        setHasInitialized(true);
      } catch (error) {
        console.error('Error loading data:', error);
        setHasInitialized(true);
      }
    };

    initializeData();
  }, [isAuthenticated, hasInitialized]);

  const selectedMatch = matches.find(m => m.id === selectedMatchId);

  const handleSaveLiveScore = async (state: LiveScoreState) => {
    if (!selectedMatch) return;

    setSaveStatus('saving');
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

      if (!response.ok) throw new Error('Failed to save');
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving:', error);
      setSaveStatus('error');
    }
  };

  const bgStyle = {
    background: `linear-gradient(to bottom, ${WPLColors.base}, ${WPLColors.gradientStart}66, ${WPLColors.gradientMid}33, ${WPLColors.base})`
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
      
      <main className="flex-1 relative z-20 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-8 h-8" style={{ color: WPLColors.pink }} />
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
            <p style={{ color: WPLColors.textSecondary }}>
              Record ball-by-ball live cricket scores
            </p>
          </div>

          {/* Match Selector */}
          {selectedMatch && (
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
                    {match.team1?.shortName || match.team1?.name || 'Team 1'} vs {match.team2?.shortName || match.team2?.name || 'Team 2'} · {new Date(match.date || Date.now()).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Live Score Entry */}
          {selectedMatch ? (
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
          ) : (
            <div
              className="rounded-2xl p-12 text-center backdrop-blur-xl border"
              style={{
                background: WPLColors.purpleRGBA[10],
                borderColor: WPLColors.purpleRGBA[30],
              }}
            >
              <p className="text-lg" style={{ color: WPLColors.textSecondary }}>
                Loading matches...
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
