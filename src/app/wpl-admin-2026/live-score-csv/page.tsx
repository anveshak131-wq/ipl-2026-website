
"use client";
// Hardcoded player lists for each team
const HARDCODED_PLAYERS: { [team: string]: string[] } = {
  'MI': [
    'Harmanpreet Kaur', 'Yastika Bhatia', 'Hayley Matthews', 'Nat Sciver-Brunt',
    'Amelia Kerr', 'Pooja Vastrakar', 'Issy Wong', 'Amanjot Kaur',
    'Saika Ishaque', 'Jintimani Kalita', 'Humaira Kazi', 'Chloe Tryon',
    'Priyanka Bala', 'Neelam Bisht', 'Sonam Yadav', 'Dhara Gujjar', 'Sabbhineni Meghana'
  ],
  'RCB': [
    'Smriti Mandhana', 'Sophie Devine', 'Ellyse Perry', 'Richa Ghosh',
    'Heather Knight', 'Renuka Singh', 'Shreyanka Patil', 'Kanika Ahuja',
    'Asha Sobhana', 'Disha Kasat', 'Erin Burns', 'Poonam Khemnar',
    'Sahana Pawar', 'Preeti Bose', 'Megan Schutt', 'Komal Zanzad', 'Simran Bahadur'
  ],
  // Add more teams as needed
};

import { useState, useEffect, useMemo } from 'react';
import comprehensivePlayers from '../../../../comprehensive-players.json';
import type { SaveStatus } from './saveStatus';
import WPLAdminSidebarNew from '@/components/admin/WPLAdminSidebarNew';
import { api as dataApi } from '@/lib/data';
import { Match } from '@/types';

const HEADERS = ['Overs','Ball','Innings','Striker','Non-Striker','Bowler','Runs','Wide','No Ball','Byes','LB','Wicket','Notes'];

export default function LiveScoreCSVPage() {
  const [rows, setRows] = useState<string[][]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [tossInfo, setTossInfo] = useState<string>('');
  const [playing11, setPlaying11] = useState<{ [team: string]: string[] }>({});
  // Map matches list team names to scorecard short names
  const [teamNameMap, setTeamNameMap] = useState<{ [matchTeam: string]: string }>({});
  // Map team short name to teamId
  const [teamIdMap, setTeamIdMap] = useState<{ [shortName: string]: string }>({});
  const [allPlayers, setAllPlayers] = useState<any[]>([]);
  
  // Wicket data state
  const [wicketData, setWicketData] = useState<{ [rowIndex: number]: { 
    hasWicket: boolean; 
    wicketType: string; 
    wicketTaker: string; 
  } }>({});

  // Extras data state
  const [extrasData, setExtrasData] = useState<{ [rowIndex: number]: { 
    hasWide: boolean; 
    hasNoBall: boolean; 
    hasByes: boolean;
    hasLB: boolean;
    byesRuns: number;
    lbRuns: number;
    wideRuns: number; // Additional runs from wide (boundary or batsmen running)
    noBallRuns: number; // Additional runs from no ball
    noBallType: 'bat' | 'bye'; // Whether no ball runs go to batsman or byes
  } }>({});

  // Common cricket wicket types
  const WICKET_TYPES = [
    'Caught',
    'Bowled', 
    'LBW',
    'Run Out',
    'Stumped',
    'Caught and Bowled',
    'Hit Wicket',
    'Obstructing the Field',
    'Handled the Ball',
    'Timed Out',
    'Mankading (Run out at non-striker end)'
  ];

  // Fetch matches list on mount
  useEffect(() => {
    (async () => {
      try {
        // Fetch matches (like scorecard page)
        const data = await dataApi.getMatches('wpl');
        console.log('=== MATCHES LIST DEBUG ===');
        console.log('Fetched WPL matches:', data);
        if (data && data.length > 0) {
          setMatches(data);
          setSelectedMatch(data[0].id);
        } else {
          console.log('No WPL matches found');
        }
        
        // Fetch players (like scorecard page)
        const playersData = await dataApi.getPlayers(undefined, 'wpl');
        console.log('Fetched WPL players:', playersData);
        setAllPlayers(playersData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    })();
  }, []);

  // Load table data and toss info for selected match
  useEffect(() => {
    if (!selectedMatch) return;
    (async () => {
      try {
        // Table data
        const resp = await fetch(`/api/wpl-live-score/save?matchId=${encodeURIComponent(selectedMatch)}`);
        if (resp.ok) {
          const data = await resp.json();
          if (Array.isArray(data.rows)) {
            setRows(data.rows);
          } else if (Array.isArray(data)) {
            setRows(data);
          } else {
            console.log('Unexpected data from KV:', data);
          }
        }
      } catch {}
      // Get playing 11 from match data
      try {
        const matchResp = await fetch(`/api/matches?id=${encodeURIComponent(selectedMatch)}`);
        if (matchResp.ok) {
          const matchData = await matchResp.json();
          console.log('=== MATCH DATA DEBUG ===');
          console.log('Full match data:', matchData);
          console.log('Match name:', matchData.name);
          console.log('Playing11 data:', matchData.playing11);
          console.log('Match team1:', matchData.team1);
          console.log('Match team2:', matchData.team2);
          if (matchData && matchData.playing11) {
            const p11 = matchData.playing11;
            console.log('Playing11 keys:', Object.keys(p11));
            console.log('Team1 players:', p11.team1);
            console.log('Team2 players:', p11.team2);
            console.log('Playing11 structure:', JSON.stringify(p11, null, 2));
            setPlaying11(p11);
          } else {
            console.log('No playing11 found in match data');
          }
        }
      } catch (error) {
        console.error('Error fetching match data:', error);
      }
      // Toss info from scorecard
      try {
        const tossResp = await fetch(`/api/scorecards?matchId=${encodeURIComponent(selectedMatch)}`);
        if (tossResp.ok) {
          const scorecards = await tossResp.json();
          if (Array.isArray(scorecards) && scorecards.length > 0) {
            const sc = scorecards[0];
            let toss = '';
            if (sc.matchInfo && sc.matchInfo.toss) toss = sc.matchInfo.toss;
            else if (sc.toss) toss = sc.toss;
            else if (sc.matchInfo && sc.matchInfo.tossWinner) toss = sc.matchInfo.tossWinner;
            // If toss is an object, format as string
            if (toss && typeof toss === 'object') {
              const tossObj = toss as any;
              const winner = tossObj.winner || tossObj.team || '';
              const decision = tossObj.decision || '';
              setTossInfo(`Winner: ${winner}${decision ? '; Decision: ' + decision : ''}`);
            } else {
              setTossInfo(toss || '');
            }
            // Extract team name mappings from scorecard (but not playing11)
            let nameMap: { [matchTeam: string]: string } = {};
            let idMap: { [shortName: string]: string } = {};
            let team1Short = '', team2Short = '';
            if (sc.matchInfo && sc.matchInfo.team1 && sc.matchInfo.team2) {
              team1Short = sc.matchInfo.team1.shortName || sc.matchInfo.team1.name || 'team1';
              team2Short = sc.matchInfo.team2.shortName || sc.matchInfo.team2.name || 'team2';
              // Map matches list names to scorecard short names
              const match = matches.find(m => m.id === selectedMatch);
              if (match && match.team1 && match.team2) {
                const matchTeam1 = match.team1.name;
                const matchTeam2 = match.team2.name;
                if (matchTeam1 && team1Short) nameMap[matchTeam1.trim()] = team1Short;
                if (matchTeam2 && team2Short) nameMap[matchTeam2.trim()] = team2Short;
              }
              // Map shortName to teamId from matchInfo
              if (sc.matchInfo.team1.shortName && sc.matchInfo.team1.id) idMap[sc.matchInfo.team1.shortName] = sc.matchInfo.team1.id;
              if (sc.matchInfo.team2.shortName && sc.matchInfo.team2.id) idMap[sc.matchInfo.team2.shortName] = sc.matchInfo.team2.id;
            } else {
              // fallback to matches list
              const match = matches.find(m => m.id === selectedMatch);
              if (match && match.team1 && match.team2) {
                team1Short = match.team1.name || 'team1';
                team2Short = match.team2.name || 'team2';
              }
            }
            setTeamNameMap(nameMap);
            setTeamIdMap(idMap);
          } else {
            setTossInfo('');
            setPlaying11({});
          }
        } else {
          setTossInfo('');
          setPlaying11({});
        }
      } catch {
        setTossInfo('');
        setPlaying11({});
      }
    })();
  }, [selectedMatch]);

  const updateCell = (rIdx: number, cIdx: number, value: string) => {
    setRows((prev) => {
      const copy = prev.map((r) => [...r]);
      copy[rIdx][cIdx] = value;
      return copy;
    });
  };

  // Wicket handling functions
  const updateWicketData = (rowIndex: number, field: 'hasWicket' | 'wicketType' | 'wicketTaker', value: boolean | string) => {
    setWicketData(prev => ({
      ...prev,
      [rowIndex]: {
        ...prev[rowIndex],
        [field]: value
      }
    }));
  };

  // Extras handling functions
  const updateExtrasData = (rowIndex: number, field: 'hasWide' | 'hasNoBall' | 'hasByes' | 'hasLB' | 'byesRuns' | 'lbRuns' | 'wideRuns' | 'noBallRuns' | 'noBallType', value: boolean | number | string) => {
    setExtrasData(prev => ({
      ...prev,
      [rowIndex]: {
        ...prev[rowIndex],
        [field]: value
      }
    }));

    // Update the cell value to reflect the extras (for CSV export)
    const extras = [];
    if (extrasData[rowIndex]?.hasWide || (field === 'hasWide' && value)) {
      const runs = field === 'wideRuns' ? (value as number) : (extrasData[rowIndex]?.wideRuns || 0);
      if (runs > 0) {
        extras.push(`Wide: ${runs + 1}`); // +1 for the wide penalty
      } else {
        extras.push('Wide: 1');
      }
    }
    if (extrasData[rowIndex]?.hasNoBall || (field === 'hasNoBall' && value)) {
      const runs = field === 'noBallRuns' ? (value as number) : (extrasData[rowIndex]?.noBallRuns || 0);
      const type = field === 'noBallType' ? (value as string) : (extrasData[rowIndex]?.noBallType || 'bat');
      if (runs > 0) {
        extras.push(`No Ball (${type}): ${runs + 1}`); // +1 for the no ball penalty
      } else {
        extras.push(`No Ball (${type}): 1`);
      }
    }
    if (extrasData[rowIndex]?.hasByes || (field === 'hasByes' && value)) {
      const runs = field === 'byesRuns' ? value : (extrasData[rowIndex]?.byesRuns || 0);
      extras.push(`Byes: ${runs}`);
    }
    if (extrasData[rowIndex]?.hasLB || (field === 'hasLB' && value)) {
      const runs = field === 'lbRuns' ? value : (extrasData[rowIndex]?.lbRuns || 0);
      extras.push(`LB: ${runs}`);
    }
    
    // Store extras info in the appropriate cell for data persistence
    let cellIndex = 7; // Wide column
    if (field === 'hasNoBall' || field === 'noBallRuns' || field === 'noBallType') cellIndex = 8; // No Ball column
    if (field === 'hasByes' || field === 'byesRuns') cellIndex = 9; // Byes column
    if (field === 'hasLB' || field === 'lbRuns') cellIndex = 10; // LB column
    
    const relevantExtras = extras.filter(e => 
      (field === 'hasWide' || field === 'wideRuns') && e.includes('Wide') ||
      (field === 'hasNoBall' || field === 'noBallRuns' || field === 'noBallType') && e.includes('No Ball') ||
      (field === 'hasByes' || field === 'byesRuns') && e.includes('Byes') ||
      (field === 'hasLB' || field === 'lbRuns') && e.includes('LB')
    );
    
    updateCell(rowIndex, cellIndex, relevantExtras.join(', ') || (value ? (field.includes('has') ? field.replace('has', '') : `${field}: ${value}`) : ''));
  };

  const generateWicketDescription = (rowIndex: number) => {
    const data = wicketData[rowIndex];
    if (!data || !data.hasWicket) return '';
    
    let description = data.wicketType || '';
    if (data.wicketTaker) {
      description += ` - ${data.wicketTaker}`;
    }
    return description;
  };

  // Calculate team total for a specific innings
  const calculateTeamTotal = (innings: string | number) => {
    const filteredRows = rows.filter(row => row[2] === String(innings));
    
    let totalRuns = 0;
    let totalExtras = 0;
    
    filteredRows.forEach((row, index) => {
      const originalIndex = rows.indexOf(row);
      const extras = extrasData[originalIndex] || {};
      
      // Add batsman's runs
      totalRuns += parseInt(row[6]) || 0;
      
      // Add extras
      if (extras.hasWide) totalExtras += 1 + (extras.wideRuns || 0); // 1 penalty + additional runs
      if (extras.hasNoBall) {
        totalExtras += 1 + (extras.noBallRuns || 0); // 1 penalty + additional runs
        // If no ball type is 'bye', runs go to byes, not extras
        if (extras.noBallType === 'bye') {
          totalExtras -= (extras.noBallRuns || 0); // Remove from extras, will be counted in byes
        }
      }
      if (extras.hasByes) totalExtras += extras.byesRuns || 0;
      if (extras.hasLB) totalExtras += extras.lbRuns || 0;
      
      // Add no ball byes to byes total if applicable
      if (extras.hasNoBall && extras.noBallType === 'bye') {
        totalExtras += extras.noBallRuns || 0;
      }
    });
    
    return {
      batsmanRuns: totalRuns,
      wides: (filteredRows.reduce((sum, row) => {
        const originalIndex = rows.indexOf(row);
        return sum + (extrasData[originalIndex]?.hasWide ? 1 : 0);
      }, 0)),
      noBalls: (filteredRows.reduce((sum, row) => {
        const originalIndex = rows.indexOf(row);
        return sum + (extrasData[originalIndex]?.hasNoBall ? 1 : 0);
      }, 0)),
      byes: (filteredRows.reduce((sum, row) => {
        const originalIndex = rows.indexOf(row);
        let byeRuns = (extrasData[originalIndex]?.byesRuns || 0);
        // Add no ball byes if type is 'bye'
        if (extrasData[originalIndex]?.hasNoBall && extrasData[originalIndex]?.noBallType === 'bye') {
          byeRuns += (extrasData[originalIndex]?.noBallRuns || 0);
        }
        return sum + byeRuns;
      }, 0)),
      legByes: (filteredRows.reduce((sum, row) => {
        const originalIndex = rows.indexOf(row);
        return sum + (extrasData[originalIndex]?.lbRuns || 0);
      }, 0)),
      extras: totalExtras,
      teamTotal: totalRuns + totalExtras
    };
  };

  // Helper to get team short names from matches list for selected match
  const getSelectedMatchTeams = () => {
    const match = matches.find(m => m.id === selectedMatch);
    if (!match || !match.team1 || !match.team2) return { team1: '', team2: '' };
    return { team1: match.team1.name, team2: match.team2.name };
  };

  // Helper to get scorecard short name for a match team name
  const getScorecardShortName = (matchTeam: string) => {
    return teamNameMap[matchTeam] || matchTeam;
  };

  // Helper to normalize team names for comparison
  const normalizeTeamName = (teamName: string) => {
    if (!teamName) return '';
    
    // Convert to lowercase and remove common variations
    const normalized = teamName.toLowerCase().trim();
    
    // Handle common team name variations
    if (normalized.includes('royal challengers') || normalized.includes('rcb')) {
      return 'RCB';
    }
    if (normalized.includes('mumbai indians') || normalized.includes('mumbai') || normalized.includes('mi')) {
      return 'MI';
    }
    if (normalized.includes('chennai super') || normalized.includes('csk')) {
      return 'CSK';
    }
    if (normalized.includes('kolkata knight') || normalized.includes('kkr')) {
      return 'KKR';
    }
    
    return teamName;
  };

  // Helper to determine which team bats first based on tossInfo
  const getBattingFirstTeam = () => {
    const { team1, team2 } = getSelectedMatchTeams();
    
    if (!tossInfo) return '';
    const winnerMatch = tossInfo.match(/Winner: ([^;]+)/);
    const decisionMatch = tossInfo.match(/Decision: ([^;]+)/);
    const winner = winnerMatch ? winnerMatch[1].trim() : '';
    const decision = decisionMatch ? decisionMatch[1].trim().toLowerCase() : '';
    
    if (!winner || !decision) return '';
    
    // Normalize team names for comparison
    const normalizedWinner = normalizeTeamName(winner);
    const normalizedTeam1 = normalizeTeamName(team1);
    const normalizedTeam2 = normalizeTeamName(team2);
    
    if (decision === 'bowl') {
      // If winner chose to bowl, the other team bats first
      if (normalizedWinner === normalizedTeam1) return team2;
      if (normalizedWinner === normalizedTeam2) return team1;
    }
    if (decision === 'bat') {
      // If winner chose to bat, they bat first
      if (normalizedWinner === normalizedTeam1) return team1;
      if (normalizedWinner === normalizedTeam2) return team2;
    }
    return '';
  };

  // Helper to get players by team (like scorecard page)
  const getPlayersByTeam = (teamId: number): any[] => {
    return allPlayers.filter(player => player.teamId === teamId.toString());
  };

  // Helper to get batting team for a given innings (1 or 2)
  const getBattingTeamForInnings = (innings: string | number) => {
    const { team1, team2 } = getSelectedMatchTeams();
    const first = getBattingFirstTeam();
    if (innings === '1' || innings === 1) return getScorecardShortName(first);
    if (innings === '2' || innings === 2) {
      if (first === team1) return getScorecardShortName(team2);
      if (first === team2) return getScorecardShortName(team1);
    }
    return '';
  };

  // Helper to map batting team name to playing11 key (team1/team2)
  const getPlaying11Key = (battingTeamShortName: string) => {
    console.log('=== MAPPING DEBUG ===');
    const { team1, team2 } = getSelectedMatchTeams();
    const team1Short = getScorecardShortName(team1);
    const team2Short = getScorecardShortName(team2);
    
    console.log('Input batting team:', battingTeamShortName);
    console.log('Match teams:', { team1, team2 });
    console.log('Short names:', { team1Short, team2Short });
    
    let result = '';
    if (battingTeamShortName === team1Short) result = 'team1';
    else if (battingTeamShortName === team2Short) result = 'team2';
    else if (battingTeamShortName === team1) result = 'team1';
    else if (battingTeamShortName === team2) result = 'team2';
    
    console.log('Mapping result:', result);
    console.log('==================');
    return result;
  };

  // Get all players for a team short name (from comprehensive-players.json)
  const getAllPlayersForTeam = (shortName: string) => {
    const teamId = teamIdMap[shortName];
    if (!teamId) return [];
    // @ts-ignore
    return (comprehensivePlayers as any[]).filter(p => p.teamId === teamId).map(p => p.name);
  };

  const addRow = () => {
    // Prefill for first innings, first over, first ball
    const battingFirst = getBattingFirstTeam();
    let newRow = Array(HEADERS.length).fill('');
    // If table is empty or user is adding the first row for innings 1, over 0, ball 0
    if (rows.length === 0 || (rows[0][0] === '0' && rows[0][1] === '0' && rows[0][2] === '1')) {
      // Prefill Innings=1, Overs=0, Ball=0, Striker/Non-Striker with battingFirst
      newRow[0] = '0'; // Overs
      newRow[1] = '0'; // Ball
      newRow[2] = '1'; // Innings
      newRow[3] = battingFirst; // Striker
      newRow[4] = battingFirst; // Non-Striker
    }
    setRows((p) => [...p, newRow]);
  };
  const removeRow = async (idx: number) => {
    setRows((prev) => {
      const updated = prev.filter((_, i) => i !== idx);
      (async () => {
        setSaveStatus('saving');
        try {
          const resp = await fetch(`/api/wpl-live-score/save?matchId=${encodeURIComponent(selectedMatch)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rows: updated }),
          });
          if (resp.ok) {
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 2000);
          } else {
            setSaveStatus('error');
          }
        } catch {
          setSaveStatus('error');
        }
      })();
      return updated;
    });
  };

  const exportCSV = () => {
    const headerLine = HEADERS.join(',');
    const body = rows
      .map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const csv = [headerLine, body].filter(Boolean).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'live_score.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveRows = async () => {
    setSaveStatus('saving');
    try {
      const resp = await fetch(`/api/wpl-live-score/save?matchId=${encodeURIComponent(selectedMatch)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });
      if (resp.ok) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
    }
  };

  // Normalize team key for hardcoded player lookup
  const normalizeTeamKey = (team: string) => {
    if (!team) return '';
    if (team === 'MI-W') return 'MI';
    if (team === 'RCB-W') return 'RCB';
    // Add more mappings as needed
    return team;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
        <WPLAdminSidebarNew />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Enhanced Header */}
            <div className="mb-8 text-center">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                Live Score Management
              </h1>
              <p className="text-gray-300 text-lg">Professional Cricket Scoring Dashboard</p>
            </div>

            {/* Enhanced Match Selection */}
            <div className="mb-8">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
                <label className="block text-white font-semibold mb-3 text-lg">Select Match</label>
                <select
                  className="w-full max-w-md border border-white/20 rounded-xl px-4 py-3 bg-white/10 text-white backdrop-blur-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 transition-all duration-200 text-lg"
                  value={selectedMatch}
                  onChange={e => setSelectedMatch(e.target.value)}
                  disabled={matches.length === 0}
                >
                  <option value="" className="bg-gray-800">Choose a match...</option>
                  {matches.map(m => (
                    <option key={m.id} value={m.id} className="bg-gray-800">{m.team1.name} vs {m.team2.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Enhanced Toss Info */}
            {tossInfo && (
              <div className="mb-8">
                <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-lg rounded-2xl p-4 border border-white/20 shadow-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                    <p className="text-blue-100 font-semibold text-lg">{tossInfo}</p>
                  </div>
                </div>
              </div>
            )}
          <p className="text-sm text-gray-500 mb-4">Edit rows inline for testing. Use the + button to add rows and the trash button to remove.</p>
          <div className="mb-4 flex gap-3 items-center">
            <button onClick={addRow} className="px-3 py-2 bg-purple-600 text-white rounded-md">+ Add Row</button>
            <button onClick={exportCSV} className="px-3 py-2 bg-white border border-gray-200 rounded-md text-gray-700 shadow-sm hover:bg-gray-50">Export CSV</button>
            <button onClick={saveRows} className="px-3 py-2 bg-green-600 text-white rounded-md disabled:opacity-60" disabled={saveStatus==='saving'}>
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'success' ? 'Saved!' : saveStatus === 'error' ? 'Error!' : 'Save'}
            </button>
          </div>
          
          {/* Team Totals Display */}
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-bold text-blue-400 mb-2">Innings 1 Total</h3>
              <div className="text-sm space-y-1">
                <div>Batsman Runs: <span className="font-mono text-white">{calculateTeamTotal(1).batsmanRuns}</span></div>
                <div>Wides: <span className="font-mono text-orange-400">{calculateTeamTotal(1).wides}</span></div>
                <div>No Balls: <span className="font-mono text-yellow-400">{calculateTeamTotal(1).noBalls}</span></div>
                <div>Byes: <span className="font-mono text-purple-400">{calculateTeamTotal(1).byes}</span></div>
                <div>Leg Byes: <span className="font-mono text-pink-400">{calculateTeamTotal(1).legByes}</span></div>
                <div className="text-xs text-gray-500 mt-2">Extras: {calculateTeamTotal(1).extras}</div>
                <div className="text-lg font-bold text-green-400 border-t border-gray-700 pt-2">Team Total: <span className="font-mono">{calculateTeamTotal(1).teamTotal}</span></div>
              </div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-bold text-blue-400 mb-2">Innings 2 Total</h3>
              <div className="text-sm space-y-1">
                <div>Batsman Runs: <span className="font-mono text-white">{calculateTeamTotal(2).batsmanRuns}</span></div>
                <div>Wides: <span className="font-mono text-orange-400">{calculateTeamTotal(2).wides}</span></div>
                <div>No Balls: <span className="font-mono text-yellow-400">{calculateTeamTotal(2).noBalls}</span></div>
                <div>Byes: <span className="font-mono text-purple-400">{calculateTeamTotal(2).byes}</span></div>
                <div>Leg Byes: <span className="font-mono text-pink-400">{calculateTeamTotal(2).legByes}</span></div>
                <div className="text-xs text-gray-500 mt-2">Extras: {calculateTeamTotal(2).extras}</div>
                <div className="text-lg font-bold text-green-400 border-t border-gray-700 pt-2">Team Total: <span className="font-mono">{calculateTeamTotal(2).teamTotal}</span></div>
              </div>
            </div>
          </div>
          
          <div className="shadow-lg overflow-hidden rounded-lg border border-gray-300 bg-gray-900">
            <table className="min-w-full text-sm table-fixed bg-gray-900">
              <thead className="bg-gray-800">
                <tr>
                  {HEADERS.map((h) => (
                    <th key={h} className="px-3 py-3 text-left font-semibold text-gray-100 sticky top-0 z-10 border-b border-gray-700 uppercase tracking-wide bg-gray-800">{h}</th>
                  ))}
                  <th className="px-3 py-3 sticky top-0 z-10 border-b border-gray-700 bg-gray-800 text-gray-100">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, r) => (
                  <tr key={r} className={`transition-colors ${r % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800'} hover:bg-gray-700`}>
                    {row.map((cell, c) => {
                      // Determine batting team for this row
                      let battingTeam = '';
                      if (c === 3 || c === 4) {
                        // Striker/Non-Striker: use row[2] (Innings) to determine
                        battingTeam = getBattingTeamForInnings(row[2]);
                      }
                      return (
                        <td key={c} className="px-3 py-2 align-top border-b border-gray-800">
                          {c === 0 ? (
                            <select
                              value={cell}
                              onChange={e => updateCell(r, c, e.target.value)}
                              className="w-full border border-gray-700 focus:border-purple-500 rounded px-2 py-1 bg-gray-900 text-gray-100"
                            >
                              <option value="">Overs</option>
                              {Array.from({ length: 21 }, (_, i) => (
                                <option key={i} value={String(i)}>{i}</option>
                              ))}
                            </select>
                          ) : c === 1 ? (
                            <select
                              value={cell}
                              onChange={e => updateCell(r, c, e.target.value)}
                              className="w-full border border-gray-700 focus:border-purple-500 rounded px-2 py-1 bg-gray-900 text-gray-100"
                            >
                              <option value="">Ball</option>
                              {Array.from({ length: 7 }, (_, i) => (
                                <option key={i} value={String(i)}>{i}</option>
                              ))}
                            </select>
                          ) : c === 2 ? (
                            <select
                              value={cell}
                              onChange={e => updateCell(r, c, e.target.value)}
                              className="w-full border border-gray-700 focus:border-purple-500 rounded px-2 py-1 bg-gray-900 text-gray-100"
                            >
                              <option value="">Innings</option>
                              <option value="1">1</option>
                              <option value="2">2</option>
                            </select>
                          ) : c === 3 || c === 4 ? (
                            <select
                              value={cell}
                              onChange={e => updateCell(r, c, e.target.value)}
                              className="w-full border border-gray-700 focus:border-purple-500 rounded px-2 py-1 bg-gray-900 text-gray-100"
                            >
                              <option value="">{c === 3 ? 'Striker' : 'Non-Striker'}</option>
                              {(() => {
                                // Get the batting team based on scorecard data
                                const match = matches.find(m => m.id === selectedMatch);
                                const { team1, team2 } = getSelectedMatchTeams();
                                let battingTeamId = '';
                                
                                // From scorecard: RCB won toss and chose to bowl
                                // So MI bats first (innings 1), RCB bats second (innings 2)
                                // Hardcoded team IDs based on scorecard data
                                // MI has teamId "11", RCB has teamId "12"
                                
                                if (row[2] === '1' || row[2] === 1) {
                                  // Innings 1: MI is batting (teamId "11")
                                  battingTeamId = "11";
                                } else {
                                  // Innings 2: RCB is batting (teamId "12")
                                  battingTeamId = "12";
                                }
                                
                                // Get players for the batting team
                                const teamPlayers = battingTeamId ? getPlayersByTeam(parseInt(battingTeamId)) : [];
                                
                                return teamPlayers.map((player: any) => (
                                  <option key={player.id} value={player.name}>{player.name}</option>
                                ));
                              })()}
                            </select>
                          ) : c === 5 ? (
                            <select
                              value={cell}
                              onChange={e => updateCell(r, c, e.target.value)}
                              className="w-full border border-gray-700 focus:border-purple-500 rounded px-2 py-1 bg-gray-900 text-gray-100"
                            >
                              <option value="">Bowler</option>
                              {(() => {
                                // Get the bowling team based on scorecard data
                                const match = matches.find(m => m.id === selectedMatch);
                                const { team1, team2 } = getSelectedMatchTeams();
                                let bowlingTeamId = '';
                                
                                // From scorecard: RCB won toss and chose to bowl
                                // So MI bats first (innings 1), RCB bowls first (innings 1)
                                // In innings 2, RCB bats, MI bowls
                                // Hardcoded team IDs based on scorecard data
                                // MI has teamId "11", RCB has teamId "12"
                                
                                if (row[2] === '1' || row[2] === 1) {
                                  // Innings 1: RCB is bowling (teamId "12")
                                  bowlingTeamId = "12";
                                } else {
                                  // Innings 2: MI is bowling (teamId "11")
                                  bowlingTeamId = "11";
                                }
                                
                                // Get players for the bowling team
                                const teamPlayers = bowlingTeamId ? getPlayersByTeam(parseInt(bowlingTeamId)) : [];
                                
                                return teamPlayers.map((player: any) => (
                                  <option key={player.id} value={player.name}>{player.name}</option>
                                ));
                              })()}
                            </select>
                          ) : c === 7 ? (
                            // Wide checkbox + dropdown for additional runs
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={extrasData[r]?.hasWide || false}
                                  onChange={(e) => updateExtrasData(r, 'hasWide', e.target.checked)}
                                  className="rounded border-gray-600 bg-gray-900 text-purple-600 focus:ring-purple-500"
                                />
                                <label className="text-xs text-gray-400">Wide?</label>
                              </div>
                              {extrasData[r]?.hasWide && (
                                <select
                                  value={extrasData[r]?.wideRuns || 0}
                                  onChange={(e) => updateExtrasData(r, 'wideRuns', parseInt(e.target.value))}
                                  className="w-full border border-gray-700 focus:border-purple-500 rounded px-1 py-1 bg-gray-900 text-gray-100 text-xs"
                                >
                                  <option value={0}>Wide only (1 run)</option>
                                  <option value={1}>+1 run (2 total)</option>
                                  <option value={2}>+2 runs (3 total)</option>
                                  <option value={3}>+3 runs (4 total)</option>
                                  <option value={4}>Boundary 4 (5 total)</option>
                                </select>
                              )}
                            </div>
                          ) : c === 8 ? (
                            // No Ball checkbox + dropdown for additional runs
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={extrasData[r]?.hasNoBall || false}
                                  onChange={(e) => updateExtrasData(r, 'hasNoBall', e.target.checked)}
                                  className="rounded border-gray-600 bg-gray-900 text-purple-600 focus:ring-purple-500"
                                />
                                <label className="text-xs text-gray-400">No Ball?</label>
                              </div>
                              {extrasData[r]?.hasNoBall && (
                                <>
                                  <select
                                    value={extrasData[r]?.noBallType || 'bat'}
                                    onChange={(e) => updateExtrasData(r, 'noBallType', e.target.value)}
                                    className="w-full border border-gray-700 focus:border-purple-500 rounded px-1 py-1 bg-gray-900 text-gray-100 text-xs mb-1"
                                  >
                                    <option value="bat">Bat hit (runs to batsman)</option>
                                    <option value="bye">No bat hit (runs to byes)</option>
                                  </select>
                                  <select
                                    value={extrasData[r]?.noBallRuns || 0}
                                    onChange={(e) => updateExtrasData(r, 'noBallRuns', parseInt(e.target.value))}
                                    className="w-full border border-gray-700 focus:border-purple-500 rounded px-1 py-1 bg-gray-900 text-gray-100 text-xs"
                                  >
                                    <option value={0}>No Ball only (1 run)</option>
                                    <option value={1}>+1 run (2 total)</option>
                                    <option value={2}>+2 runs (3 total)</option>
                                    <option value={3}>+3 runs (4 total)</option>
                                    <option value={4}>+4 runs (5 total)</option>
                                    <option value={6}>+6 runs (7 total)</option>
                                  </select>
                                </>
                              )}
                            </div>
                          ) : c === 9 ? (
                            // Byes checkbox + dropdown
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={extrasData[r]?.hasByes || false}
                                  onChange={(e) => updateExtrasData(r, 'hasByes', e.target.checked)}
                                  className="rounded border-gray-600 bg-gray-900 text-purple-600 focus:ring-purple-500"
                                />
                                <label className="text-xs text-gray-400">Byes?</label>
                              </div>
                              {extrasData[r]?.hasByes && (
                                <select
                                  value={extrasData[r]?.byesRuns || 0}
                                  onChange={(e) => updateExtrasData(r, 'byesRuns', parseInt(e.target.value))}
                                  className="w-full border border-gray-700 focus:border-purple-500 rounded px-1 py-1 bg-gray-900 text-gray-100 text-xs"
                                >
                                  {Array.from({ length: 7 }, (_, i) => (
                                    <option key={i} value={i}>{i} run{i !== 1 ? 's' : ''}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                          ) : c === 10 ? (
                            // LB (Leg Byes) checkbox + dropdown
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={extrasData[r]?.hasLB || false}
                                  onChange={(e) => updateExtrasData(r, 'hasLB', e.target.checked)}
                                  className="rounded border-gray-600 bg-gray-900 text-purple-600 focus:ring-purple-500"
                                />
                                <label className="text-xs text-gray-400">LB?</label>
                              </div>
                              {extrasData[r]?.hasLB && (
                                <select
                                  value={extrasData[r]?.lbRuns || 0}
                                  onChange={(e) => updateExtrasData(r, 'lbRuns', parseInt(e.target.value))}
                                  className="w-full border border-gray-700 focus:border-purple-500 rounded px-1 py-1 bg-gray-900 text-gray-100 text-xs"
                                >
                                  {Array.from({ length: 7 }, (_, i) => (
                                    <option key={i} value={i}>{i} run{i !== 1 ? 's' : ''}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                          ) : c === 11 ? (
                            // Wicket column with checkbox, dropdown, and text input
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={wicketData[r]?.hasWicket || false}
                                  onChange={(e) => updateWicketData(r, 'hasWicket', e.target.checked)}
                                  className="rounded border-gray-600 bg-gray-900 text-purple-600 focus:ring-purple-500"
                                />
                                <label className="text-xs text-gray-400">Wicket?</label>
                              </div>
                              
                              {wicketData[r]?.hasWicket && (
                                <>
                                  <select
                                    value={wicketData[r]?.wicketType || ''}
                                    onChange={(e) => updateWicketData(r, 'wicketType', e.target.value)}
                                    className="w-full border border-gray-700 focus:border-purple-500 rounded px-2 py-1 bg-gray-900 text-gray-100 text-sm"
                                  >
                                    <option value="">Select type...</option>
                                    {WICKET_TYPES.map(type => (
                                      <option key={type} value={type}>{type}</option>
                                    ))}
                                  </select>
                                  
                                  {wicketData[r]?.wicketType && wicketData[r]?.wicketType !== 'Bowled' && wicketData[r]?.wicketType !== 'LBW' && wicketData[r]?.wicketType !== 'Hit Wicket' && (
                                    <input
                                      type="text"
                                      value={wicketData[r]?.wicketTaker || ''}
                                      onChange={(e) => updateWicketData(r, 'wicketTaker', e.target.value)}
                                      placeholder="Who took wicket?"
                                      className="w-full border border-gray-700 focus:border-purple-500 rounded px-2 py-1 bg-gray-900 text-gray-100 text-sm placeholder-gray-400"
                                    />
                                  )}
                                  
                                  {/* Update the cell value with the wicket description */}
                                  {(() => {
                                    const description = generateWicketDescription(r);
                                    if (description !== cell) {
                                      updateCell(r, c, description);
                                    }
                                    return null;
                                  })()}
                                </>
                              )}
                            </div>
                          ) : c === 6 ? (
                            // Runs dropdown with values 0-6
                            <select
                              value={cell}
                              onChange={e => updateCell(r, c, e.target.value)}
                              className="w-full border border-gray-700 focus:border-purple-500 rounded px-2 py-1 bg-gray-900 text-gray-100"
                            >
                              <option value="">Runs</option>
                              {Array.from({ length: 7 }, (_, i) => (
                                <option key={i} value={String(i)}>{i}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              value={cell}
                              onChange={(e) => updateCell(r, c, e.target.value)}
                              placeholder={HEADERS[c]}
                              className="w-full border border-gray-700 focus:border-purple-500 rounded px-2 py-1 bg-gray-900 text-gray-100 placeholder-gray-400"
                            />
                          )}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 align-top border-b border-gray-800 text-right">
                      <button onClick={() => removeRow(r)} title="Remove row" className="text-red-400 hover:text-red-200">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
