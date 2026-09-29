
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
import comprehensivePlayers from '../../../../../comprehensive-players.json';
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

  // Current striker and non-striker state for each innings
  const [currentBatsmen, setCurrentBatsmen] = useState<{ 
    [innings: string]: { striker: string; nonStriker: string } 
  }>({});

  // Current over and bowler state for each innings
  const [currentOver, setCurrentOver] = useState<{ 
    [innings: string]: { overNumber: string; bowler: string; ballsInOver: number } 
  }>({});

  // Quick Templates Component
  const QuickTemplates = ({ onApplyTemplate }) => {
    const [activeTemplate, setActiveTemplate] = useState(null);
    
    const templates = [
      { 
        id: 'dot_ball', 
        name: 'Dot Ball', 
        icon: '○', 
        color: 'from-gray-400/20 to-gray-500/20',
        borderColor: 'border-gray-400/30',
        hoverColor: 'hover:shadow-gray-500/25',
        data: { runs: '0', ball: 'auto' }
      },
      { 
        id: 'single', 
        name: 'Single', 
        icon: '1', 
        color: 'from-blue-400/20 to-blue-500/20',
        borderColor: 'border-blue-400/30',
        hoverColor: 'hover:shadow-blue-500/25',
        data: { runs: '1', ball: 'auto' }
      },
      { 
        id: 'double', 
        name: 'Double', 
        icon: '2', 
        color: 'from-cyan-400/20 to-cyan-500/20',
        borderColor: 'border-cyan-400/30',
        hoverColor: 'hover:shadow-cyan-500/25',
        data: { runs: '2', ball: 'auto' }
      },
      { 
        id: 'triple', 
        name: 'Triple', 
        icon: '3', 
        color: 'from-teal-400/20 to-teal-500/20',
        borderColor: 'border-teal-400/30',
        hoverColor: 'hover:shadow-teal-500/25',
        data: { runs: '3', ball: 'auto' }
      },
      { 
        id: 'boundary', 
        name: 'Boundary', 
        icon: '4', 
        color: 'from-green-400/20 to-green-500/20',
        borderColor: 'border-green-400/30',
        hoverColor: 'hover:shadow-green-500/25',
        data: { runs: '4', ball: 'auto' }
      },
      { 
        id: 'five', 
        name: 'Five Runs', 
        icon: '5', 
        color: 'from-lime-400/20 to-lime-500/20',
        borderColor: 'border-lime-400/30',
        hoverColor: 'hover:shadow-lime-500/25',
        data: { runs: '5', ball: 'auto' }
      },
      { 
        id: 'six', 
        name: 'Six', 
        icon: '6', 
        color: 'from-purple-400/20 to-purple-500/20',
        borderColor: 'border-purple-400/30',
        hoverColor: 'hover:shadow-purple-500/25',
        data: { runs: '6', ball: 'auto' }
      },
      { 
        id: 'wicket', 
        name: 'Wicket', 
        icon: 'W', 
        color: 'from-red-400/20 to-red-500/20',
        borderColor: 'border-red-400/30',
        hoverColor: 'hover:shadow-red-500/25',
        data: { runs: '0', wicket: true, ball: 'auto' }
      },
      { 
        id: 'no_ball', 
        name: 'No Ball', 
        icon: 'NB', 
        color: 'from-orange-400/20 to-orange-500/20',
        borderColor: 'border-orange-400/30',
        hoverColor: 'hover:shadow-orange-500/25',
        data: { runs: '1', noBall: true, ball: 'auto' }
      },
      { 
        id: 'wide', 
        name: 'Wide', 
        icon: 'WD', 
        color: 'from-yellow-400/20 to-yellow-500/20',
        borderColor: 'border-yellow-400/30',
        hoverColor: 'hover:shadow-yellow-500/25',
        data: { runs: '1', wide: true, ball: 'auto' }
      },
    ];

    const handleTemplateClick = (template) => {
      setActiveTemplate(template.id);
      onApplyTemplate(template.data);
      setTimeout(() => setActiveTemplate(null), 300);
    };

    return (
      <div className="mb-6 p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl">
        <h4 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Quick Actions
        </h4>
        <div className="flex flex-wrap gap-2">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleTemplateClick(template)}
              className={`px-3 py-2 bg-gradient-to-r ${template.color} ${template.borderColor} border 
                       rounded-lg text-white font-medium hover:scale-105 transform transition-all 
                       duration-200 shadow-lg ${template.hoverColor} flex items-center gap-2
                       ${activeTemplate === template.id ? 'ring-2 ring-white/40 scale-105' : ''}`}
            >
              <span className="text-lg font-bold">{template.icon}</span>
              <span className="text-xs">{template.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

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

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedWicketData = localStorage.getItem('liveScoreWicketData');
    const savedExtrasData = localStorage.getItem('liveScoreExtrasData');
    const savedCurrentBatsmen = localStorage.getItem('liveScoreCurrentBatsmen');
    const savedCurrentOver = localStorage.getItem('liveScoreCurrentOver');
    
    if (savedWicketData) {
      try {
        setWicketData(JSON.parse(savedWicketData));
      } catch (e) {
        console.error('Error loading wicket data:', e);
      }
    }
    
    if (savedExtrasData) {
      try {
        setExtrasData(JSON.parse(savedExtrasData));
      } catch (e) {
        console.error('Error loading extras data:', e);
      }
    }
    
    if (savedCurrentBatsmen) {
      try {
        setCurrentBatsmen(JSON.parse(savedCurrentBatsmen));
      } catch (e) {
        console.error('Error loading current batsmen:', e);
      }
    }
    
    if (savedCurrentOver) {
      try {
        setCurrentOver(JSON.parse(savedCurrentOver));
      } catch (e) {
        console.error('Error loading current over:', e);
      }
    }
  }, []);

  // Save wicket data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('liveScoreWicketData', JSON.stringify(wicketData));
  }, [wicketData]);

  // Save extras data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('liveScoreExtrasData', JSON.stringify(extrasData));
  }, [extrasData]);

  // Save current batsmen to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('liveScoreCurrentBatsmen', JSON.stringify(currentBatsmen));
  }, [currentBatsmen]);

  // Save current over to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('liveScoreCurrentOver', JSON.stringify(currentOver));
  }, [currentOver]);

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
        const tossResp = await fetch(`/api/scorecards?matchId=${encodeURIComponent(selectedMatch)}&league=wpl`);
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

  const addRowToInnings = (innings: number) => {
    const currentBatsmenForInnings = currentBatsmen[String(innings)] || { striker: '', nonStriker: '' };
    const currentOverForInnings = currentOver[String(innings)] || { overNumber: '', bowler: '', ballsInOver: 0 };
    
    const newRow = [
      currentOverForInnings.overNumber, // Over
      '', // Ball (will be calculated based on ballsInOver + 1)
      String(innings), 
      currentBatsmenForInnings.striker, 
      currentBatsmenForInnings.nonStriker, 
      currentOverForInnings.bowler, // Bowler
      '', '', '', '', '', '', '', ''
    ];
    
    setRows(prev => [...prev, newRow]);
  };

  // Template application logic
  const applyTemplateToLastRow = (templateData: any) => {
    if (rows.length === 0) {
      // If no rows exist, add a new row first
      addRowToInnings(1); // Default to innings 1
      setTimeout(() => applyTemplateToRow(rows.length - 1, templateData), 100);
      return;
    }
    
    // Apply to the last row
    const lastRowIndex = rows.length - 1;
    applyTemplateToRow(lastRowIndex, templateData);
  };

  const applyTemplateToRow = (rowIndex: number, templateData: any) => {
    const currentRow = rows[rowIndex];
    if (!currentRow) return;

    // Get current innings
    const currentInnings = currentRow[2] || '1';
    const currentOverForInnings = currentOver[currentInnings] || { overNumber: '', bowler: '', ballsInOver: 0 };

    // Update runs
    if (templateData.runs !== undefined) {
      updateCell(rowIndex, 6, templateData.runs);
    }

    // Handle wicket
    if (templateData.wicket) {
      setWicketData(prev => ({
        ...prev,
        [rowIndex]: {
          hasWicket: true,
          wicketType: 'Caught',
          wicketTaker: currentOverForInnings.bowler || ''
        }
      }));
    }

    // Handle no ball
    if (templateData.noBall) {
      setExtrasData(prev => ({
        ...prev,
        [rowIndex]: {
          ...prev[rowIndex],
          hasNoBall: true,
          noBallRuns: 0
        }
      }));
    }

    // Handle wide
    if (templateData.wide) {
      setExtrasData(prev => ({
        ...prev,
        [rowIndex]: {
          ...prev[rowIndex],
          hasWide: true,
          wideRuns: 0
        }
      }));
    }

    // Auto-increment ball if needed
    if (templateData.ball === 'auto') {
      const currentBall = parseInt(currentRow[1]) || 0;
      const newBall = currentBall + 1;
      
      if (newBall > 6) {
        // Move to next over
        const nextOver = String((parseInt(currentRow[0]) || 0) + 1);
        updateCell(rowIndex, 0, nextOver);
        updateCell(rowIndex, 1, '1');
        
        // Update persistent over state
        setCurrentOver(prev => ({
          ...prev,
          [currentInnings]: {
            ...prev[currentInnings],
            overNumber: nextOver,
            ballsInOver: 1
          }
        }));
      } else {
        updateCell(rowIndex, 1, String(newBall));
        
        // Update persistent over state
        setCurrentOver(prev => ({
          ...prev,
          [currentInnings]: {
            ...prev[currentInnings],
            ballsInOver: newBall
          }
        }));
      }
    }
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

    // When a wicket is confirmed, clear the striker/non-striker for that innings
    if (field === 'hasWicket' && value === true) {
      const currentInnings = rows[rowIndex][2];
      const striker = rows[rowIndex][3]; // Striker is in column 3
      const nonStriker = rows[rowIndex][4]; // Non-Striker is in column 4
      
      setCurrentBatsmen(prev => {
        const currentBatsmen = prev[currentInnings] || { striker: '', nonStriker: '' };
        const updatedBatsmen = { ...currentBatsmen };
        
        // Clear the batsman who got out
        if (striker === currentBatsmen.striker) {
          updatedBatsmen.striker = '';
        }
        if (nonStriker === currentBatsmen.nonStriker) {
          updatedBatsmen.nonStriker = '';
        }
        
        return {
          ...prev,
          [currentInnings]: updatedBatsmen
        };
      });
    }
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

  // Helper function to render cell content
  const renderCellContent = (cell: string, c: number, rowIndex: number, battingTeam: string) => {
    switch (c) {
      case 0: // Overs
        return (
          <select
            value={cell || (() => {
              // Use persistent value if current cell is empty
              const currentInnings = rows[rowIndex][2];
              const over = currentOver[currentInnings] || { overNumber: '', bowler: '', ballsInOver: 0 };
              return over.overNumber;
            })()}
            onChange={e => {
              const newValue = e.target.value;
              updateCell(rowIndex, c, newValue);
              
              // Update persistent over state and reset balls count
              const currentInnings = rows[rowIndex][2];
              setCurrentOver(prev => ({
                ...prev,
                [currentInnings]: {
                  ...prev[currentInnings],
                  overNumber: newValue,
                  ballsInOver: 0 // Reset balls count when over changes
                }
              }));
            }}
            className="w-full border border-gray-700 focus:border-purple-500 rounded px-2 py-1 bg-gray-900 text-gray-100"
          >
            <option value="">Overs</option>
            {Array.from({ length: 21 }, (_, i) => (
              <option key={i} value={String(i)}>{i}</option>
            ))}
          </select>
        );
      case 1: // Ball
        return (
          <select
            value={cell || (() => {
              // Calculate ball number based on balls in current over
              const currentInnings = rows[rowIndex][2];
              const over = currentOver[currentInnings] || { overNumber: '', bowler: '', ballsInOver: 0 };
              return String(over.ballsInOver + 1);
            })()}
            onChange={e => {
              const newValue = e.target.value;
              updateCell(rowIndex, c, newValue);
              
              // Update balls in over count
              const currentInnings = rows[rowIndex][2];
              const ballNumber = parseInt(newValue) || 0;
              
              setCurrentOver(prev => {
                const updated = {
                  ...prev,
                  [currentInnings]: {
                    ...prev[currentInnings],
                    ballsInOver: ballNumber
                  }
                };
                
                // If 6 balls are completed, prepare for next over
                if (ballNumber >= 6) {
                  const currentOverNumber = parseInt(prev[currentInnings]?.overNumber || '0') || 0;
                  updated[currentInnings] = {
                    ...updated[currentInnings],
                    overNumber: String(currentOverNumber + 1),
                    ballsInOver: 0,
                    bowler: '' // Clear bowler for next over
                  };
                }
                
                return updated;
              });
            }}
            className="w-full border border-gray-700 focus:border-purple-500 rounded px-2 py-1 bg-gray-900 text-gray-100"
          >
            <option value="">Ball</option>
            {Array.from({ length: 7 }, (_, i) => (
              <option key={i} value={String(i)}>{i}</option>
            ))}
          </select>
        );
      case 2: // Innings (hidden in separate tables)
        return <span className="text-gray-500">{cell}</span>;
      case 3: // Striker
      case 4: // Non-Striker
        return (
          <select
            value={cell || (() => {
              // Use persistent value if current cell is empty
              const currentInnings = rows[rowIndex][2];
              const batsmen = currentBatsmen[currentInnings] || { striker: '', nonStriker: '' };
              return c === 3 ? batsmen.striker : batsmen.nonStriker;
            })()}
            onChange={e => {
              const newValue = e.target.value;
              updateCell(rowIndex, c, newValue);
              
              // Update persistent batsmen state
              const currentInnings = rows[rowIndex][2];
              setCurrentBatsmen(prev => ({
                ...prev,
                [currentInnings]: {
                  ...prev[currentInnings],
                  [c === 3 ? 'striker' : 'nonStriker']: newValue
                }
              }));
            }}
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
              
              const currentInnings = rows[rowIndex][2];
              if (currentInnings === '1' || currentInnings === 1) {
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
        );
      case 5: // Bowler
        return (
          <select
            value={cell || (() => {
              // Use persistent value if current cell is empty
              const currentInnings = rows[rowIndex][2];
              const over = currentOver[currentInnings] || { overNumber: '', bowler: '', ballsInOver: 0 };
              return over.bowler;
            })()}
            onChange={e => {
              const newValue = e.target.value;
              updateCell(rowIndex, c, newValue);
              
              // Update persistent bowler state
              const currentInnings = rows[rowIndex][2];
              setCurrentOver(prev => ({
                ...prev,
                [currentInnings]: {
                  ...prev[currentInnings],
                  bowler: newValue
                }
              }));
            }}
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
              
              const currentInnings = rows[rowIndex][2];
              if (currentInnings === '1' || currentInnings === 1) {
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
        );
      case 6: // Runs
        return (
          <select
            value={cell}
            onChange={e => updateCell(rowIndex, c, e.target.value)}
            className="w-full border border-gray-700 focus:border-purple-500 rounded px-2 py-1 bg-gray-900 text-gray-100"
          >
            <option value="">Runs</option>
            {Array.from({ length: 7 }, (_, i) => (
              <option key={i} value={String(i)}>{i}</option>
            ))}
          </select>
        );
      case 7: // Wide
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={extrasData[rowIndex]?.hasWide || false}
                onChange={(e) => updateExtrasData(rowIndex, 'hasWide', e.target.checked)}
                className="rounded border-gray-600 bg-gray-900 text-purple-600 focus:ring-purple-500"
              />
              <label className="text-xs text-gray-400">Wide?</label>
            </div>
            {extrasData[rowIndex]?.hasWide && (
              <select
                value={extrasData[rowIndex]?.wideRuns || 0}
                onChange={(e) => updateExtrasData(rowIndex, 'wideRuns', parseInt(e.target.value))}
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
        );
      case 8: // No Ball
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={extrasData[rowIndex]?.hasNoBall || false}
                onChange={(e) => updateExtrasData(rowIndex, 'hasNoBall', e.target.checked)}
                className="rounded border-gray-600 bg-gray-900 text-purple-600 focus:ring-purple-500"
              />
              <label className="text-xs text-gray-400">No Ball?</label>
            </div>
            {extrasData[rowIndex]?.hasNoBall && (
              <>
                <select
                  value={extrasData[rowIndex]?.noBallType || 'bat'}
                  onChange={(e) => updateExtrasData(rowIndex, 'noBallType', e.target.value)}
                  className="w-full border border-gray-700 focus:border-purple-500 rounded px-1 py-1 bg-gray-900 text-gray-100 text-xs mb-1"
                >
                  <option value="bat">Bat hit (runs to batsman)</option>
                  <option value="bye">No bat hit (runs to byes)</option>
                </select>
                <select
                  value={extrasData[rowIndex]?.noBallRuns || 0}
                  onChange={(e) => updateExtrasData(rowIndex, 'noBallRuns', parseInt(e.target.value))}
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
        );
      case 9: // Byes
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={extrasData[rowIndex]?.hasByes || false}
                onChange={(e) => updateExtrasData(rowIndex, 'hasByes', e.target.checked)}
                className="rounded border-gray-600 bg-gray-900 text-purple-600 focus:ring-purple-500"
              />
              <label className="text-xs text-gray-400">Byes?</label>
            </div>
            {extrasData[rowIndex]?.hasByes && (
              <select
                value={extrasData[rowIndex]?.byesRuns || 0}
                onChange={(e) => updateExtrasData(rowIndex, 'byesRuns', parseInt(e.target.value))}
                className="w-full border border-gray-700 focus:border-purple-500 rounded px-1 py-1 bg-gray-900 text-gray-100 text-xs"
              >
                {Array.from({ length: 7 }, (_, i) => (
                  <option key={i} value={i}>{i} run{i !== 1 ? 's' : ''}</option>
                ))}
              </select>
            )}
          </div>
        );
      case 10: // LB (Leg Byes)
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={extrasData[rowIndex]?.hasLB || false}
                onChange={(e) => updateExtrasData(rowIndex, 'hasLB', e.target.checked)}
                className="rounded border-gray-600 bg-gray-900 text-purple-600 focus:ring-purple-500"
              />
              <label className="text-xs text-gray-400">LB?</label>
            </div>
            {extrasData[rowIndex]?.hasLB && (
              <select
                value={extrasData[rowIndex]?.lbRuns || 0}
                onChange={(e) => updateExtrasData(rowIndex, 'lbRuns', parseInt(e.target.value))}
                className="w-full border border-gray-700 focus:border-purple-500 rounded px-1 py-1 bg-gray-900 text-gray-100 text-xs"
              >
                {Array.from({ length: 7 }, (_, i) => (
                  <option key={i} value={i}>{i} run{i !== 1 ? 's' : ''}</option>
                ))}
              </select>
            )}
          </div>
        );
      case 11: // Wicket
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={wicketData[rowIndex]?.hasWicket || false}
                onChange={(e) => updateWicketData(rowIndex, 'hasWicket', e.target.checked)}
                className="rounded border-gray-600 bg-gray-900 text-purple-600 focus:ring-purple-500"
              />
              <label className="text-xs text-gray-400">Wicket?</label>
            </div>
            
            {wicketData[rowIndex]?.hasWicket && (
              <>
                <select
                  value={wicketData[rowIndex]?.wicketType || ''}
                  onChange={(e) => updateWicketData(rowIndex, 'wicketType', e.target.value)}
                  className="w-full border border-gray-700 focus:border-purple-500 rounded px-2 py-1 bg-gray-900 text-gray-100 text-sm"
                >
                  <option value="">Select type...</option>
                  {WICKET_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
               
                {wicketData[rowIndex]?.wicketType && wicketData[rowIndex]?.wicketType !== 'Bowled' && wicketData[rowIndex]?.wicketType !== 'LBW' && wicketData[rowIndex]?.wicketType !== 'Hit Wicket' && (
                  <input
                    type="text"
                    value={wicketData[rowIndex]?.wicketTaker || ''}
                    onChange={(e) => updateWicketData(rowIndex, 'wicketTaker', e.target.value)}
                    placeholder="Who took wicket?"
                    className="w-full border border-gray-700 focus:border-purple-500 rounded px-2 py-1 bg-gray-900 text-gray-100 text-sm placeholder-gray-400"
                  />
                )}
               
                {/* Update the cell value with the wicket description */}
                {(() => {
                  const description = generateWicketDescription(rowIndex);
                  if (description !== cell) {
                    updateCell(rowIndex, c, description);
                  }
                  return null;
                })()}
              </>
            )}
          </div>
        );
      default: // Notes
        return (
          <input
            value={cell}
            onChange={(e) => updateCell(rowIndex, c, e.target.value)}
            placeholder={HEADERS[c]}
            className="w-full border border-gray-700 focus:border-purple-500 rounded px-2 py-1 bg-gray-900 text-gray-100 placeholder-gray-400"
          />
        );
    }
  };

  // Calculate team total for a specific innings
  const calculateTeamTotal = (innings: string | number) => {
    const filteredRows = rows.filter(row => row[2] === String(innings));
    
    let totalRuns = 0;
    let totalExtras = 0;
    let totalBalls = 0;
    let totalWickets = 0;
    
    filteredRows.forEach((row, index) => {
      const originalIndex = rows.indexOf(row);
      const extras = extrasData[originalIndex] || {};
      const wicket = wicketData[originalIndex] || {};
      
      // Count balls (exclude wides and no balls from ball count)
      if (!extras.hasWide && !extras.hasNoBall) {
        totalBalls += 1;
      }
      
      // Count wickets
      if (wicket.hasWicket) {
        totalWickets += 1;
      }
      
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
    
    // Calculate overs from balls
    const overs = Math.floor(totalBalls / 6);
    const ballsInOver = totalBalls % 6;
    const oversDisplay = `${overs}.${ballsInOver}`;
    
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
      overs: oversDisplay,
      balls: totalBalls,
      wickets: totalWickets,
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
        <main className="p-8 lg:ml-64">
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

            {/* Enhanced Action Buttons */}
            <div className="mb-8">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
                <div className="flex flex-wrap gap-4 items-center justify-center">
                  <button 
                    onClick={addRow} 
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Row
                    </span>
                  </button>
                  <button 
                    onClick={exportCSV} 
                    className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl font-semibold hover:from-gray-700 hover:to-gray-800 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-gray-500/25"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export CSV
                    </span>
                  </button>
                </div>
              </div>
            </div>
          
            {/* Enhanced Team Totals Display */}
            <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-400 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-blue-100">Innings 1 Total</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-blue-200 font-medium">Overs</span>
                    <span className="font-mono text-white font-bold text-lg">{calculateTeamTotal(1).overs}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-blue-200 font-medium">Balls</span>
                    <span className="font-mono text-white font-bold text-lg">{calculateTeamTotal(1).balls}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-red-300 font-medium">Wickets</span>
                    <span className="font-mono text-red-400 font-bold">{calculateTeamTotal(1).wickets}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-blue-200 font-medium">Batsman Runs</span>
                    <span className="font-mono text-white font-bold text-lg">{calculateTeamTotal(1).batsmanRuns}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-orange-300 font-medium">Wides</span>
                    <span className="font-mono text-orange-400 font-bold">{calculateTeamTotal(1).wides}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-yellow-300 font-medium">No Balls</span>
                    <span className="font-mono text-yellow-400 font-bold">{calculateTeamTotal(1).noBalls}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-purple-300 font-medium">Byes</span>
                    <span className="font-mono text-purple-400 font-bold">{calculateTeamTotal(1).byes}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-pink-300 font-medium">Leg Byes</span>
                    <span className="font-mono text-pink-400 font-bold">{calculateTeamTotal(1).legByes}</span>
                  </div>
                  <div className="border-t border-white/20 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 font-medium">Extras</span>
                      <span className="font-mono text-gray-300 font-bold">{calculateTeamTotal(1).extras}</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg p-4 border border-green-400/30">
                    <div className="flex justify-between items-center">
                      <span className="text-green-100 font-bold text-lg">Team Total</span>
                      <span className="font-mono text-green-100 font-bold text-2xl">{calculateTeamTotal(1).teamTotal}/{calculateTeamTotal(1).wickets}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-purple-400 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-purple-100">Innings 2 Total</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-purple-200 font-medium">Overs</span>
                    <span className="font-mono text-white font-bold text-lg">{calculateTeamTotal(2).overs}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-purple-200 font-medium">Balls</span>
                    <span className="font-mono text-white font-bold text-lg">{calculateTeamTotal(2).balls}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-red-300 font-medium">Wickets</span>
                    <span className="font-mono text-red-400 font-bold">{calculateTeamTotal(2).wickets}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-purple-200 font-medium">Batsman Runs</span>
                    <span className="font-mono text-white font-bold text-lg">{calculateTeamTotal(2).batsmanRuns}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-orange-300 font-medium">Wides</span>
                    <span className="font-mono text-orange-400 font-bold">{calculateTeamTotal(2).wides}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-yellow-300 font-medium">No Balls</span>
                    <span className="font-mono text-yellow-400 font-bold">{calculateTeamTotal(2).noBalls}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-purple-300 font-medium">Byes</span>
                    <span className="font-mono text-purple-400 font-bold">{calculateTeamTotal(2).byes}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-pink-300 font-medium">Leg Byes</span>
                    <span className="font-mono text-pink-400 font-bold">{calculateTeamTotal(2).legByes}</span>
                  </div>
                  <div className="border-t border-white/20 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 font-medium">Extras</span>
                      <span className="font-mono text-gray-300 font-bold">{calculateTeamTotal(2).extras}</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg p-4 border border-green-400/30">
                    <div className="flex justify-between items-center">
                      <span className="text-green-100 font-bold text-lg">Team Total</span>
                      <span className="font-mono text-green-100 font-bold text-2xl">{calculateTeamTotal(2).teamTotal}/{calculateTeamTotal(2).wickets}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          
            {/* Quick Templates */}
            <QuickTemplates onApplyTemplate={applyTemplateToLastRow} />
          
            {/* Enhanced Innings 1 Table */}
            <div className="mb-8">
              <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-blue-400 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-blue-100">Innings 1</h2>
                </div>
                
                <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1600px] text-sm">
                      <thead className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm border-b border-white/10">
                        <tr>
                          {HEADERS.map((h, index) => {
                            const columnWidths = [
                              'w-24', // Over
                              'w-32', // Ball - increased even more
                              'w-16', // Innings
                              'w-48', // Striker - much wider for player names
                              'w-48', // Non-Striker - much wider for player names
                              'w-48', // Bowler - much wider for player names
                              'w-24', // Runs
                              'w-64', // Wicket Description - much wider for text
                              'w-36', // Wide - wider for extras info
                              'w-36', // No Ball - wider for extras info
                              'w-24', // Byes
                              'w-24', // LB
                              'w-64'  // Commentary - much wider for text
                            ];
                            return (
                              <th key={h} className={`px-4 py-4 text-left font-semibold text-blue-100 sticky top-0 z-10 border-r border-white/10 uppercase tracking-wide text-xs ${columnWidths[index] || 'w-24'}`}>
                                {h}
                              </th>
                            );
                          })}
                          <th className="px-4 py-4 sticky top-0 z-10 border-r border-white/10 text-blue-100 uppercase tracking-wide text-xs font-semibold">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {rows.filter(row => row[2] === '1' || row[2] === 1).map((row, r) => {
                          const originalIndex = rows.indexOf(row);
                          return (
                            <tr key={r} className={`transition-all duration-200 hover:bg-white/10 ${r % 2 === 0 ? 'bg-white/5' : 'bg-white/2'}`}>
                              {row.map((cell, c) => {
                                const columnWidths = [
                                  'w-24', // Over
                                  'w-32', // Ball - increased even more
                                  'w-16', // Innings
                                  'w-48', // Striker - much wider for player names
                                  'w-48', // Non-Striker - much wider for player names
                                  'w-48', // Bowler - much wider for player names
                                  'w-24', // Runs
                                  'w-64', // Wicket Description - much wider for text
                                  'w-36', // Wide - wider for extras info
                                  'w-36', // No Ball - wider for extras info
                                  'w-24', // Byes
                                  'w-24', // LB
                                  'w-64'  // Commentary - much wider for text
                                ];
                                return (
                                  <td key={c} className={`px-4 py-3 align-top border-r border-white/5 ${columnWidths[c] || 'w-24'}`}>
                                    {renderCellContent(cell, c, originalIndex, '')}
                                  </td>
                                );
                              })}
                              <td className="px-4 py-3 align-top border-r border-white/5 text-right">
                                <button 
                                  onClick={() => removeRow(originalIndex)} 
                                  title="Remove row" 
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/20 px-2 py-1 rounded-lg transition-all duration-200"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="mt-4 flex justify-center">
                  <button onClick={() => addRowToInnings(1)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                    Add Row to Innings 1
                  </button>
                </div>
              </div>
            </div>

            {/* Enhanced Innings 2 Table */}
            <div className="mb-8">
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-purple-400 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-purple-100">Innings 2</h2>
                </div>
                
                <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1600px] text-sm">
                      <thead className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm border-b border-white/10">
                        <tr>
                          {HEADERS.map((h, index) => {
                            const columnWidths = [
                              'w-24', // Over
                              'w-32', // Ball - increased even more
                              'w-16', // Innings
                              'w-48', // Striker - much wider for player names
                              'w-48', // Non-Striker - much wider for player names
                              'w-48', // Bowler - much wider for player names
                              'w-24', // Runs
                              'w-64', // Wicket Description - much wider for text
                              'w-36', // Wide - wider for extras info
                              'w-36', // No Ball - wider for extras info
                              'w-24', // Byes
                              'w-24', // LB
                              'w-64'  // Commentary - much wider for text
                            ];
                            return (
                              <th key={h} className={`px-4 py-4 text-left font-semibold text-purple-100 sticky top-0 z-10 border-r border-white/10 uppercase tracking-wide text-xs ${columnWidths[index] || 'w-24'}`}>
                                {h}
                              </th>
                            );
                          })}
                          <th className="px-4 py-4 sticky top-0 z-10 border-r border-white/10 text-purple-100 uppercase tracking-wide text-xs font-semibold">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {rows.filter(row => row[2] === '2' || row[2] === 2).map((row, r) => {
                          const originalIndex = rows.indexOf(row);
                          return (
                            <tr key={r} className={`transition-all duration-200 hover:bg-white/10 ${r % 2 === 0 ? 'bg-white/5' : 'bg-white/2'}`}>
                              {row.map((cell, c) => {
                                const columnWidths = [
                                  'w-24', // Over
                                  'w-32', // Ball - increased even more
                                  'w-16', // Innings
                                  'w-48', // Striker - much wider for player names
                                  'w-48', // Non-Striker - much wider for player names
                                  'w-48', // Bowler - much wider for player names
                                  'w-24', // Runs
                                  'w-64', // Wicket Description - much wider for text
                                  'w-36', // Wide - wider for extras info
                                  'w-36', // No Ball - wider for extras info
                                  'w-24', // Byes
                                  'w-24', // LB
                                  'w-64'  // Commentary - much wider for text
                                ];
                                return (
                                  <td key={c} className={`px-4 py-3 align-top border-r border-white/5 ${columnWidths[c] || 'w-24'}`}>
                                    {renderCellContent(cell, c, originalIndex, '')}
                                  </td>
                                );
                              })}
                              <td className="px-4 py-3 align-top border-r border-white/5 text-right">
                                <button 
                                  onClick={() => removeRow(originalIndex)} 
                                  title="Remove row" 
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/20 px-2 py-1 rounded-lg transition-all duration-200"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-center">
                  <button onClick={() => addRowToInnings(2)} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded">
                    Add Row to Innings 2
                  </button>
                </div>
              </div>
            </div>

            {/* Save Data Button at Bottom */}
            <div className="mb-8 flex justify-center">
              <button 
                onClick={saveRows} 
                className="px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-green-500/25 disabled:opacity-60 disabled:transform-none disabled:hover:scale-100 text-lg"
                disabled={saveStatus==='saving'}
              >
                <span className="flex items-center gap-3">
                  {saveStatus === 'saving' ? (
                    <>
                      <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Saving...
                    </>
                  ) : saveStatus === 'success' ? (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Saved!
                    </>
                  ) : saveStatus === 'error' ? (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Error!
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2" />
                      </svg>
                      Save Data
                    </>
                  )}
                </span>
              </button>
            </div>
        </div>
      </main>
      </div>
    </div>
  );
}
