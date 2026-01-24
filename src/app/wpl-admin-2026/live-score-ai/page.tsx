'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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
  const [savedMatch, setSavedMatch] = useState<Match | null>(null);
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

  // Default toss if none exists: set to team1 + bowl to match requested example
  useEffect(() => {
    if (!selectedMatch) return;
    const t = selectedMatch.toss || selectedMatch.matchState?.toss;
    if (!t && !tossWinner && !tossDecision) {
      setTossWinner('team1');
      setTossDecision('bowl');
    }
  }, [selectedMatch, tossWinner, tossDecision]);

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

  // Determine if inning 1 has a score or has completed (used to hide toss save after match starts)
  const inning1HasScore = Boolean(
    selectedMatch?.score?.team1?.runs ||
    selectedMatch?.score?.team2?.runs ||
    selectedMatch?.matchState?.innings1?.completed
  );

  const generateSuggestion = async () => {
    try {
      const battingTeam = computeBattingTeamForInning(event.inning);

      // If a batter/bowler is selected, ensure they belong to the respective team
      const battingTeamId = battingTeam ? String(battingTeam.id) : null;
      const bowlingTeamId = battingTeam && selectedMatch ? (String(battingTeam.id) === String(selectedMatch.team1?.id) ? String(selectedMatch.team2?.id) : String(selectedMatch.team1?.id)) : null;

      if (event.batterId && battingTeamId && !players.find(p => p.id === event.batterId && String(p.teamId) === battingTeamId)) {
        console.warn('Selected batter does not belong to batting team, clearing selection');
        setEvent({ ...event, batterId: '' });
      }
      if (event.bowlerId && bowlingTeamId && !players.find(p => p.id === event.bowlerId && String(p.teamId) === bowlingTeamId)) {
        console.warn('Selected bowler does not belong to bowling team, clearing selection');
        setEvent({ ...event, bowlerId: '' });
      }

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
      const updated = await res.json();
      alert('Saved commentary to match');
      setCommentaryDrafts([]);

      // Store the updated match so we can display the saved score below
      setSavedMatch(updated || null);

      // Also clear selected batter/bowler to avoid stale selections
      setEvent({ ...event, batterId: '', bowlerId: '' });
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
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mb-6">
            <h1 className="text-4xl font-bold" style={{ background: `linear-gradient(to right, ${WPLColors.textPrimary}, ${WPLColors.purple})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Live Score (AI Assistant)
            </h1>
            <p style={{ color: WPLColors.textSecondary }}>Dropdown-driven live event entry with AI-generated commentary suggestions.</p>
          </motion.div>

          <motion.div initial={{ scale: 0.995, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.35 }} className="rounded-2xl p-6 md:p-8 backdrop-blur-xl border mb-6" style={{ background: WPLColors.purpleRGBA[10], borderColor: WPLColors.purpleRGBA[30] }}>
            <label className="block text-sm font-medium mb-2" style={{ color: WPLColors.textPrimary }}>Select Match</label>
            <select value={selectedMatchId} onChange={(e) => setSelectedMatchId(e.target.value)} className="w-full md:w-96 px-4 py-3 rounded-lg text-white text-sm" style={{ background: WPLColors.purpleRGBA[20], border: `1px solid ${WPLColors.purpleRGBA[30]}` }}>
              {matches.map((m) => (<option key={m.id} value={m.id}>{m.team1.shortName} vs {m.team2.shortName} · {new Date(m.date).toLocaleDateString()}</option>))}
            </select>

            {/* Top toss bar: editable dropdowns + save (replaces lower toss controls) */}
            <div className="flex items-center justify-between gap-4 p-4 rounded-lg mb-4" style={{ background: WPLColors.purpleRGBA[30], border: `1px solid ${WPLColors.purpleRGBA[40]}` }}>
              <div className="flex items-center gap-3">
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

                {!inning1HasScore && (
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
                      setTossWinner(updated.toss?.winner || tossWinner);
                      setTossDecision(updated.toss?.decision || tossDecision);
                    } catch (err) {
                      console.error(err);
                      alert('Failed to save toss: ' + (err.message || err));
                    }
                  }} className="px-4 py-2 rounded-lg font-semibold" style={{ background: WPLColors.pink, color: '#fff' }}>
                    Save Toss
                  </button>
                )}
              </div>

              <div style={{ color: WPLColors.textSecondary }}>
                {event.inning && (computeBattingTeamForInning(event.inning) ? `Batting (Inning ${event.inning}): ${computeBattingTeamForInning(event.inning).shortName}` : 'Set toss to compute batting team')}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-0">
              <select value={event.inning} onChange={(e) => setEvent({ ...event, inning: e.target.value })} className="px-3 py-2 rounded text-sm text-white" style={{ background: WPLColors.purpleRGBA[20] }}>
                <option value="1">Inning 1</option>
                <option value="2">Inning 2</option>
              </select>
              <select value={event.over} onChange={(e) => setEvent({ ...event, over: e.target.value })} className="px-3 py-2 rounded text-sm text-white" style={{ background: WPLColors.purpleRGBA[20] }}>
                <option value="">Over</option>
                {Array.from({ length: 20 }).map((_, i) => (
                  <option key={i+1} value={String(i+1)}>{i+1}</option>
                ))}
              </select>

              <select value={event.ball} onChange={(e) => setEvent({ ...event, ball: e.target.value })} className="px-3 py-2 rounded text-sm text-white" style={{ background: WPLColors.purpleRGBA[20] }}>
                <option value="">Ball</option>
                {Array.from({ length: 6 }).map((_, i) => (
                  <option key={i+1} value={String(i+1)}>{i+1}</option>
                ))}
              </select>

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

            

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              {/* Batter dropdown - only players from batting team */}
              <select value={event.batterId} onChange={(e) => setEvent({ ...event, batterId: e.target.value })} className="px-3 py-2 rounded text-sm text-white" style={{ background: WPLColors.purpleRGBA[20] }}>
                <option value="">{computeBattingTeamForInning(event.inning) ? `Select Batter (${computeBattingTeamForInning(event.inning)?.shortName})` : 'Select Batter'}</option>
                {(() => {
                  const battingTeam = computeBattingTeamForInning(event.inning);
                  const battingTeamId = battingTeam ? String(battingTeam.id) : null;
                  const battingPlayers = battingTeamId ? players.filter(p => String(p.teamId) === battingTeamId) : players;
                  if (battingPlayers.length === 0) {
                    return (<option value="" disabled>No players available</option>);
                  }
                  return battingPlayers.map(p => (<option key={p.id} value={p.id}>{p.name} ({p.teamId})</option>));
                })()}
              </select>

              {/* Bowler dropdown - only players from bowling/opposition team */}
              <select value={event.bowlerId} onChange={(e) => setEvent({ ...event, bowlerId: e.target.value })} className="px-3 py-2 rounded text-sm text-white" style={{ background: WPLColors.purpleRGBA[20] }}>
                <option value="">{computeBattingTeamForInning(event.inning) ? `Select Bowler (${(computeBattingTeamForInning(event.inning)?.id === selectedMatch?.team1?.id ? selectedMatch.team2.shortName : selectedMatch?.team1?.shortName) || 'Opposition'})` : 'Select Bowler'}</option>
                {(() => {
                  const battingTeam = computeBattingTeamForInning(event.inning);
                  let bowlingTeamId = null;
                  if (battingTeam && selectedMatch) {
                    bowlingTeamId = battingTeam.id === selectedMatch.team1?.id ? String(selectedMatch.team2?.id) : String(selectedMatch.team1?.id);
                  }
                  const bowlingPlayers = bowlingTeamId ? players.filter(p => String(p.teamId) === bowlingTeamId) : players;
                  if (bowlingPlayers.length === 0) {
                    return (<option value="" disabled>No players available</option>);
                  }
                  return bowlingPlayers.map(p => (<option key={p.id} value={p.id}>{p.name} ({p.teamId})</option>));
                })()}
              </select>

              <select value={event.tone} onChange={(e) => setEvent({ ...event, tone: e.target.value })} className="px-3 py-2 rounded text-sm text-white" style={{ background: WPLColors.purpleRGBA[20] }}>
                <option value="neutral">Neutral</option>
                <option value="excited">Excited</option>
                <option value="analytical">Analytical</option>
              </select>
            </div>

            <div className="mt-4 flex gap-3 items-center">
              <motion.button whileTap={{ scale: 0.98 }} onClick={generateSuggestion} className="px-4 py-2 rounded-lg font-semibold" style={{ background: WPLColors.pink, color: '#fff' }}>Generate Suggestion</motion.button>
              <motion.button whileTap={{ scale: 0.98 }} onClick={addSuggestion} className="px-4 py-2 rounded-lg font-semibold" style={{ background: WPLColors.purple, color: '#fff' }} disabled={!suggestion}>Add Suggestion</motion.button>
              <motion.button whileTap={{ scale: 0.98 }} onClick={saveCommentaryToMatch} className="px-4 py-2 rounded-lg font-semibold ml-auto" style={{ background: '#10B981', color: '#fff' }} disabled={commentaryDrafts.length === 0}>Save to Match</motion.button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {suggestion && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className="p-3 rounded bg-gradient-to-r from-purple-900 to-purple-800 text-white">
                  <div className="text-sm font-semibold mb-2">AI Suggestion</div>
                  <div className="text-sm">{suggestion}</div>
                </motion.div>
              )}

              {commentaryDrafts.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className="p-3 rounded bg-purple-900 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Commentary Drafts</h3>
                    <button onClick={() => setCommentaryDrafts([])} className="text-xs text-purple-200">Clear</button>
                  </div>
                  <ul className="space-y-2">
                    {commentaryDrafts.map((c, idx) => (
                      <li key={idx} className="p-3 rounded bg-purple-800/60">{c}</li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </div>

            {/* Saved match score display (shows after Save to Match) */}
            {savedMatch && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className="mt-6 p-4 rounded-2xl border" style={{ background: WPLColors.purpleRGBA[8], borderColor: WPLColors.purpleRGBA[30], color: WPLColors.textPrimary }}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Saved Match Score</h4>
                  <div className="text-sm text-purple-200">Match ID: {savedMatch.id}</div>
                </div>
                {/* Prefer structured score if available, otherwise fall back to legacy team1Score/team2Score strings */}
                {savedMatch.score ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <div className="text-sm text-purple-200">{savedMatch.team1?.shortName || savedMatch.team1?.name}</div>
                      <div className="text-2xl font-bold">{savedMatch.score.team1?.runs ?? '0'}/{savedMatch.score.team1?.wickets ?? '0'}</div>
                      <div className="text-xs text-purple-300">{savedMatch.score.team1?.overs ?? '--'} ov</div>
                    </div>
                    <div>
                      <div className="text-sm text-purple-200">{savedMatch.team2?.shortName || savedMatch.team2?.name}</div>
                      <div className="text-2xl font-bold">{savedMatch.score.team2?.runs ?? '0'}/{savedMatch.score.team2?.wickets ?? '0'}</div>
                      <div className="text-xs text-purple-300">{savedMatch.score.team2?.overs ?? '--'} ov</div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <div className="text-sm text-purple-200">{savedMatch.team1?.shortName || savedMatch.team1?.name}</div>
                      <div className="text-2xl font-bold">{savedMatch.team1Score || '—'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-purple-200">{savedMatch.team2?.shortName || savedMatch.team2?.name}</div>
                      <div className="text-2xl font-bold">{savedMatch.team2Score || '—'}</div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>

        </div>
      </main>
    </div>
  );
}
