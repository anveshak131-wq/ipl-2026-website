'use client';

import { useEffect, useState } from 'react';
import WPLAdminSidebarNew from '@/components/admin/WPLAdminSidebarNew';
import AuroraBackground from '@/components/ui/AuroraBackground';
import { api } from '@/lib/data';
import { Player, Match } from '@/types';
import { WPLColors } from '@/lib/wplColors';

export default function WPLLiveScoreAI() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [commentaryDrafts, setCommentaryDrafts] = useState<string[]>([]);
  const [suggestion, setSuggestion] = useState<string>('');
  const [event, setEvent] = useState({
    inning: '1',
    over: '0',
    ball: '1',
    type: '0',
    runs: 0,
    dismissal: 'caught',
    batterId: '',
    bowlerId: '',
    note: '',
    tone: 'neutral'
  });

  // Toss controls
  const [tossWinner, setTossWinner] = useState<'team1' | 'team2' | ''>('');
  const [tossDecision, setTossDecision] = useState<'bat' | 'bowl' | ''>('');

  // Initialize toss from selectedMatch if present
  useEffect(() => {
    if (selectedMatch && (selectedMatch.toss || selectedMatch.matchState?.toss)) {
      const t = selectedMatch.toss || selectedMatch.matchState?.toss;
      setTossWinner(t?.winner || '');
      setTossDecision(t?.decision || '');
    } else {
      setTossWinner('');
      setTossDecision('');
    }
  }, [selectedMatch]);

  const computeBattingTeamForInning = (inning: string) => {
    if (!selectedMatch || !tossWinner || !tossDecision) return null;
    const winnerTeam = tossWinner === 'team1' ? selectedMatch.team1 : selectedMatch.team2;
    const otherTeam = tossWinner === 'team1' ? selectedMatch.team2 : selectedMatch.team1;

    // If winner chose to bat, they bat first
    let inning1Batting = tossDecision === 'bat' ? winnerTeam : otherTeam;
    let inning2Batting = inning1Batting === winnerTeam ? otherTeam : winnerTeam;

    return inning === '1' ? inning1Batting : inning2Batting;
  };


  useEffect(() => {
    const load = async () => {
      try {
        const [m, p] = await Promise.all([api.getMatches('wpl'), api.getPlayers(undefined, 'wpl')]);
        setMatches(m);
        setPlayers(p);
        if (m.length > 0) setSelectedMatchId(m[0].id);
      } catch (e) {
        console.error('Failed to load matches/players', e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const selectedMatch = matches.find((m) => m.id === selectedMatchId) || null;

  const generateSuggestion = async () => {
    try {
      const battingTeam = computeBattingTeamForInning(event.inning);
      const payload = {
        matchId: selectedMatchId,
        event,
        battingTeamId: battingTeam ? battingTeam.id : undefined,
        battingTeamName: battingTeam ? battingTeam.shortName || battingTeam.name : undefined,
      };

      const res = await fetch('/api/live-commentary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('AI failed');
      const data = await res.json();
      setSuggestion(data.suggestion || 'No suggestion');
    } catch (err) {
      console.error(err);
      setSuggestion('Failed to generate suggestion');
    }
  };

  const addSuggestion = () => {
    if (suggestion) {
      setCommentaryDrafts((s) => [suggestion, ...s]);
      setSuggestion('');
    }
  };

  const saveCommentaryToMatch = async () => {
    if (!selectedMatch) return;
    try {
      const token = localStorage.getItem('adminToken');
      const body = {
        id: selectedMatch.id,
        playing11: selectedMatch.playing11,
        // Append commentary into match object under `liveCommentary` field
        liveCommentary: (selectedMatch as any).liveCommentary ? [...(selectedMatch as any).liveCommentary, ...commentaryDrafts] : commentaryDrafts,
      };

      const res = await fetch(`/api/matches`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to save');
      alert('Saved commentary to match');
      setCommentaryDrafts([]);
    } catch (err) {
      console.error(err);
      alert('Failed to save commentary');
    }
  };

  const bgStyle = { background: `linear-gradient(to bottom, ${WPLColors.base}, ${WPLColors.gradientStart}66, ${WPLColors.gradientMid}33, ${WPLColors.base})` };

  if (isLoading) return (
    <div className="flex min-h-screen" style={bgStyle}>
      <AuroraBackground />
      <WPLAdminSidebarNew />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen" style={bgStyle}>
      <AuroraBackground />
      <WPLAdminSidebarNew />

      <main className="flex-1 relative z-20 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-4xl font-bold" style={{ background: `linear-gradient(to right, ${WPLColors.textPrimary}, ${WPLColors.purple})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Live Score (AI Assistant)
            </h1>
            <p style={{ color: WPLColors.textSecondary }}>Dropdown-driven live event entry with AI-generated commentary suggestions.</p>
          </div>

          <div className="rounded-2xl p-6 md:p-8 backdrop-blur-xl border mb-6" style={{ background: WPLColors.purpleRGBA[10], borderColor: WPLColors.purpleRGBA[30] }}>
            <label className="block text-sm font-medium mb-2" style={{ color: WPLColors.textPrimary }}>Select Match</label>
            <select value={selectedMatchId} onChange={(e) => setSelectedMatchId(e.target.value)} className="w-full md:w-96 px-4 py-3 rounded-lg text-white text-sm" style={{ background: WPLColors.purpleRGBA[20], border: `1px solid ${WPLColors.purpleRGBA[30]}` }}>
              {matches.map((m) => (<option key={m.id} value={m.id}>{m.team1.shortName} vs {m.team2.shortName} · {new Date(m.date).toLocaleDateString()}</option>))}
            </select>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
              <select value={event.inning} onChange={(e) => setEvent({ ...event, inning: e.target.value })} className="px-3 py-2 rounded text-sm text-white" style={{ background: WPLColors.purpleRGBA[20] }}>
                <option value="1">Inning 1</option>
                <option value="2">Inning 2</option>
              </select>

              <input value={event.over} onChange={(e) => setEvent({ ...event, over: e.target.value })} className="px-3 py-2 rounded text-sm text-white" placeholder="Over" style={{ background: WPLColors.purpleRGBA[20] }} />

              <input value={event.ball} onChange={(e) => setEvent({ ...event, ball: e.target.value })} className="px-3 py-2 rounded text-sm text-white" placeholder="Ball" style={{ background: WPLColors.purpleRGBA[20] }} />

              <select value={event.type} onChange={(e) => setEvent({ ...event, type: e.target.value })} className="px-3 py-2 rounded text-sm text-white" style={{ background: WPLColors.purpleRGBA[20] }}>
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="6">6</option>
                <option value="W">Wicket</option>
                <option value="NB">No ball</option>
                <option value="WD">Wide</option>
                <option value="1B">Bye</option>
                <option value="1LB">Leg Bye</option>
              </select>
            </div>

            {/* Toss controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
              <select value={tossWinner} onChange={(e) => setTossWinner(e.target.value as any)} className="px-3 py-2 rounded text-sm text-white" style={{ background: WPLColors.purpleRGBA[20] }}>
                <option value="">Toss winner</option>
                <option value="team1">{selectedMatch ? `${selectedMatch.team1.shortName} (team1)` : 'Team 1'}</option>
                <option value="team2">{selectedMatch ? `${selectedMatch.team2.shortName} (team2)` : 'Team 2'}</option>
              </select>

              <select value={tossDecision} onChange={(e) => setTossDecision(e.target.value as any)} className="px-3 py-2 rounded text-sm text-white" style={{ background: WPLColors.purpleRGBA[20] }}>
                <option value="">Decision</option>
                <option value="bat">Bat</option>
                <option value="bowl">Bowl</option>
              </select>

              <div className="flex items-center gap-2">
                <button onClick={async () => {
                  // Save toss to match via API
                  if (!selectedMatch || !tossWinner || !tossDecision) {
                    alert('Select toss winner and decision first');
                    return;
                  }
                  try {
                    const token = localStorage.getItem('adminToken');
                    const res = await fetch('/api/matches', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                      body: JSON.stringify({ id: selectedMatch.id, toss: { winner: tossWinner, decision: tossDecision } })
                    });
                    if (!res.ok) throw new Error('Failed to save toss');
                    const updated = await res.json();
                    alert('Toss saved');
                    // Update local selectedMatch copy
                    // Note: page will not re-fetch matches automatically here; we keep UI in sync
                    setTossWinner(updated.toss?.winner || tossWinner);
                    setTossDecision(updated.toss?.decision || tossDecision);
                  } catch (err) {
                    console.error(err);
                    alert('Failed to save toss: ' + (err.message || err));
                  }
                }} className="px-4 py-2 rounded-lg font-semibold" style={{ background: WPLColors.pink, color: '#fff' }}>
                  Save Toss
                </button>

                <div style={{ color: WPLColors.textSecondary }} className="ml-3">
                  {event.inning && (computeBattingTeamForInning(event.inning) ? `Batting (Inning ${event.inning}): ${computeBattingTeamForInning(event.inning).shortName}` : 'Set toss to compute batting team')}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              <select value={event.batterId} onChange={(e) => setEvent({ ...event, batterId: e.target.value })} className="px-3 py-2 rounded text-sm text-white" style={{ background: WPLColors.purpleRGBA[20] }}>
                <option value="">Select Batter</option>
                {players.map(p => (<option key={p.id} value={p.id}>{p.name} ({p.teamId})</option>))}
              </select>

              <select value={event.bowlerId} onChange={(e) => setEvent({ ...event, bowlerId: e.target.value })} className="px-3 py-2 rounded text-sm text-white" style={{ background: WPLColors.purpleRGBA[20] }}>
                <option value="">Select Bowler</option>
                {players.map(p => (<option key={p.id} value={p.id}>{p.name} ({p.teamId})</option>))}
              </select>

              <select value={event.tone} onChange={(e) => setEvent({ ...event, tone: e.target.value })} className="px-3 py-2 rounded text-sm text-white" style={{ background: WPLColors.purpleRGBA[20] }}>
                <option value="neutral">Neutral</option>
                <option value="excited">Excited</option>
                <option value="analytical">Analytical</option>
              </select>
            </div>

            <div className="mt-4 flex gap-3">
              <button onClick={generateSuggestion} className="px-4 py-2 rounded-lg font-semibold" style={{ background: WPLColors.pink, color: '#fff' }}>Generate Suggestion</button>
              <button onClick={addSuggestion} className="px-4 py-2 rounded-lg font-semibold" style={{ background: WPLColors.purple, color: '#fff' }} disabled={!suggestion}>Add Suggestion</button>
              <button onClick={saveCommentaryToMatch} className="px-4 py-2 rounded-lg font-semibold ml-auto" style={{ background: '#10B981', color: '#fff' }} disabled={commentaryDrafts.length === 0}>Save to Match</button>
            </div>

            {suggestion && (
              <div className="mt-3 p-3 rounded bg-purple-900 text-white">Suggestion: {suggestion}</div>
            )}

            {commentaryDrafts.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold text-white mb-2">Commentary Drafts</h3>
                <ul className="space-y-2">
                  {commentaryDrafts.map((c, idx) => (
                    <li key={idx} className="p-3 rounded bg-purple-900 text-white">{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
