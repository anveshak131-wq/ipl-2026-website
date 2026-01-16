'use client';

import { useState, useEffect } from 'react';
import { api as dataApi } from '@/lib/data';
import WPLAdminSidebarNew from '@/components/admin/WPLAdminSidebarNew';

interface Match {
  id: string;
  team1: { id: number; name: string; shortName?: string };
  team2: { id: number; name: string; shortName?: string };
  venue: string;
  date: string;
  time: string;
  status?: string;
  league?: string;
}

interface Player {
  id: string;
  name: string;
  teamId: string;
  role?: string;
  battingStyle?: string;
  bowlingStyle?: string;
}

interface Batter {
  playerId: string;
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate?: number;
  dismissal?: {
    type: string;
    bowlerId?: string;
    fielderId?: string;
    details?: string; // e.g., "c Shabnim Ismail b Nat Sciver-Brunt"
  };
}

interface Bowler {
  playerId: string;
  name: string;
  overs: number;
  balls: number;
  runs: number;
  wickets: number;
  maidens: number;
  economyRate?: number;
  dots?: number;
  wides?: number;
  noBalls?: number;
}

interface Innings {
  inningsNumber: number;
  battingTeamId: number;
  batting: Batter[];
  bowling: Bowler[];
  extras: {
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
  };
  totalRuns?: number;
  totalWickets?: number;
  totalOvers?: number;
  powerplay?: { overs: number; runs: number };
}

interface Scorecard {
  id?: string;
  matchId: string;
  league: string;
  matchInfo: {
    team1: { id: number; name: string; shortName?: string };
    team2: { id: number; name: string; shortName?: string };
    venue: string;
    date: string;
    time: string;
    toss?: { winner: string; decision: string };
    weather?: string;
    status?: string;
  };
  innings: Innings[];
  result?: {
    winner: string;
    margin: string;
    manOfTheMatch?: string;
  };
  draft?: boolean;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
}

export default function ScorecardAdminPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [activeTab, setActiveTab] = useState('matchInfo');
  const [activeInnings, setActiveInnings] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchMatches();
    fetchPlayers();
  }, []);

  const getPlayersByTeam = (teamId: number): Player[] => {
    return players.filter(player => player.teamId === teamId.toString());
  };

  const fetchMatches = async () => {
    try {
      const data = await dataApi.getMatches('wpl');
      console.log('Fetched WPL matches:', data);
      setMatches(data || []);
      if (!data || data.length === 0) {
        setMessage('⚠ No WPL matches found. Please check Cloudflare KV data.');
      }
    } catch (err) {
      console.error('Error fetching matches:', err);
      setMessage('❌ Error fetching WPL matches');
    }
  };

  const fetchPlayers = async () => {
    try {
      const data = await dataApi.getPlayers(undefined, 'wpl');
      console.log('Fetched WPL players:', data);
      setPlayers(data || []);
    } catch (err) {
      console.error('Error fetching players:', err);
      setMessage('❌ Error fetching WPL players');
    }
  };

  const handleSelectMatch = async (match: Match) => {
    setSelectedMatch(match);
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(`/api/scorecards?matchId=${match.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setScorecard(data[0]);
        } else {
          setScorecard(initializeScorecard(match));
        }
      } else {
        setScorecard(initializeScorecard(match));
      }
    } catch (err) {
      console.log('No scorecard exists yet, creating new one');
      setScorecard(initializeScorecard(match));
    }
    setLoading(false);
  };

  const initializeScorecard = (match: Match): Scorecard => {
    return {
      matchId: match.id,
      league: 'wpl',
      matchInfo: {
        team1: match.team1,
        team2: match.team2,
        venue: match.venue,
        date: match.date,
        time: match.time,
        toss: { winner: '', decision: '' },
      },
      innings: [
        {
          inningsNumber: 1,
          battingTeamId: match.team1.id,
          batting: [],
          bowling: [],
          extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
          totalRuns: 0,
          totalWickets: 0,
          totalOvers: 0,
        },
        {
          inningsNumber: 2,
          battingTeamId: match.team2.id,
          batting: [],
          bowling: [],
          extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
          totalRuns: 0,
          totalWickets: 0,
          totalOvers: 0,
        },
      ],
    };
  };

  const handleSaveScorecard = async () => {
    if (!scorecard) return;
    setSaving(true);
    setMessage('');
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const endpoint = scorecard.id ? `/api/scorecards/${scorecard.id}` : '/api/scorecards';
      const method = scorecard.id ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(scorecard),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error: ${response.status} ${response.statusText}`);
      }

      const saved = await response.json();
      setScorecard(saved);
      setMessage('✓ Scorecard saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error saving:', err);
      setMessage(`✗ Error saving scorecard: ${err.message}`);
    }
    setSaving(false);
  };

  const handlePublishScorecard = async () => {
    if (!scorecard?.id) return;
    setSaving(true);
    setMessage('');
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/scorecards/${scorecard.id}/publish`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      setMessage('✓ Scorecard published successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error publishing:', err);
      setMessage('✗ Error publishing scorecard');
    }
    setSaving(false);
  };

  const updateMatchInfo = (field: string, value: any) => {
    if (!scorecard) return;
    const updated = { ...scorecard };
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      updated.matchInfo = {
        ...updated.matchInfo,
        [parent]: { ...updated.matchInfo[parent as keyof typeof updated.matchInfo], [child]: value },
      };
    } else {
      updated.matchInfo = { ...updated.matchInfo, [field]: value };
    }
    setScorecard(updated);
  };

  const addBatter = () => {
    if (!scorecard) return;
    const updated = { ...scorecard };
    const teamPlayers = getPlayersByTeam(updated.innings[activeInnings].battingTeamId);
    
    updated.innings[activeInnings].batting.push({
      playerId: '',
      name: '',
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      strikeRate: 0,
      dismissal: { type: 'not-out' }
    });
    setScorecard(updated);
  };

  const updateBatter = (playerIndex: number, field: string, value: any) => {
    if (!scorecard) return;
    const updated = { ...scorecard };
    const batter = updated.innings[activeInnings].batting[playerIndex];
    
    if (field === 'playerId') {
      const player = players.find(p => p.id === value);
      if (player) {
        batter.name = player.name;
      }
    }
    
    (batter as any)[field] = value;

    // Calculate strike rate
    if (field === 'runs' || field === 'balls') {
      batter.strikeRate = batter.balls > 0 ? parseFloat(((batter.runs / batter.balls) * 100).toFixed(2)) : 0;
    }

    setScorecard(updated);
  };

  const removeBatter = (playerIndex: number) => {
    if (!scorecard) return;
    const updated = { ...scorecard };
    updated.innings[activeInnings].batting.splice(playerIndex, 1);
    setScorecard(updated);
  };

  const addBowler = () => {
    if (!scorecard) return;
    const updated = { ...scorecard };
    
    updated.innings[activeInnings].bowling.push({
      playerId: '',
      name: '',
      overs: 0,
      balls: 0,
      runs: 0,
      wickets: 0,
      maidens: 0,
      economyRate: 0,
    });
    setScorecard(updated);
  };

  const updateBowler = (bowlerIndex: number, field: string, value: any) => {
    if (!scorecard) return;
    const updated = { ...scorecard };
    const bowler = updated.innings[activeInnings].bowling[bowlerIndex];
    
    if (field === 'playerId') {
      const player = players.find(p => p.id === value);
      if (player) {
        bowler.name = player.name;
      }
    }
    
    (bowler as any)[field] = value;

    // Calculate economy rate
    if (field === 'overs' || field === 'balls' || field === 'runs') {
      const totalOvers = bowler.overs + bowler.balls / 6;
      bowler.economyRate = totalOvers > 0 ? parseFloat((bowler.runs / totalOvers).toFixed(2)) : 0;
    }

    setScorecard(updated);
  };

  const removeBowler = (bowlerIndex: number) => {
    if (!scorecard) return;
    const updated = { ...scorecard };
    updated.innings[activeInnings].bowling.splice(bowlerIndex, 1);
    setScorecard(updated);
  };

  const calculateInningsTotals = () => {
    if (!scorecard) return;
    const updated = { ...scorecard };
    const inning = updated.innings[activeInnings];

    // Calculate total runs (handle empty strings by treating them as 0)
    const batterRuns = inning.batting.reduce((sum, b) => sum + (Number(b.runs) || 0), 0);
    const extrasTotal = (Number(inning.extras.wides) || 0) + 
                       (Number(inning.extras.noBalls) || 0) + 
                       (Number(inning.extras.byes) || 0) + 
                       (Number(inning.extras.legByes) || 0);
    inning.totalRuns = batterRuns + extrasTotal;

    // Calculate total wickets
    inning.totalWickets = inning.batting.filter(
      (b) => b.dismissal && b.dismissal.type !== 'not-out'
    ).length;

    setScorecard(updated);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <WPLAdminSidebarNew />
      <div className="lg:ml-64 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">WPL Scorecard Admin</h1>
        <p className="text-gray-400 mb-8">Create and manage WPL match scorecards</p>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.includes('✓') ? 'bg-green-900' : 'bg-red-900'}`}>
            {message}
          </div>
        )}

        {/* Match Selection */}
        {!selectedMatch && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Select a Match</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.map((match) => (
                <button
                  key={match.id}
                  onClick={() => handleSelectMatch(match)}
                  className="p-6 rounded-lg bg-gray-800 hover:bg-gray-700 transition text-left border border-gray-700 hover:border-blue-500"
                >
                  <div className="font-bold text-lg mb-2">
                    {match.team1.name} vs {match.team2.name}
                  </div>
                  <div className="text-sm text-gray-400">
                    {match.date} • {match.time}
                  </div>
                  <div className="text-sm text-gray-400">{match.venue}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Scorecard Editor */}
        {scorecard && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  {scorecard.matchInfo.team1.name} vs {scorecard.matchInfo.team2.name}
                </h2>
                <p className="text-gray-400 mt-1">{scorecard.matchInfo.venue}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedMatch(null);
                  setScorecard(null);
                  setActiveTab('matchInfo');
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
              >
                Change Match
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 border-b border-gray-700">
              {['matchInfo', 'innings1', 'innings2', 'result'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-t whitespace-nowrap transition ${
                    activeTab === tab
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {tab === 'matchInfo' && '📋 Match Info'}
                  {tab === 'innings1' && `🏏 ${scorecard.matchInfo.team1.name} Innings`}
                  {tab === 'innings2' && `🏏 ${scorecard.matchInfo.team2.name} Innings`}
                  {tab === 'result' && '🏆 Result'}
                </button>
              ))}
            </div>

            {/* Match Info Tab */}
            {activeTab === 'matchInfo' && (
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-6">Match Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Toss Winner</label>
                    <select
                      value={scorecard.matchInfo.toss?.winner || ''}
                      onChange={(e) => updateMatchInfo('toss.winner', e.target.value)}
                      className="w-full bg-gray-700 p-3 rounded border border-gray-600 text-white"
                    >
                      <option value="">Select team...</option>
                      <option value={scorecard.matchInfo.team1.name}>{scorecard.matchInfo.team1.name}</option>
                      <option value={scorecard.matchInfo.team2.name}>{scorecard.matchInfo.team2.name}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Toss Decision</label>
                    <select
                      value={scorecard.matchInfo.toss?.decision || ''}
                      onChange={(e) => updateMatchInfo('toss.decision', e.target.value)}
                      className="w-full bg-gray-700 p-3 rounded border border-gray-600 text-white"
                    >
                      <option value="">Select...</option>
                      <option value="bat">Bat</option>
                      <option value="bowl">Bowl</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Venue</label>
                    <input
                      type="text"
                      value={scorecard.matchInfo.venue}
                      onChange={(e) => updateMatchInfo('venue', e.target.value)}
                      className="w-full bg-gray-700 p-3 rounded border border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Date</label>
                    <input
                      type="date"
                      value={scorecard.matchInfo.date}
                      onChange={(e) => updateMatchInfo('date', e.target.value)}
                      className="w-full bg-gray-700 p-3 rounded border border-gray-600 text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Innings Tabs */}
            {['innings1', 'innings2'].includes(activeTab) && (
              <div className="space-y-8">
                {/* Batting Section */}
                <div className="bg-gray-800 p-6 rounded-lg">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Batting</h3>
                    <button
                      onClick={addBatter}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition"
                    >
                      + Add Batter
                    </button>
                  </div>

                  {scorecard.innings[activeInnings].batting.length === 0 ? (
                    <p className="text-gray-400">No batters added yet</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-600">
                            <th className="text-left p-2">Player</th>
                            <th className="text-center p-2">Runs</th>
                            <th className="text-center p-2">Balls</th>
                            <th className="text-center p-2">4s</th>
                            <th className="text-center p-2">6s</th>
                            <th className="text-center p-2">SR</th>
                            <th className="text-left p-2">Dismissal Type</th>
                            <th className="text-left p-2">Dismissal Details</th>
                            <th className="text-center p-2">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {scorecard.innings[activeInnings].batting.map((batter, idx) => {
                            const teamPlayers = getPlayersByTeam(scorecard.innings[activeInnings].battingTeamId);
                            return (
                              <tr key={idx} className="border-b border-gray-700">
                                <td className="p-2">
                                  <select
                                    value={batter.playerId}
                                    onChange={(e) => updateBatter(idx, 'playerId', e.target.value)}
                                    className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-white text-sm"
                                  >
                                    <option value="">Select Player</option>
                                    {teamPlayers.map(player => (
                                      <option key={player.id} value={player.id}>{player.name}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    value={batter.runs || ''}
                                    onChange={(e) => updateBatter(idx, 'runs', e.target.value ? parseInt(e.target.value) : '')}
                                    placeholder="0"
                                    className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-white text-center text-sm"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    value={batter.balls || ''}
                                    onChange={(e) => updateBatter(idx, 'balls', e.target.value ? parseInt(e.target.value) : '')}
                                    placeholder="0"
                                    className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-white text-center text-sm"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    value={batter.fours || ''}
                                    onChange={(e) => updateBatter(idx, 'fours', e.target.value ? parseInt(e.target.value) : '')}
                                    placeholder="0"
                                    className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-white text-center text-sm"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    value={batter.sixes || ''}
                                    onChange={(e) => updateBatter(idx, 'sixes', e.target.value ? parseInt(e.target.value) : '')}
                                    placeholder="0"
                                    className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-white text-center text-sm"
                                  />
                                </td>
                                <td className="p-2 text-center font-bold text-green-400">{batter.strikeRate}</td>
                                <td className="p-2">
                                  <select
                                    value={batter.dismissal?.type || 'not-out'}
                                    onChange={(e) =>
                                      updateBatter(idx, 'dismissal', {
                                        ...batter.dismissal,
                                        type: e.target.value,
                                      })
                                    }
                                    className="bg-gray-700 p-2 rounded border border-gray-600 text-white text-sm"
                                  >
                                    <option value="not-out">Not Out</option>
                                    <option value="bowled">Bowled</option>
                                    <option value="caught">Caught</option>
                                    <option value="lbw">LBW</option>
                                    <option value="run-out">Run Out</option>
                                    <option value="stumped">Stumped</option>
                                    <option value="hit-wicket">Hit Wicket</option>
                                  </select>
                                </td>
                                <td className="p-2">
                                  {batter.dismissal?.type && batter.dismissal.type !== 'not-out' && (
                                    <input
                                      type="text"
                                      value={batter.dismissal?.details || ''}
                                      onChange={(e) =>
                                        updateBatter(idx, 'dismissal', {
                                          ...batter.dismissal,
                                          details: e.target.value,
                                        })
                                      }
                                      placeholder="e.g., c Shabnim Ismail b Nat Sciver-Brunt"
                                      className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-white text-sm"
                                    />
                                  )}
                                </td>
                                <td className="p-2 text-center">
                                  <button
                                    onClick={() => removeBatter(idx)}
                                    className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                                  >
                                    ✕
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Extras */}
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Wides</label>
                      <input
                        type="number"
                        value={scorecard.innings[activeInnings].extras.wides || ''}
                        onChange={(e) => {
                          const updated = { ...scorecard };
                          updated.innings[activeInnings].extras.wides = e.target.value ? parseInt(e.target.value) : '';
                          setScorecard(updated);
                        }}
                        placeholder="0"
                        className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">No Balls</label>
                      <input
                        type="number"
                        value={scorecard.innings[activeInnings].extras.noBalls || ''}
                        onChange={(e) => {
                          const updated = { ...scorecard };
                          updated.innings[activeInnings].extras.noBalls = e.target.value ? parseInt(e.target.value) : '';
                          setScorecard(updated);
                        }}
                        placeholder="0"
                        className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Byes</label>
                      <input
                        type="number"
                        value={scorecard.innings[activeInnings].extras.byes || ''}
                        onChange={(e) => {
                          const updated = { ...scorecard };
                          updated.innings[activeInnings].extras.byes = e.target.value ? parseInt(e.target.value) : '';
                          setScorecard(updated);
                        }}
                        placeholder="0"
                        className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Leg Byes</label>
                      <input
                        type="number"
                        value={scorecard.innings[activeInnings].extras.legByes || ''}
                        onChange={(e) => {
                          const updated = { ...scorecard };
                          updated.innings[activeInnings].extras.legByes = e.target.value ? parseInt(e.target.value) : '';
                          setScorecard(updated);
                        }}
                        placeholder="0"
                        className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Bowling Section */}
                <div className="bg-gray-800 p-6 rounded-lg">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Bowling</h3>
                    <button
                      onClick={addBowler}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition"
                    >
                      + Add Bowler
                    </button>
                  </div>

                  {scorecard.innings[activeInnings].bowling.length === 0 ? (
                    <p className="text-gray-400">No bowlers added yet</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-600">
                            <th className="text-left p-2">Bowler</th>
                            <th className="text-center p-2">Ovrs</th>
                            <th className="text-center p-2">Runs</th>
                            <th className="text-center p-2">Wkts</th>
                            <th className="text-center p-2">Wides</th>
                            <th className="text-center p-2">No Balls</th>
                            <th className="text-center p-2">Econ</th>
                            <th className="text-center p-2">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {scorecard.innings[activeInnings].bowling.map((bowler, idx) => {
                            const bowlingTeamId = scorecard.innings[activeInnings].battingTeamId === scorecard.matchInfo.team1.id 
                              ? scorecard.matchInfo.team2.id 
                              : scorecard.matchInfo.team1.id;
                            const bowlingPlayers = getPlayersByTeam(bowlingTeamId);
                            
                            return (
                              <tr key={idx} className="border-b border-gray-700">
                                <td className="p-2">
                                  <select
                                    value={bowler.playerId}
                                    onChange={(e) => updateBowler(idx, 'playerId', e.target.value)}
                                    className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-white text-sm"
                                  >
                                    <option value="">Select Player</option>
                                    {bowlingPlayers.map(player => (
                                      <option key={player.id} value={player.id}>{player.name}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="p-2">
                                  <div className="flex gap-1">
                                    <input
                                      type="number"
                                      value={bowler.overs || ''}
                                      onChange={(e) => updateBowler(idx, 'overs', e.target.value ? parseInt(e.target.value) : '')}
                                      placeholder="O"
                                      className="w-1/2 bg-gray-700 p-2 rounded border border-gray-600 text-white text-center text-sm"
                                    />
                                    <input
                                      type="number"
                                      value={bowler.balls || ''}
                                      onChange={(e) => updateBowler(idx, 'balls', e.target.value ? parseInt(e.target.value) : '')}
                                      placeholder="B"
                                      min="0"
                                      max="5"
                                      className="w-1/2 bg-gray-700 p-2 rounded border border-gray-600 text-white text-center text-sm"
                                    />
                                  </div>
                                </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    value={bowler.runs || ''}
                                    onChange={(e) => updateBowler(idx, 'runs', e.target.value ? parseInt(e.target.value) : '')}
                                    placeholder="0"
                                    className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-white text-center text-sm"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    value={bowler.wickets || ''}
                                    onChange={(e) => updateBowler(idx, 'wickets', e.target.value ? parseInt(e.target.value) : '')}
                                    placeholder="0"
                                    className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-white text-center text-sm"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    value={bowler.wides || ''}
                                    onChange={(e) => updateBowler(idx, 'wides', e.target.value ? parseInt(e.target.value) : '')}
                                    placeholder="0"
                                    className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-white text-center text-sm"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    value={bowler.noBalls || ''}
                                    onChange={(e) => updateBowler(idx, 'noBalls', e.target.value ? parseInt(e.target.value) : '')}
                                    placeholder="0"
                                    className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-white text-center text-sm"
                                  />
                                </td>
                                <td className="p-2 text-center font-bold text-green-400">{bowler.economyRate}</td>
                                <td className="p-2 text-center">
                                  <button
                                    onClick={() => removeBowler(idx)}
                                    className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                                  >
                                    ✕
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Calculate Totals Button */}
                <button
                  onClick={calculateInningsTotals}
                  className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded font-semibold transition"
                >
                  Calculate Totals
                </button>
              </div>
            )}

            {/* Result Tab */}
            {activeTab === 'result' && (
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-6">Match Result</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Winner</label>
                    <select
                      value={scorecard.result?.winner || ''}
                      onChange={(e) => {
                        const updated = { ...scorecard };
                        updated.result = { ...updated.result, winner: e.target.value };
                        setScorecard(updated);
                      }}
                      className="w-full bg-gray-700 p-3 rounded border border-gray-600 text-white"
                    >
                      <option value="">Select...</option>
                      <option value={scorecard.matchInfo.team1.name}>{scorecard.matchInfo.team1.name}</option>
                      <option value={scorecard.matchInfo.team2.name}>{scorecard.matchInfo.team2.name}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Margin (e.g., "by 5 runs")</label>
                    <input
                      type="text"
                      value={scorecard.result?.margin || ''}
                      onChange={(e) => {
                        const updated = { ...scorecard };
                        updated.result = { ...updated.result, margin: e.target.value };
                        setScorecard(updated);
                      }}
                      placeholder="e.g., by 5 runs or by 3 wickets"
                      className="w-full bg-gray-700 p-3 rounded border border-gray-600 text-white placeholder-gray-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-400 mb-2">Man of the Match</label>
                    <select
                      value={scorecard.result?.manOfTheMatch || ''}
                      onChange={(e) => {
                        const updated = { ...scorecard };
                        updated.result = { ...updated.result, manOfTheMatch: e.target.value };
                        setScorecard(updated);
                      }}
                      className="w-full bg-gray-700 p-3 rounded border border-gray-600 text-white"
                    >
                      <option value="">Select Player</option>
                      {players.map(player => (
                        <option key={player.id} value={player.name}>{player.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 flex gap-4 flex-wrap">
              <button
                onClick={handleSaveScorecard}
                disabled={saving}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded font-bold transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : '💾 Save Scorecard'}
              </button>
              {scorecard.id && (
                <button
                  onClick={handlePublishScorecard}
                  disabled={saving}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded font-bold transition disabled:opacity-50"
                >
                  {saving ? 'Publishing...' : '🚀 Publish'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
