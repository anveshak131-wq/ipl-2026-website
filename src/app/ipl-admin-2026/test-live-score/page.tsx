'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import BallEntryPanel from '@/components/admin/live-score/BallEntryPanel';
import AuroraBackground from '@/components/ui/AuroraBackground';
import { LiveScoreState } from '@/hooks/useLiveScore';
import { LoadingSpinner } from '@/components/admin/animations';
import { TestTube } from 'lucide-react';
import { useLeague } from '@/contexts/LeagueContext';
import { WPLColors } from '@/lib/wplColors';

export default function TestLiveScorePage() {
  const router = useRouter();
  const { currentLeague } = useLeague();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

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
      <AdminSidebar currentPage="/ipl-admin-2026/test-live-score" />
      
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
              players={[]}
                    league={currentLeague}
            />
            </div>
        </div>
      </main>
    </div>
  );
}

