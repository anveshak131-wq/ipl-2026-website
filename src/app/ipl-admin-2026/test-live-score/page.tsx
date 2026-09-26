'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BallEntryPanel from '@/components/admin/live-score/BallEntryPanel';
import AuroraBackground from '@/components/ui/AuroraBackground';
import { LiveScoreState } from '@/hooks/useLiveScore';
import { LoadingSpinner } from '@/components/admin/animations';
import { TestTube } from 'lucide-react';
import { useLeague } from '@/contexts/LeagueContext';
import { WPLColors } from '@/lib/wplColors';
import { Player } from '@/types';

export default function TestLiveScorePage() {
  const router = useRouter();
  const { currentLeague } = useLeague();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Dummy players for testing Impact Player feature
  const dummyPlayers: Player[] = [
    // Team A players (playing 11)
    { id: 'p1', name: 'Batter 1', teamId: 'team-a', role: 'Batsman', league: currentLeague },
    { id: 'p2', name: 'Batter 2', teamId: 'team-a', role: 'Batsman', league: currentLeague },
    { id: 'p3', name: 'All-rounder 1', teamId: 'team-a', role: 'All-rounder', league: currentLeague },
    { id: 'p4', name: 'Bowler 1', teamId: 'team-a', role: 'Bowler', league: currentLeague },
    { id: 'p5', name: 'Bowler 2', teamId: 'team-a', role: 'Bowler', league: currentLeague },
    { id: 'p6', name: 'WK 1', teamId: 'team-a', role: 'Wicket-keeper', league: currentLeague },
    { id: 'p7', name: 'Batter 3', teamId: 'team-a', role: 'Batsman', league: currentLeague },
    { id: 'p8', name: 'Bowler 3', teamId: 'team-a', role: 'Bowler', league: currentLeague },
    { id: 'p9', name: 'All-rounder 2', teamId: 'team-a', role: 'All-rounder', league: currentLeague },
    { id: 'p10', name: 'Bowler 4', teamId: 'team-a', role: 'Bowler', league: currentLeague },
    { id: 'p11', name: 'Batter 4', teamId: 'team-a', role: 'Batsman', league: currentLeague },
    // Team A Impact Player options (not in playing 11)
    { id: 'p12', name: 'Impact Batter', teamId: 'team-a', role: 'Batsman', league: currentLeague },
    { id: 'p13', name: 'Impact Bowler', teamId: 'team-a', role: 'Bowler', league: currentLeague },
    // Team B players (playing 11)
    { id: 'p14', name: 'Batter 5', teamId: 'team-b', role: 'Batsman', league: currentLeague },
    { id: 'p15', name: 'Batter 6', teamId: 'team-b', role: 'Batsman', league: currentLeague },
    { id: 'p16', name: 'All-rounder 3', teamId: 'team-b', role: 'All-rounder', league: currentLeague },
    { id: 'p17', name: 'Bowler 5', teamId: 'team-b', role: 'Bowler', league: currentLeague },
    { id: 'p18', name: 'Bowler 6', teamId: 'team-b', role: 'Bowler', league: currentLeague },
    { id: 'p19', name: 'WK 2', teamId: 'team-b', role: 'Wicket-keeper', league: currentLeague },
    { id: 'p20', name: 'Batter 7', teamId: 'team-b', role: 'Batsman', league: currentLeague },
    { id: 'p21', name: 'Bowler 7', teamId: 'team-b', role: 'Bowler', league: currentLeague },
    { id: 'p22', name: 'All-rounder 4', teamId: 'team-b', role: 'All-rounder', league: currentLeague },
    { id: 'p23', name: 'Bowler 8', teamId: 'team-b', role: 'Bowler', league: currentLeague },
    { id: 'p24', name: 'Batter 8', teamId: 'team-b', role: 'Batsman', league: currentLeague },
    // Team B Impact Player options (not in playing 11)
    { id: 'p25', name: 'Impact All-rounder', teamId: 'team-b', role: 'All-rounder', league: currentLeague },
    { id: 'p26', name: 'Impact Spinner', teamId: 'team-b', role: 'Bowler', league: currentLeague },
  ];

  // Dummy playing 11
  const dummyPlaying11 = {
    team1: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p11'],
    team2: ['p14', 'p15', 'p16', 'p17', 'p18', 'p19', 'p20', 'p21', 'p22', 'p23', 'p24'],
  };

  // Initial batter and bowler for testing
  const initialBatter = { id: 'p1', name: 'Batter 1' };
  const initialBowler = { id: 'p17', name: 'Bowler 5' };

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

  const handleSaveLiveScore = async (state: LiveScoreState) => {
    // Test page - just log the state, no actual saving needed
    console.log('Test Live Score State:', state);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
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
      
      <main className="flex-1 relative z-20 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
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
                Test Live Score
                  </h1>
            </div>
            <p style={{ color: isWPL ? WPLColors.textSecondary : '#9CA3AF' }}>
              Simple test interface for live score functionality - no match or player selection required
            </p>
          </div>

          {/* Live Score Entry */}
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
                  <BallEntryPanel
                    matchId="test-match"
                    team1Name="Team A"
                    team2Name="Team B"
                    team1Id="team-a"
                    team2Id="team-b"
                    onSave={handleSaveLiveScore}
                    players={dummyPlayers}
                    league={currentLeague}
                    initialBatter={initialBatter}
                    initialBowler={initialBowler}
                    playing11={dummyPlaying11}
                    isTestPage={true}
                    venue="Test Stadium"
                    date={new Date().toISOString().split('T')[0]}
                    time="19:30"
                    isEveningMatch={true} // Evening match for two-ball rule testing
                    toss={{
                      winner: 'team1',
                      decision: 'bat',
                    }}
                    pitchReport="Hard and dry surface with even bounce. Good for stroke play. Expected to assist both batters and bowlers equally."
                    headToHead={{
                      matches: 15,
                      team1Wins: 8,
                      team2Wins: 7,
                      lastResult: 'Team A won by 5 wickets',
                    }}
                  />
            </div>
        </div>
      </main>
    </div>
  );
}
