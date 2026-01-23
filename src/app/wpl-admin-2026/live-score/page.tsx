'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WPLAdminSidebarNew from '@/components/admin/WPLAdminSidebarNew';
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
  const [initialLiveState, setInitialLiveState] = useState<LiveScoreState | undefined>(undefined);

  const getLocalStorageKeyForMatch = (matchId: string) => `liveScore_wpl_${matchId}`;

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

  useEffect(() => {
    if (!selectedMatchId) {
      setInitialLiveState(undefined);
      return;
    }

    const localKey = getLocalStorageKeyForMatch(selectedMatchId);
    const localData = localStorage.getItem(localKey);
    
    if (localData) {
      try {
        const parsedLocal = JSON.parse(localData);
        console.log('[WPLLiveScore] Loaded from localStorage:', parsedLocal);
        setInitialLiveState(parsedLocal);
      } catch (e) {
        console.error('[WPLLiveScore] Error parsing localStorage data:', e);
        setInitialLiveState(undefined);
      }
    } else {
      setInitialLiveState(undefined);
    }
  }, [selectedMatchId]);

  useEffect(() => {
    if (!selectedMatchId || !isAuthenticated) return;

    const refreshMatchData = async () => {
      try {
        const updatedMatches = await api.getMatches('wpl');
        setMatches(updatedMatches || []);
      } catch (err) {
        console.error('[WPLLiveScore] Error refreshing match data:', err);
      }
    };

    refreshMatchData();

    const interval = setInterval(refreshMatchData, 10000);
    return () => clearInterval(interval);
  }, [selectedMatchId, isAuthenticated]);

  const selectedMatch = matches.find(m => m.id === selectedMatchId);

  const getLocalStorageKey = (matchId: string) => `liveScore_wpl_${matchId}`;

  const handleSaveLiveScore = async (state: LiveScoreState) => {
    if (!selectedMatch) return;

    try {
      const localKey = getLocalStorageKey(selectedMatch.id);
      const fullStateToSave = {
        ...state,
        lastUpdated: new Date().toISOString(),
        matchId: selectedMatch.id,
      };
      localStorage.setItem(localKey, JSON.stringify(fullStateToSave));
      console.log('[WPLLiveScore] Saved full state to localStorage');

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

  const bgStyle = {
    background: `linear-gradient(to bottom, ${WPLColors.base}, ${WPLColors.gradientStart}66, ${WPLColors.gradientMid}33, ${WPLColors.base})`
  };

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

  if (error) {
    return (
      <div className="flex min-h-screen" style={bgStyle}>
        <AuroraBackground />
        <WPLAdminSidebarNew />
        <main className="flex-1 relative z-20 p-8 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2" style={{ color: WPLColors.textPrimary }}>Error</h2>
            <p style={{ color: WPLColors.textSecondary }}>{error}</p>
          </div>
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (matches.length === 0) {
    return (
      <div className="flex min-h-screen" style={bgStyle}>
        <AuroraBackground />
        <WPLAdminSidebarNew />

        <main className="flex-1 relative z-20 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
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
              <p style={{ color: WPLColors.textSecondary }}>Create and manage WPL match scorecards</p>
            </div>

            <div className="rounded-2xl p-6 md:p-8 backdrop-blur-xl border flex flex-col items-center gap-4"
              style={{ background: WPLColors.purpleRGBA[10], borderColor: WPLColors.purpleRGBA[30] }}>
              <div className="text-lg font-medium" style={{ color: WPLColors.textPrimary }}>
                {matches.length} WPL matches available • {players.length} WPL players loaded
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/wpl-admin-2026/matchday')}
                  className="px-4 py-2 rounded-lg font-semibold"
                  style={{ background: WPLColors.pink, color: '#fff' }}
                >
                  Create Match
                </button>

                <button
                  onClick={() => router.push('/wpl-admin-2026/players')}
                  className="px-4 py-2 rounded-lg font-semibold"
                  style={{ background: WPLColors.purple, color: '#fff' }}
                >
                  Import Players
                </button>
              </div>

              <p className="text-sm mt-2" style={{ color: WPLColors.textSecondary }}>
                You can create a match or import players to get started with live scoring.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={bgStyle}>
      <AuroraBackground />
      <WPLAdminSidebarNew />
      
      <main className="flex-1 relative z-20 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
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

          {selectedMatch && selectedMatch.matchState?.toss && (
            <div 
              className="rounded-2xl p-4 md:p-6 backdrop-blur-xl border mb-6"
              style={{
                background: WPLColors.purpleRGBA[10],
                borderColor: WPLColors.purpleRGBA[30],
              }}
            >
              <div className="flex items-center gap-3">
                <div className="text-sm" style={{ color: WPLColors.textSecondary }}>
                  🪙 Toss (from Scorecard):
                </div>
                <div className="font-semibold" style={{ color: WPLColors.textPrimary }}>
                  {selectedMatch.matchState.toss.winner === 'team1' ? selectedMatch.team1?.name : selectedMatch.team2?.name} won and elected to {selectedMatch.matchState.toss.decision}
                </div>
                <div className="ml-auto">
                  <a 
                    href="/wpl-admin-2026/scorecard" 
                    className="text-xs px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
                    style={{ 
                      background: WPLColors.pink, 
                      color: '#fff' 
                    }}
                  >
                    Edit in Scorecard
                  </a>
                </div>
              </div>
            </div>
          )}

          {selectedMatch && !selectedMatch.matchState?.toss && (
            <div 
              className="rounded-2xl p-4 md:p-6 backdrop-blur-xl border mb-6"
              style={{
                background: 'rgba(234, 179, 8, 0.1)',
                borderColor: 'rgba(234, 179, 8, 0.3)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="text-sm" style={{ color: '#eab308' }}>
                  ⚠️ Toss not set yet - Set it below in Pre-Match or in Scorecard page
                </div>
                <div className="ml-auto">
                  <a 
                    href="/wpl-admin-2026/scorecard" 
                    className="text-xs px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
                    style={{ 
                      background: WPLColors.pink, 
                      color: '#fff' 
                    }}
                  >
                    Set in Scorecard
                  </a>
                </div>
              </div>
            </div>
          )}

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
                initialState={initialLiveState}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
"use client";

import { useEffect, useMemo, useState } from "react";
import WPLAdminSidebarNew from "@/components/admin/WPLAdminSidebarNew";
import AuroraBackground from "@/components/ui/AuroraBackground";
import { api } from "@/lib/data";
import { WPLColors } from "@/lib/wplColors";
import { Player, Team, Match } from "@/types";

const EVENT_TYPES = [
  "Dot",
  "Single",
  "Two",
  "Three",
  "Four",
  "Six",
  "Wicket",
  "No-ball",
  "Wide",
  "Bye",
  "Leg-bye",
];

function simpleTemplateCommentary({ eventType, batsman, bowler, runs, extras }: any) {
  // Lightweight rule-based commentary generator. Replaceable with AI backend.
  const r = runs || 0;
  switch (eventType) {
    case "Dot":
      return `${bowler} beats ${batsman} — no run.`;
    case "Single":
      return `${batsman} picks up a quick single off ${bowler}.`;
    case "Two":
      return `${batsman} nudges it into the gap — two runs.`;
    case "Three":
      return `${batsman} runs hard for three as the field hesitates.`;
    case "Four":
      return `${batsman} drives it beautifully — FOUR!`;
    case "Six":
      return `${batsman} sends that into the crowd — SIX!`;
    case "Wicket":
      return `OUT! ${batsman} is gone, ${bowler} with the breakthrough.`;
    case "No-ball":
      return `No-ball by ${bowler}${extras ? ` — ${extras}` : ""}. Free hit to follow.`;
    case "Wide":
      return `Wide down the leg side from ${bowler}.`;
    case "Bye":
      return `Byes — the ball sneaks past the keeper.`;
    case "Leg-bye":
      return `Leg-bye taken; the batsmen get through for a quick run.`;
    default:
      return `${batsman} - ${eventType}`;
  }
}

export default function WPLLiveScoreAdminPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);

  const [selectedMatchId, setSelectedMatchId] = useState<string>("");
  const [inning, setInning] = useState<1 | 2>(1);
  const [over, setOver] = useState<number>(0);

  const [selectedBowler, setSelectedBowler] = useState<string>("");
  const [selectedBatsman, setSelectedBatsman] = useState<string>("");
  const [eventType, setEventType] = useState<string>(EVENT_TYPES[0]);
  const [runs, setRuns] = useState<number | "">("");
  const [extras, setExtras] = useState<string>("");
  const [useAI, setUseAI] = useState<boolean>(false);

  const [commentary, setCommentary] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [m, p, t] = await Promise.all([
          api.getMatches("wpl"),
          api.getPlayers(undefined, "wpl"),
          api.getTeams("wpl"),
        ]);
        setMatches(m || []);
        setPlayers(p || []);
        setTeams(t || []);
      } catch (err) {
        console.error("Failed to load live-score assets:", err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const selectedMatch = useMemo(() => matches.find((x) => x.id === selectedMatchId) || null, [matches, selectedMatchId]);

  const team1Players = useMemo(() => {
    if (!selectedMatch) return [];
    return players.filter(p => String(p.teamId) === String(selectedMatch.team1.id) && (p.league || 'wpl') === (selectedMatch.league || 'wpl'));
  }, [players, selectedMatch]);

  const team2Players = useMemo(() => {
    if (!selectedMatch) return [];
    return players.filter(p => String(p.teamId) === String(selectedMatch.team2.id) && (p.league || 'wpl') === (selectedMatch.league || 'wpl'));
  }, [players, selectedMatch]);

  const allBowlers = useMemo(() => [...team1Players, ...team2Players].filter(p => p.role && p.role.toLowerCase().includes('bowler') || true), [team1Players, team2Players]);

  async function generateCommentaryText(payload: any) {
    // If admin chooses AI mode and server API exists, send to backend AI endpoint.
    if (useAI) {
      try {
        const res = await fetch('/api/ai/commentary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.ok) {
          const json = await res.json();
          return json.text || simpleTemplateCommentary(payload);
        }
        console.warn('AI endpoint returned non-OK, falling back to template');
      } catch (err) {
        console.warn('AI call failed, falling back to template', err);
      }
    }
    return simpleTemplateCommentary(payload);
  }

  const onAddEvent = async () => {
    if (!selectedMatch) {
      alert('Select a match first');
      return;
    }

    const batsmanName = players.find(p => p.id === selectedBatsman)?.name || selectedBatsman || 'Batsman';
    const bowlerName = players.find(p => p.id === selectedBowler)?.name || selectedBowler || 'Bowler';

    const payload = {
      eventType,
      batsman: batsmanName,
      bowler: bowlerName,
      runs: runs === '' ? 0 : Number(runs),
      extras,
      inning,
      over,
      match: selectedMatch ? { id: selectedMatch.id, teams: [selectedMatch.team1.shortName, selectedMatch.team2.shortName] } : null,
    };

    const text = await generateCommentaryText(payload);
    setCommentary(prev => [`${over}.0 — ${text}`, ...prev]);
  };

  const bgStyle = { background: `linear-gradient(to bottom, ${WPLColors.base}, ${WPLColors.gradientStart}66)` };

  return (
    <div className="flex min-h-screen" style={bgStyle}>
      <AuroraBackground />
      <WPLAdminSidebarNew />
      <main className="flex-1 p-6 md:p-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-4" style={{ color: WPLColors.textPrimary }}>Live Score — Admin (WPL)</h1>

          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <section className="rounded-lg p-4 bg-white/5 border" style={{ borderColor: WPLColors.purpleRGBA[30] }}>
                <label className="block text-sm mb-2">Select Match</label>
                <select className="w-full px-3 py-2 rounded" value={selectedMatchId} onChange={(e) => setSelectedMatchId(e.target.value)}>
                  <option value="">Select a match...</option>
                  {matches.map(m => (
                    <option key={m.id} value={m.id}>{m.team1.shortName} vs {m.team2.shortName} · {new Date(m.date).toLocaleDateString()}</option>
                  ))}
                </select>

                <div className="mt-4">
                  <label className="block text-sm mb-2">Inning</label>
                  <select className="w-full px-3 py-2 rounded" value={inning} onChange={(e) => setInning(Number(e.target.value) as 1 | 2)}>
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                  </select>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm mb-2">Over</label>
                    <input type="number" className="w-full px-3 py-2 rounded" value={over} onChange={(e) => setOver(Number(e.target.value))} min={0} />
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Bowler</label>
                    <select className="w-full px-3 py-2 rounded" value={selectedBowler} onChange={(e) => setSelectedBowler(e.target.value)}>
                      <option value="">Select bowler</option>
                      {allBowlers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm mb-2">Batsman</label>
                  <select className="w-full px-3 py-2 rounded" value={selectedBatsman} onChange={(e) => setSelectedBatsman(e.target.value)}>
                    <option value="">Select batsman</option>
                    {team1Players.concat(team2Players).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm mb-2">Event</label>
                    <select className="w-full px-3 py-2 rounded" value={eventType} onChange={(e) => setEventType(e.target.value)}>
                      {EVENT_TYPES.map(ev => <option key={ev} value={ev}>{ev}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Runs</label>
                    <input type="number" className="w-full px-3 py-2 rounded" value={runs as any} onChange={(e) => setRuns(e.target.value === "" ? "" : Number(e.target.value))} min={0} />
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Extras</label>
                    <input className="w-full px-3 py-2 rounded" value={extras} onChange={(e) => setExtras(e.target.value)} placeholder="n/a" />
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={useAI} onChange={(e) => setUseAI(e.target.checked)} />
                    <span className="text-sm">Use AI-enhanced commentary</span>
                  </label>
                  <button onClick={onAddEvent} className="ml-auto px-4 py-2 rounded bg-purple-600 text-white">Add Event</button>
                </div>
              </section>

              <section className="col-span-2 rounded-lg p-4 bg-white/5 border" style={{ borderColor: WPLColors.purpleRGBA[30] }}>
                <h2 className="text-xl font-semibold mb-3">Live Commentary</h2>
                <div className="flex gap-2 mb-4">
                  <button onClick={() => setCommentary([])} className="px-3 py-1 rounded bg-red-600/60">Clear</button>
                </div>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                  {commentary.length === 0 ? (
                    <div className="text-sm text-gray-300">No events yet. Use the controls to add ball-by-ball events (dropdowns instead of buttons).</div>
                  ) : (
                    commentary.map((c, i) => (
                      <div key={i} className="p-3 bg-black/20 rounded">
                        <div className="text-sm text-white">{c}</div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WPLAdminSidebarNew from '@/components/admin/WPLAdminSidebarNew';
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
  const [initialLiveState, setInitialLiveState] = useState<LiveScoreState | undefined>(undefined);

  // Helper to get localStorage key for a match
  const getLocalStorageKeyForMatch = (matchId: string) => `liveScore_wpl_${matchId}`;

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

  // Load initial state from localStorage when match is selected
  useEffect(() => {
    if (!selectedMatchId) {
      setInitialLiveState(undefined);
      return;
    }

    const localKey = getLocalStorageKeyForMatch(selectedMatchId);
    const localData = localStorage.getItem(localKey);
    
    if (localData) {
      try {
        const parsedLocal = JSON.parse(localData);
        console.log('[WPLLiveScore] Loaded from localStorage:', parsedLocal);
        setInitialLiveState(parsedLocal);
      } catch (e) {
        console.error('[WPLLiveScore] Error parsing localStorage data:', e);
        setInitialLiveState(undefined);
      }
    } else {
      setInitialLiveState(undefined);
    }
  }, [selectedMatchId]);

  // Refresh match data when selected match changes (to get latest toss info from scorecard)
  // Also refresh periodically every 10 seconds to catch updates
  useEffect(() => {
    if (!selectedMatchId || !isAuthenticated) return;

    const refreshMatchData = async () => {
      try {
        const updatedMatches = await api.getMatches('wpl');
        setMatches(updatedMatches || []);
      } catch (err) {
        console.error('[WPLLiveScore] Error refreshing match data:', err);
      }
    };

    // Refresh immediately when match selected
    refreshMatchData();

    // Then refresh every 10 seconds to catch toss updates from scorecard
    const interval = setInterval(refreshMatchData, 10000);
    return () => clearInterval(interval);
  }, [selectedMatchId, isAuthenticated]);

  const selectedMatch = matches.find(m => m.id === selectedMatchId);

  // Helper to get localStorage key for a match
  const getLocalStorageKey = (matchId: string) => `liveScore_wpl_${matchId}`;

  const handleSaveLiveScore = async (state: LiveScoreState) => {
    if (!selectedMatch) return;

    try {
      // First, save the full state to localStorage for persistence across refreshes
      const localKey = getLocalStorageKey(selectedMatch.id);
      const fullStateToSave = {
        ...state,
        lastUpdated: new Date().toISOString(),
        matchId: selectedMatch.id,
      };
      localStorage.setItem(localKey, JSON.stringify(fullStateToSave));
      console.log('[WPLLiveScore] Saved full state to localStorage');

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
        <WPLAdminSidebarNew />
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

  // No matches - render an empty state with counts and actions
  if (matches.length === 0) {
    return (
      <div className="flex min-h-screen" style={bgStyle}>
        <AuroraBackground />
        <WPLAdminSidebarNew />

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
              <p style={{ color: WPLColors.textSecondary }}>Create and manage WPL match scorecards</p>
            </div>

            {/* Counts + actions */}
            <div className="rounded-2xl p-6 md:p-8 backdrop-blur-xl border flex flex-col items-center gap-4"
              style={{ background: WPLColors.purpleRGBA[10], borderColor: WPLColors.purpleRGBA[30] }}>
              <div className="text-lg font-medium" style={{ color: WPLColors.textPrimary }}>
                {matches.length} WPL matches available • {players.length} WPL players loaded
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/wpl-admin-2026/matchday')}
                  className="px-4 py-2 rounded-lg font-semibold"
                  style={{ background: WPLColors.pink, color: '#fff' }}
                >
                  Create Match
                </button>

                <button
                  onClick={() => router.push('/wpl-admin-2026/players')}
                  className="px-4 py-2 rounded-lg font-semibold"
                  style={{ background: WPLColors.purple, color: '#fff' }}
                >
                  Import Players
                </button>
              </div>

              <p className="text-sm mt-2" style={{ color: WPLColors.textSecondary }}>
                You can create a match or import players to get started with live scoring.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Main render
  return (
    <div className="flex min-h-screen" style={bgStyle}>
      <AuroraBackground />
      <WPLAdminSidebarNew />
      
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

          {/* Toss Info from Scorecard - Display Only */}
          {selectedMatch && selectedMatch.matchState?.toss && (
            <div 
              className="rounded-2xl p-4 md:p-6 backdrop-blur-xl border mb-6"
              style={{
                background: WPLColors.purpleRGBA[10],
                borderColor: WPLColors.purpleRGBA[30],
              }}
            >
              <div className="flex items-center gap-3">
                <div className="text-sm" style={{ color: WPLColors.textSecondary }}>
                  🪙 Toss (from Scorecard):
                </div>
                <div className="font-semibold" style={{ color: WPLColors.textPrimary }}>
                  {selectedMatch.matchState.toss.winner === 'team1' ? selectedMatch.team1?.name : selectedMatch.team2?.name} won and elected to {selectedMatch.matchState.toss.decision}
                </div>
                <div className="ml-auto">
                  <a 
                    href="/wpl-admin-2026/scorecard" 
                    className="text-xs px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
                    style={{ 
                      background: WPLColors.pink, 
                      color: '#fff' 
                    }}
                  >
                    Edit in Scorecard
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Toss Not Set Warning */}
          {selectedMatch && !selectedMatch.matchState?.toss && (
            <div 
              className="rounded-2xl p-4 md:p-6 backdrop-blur-xl border mb-6"
              style={{
                background: 'rgba(234, 179, 8, 0.1)',
                borderColor: 'rgba(234, 179, 8, 0.3)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="text-sm" style={{ color: '#eab308' }}>
                  ⚠️ Toss not set yet - Set it below in Pre-Match or in Scorecard page
                </div>
                <div className="ml-auto">
                  <a 
                    href="/wpl-admin-2026/scorecard" 
                    className="text-xs px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
                    style={{ 
                      background: WPLColors.pink, 
                      color: '#fff' 
                    }}
                  >
                    Set in Scorecard
                  </a>
                </div>
              </div>
            </div>
          )}

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
                initialState={initialLiveState}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
