"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import WPLAdminSidebarNew from '@/components/admin/WPLAdminSidebarNew';
import BallEntryPanel from '@/components/admin/live-score/BallEntryPanel';
import AuroraBackground from '@/components/ui/AuroraBackground';
import { LiveScoreState } from '@/hooks/useLiveScore';
import { LoadingSpinner } from '@/components/admin/animations';
import { useLeague } from '@/contexts/LeagueContext';
import { WPLColors } from '@/lib/wplColors';
import { Player, Match } from '@/types';
import { api } from '@/lib/data';

export default function WPLLiveScorePage() {
  const router = useRouter();
  const { currentLeague } = useLeague();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/wpl-admin-2026');
      return;
    }
    setIsAuthenticated(true);
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let mounted = true;
    (async () => {
      setIsLoading(true);
      try {
        const [m, p] = await Promise.all([api.getMatches('wpl'), api.getPlayers(undefined, 'wpl')]);
        if (!mounted) return;
        setMatches(m || []);
        setPlayers(p || []);
        const saved = localStorage.getItem('wpl-live-score-matchId');
        if (saved && m?.length) setSelectedMatchId(saved);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  const selectedMatch = matches.find((x) => x.id === selectedMatchId) || null;

  const getLocalKey = (matchId: string) => `liveScore_wpl_${matchId}`;

  const handleSaveLiveScore = async (state: LiveScoreState) => {
    if (!selectedMatch) return;
    try {
      const key = getLocalKey(selectedMatch.id);
      localStorage.setItem(key, JSON.stringify({ ...state, lastUpdated: new Date().toISOString() }));
      const token = localStorage.getItem('adminToken');
      await fetch('/api/live-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ matchId: selectedMatch.id, scoreUpdate: state }),
      });
    } catch (err) {
      console.error('Failed to save live score', err);
    }
  };

  const bgStyle = { background: `linear-gradient(to bottom, ${WPLColors.base}, ${WPLColors.gradientStart}66)` };

  if (!isAuthenticated) return null;

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

  return (
    <div className="flex min-h-screen" style={bgStyle}>
      <AuroraBackground />
      <WPLAdminSidebarNew />
      <main className="flex-1 p-6 md:p-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-4" style={{ color: WPLColors.textPrimary }}>
            Live Score — Admin (WPL)
          </h1>

          <div className="mb-6">
            <label className="block text-sm mb-2">Select Match</label>
            <select
              className="w-full px-3 py-2 rounded"
              value={selectedMatchId}
              onChange={(e) => {
                setSelectedMatchId(e.target.value);
                localStorage.setItem('wpl-live-score-matchId', e.target.value);
              }}
            >
              <option value="">Select a match...</option>
              {matches.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.team1?.shortName} vs {m.team2?.shortName} · {new Date(m.date).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          {selectedMatch && (
            <div className="rounded-2xl p-6 md:p-8 backdrop-blur-xl border" style={{ background: WPLColors.purpleRGBA[10], borderColor: WPLColors.purpleRGBA[30] }}>
              <BallEntryPanel
                matchId={selectedMatch.id}
                team1Name={selectedMatch.team1?.shortName || selectedMatch.team1?.name || 'Team 1'}
                team2Name={selectedMatch.team2?.shortName || selectedMatch.team2?.name || 'Team 2'}
                team1Id={selectedMatch.team1?.id || ''}
                team2Id={selectedMatch.team2?.id || ''}
                onSave={handleSaveLiveScore}
                players={players}
                league={currentLeague}
                initialState={undefined}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
