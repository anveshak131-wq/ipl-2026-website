
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

const HEADERS = ['Overs','Ball','Innings','Striker','Non-Striker','Bowler','Runs','Extras','Wicket','Notes'];

export default function LiveScoreCSVPage() {
  const [rows, setRows] = useState<string[][]>([]);
  const [matches, setMatches] = useState<{ id: string, name: string }[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [tossInfo, setTossInfo] = useState<string>('');
  const [playing11, setPlaying11] = useState<{ [team: string]: string[] }>({});
  // Map matches list team names to scorecard short names
  const [teamNameMap, setTeamNameMap] = useState<{ [matchTeam: string]: string }>({});
  // Map team short name to teamId
  const [teamIdMap, setTeamIdMap] = useState<{ [shortName: string]: string }>({});

  // Fetch matches list on mount
  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch('/api/wpl-live-score/matches');
        if (resp.ok) {
          const data = await resp.json();
          if (Array.isArray(data)) {
            setMatches(data);
            if (data.length > 0) setSelectedMatch(data[0].id);
          }
        }
      } catch {}
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
          if (matchData && matchData.playing11) {
            const p11 = matchData.playing11;
            console.log('Team1 players:', p11.team1);
            console.log('Team2 players:', p11.team2);
            console.log('Match team1 name:', matchData.team1?.name);
            console.log('Match team2 name:', matchData.team2?.name);
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
              if (match && match.name) {
                const [matchTeam1, matchTeam2] = match.name.split(' vs ');
                if (matchTeam1 && team1Short) nameMap[matchTeam1.trim()] = team1Short;
                if (matchTeam2 && team2Short) nameMap[matchTeam2.trim()] = team2Short;
              }
              // Map shortName to teamId from matchInfo
              if (sc.matchInfo.team1.shortName && sc.matchInfo.team1.id) idMap[sc.matchInfo.team1.shortName] = sc.matchInfo.team1.id;
              if (sc.matchInfo.team2.shortName && sc.matchInfo.team2.id) idMap[sc.matchInfo.team2.shortName] = sc.matchInfo.team2.id;
            } else {
              // fallback to matches list
              const match = matches.find(m => m.id === selectedMatch);
              if (match && match.name) {
                const [team1, team2] = match.name.split(' vs ');
                team1Short = team1?.trim() || 'team1';
                team2Short = team2?.trim() || 'team2';
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

  // Helper to get team short names from matches list for selected match
  const getSelectedMatchTeams = () => {
    const match = matches.find(m => m.id === selectedMatch);
    if (!match || !match.name) return { team1: '', team2: '' };
    const [team1, team2] = match.name.split(' vs ');
    return { team1: team1?.trim() || '', team2: team2?.trim() || '' };
  };

  // Helper to get scorecard short name for a match team name
  const getScorecardShortName = (matchTeam: string) => {
    return teamNameMap[matchTeam] || matchTeam;
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
    if (decision === 'bowl') {
      if (winner === team1) return team2;
      if (winner === team2) return team1;
    }
    if (decision === 'bat') {
      return winner;
    }
    return '';
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
    <div className="min-h-screen">
      <WPLAdminSidebarNew />
      <main className="p-8 lg:ml-64">
        <div className="max-w-6xl">
          <h1 className="text-3xl font-bold mb-4">Live Score CSV — Editable Table</h1>
          <div className="mb-6">
            <label className="block text-gray-200 font-semibold mb-2">Matches:</label>
            <select
              className="w-full max-w-xs border border-gray-700 rounded px-2 py-2 bg-gray-900 text-gray-100"
              value={selectedMatch}
              onChange={e => setSelectedMatch(e.target.value)}
              disabled={matches.length === 0}
            >
              {matches.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          {tossInfo && (
            <div className="mb-4 p-3 rounded bg-blue-900 text-blue-100 font-semibold shadow">
              Toss: {tossInfo}
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
                                console.log('=== DROPDOWN DEBUG ===');
                                console.log('Row data:', row);
                                console.log('Innings value:', row[2]);
                                console.log('Batting team:', battingTeam);
                                console.log('Playing11 state:', playing11);
                                console.log('Selected match teams:', getSelectedMatchTeams());
                                console.log('Scorecard short names:', {
                                  team1: getScorecardShortName(getSelectedMatchTeams().team1),
                                  team2: getScorecardShortName(getSelectedMatchTeams().team2)
                                });
                                const playing11Key = getPlaying11Key(battingTeam);
                                console.log('Playing11 key:', playing11Key);
                                const players = playing11[playing11Key] || [];
                                console.log('Players for team:', players);
                                console.log('==================');
                                return players.map((p: string) => (
                                  <option key={p} value={p}>{p}</option>
                                ));
                              })()}
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
