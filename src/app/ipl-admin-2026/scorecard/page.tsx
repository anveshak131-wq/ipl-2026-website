'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

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
  teamId: string | number;
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
    winner?: string;
    margin?: string;
    manOfTheMatch?: string;
  };
  draft?: boolean;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
}

export default function ScorecardAdminPage() {
  const router = useRouter();
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

  // Helper to get players by team
  const getPlayersByTeam = (teamId: number): Player[] => {
    const teamIdStr = String(teamId);
    return players.filter(player => {
      const playerTeamId = typeof player.teamId === 'number' ? String(player.teamId) : player.teamId;
      return playerTeamId === teamIdStr;
    });
  };

  // Refresh data function
  const refreshData = async () => {
    setMessage('🔄 Refreshing data...');
    await fetchMatches();
    await fetchPlayers();
    setMessage('');
  };

  const fetchMatches = async () => {
    try {
      console.log('Fetching IPL matches (Workers KV) via API');
      console.log('API Base URL:', process.env.NODE_ENV === 'production' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8788/api'));
      console.log('Admin token available:', !!localStorage.getItem('adminToken'));
      const res = await api.get('/matches', { league: 'ipl' });
      console.log('IPL matches response:', res);
      console.log('IPL matches data length:', res.data?.length || 0);
      setMatches(res.data || []);
      if (res.data && res.data.length === 0) {
        setMessage('⚠️ No IPL matches found. IPL matches are not yet available until you add them in the IPL matches page.');
      }
    } catch (err: unknown) {
      console.error('Error fetching IPL matches:', err);
      if (err instanceof Error) {
        console.error('Error details:', err.message, err.stack);
      }
      setMessage('⚠️ IPL matches are not yet available. Please add IPL matches in the IPL matches page first.');
    }
  };

  const fetchPlayers = async () => {
    try {
      console.log('Fetching IPL players (Workers KV) via API');
      console.log('API Base URL:', process.env.NODE_ENV === 'production' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8788/api'));
      console.log('Admin token available:', !!localStorage.getItem('adminToken'));
      const res = await api.get('/players', { league: 'ipl' });
      console.log('IPL players response:', res);
      console.log('IPL players data length:', res.data?.length || 0);
      setPlayers(res.data || []);
      if (res.data && res.data.length === 0) {
        setMessage('⚠️ No IPL players found. Please add IPL players first.');
      }
    } catch (err: unknown) {
      console.error('Error fetching IPL players:', err);
      if (err instanceof Error) {
        console.error('Error details:', err.message, err.stack);
      }
      setMessage('⚠️ IPL players are not yet available. Please add IPL players and teams first.');
    }
  };

  const handleSelectMatch = async (match: Match) => {
    setSelectedMatch(match);
    setLoading(true);
    setMessage('');
    try {
      const res = await api.get(`/scorecards?matchId=${match.id}`);
      if (res.data && res.data.length > 0) {
        setScorecard(res.data[0]);
      } else {
        setScorecard(initializeScorecard(match));
      }
    } catch (err) {
      console.log('No scorecard exists yet, creating new one');
      setScorecard(initializeScorecard(match));
    }
    setLoading(false);
  };

  const handleCreateMatch = () => {
    // Matches are authored on the matchday page which writes to Workers KV.
    // Navigate the admin to the match creation page where matches are created.
    router.push('/ipl-admin-2026/matchday');
  };

  // Export scorecard to PDF
  const exportScorecardPDF = async (sc: Scorecard) => {
    try {
      console.log('Starting IPL 2025 Professional PDF export...');
      
      // Import the 2025 PDF exporter for IPL
      const { exportScorecardPDF2025 } = await import('./pdf-export-2025');
      
      await exportScorecardPDF2025(sc);
      console.log('IPL 2025 Professional PDF exported successfully');
      setMessage('✅ IPL Scorecard PDF exported successfully!');
      setTimeout(() => setMessage(''), 3000);
      
    } catch (error) {
      console.error('Error exporting IPL PDF:', error);
      setMessage(`❌ Error exporting PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Export scorecard to CSV
  const exportScorecardCSV = (sc: Scorecard) => {
    try {
      const lines: string[] = [];

      // Match info
      lines.push('Match Info');
      lines.push(`Teams,${sc.matchInfo.team1.name} vs ${sc.matchInfo.team2.name}`);
      lines.push(`Venue,${sc.matchInfo.venue || ''}`);
      lines.push(`Date,${sc.matchInfo.date || ''}`);
      lines.push(`Time,${sc.matchInfo.time || ''}`);
      lines.push(`Toss Winner,${sc.matchInfo.toss?.winner || ''}`);
      lines.push(`Toss Decision,${sc.matchInfo.toss?.decision || ''}`);
      lines.push('');

      // Innings
      sc.innings.forEach((inn) => {
        const battingTeamName = inn.battingTeamId === sc.matchInfo.team1.id ? sc.matchInfo.team1.name : sc.matchInfo.team2.name;
        lines.push(`Innings ${inn.inningsNumber} - ${battingTeamName}`);
        lines.push('Batting');
        lines.push('Player,Runs,Balls,4s,6s,SR,Dismissal');
        inn.batting.forEach((b) => {
          lines.push(`${b.name || b.playerId || ''},${b.runs || 0},${b.balls || 0},${b.fours || 0},${b.sixes || 0},${b.strikeRate || ''},${b.dismissal?.type || ''}`);
        });
        lines.push('');

        lines.push('Bowling');
        lines.push('Bowler,Overs,Balls,Runs,Wickets,Maidens,Econ');
        inn.bowling.forEach((bw) => {
          lines.push(`${bw.name || bw.playerId || ''},${bw.overs || ''},${bw.balls || ''},${bw.runs || 0},${bw.wickets || 0},${bw.maidens || 0},${bw.economyRate || ''}`);
        });
        lines.push('');
        lines.push(`Extras,${(inn.extras.wides || 0) + (inn.extras.noBalls || 0) + (inn.extras.byes || 0) + (inn.extras.legByes || 0)}`);
        lines.push(`Total,${inn.totalRuns || 0}/${inn.totalWickets || 0} (${inn.totalOvers || ''})`);
        lines.push('');
      });

      // Result
      lines.push('Result');
      lines.push(`Winner,${sc.result?.winner || ''}`);
      lines.push(`Margin,${sc.result?.margin || ''}`);
      lines.push(`ManOfTheMatch,${sc.result?.manOfTheMatch || ''}`);

      const csvContent = lines.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `IPL-Scorecard-${sc.matchInfo.team1.name}-vs-${sc.matchInfo.team2.name}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setMessage('✅ IPL Scorecard CSV exported successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      setMessage(`❌ Error exporting CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setMessage(''), 3000);
    }
  };



  const initializeScorecard = (match: Match): Scorecard => {
    return {
      matchId: match.id,
      league: 'ipl',
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
      let res;
      if (scorecard.id) {
        res = await api.put(`/scorecards/${scorecard.id}`, scorecard);
      } else {
        res = await api.post('/scorecards', scorecard);
      }
      setScorecard(res.data);
      setMessage('✓ Scorecard saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error saving:', err);
      setMessage('✗ Error saving scorecard');
    }
    setSaving(false);
  };

  const handlePublishScorecard = async () => {
    if (!scorecard?.id) return;
    setSaving(true);
    setMessage('');
    try {
      await api.put(`/scorecards/${scorecard.id}/publish`);
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
        [parent]: { ...(updated.matchInfo[parent as keyof typeof updated.matchInfo] as any), [child]: value },
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

    // Calculate total runs
    inning.totalRuns = inning.batting.reduce((sum, b) => sum + b.runs, 0) + 
                       (inning.extras.wides + inning.extras.noBalls + inning.extras.byes + inning.extras.legByes);

    // Calculate total wickets
    inning.totalWickets = inning.batting.filter(
      (b) => !b.dismissal || b.dismissal.type !== 'not-out'
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">IPL Scorecard Admin</h1>
        <p className="text-gray-400 mb-8">Create and manage IPL match scorecards</p>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.includes('✓') ? 'bg-green-900' : 'bg-red-900'}`}>
            {message}
          </div>
        )}

        {/* Match Selection */}
        {!selectedMatch && (
          <div>
            <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Select a Match</h2>
                <p className="text-gray-400 mt-1">
                  {matches.length} IPL matches available • {players.length} IPL players loaded
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={refreshData}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition flex items-center gap-2"
                >
                  🔄 Refresh Data
                </button>

                <button
                  onClick={handleCreateMatch}
                  className="px-4 py-2 bg-pink-600 hover:bg-pink-700 rounded transition"
                >
                  ➕ Create Match
                </button>
              </div>
            </div>
            
            {/* Show message when no matches are available */}
            {matches.length === 0 && (
              <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-6 mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">⚠️</span>
                  <h3 className="text-xl font-bold text-yellow-300">IPL Matches Not Yet Available</h3>
                </div>
                <p className="text-yellow-200 mb-4">
                  IPL matches are not yet available until you add them in the IPL matches page. 
                  Once you create IPL matches, they will appear here for scorecard management.
                </p>
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={handleCreateMatch}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded transition flex items-center gap-2"
                  >
                    ➕ Create IPL Matches Manually
                  </button>
                  <button
                    onClick={() => router.push('/ipl-admin-2026/matches')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition flex items-center gap-2"
                  >
                    📋 Go to IPL Matches Page
                  </button>
                </div>
              </div>
            )}
            
            {/* Show message when no players are available but matches exist */}
            {matches.length > 0 && players.length === 0 && (
              <div className="bg-orange-900 border border-orange-700 rounded-lg p-6 mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">👥</span>
                  <h3 className="text-xl font-bold text-orange-300">IPL Players Not Yet Available</h3>
                </div>
                <p className="text-orange-200 mb-4">
                  IPL players are not yet available. You need to add players before creating scorecards.
                </p>
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={() => router.push('/ipl-admin-2026/players')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition flex items-center gap-2"
                  >
                    👥 Go to IPL Players Page
                  </button>
                </div>
              </div>
            )}
            
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
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handleSaveScorecard}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 rounded transition"
                >
                  {saving ? 'Saving...' : 'Save Draft'}
                </button>
                <button
                  onClick={handlePublishScorecard}
                  disabled={saving || !scorecard.id}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 rounded transition"
                >
                  {saving ? 'Publishing...' : 'Publish'}
                </button>
                <button
                  onClick={() => exportScorecardPDF(scorecard)}
                  disabled={!scorecard}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 rounded transition flex items-center gap-2"
                >
                  📄 Export PDF
                </button>
                <button
                  onClick={() => exportScorecardCSV(scorecard)}
                  disabled={!scorecard}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 rounded transition flex items-center gap-2"
                >
                  📊 Export CSV
                </button>
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
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 border-b border-gray-700">
              {['matchInfo', 'innings1', 'innings2', 'result'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    if (tab === 'innings1') setActiveInnings(0);
                    if (tab === 'innings2') setActiveInnings(1);
                  }}
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
                    <input
                      type="text"
                      placeholder={`${scorecard.matchInfo.team1.name} or ${scorecard.matchInfo.team2.name}`}
                      value={scorecard.matchInfo.toss?.winner || ''}
                      onChange={(e) => updateMatchInfo('toss.winner', e.target.value)}
                      className="w-full bg-gray-700 p-3 rounded border border-gray-600 text-white placeholder-gray-500"
                    />
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
                            <th className="text-left p-2">Dismissal</th>
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
                                    value={batter.runs}
                                    onChange={(e) => updateBatter(idx, 'runs', parseInt(e.target.value) || 0)}
                                    className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-white text-center text-sm"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    value={batter.balls}
                                    onChange={(e) => updateBatter(idx, 'balls', parseInt(e.target.value) || 0)}
                                    className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-white text-center text-sm"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    value={batter.fours}
                                    onChange={(e) => updateBatter(idx, 'fours', parseInt(e.target.value) || 0)}
                                    className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-white text-center text-sm"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    value={batter.sixes}
                                    onChange={(e) => updateBatter(idx, 'sixes', parseInt(e.target.value) || 0)}
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

                  {/* Calculate Totals Button */}
                  <button
                    onClick={calculateInningsTotals}
                    className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded font-semibold transition mt-6"
                  >
                    Calculate Totals
                  </button>
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
                            <th className="text-left p-2">Player</th>
                            <th className="text-center p-2">Overs</th>
                            <th className="text-center p-2">Balls</th>
                            <th className="text-center p-2">Runs</th>
                            <th className="text-center p-2">Wickets</th>
                            <th className="text-center p-2">Maidens</th>
                            <th className="text-center p-2">Economy</th>
                            <th className="text-center p-2">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {scorecard.innings[activeInnings].bowling.map((bowler, idx) => {
                            const teamPlayers = getPlayersByTeam(scorecard.innings[activeInnings].battingTeamId === scorecard.matchInfo.team1.id ? scorecard.matchInfo.team2.id : scorecard.matchInfo.team1.id);
                            return (
                              <tr key={idx} className="border-b border-gray-700">
                                <td className="p-2">
                                  <select
                                    value={bowler.playerId}
                                    onChange={(e) => updateBowler(idx, 'playerId', e.target.value)}
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
                                    step="0.1"
                                    value={bowler.overs}
                                    onChange={(e) => updateBowler(idx, 'overs', parseFloat(e.target.value) || 0)}
                                    className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-white text-center text-sm"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    value={bowler.balls}
                                    onChange={(e) => updateBowler(idx, 'balls', parseInt(e.target.value) || 0)}
                                    className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-white text-center text-sm"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    value={bowler.runs}
                                    onChange={(e) => updateBowler(idx, 'runs', parseInt(e.target.value) || 0)}
                                    className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-white text-center text-sm"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    value={bowler.wickets}
                                    onChange={(e) => updateBowler(idx, 'wickets', parseInt(e.target.value) || 0)}
                                    className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-white text-center text-sm"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    value={bowler.maidens}
                                    onChange={(e) => updateBowler(idx, 'maidens', parseInt(e.target.value) || 0)}
                                    className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-white text-center text-sm font-bold text-yellow-400"
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
                      className="w-full bg-gray-700 p-3 rounded border border-gray-600 text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
