'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import type { Match, Player } from '@/types';

interface LiveScoreData {
  matchId: string;
  team1: { name: string; runs: number; wickets: number; overs: number };
  team2: { name: string; runs: number; wickets: number; overs: number };
  currentBatter: { name: string; runs: number; balls: number };
  currentBowler: { name: string; runs: number; balls: number };
  commentary: string[];
  status: string;
  lastUpdated: string;
}

export default function AdminLiveScorePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [liveScore, setLiveScore] = useState<LiveScoreData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');

  const [formData, setFormData] = useState({
    team1Name: 'RCB',
    team1Runs: 0,
    team1Wickets: 0,
    team1Overs: 0,
    team2Name: 'CSK',
    team2Runs: 0,
    team2Wickets: 0,
    team2Overs: 0,
    batterName: '',
    batterRuns: 0,
    batterBalls: 0,
    bowlerName: '',
    bowlerRuns: 0,
    bowlerBalls: 0,
    commentary: '',
    status: 'Live',
    innings: 1,
    battingTeam: 'team1' as 'team1' | 'team2',
    tossWinner: '' as '' | 'team1' | 'team2',
    tossDecision: '' as '' | 'bat' | 'bowl',
  });
  const [lastBallSnapshot, setLastBallSnapshot] = useState<any | null>(null);

  // Check authentication
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/admin');
        return;
      }

      // For admin users, the token is stored in localStorage after login.
      // Trust that if the token exists, the user is authenticated.
      // (Admin tokens are base64-encoded payloads, not verified against KV.)
      setIsAuthenticated(true);
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  // Load fixtures and players once authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadData = async () => {
      try {
        const [matchesRes, playersRes] = await Promise.all([
          fetch('/api/matches'),
          fetch('/api/players'),
        ]);

        if (matchesRes.ok) {
          const matchesData: Match[] = await matchesRes.json();
          setMatches(matchesData);
          // Pre-select the first upcoming or live match if none selected yet
          if (!selectedMatchId && matchesData.length > 0) {
            const preferred =
              matchesData.find((m) => m.status === 'live') ||
              matchesData.find((m) => m.status === 'upcoming') ||
              matchesData[0];
            setSelectedMatchId(preferred.id);
          }
        }

        if (playersRes.ok) {
          const playersData: Player[] = await playersRes.json();
          setPlayers(playersData);
        }
      } catch (err) {
        console.error('Error loading fixtures/players for admin live score:', err);
      }
    };

    loadData();
  }, [isAuthenticated, selectedMatchId]);

  const selectedMatch = useMemo(
    () => matches.find((m) => m.id === selectedMatchId) || null,
    [matches, selectedMatchId]
  );

  // Fetch live score for the selected match
  useEffect(() => {
    if (!isAuthenticated || !selectedMatch) return;

    const fetchLiveScore = async () => {
      try {
        const response = await fetch(`/api/live-score?matchId=${encodeURIComponent(selectedMatch.id)}`);
        if (response.ok) {
          const liveScoreData = await response.json();
          setLiveScore(liveScoreData);
          setFormData((prev) => ({
            ...prev,
            team1Name: selectedMatch.team1.shortName || selectedMatch.team1.name,
            team1Runs: liveScoreData.team1.runs,
            team1Wickets: liveScoreData.team1.wickets,
            team1Overs: liveScoreData.team1.overs,
            team2Name: selectedMatch.team2.shortName || selectedMatch.team2.name,
            team2Runs: liveScoreData.team2.runs,
            team2Wickets: liveScoreData.team2.wickets,
            team2Overs: liveScoreData.team2.overs,
            batterName: liveScoreData.currentBatter.name,
            batterRuns: liveScoreData.currentBatter.runs,
            batterBalls: liveScoreData.currentBatter.balls,
            bowlerName: liveScoreData.currentBowler.name,
            bowlerRuns: liveScoreData.currentBowler.runs,
            bowlerBalls: liveScoreData.currentBowler.balls,
            commentary: liveScoreData.commentary.length > 0 ? liveScoreData.commentary[0] : '',
            status: liveScoreData.status,
            innings: (liveScoreData as any).innings || prev.innings,
            battingTeam: ((liveScoreData as any).battingTeam as 'team1' | 'team2') || prev.battingTeam,
            tossWinner: ((liveScoreData as any).toss?.winner as 'team1' | 'team2') || prev.tossWinner,
            tossDecision: ((liveScoreData as any).toss?.decision as 'bat' | 'bowl') || prev.tossDecision,
          }));
        } else {
          // No existing live score yet; initialise from fixture
          setLiveScore(null);
          setFormData((prev) => ({
            ...prev,
            team1Name: selectedMatch.team1.shortName || selectedMatch.team1.name,
            team1Runs: 0,
            team1Wickets: 0,
            team1Overs: 0,
            team2Name: selectedMatch.team2.shortName || selectedMatch.team2.name,
            team2Runs: 0,
            team2Wickets: 0,
            team2Overs: 0,
            status: selectedMatch.status === 'upcoming' ? 'Scheduled' : 'Live',
          }));
        }
      } catch (error) {
        console.error('Error fetching live score:', error);
      }
    };

    fetchLiveScore();
  }, [isAuthenticated, selectedMatch]);

  const team1Players = useMemo(() => {
    if (!selectedMatch) return [] as Player[];
    return players.filter((p) => p.teamId === selectedMatch.team1.id);
  }, [players, selectedMatch]);

  const team2Players = useMemo(() => {
    if (!selectedMatch) return [] as Player[];
    return players.filter((p) => p.teamId === selectedMatch.team2.id);
  }, [players, selectedMatch]);

  // Helpers for overs/balls conversion
  const oversToBalls = (overs: number) => {
    const whole = Math.floor(overs);
    const fraction = Math.round((overs - whole) * 10); // .0 - .5
    return whole * 6 + fraction;
  };

  const ballsToOvers = (balls: number) => {
    const whole = Math.floor(balls / 6);
    const rem = balls % 6;
    return parseFloat(`${whole}.${rem}`);
  };

  // Derived strike rate and economy
  const batterStrikeRate = useMemo(() => {
    if (!formData.batterBalls) return 0;
    return parseFloat(((formData.batterRuns * 100) / formData.batterBalls).toFixed(1));
  }, [formData.batterRuns, formData.batterBalls]);

  const bowlerEconomy = useMemo(() => {
    const balls = formData.bowlerBalls;
    if (!balls) return 0;
    const overs = balls / 6;
    return parseFloat(((formData.bowlerRuns / overs)).toFixed(2));
  }, [formData.bowlerRuns, formData.bowlerBalls]);

  // Per-ball quick update handler
  const handleBallEvent = (runs: number | 'W') => {
    if (!selectedMatch) return;

    setFormData((prev) => {
      // snapshot state before applying this ball so we can undo once
      setLastBallSnapshot(prev);
      const isWicket = runs === 'W';
      const runValue = typeof runs === 'number' ? runs : 0;
      const battingKey = prev.battingTeam === 'team1' ? 'team1' : 'team2';

      const currentOvers = battingKey === 'team1' ? prev.team1Overs : prev.team2Overs;
      const currentRuns = battingKey === 'team1' ? prev.team1Runs : prev.team2Runs;
      const currentWickets = battingKey === 'team1' ? prev.team1Wickets : prev.team2Wickets;

      const currentBalls = oversToBalls(currentOvers);
      const newTeamBalls = currentBalls + 1;
      const newTeamOvers = ballsToOvers(newTeamBalls);

      const newTeamRuns = currentRuns + runValue;
      const newTeamWickets = isWicket ? currentWickets + 1 : currentWickets;

      const newBatterRuns = prev.batterRuns + runValue;
      const newBatterBalls = prev.batterBalls + 1;

      const newBowlerRuns = prev.bowlerRuns + runValue;
      const newBowlerBalls = prev.bowlerBalls + 1;

      const ballNumber = newTeamBalls;
      const overNum = Math.floor(ballNumber / 6);
      const ballInOver = ballNumber % 6;

      const ballDesc = isWicket
        ? `WICKET! ${prev.batterName || 'Batter'} is out, bowled by ${prev.bowlerName || 'Bowler'}.`
        : `${prev.batterName || 'Batter'} scores ${runValue} run${runValue === 1 ? '' : 's'} off ${prev.bowlerName || 'Bowler'}.`;

      const prefix = `Over ${overNum}.${ballInOver}: `;
      const newCommentLine = prefix + ballDesc;

      return {
        ...prev,
        team1Runs: battingKey === 'team1' ? newTeamRuns : prev.team1Runs,
        team1Wickets: battingKey === 'team1' ? newTeamWickets : prev.team1Wickets,
        team1Overs: battingKey === 'team1' ? newTeamOvers : prev.team1Overs,
        team2Runs: battingKey === 'team2' ? newTeamRuns : prev.team2Runs,
        team2Wickets: battingKey === 'team2' ? newTeamWickets : prev.team2Wickets,
        team2Overs: battingKey === 'team2' ? newTeamOvers : prev.team2Overs,
        batterRuns: newBatterRuns,
        batterBalls: newBatterBalls,
        bowlerRuns: newBowlerRuns,
        bowlerBalls: newBowlerBalls,
        commentary: newCommentLine,
      };
    });
  };

  const handleUndoLastBall = () => {
    if (!lastBallSnapshot) return;
    setFormData(lastBallSnapshot);
    setLastBallSnapshot(null);
  };

  const handleSaveScore = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!selectedMatch) {
        alert('Please select a match first');
        return;
      }
      const scoreUpdate = {
        team1: {
          name: formData.team1Name,
          runs: parseInt(formData.team1Runs.toString()),
          wickets: parseInt(formData.team1Wickets.toString()),
          overs: parseFloat(formData.team1Overs.toString()),
        },
        team2: {
          name: formData.team2Name,
          runs: parseInt(formData.team2Runs.toString()),
          wickets: parseInt(formData.team2Wickets.toString()),
          overs: parseFloat(formData.team2Overs.toString()),
        },
        currentBatter: {
          name: formData.batterName,
          runs: parseInt(formData.batterRuns.toString()),
          balls: parseInt(formData.batterBalls.toString()),
        },
        currentBowler: {
          name: formData.bowlerName,
          runs: parseInt(formData.bowlerRuns.toString()),
          balls: parseInt(formData.bowlerBalls.toString()),
        },
        commentary: formData.commentary
          ? [formData.commentary, ...(liveScore?.commentary || []).slice(0, 49)]
          : liveScore?.commentary || [],
        status: formData.status,
        innings: formData.innings,
        battingTeam: formData.battingTeam,
        toss: formData.tossWinner && formData.tossDecision
          ? { winner: formData.tossWinner, decision: formData.tossDecision }
          : undefined,
      };

      const response = await fetch('/api/live-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          matchId: selectedMatch.id,
          scoreUpdate,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLiveScore(data.liveScore);
        setFormData({ ...formData, commentary: '' });
        alert('Score updated successfully!');
      } else {
        alert('Failed to update score');
      }
    } catch (error) {
      console.error('Error saving score:', error);
      alert('Error updating score');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-ipl-gold"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-900">
      <AdminSidebar />

      <main className="flex-grow">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold text-white mb-8">Live Score Management</h1>

          {/* Match Selector */}
          <div className="mb-6 bg-slate-800/60 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Select Match</p>
              <p className="text-sm text-gray-300 max-w-xl">
                Choose a fixture to manage its live score. All updates will immediately reflect on the public live score page.
              </p>
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-3 w-full md:w-auto">
              <select
                value={selectedMatchId}
                onChange={(e) => setSelectedMatchId(e.target.value)}
                className="w-full md:w-72 px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-ipl-gold"
              >
                <option value="">Select a match...</option>
                {matches.map((match) => (
                  <option key={match.id} value={match.id}>
                    {match.team1.shortName} vs {match.team2.shortName} · {match.date} {match.time}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Score Update Form */}
            <div className="bg-slate-800/50 rounded-2xl border border-white/10 p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Update Score</h2>

              <form className="space-y-6">
                {/* Inning indicator */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Innings</p>
                    <p className="text-xs text-gray-500">Select whether you are updating the 1st or 2nd innings of this match.</p>
                  </div>
                  <select
                    value={formData.innings}
                    onChange={(e) => setFormData({ ...formData, innings: parseInt(e.target.value) || 1 })}
                    className="w-full md:w-48 px-3 py-2 bg-slate-700 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-ipl-gold"
                  >
                    <option value={1}>1st Innings</option>
                    <option value={2}>2nd Innings</option>
                  </select>
                </div>

                {/* Batting team toggle & Toss */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Batting team</p>
                    <p className="text-[11px] text-gray-500">Which team is currently batting. Quick buttons and batter stats will apply to this team.</p>
                    <select
                      value={formData.battingTeam}
                      onChange={(e) => setFormData({ ...formData, battingTeam: e.target.value as 'team1' | 'team2' })}
                      className="w-full px-3 py-2 bg-slate-700 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-ipl-gold"
                    >
                      <option value="team1">{formData.team1Name}</option>
                      <option value="team2">{formData.team2Name}</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Toss winner</p>
                    <p className="text-[11px] text-gray-500">Who won the toss at the start of the match.</p>
                    <select
                      value={formData.tossWinner}
                      onChange={(e) => setFormData({ ...formData, tossWinner: e.target.value as any })}
                      className="w-full px-3 py-2 bg-slate-700 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-ipl-gold"
                    >
                      <option value="">Select...</option>
                      <option value="team1">{formData.team1Name}</option>
                      <option value="team2">{formData.team2Name}</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Toss decision</p>
                    <p className="text-[11px] text-gray-500">What the toss winner chose to do – bat first or bowl first.</p>
                    <select
                      value={formData.tossDecision}
                      onChange={(e) => setFormData({ ...formData, tossDecision: e.target.value as any })}
                      className="w-full px-3 py-2 bg-slate-700 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-ipl-gold"
                    >
                      <option value="">Select...</option>
                      <option value="bat">Bat</option>
                      <option value="bowl">Bowl</option>
                    </select>
                  </div>
                </div>

                {/* Team 1 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-ipl-gold">Team 1</h3>
                  <p className="text-[11px] text-gray-500">This is the first team in the fixture (usually the home side). Update their total runs, wickets, and overs here.</p>
                  <input
                    type="text"
                    placeholder="Team Name"
                    value={formData.team1Name}
                    disabled
                    className="w-full px-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-gray-500 opacity-80 cursor-not-allowed"
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      type="number"
                      placeholder="Runs (e.g. 145)"
                      value={formData.team1Runs}
                      onChange={(e) => setFormData({ ...formData, team1Runs: parseInt(e.target.value) || 0 })}
                      className="px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                    />
                    <input
                      type="number"
                      placeholder="Wickets (e.g. 3)"
                      value={formData.team1Wickets}
                      onChange={(e) => setFormData({ ...formData, team1Wickets: parseInt(e.target.value) || 0 })}
                      className="px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                    />
                    <input
                      type="number"
                      placeholder="Overs (e.g. 10.2)"
                      step="0.1"
                      value={formData.team1Overs}
                      onChange={(e) => setFormData({ ...formData, team1Overs: parseFloat(e.target.value) || 0 })}
                      className="px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                    />
                  </div>
                </div>

                {/* Team 2 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-ipl-gold">Team 2</h3>
                  <p className="text-[11px] text-gray-500">This is the second team in the fixture. Update their total runs, wickets, and overs here.</p>
                  <input
                    type="text"
                    placeholder="Team Name"
                    value={formData.team2Name}
                    disabled
                    className="w-full px-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-gray-500 opacity-80 cursor-not-allowed"
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      type="number"
                      placeholder="Runs"
                      value={formData.team2Runs}
                      onChange={(e) => setFormData({ ...formData, team2Runs: parseInt(e.target.value) || 0 })}
                      className="px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                    />
                    <input
                      type="number"
                      placeholder="Wickets"
                      value={formData.team2Wickets}
                      onChange={(e) => setFormData({ ...formData, team2Wickets: parseInt(e.target.value) || 0 })}
                      className="px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                    />
                    <input
                      type="number"
                      placeholder="Overs"
                      step="0.1"
                      value={formData.team2Overs}
                      onChange={(e) => setFormData({ ...formData, team2Overs: parseFloat(e.target.value) || 0 })}
                      className="px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                    />
                  </div>
                </div>

                {/* Current Players */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-ipl-gold">Current Match</h3>
                  <p className="text-[11px] text-gray-500">Pick the striker (batter) and current bowler, then use quick buttons or manual inputs to keep their stats up to date.</p>
                  <select
                    value={formData.batterName}
                    onChange={(e) => setFormData({ ...formData, batterName: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-ipl-gold"
                  >
                    <option value="">Select batter...</option>
                    {(formData.battingTeam === 'team1' ? team1Players : team2Players).map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      placeholder="Batter Runs (e.g. 35)"
                      value={formData.batterRuns}
                      onChange={(e) => setFormData({ ...formData, batterRuns: parseInt(e.target.value) || 0 })}
                      className="px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                    />
                    <input
                      type="number"
                      placeholder="Batter Balls (e.g. 22)"
                      value={formData.batterBalls}
                      onChange={(e) => setFormData({ ...formData, batterBalls: parseInt(e.target.value) || 0 })}
                      className="px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                    />
                  </div>

                  {/* Batter strike rate */}
                  <p className="text-xs text-gray-400">
                    Strike rate:{' '}
                    <span className="text-ipl-gold font-semibold">{batterStrikeRate.toFixed(1)}</span>
                  </p>

                  <select
                    value={formData.bowlerName}
                    onChange={(e) => setFormData({ ...formData, bowlerName: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-ipl-gold"
                  >
                    <option value="">Select bowler...</option>
                    {(formData.battingTeam === 'team1' ? team2Players : team1Players).map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      placeholder="Bowler Runs (e.g. 24)"
                      value={formData.bowlerRuns}
                      onChange={(e) => setFormData({ ...formData, bowlerRuns: parseInt(e.target.value) || 0 })}
                      className="px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                    />
                    <input
                      type="number"
                      placeholder="Bowler Balls (e.g. 18)"
                      value={formData.bowlerBalls}
                      onChange={(e) => setFormData({ ...formData, bowlerBalls: parseInt(e.target.value) || 0 })}
                      className="px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                    />
                  </div>

                  {/* Bowler economy */}
                  <p className="text-xs text-gray-400">
                    Economy:{' '}
                    <span className="text-ipl-gold font-semibold">{bowlerEconomy.toFixed(2)}</span>
                  </p>

                  {/* Quick ball controls */}
                  <div className="mt-4 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Quick ball update</p>
                        <p className="text-[11px] text-gray-500">
                          Editing: {formData.innings === 1 ? '1st' : '2nd'} innings –{' '}
                          {formData.battingTeam === 'team2' ? formData.team2Name : formData.team1Name} batting
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleUndoLastBall}
                        disabled={!lastBallSnapshot}
                        className="text-[11px] px-3 py-1 rounded-full border border-white/15 text-gray-300 hover:bg-slate-700/70 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Undo last ball
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-500">Click a button after each ball. It will automatically update the score, batter, bowler and add a short commentary line.</p>
                    <div className="flex flex-wrap gap-2">
                      {[0, 1, 2, 3, 4, 6].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => handleBallEvent(r as number)}
                          className="px-3 py-1.5 rounded-full bg-slate-700 border border-white/10 text-xs text-white hover:bg-slate-600 transition-colors"
                        >
                          {r} run{r === 1 ? '' : 's'}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleBallEvent('W')}
                        className="px-3 py-1.5 rounded-full bg-red-600/20 border border-red-500/40 text-xs text-red-300 hover:bg-red-600/30 transition-colors"
                      >
                        Wicket
                      </button>
                    </div>
                  </div>
                </div>

                {/* Commentary */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-ipl-gold">Add Commentary</h3>
                  <p className="text-[11px] text-gray-500">Optional: type extra details about the last ball or over. This text appears on the public live score page.</p>
                  <textarea
                    placeholder="Example: Kohli drives through cover for four."
                    value={formData.commentary}
                    onChange={(e) => setFormData({ ...formData, commentary: e.target.value })}
                    maxLength={500}
                    rows={4}
                    className="w-full px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold resize-none"
                  />
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white focus:outline-none focus:border-ipl-gold"
                  >
                    {/* Match status used to show if the game is live, scheduled or finished */}
                    <option>Live</option>
                    <option>Scheduled</option>
                    <option>Completed</option>
                    <option>Cancelled</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleSaveScore}
                  disabled={isSaving || !selectedMatch}
                  className="w-full px-6 py-3 bg-ipl-gold hover:bg-ipl-gold/90 text-black font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Update Live Score'}
                </button>
              </form>
            </div>

            {/* Live Preview */}
            <div className="bg-slate-800/50 rounded-2xl border border-white/10 p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Live Preview</h2>

              {liveScore && (
                <div className="space-y-6">
                  {/* Score Cards */}
                  <div className="space-y-3">
                    <div className="bg-gradient-to-br from-red-900/20 to-red-600/20 border border-red-500/30 rounded-lg p-4">
                      <p className="text-gray-400 text-sm">Team 1</p>
                      <h3 className="text-2xl font-bold text-white">{liveScore.team1.name}</h3>
                      <p className="text-3xl font-bold text-ipl-gold mt-2">
                        {liveScore.team1.runs}/{liveScore.team1.wickets} ({liveScore.team1.overs})
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-yellow-900/20 to-yellow-600/20 border border-yellow-500/30 rounded-lg p-4">
                      <p className="text-gray-400 text-sm">Team 2</p>
                      <h3 className="text-2xl font-bold text-white">{liveScore.team2.name}</h3>
                      <p className="text-3xl font-bold text-ipl-gold mt-2">
                        {liveScore.team2.runs}/{liveScore.team2.wickets} ({liveScore.team2.overs})
                      </p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="bg-slate-700/30 rounded-lg p-4 border border-white/5">
                    <p className="text-gray-400 text-sm">Match Status</p>
                    <p className="text-xl font-bold text-ipl-gold mt-1">{liveScore.status}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Last updated: {new Date(liveScore.lastUpdated).toLocaleString()}
                    </p>
                  </div>

                  {/* Recent Commentary */}
                  <div className="bg-slate-700/30 rounded-lg p-4 border border-white/5">
                    <p className="text-gray-400 text-sm mb-2">Recent Commentary</p>
                    <div className="max-h-32 overflow-y-auto space-y-2">
                      {liveScore.commentary && liveScore.commentary.length > 0 ? (
                        liveScore.commentary.slice(0, 5).map((comment, idx) => (
                          <p key={idx} className="text-sm text-gray-300 border-l-2 border-ipl-gold pl-2">
                            {comment}
                          </p>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No commentary yet</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
