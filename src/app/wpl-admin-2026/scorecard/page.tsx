'use client';

import React, { useState, useEffect } from 'react';
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
  fallOfWickets?: Array<{
    player: string;
    score: string;
    over: string;
  }>;
  powerplays?: {
    mandatory: { overs: string; runs: number };
    optional: { overs: string; runs: number };
  };
  partnerships?: Array<{
    batsman1: string;
    batsman1Runs: string;
    batsman1Balls: string;
    batsman2: string;
    batsman2Runs: string;
    batsman2Balls: string;
    totalRuns: string;
  }>;
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
  const [scorecards, setScorecards] = useState<any[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'matchInfo' | 'innings1' | 'innings2'>('matchInfo');
  const [activeInnings, setActiveInnings] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMatches();
    fetchPlayers();
    fetchAllScorecards();
  }, []);

  // Sync activeInnings with activeTab
  useEffect(() => {
    if (activeTab === 'innings1') {
      setActiveInnings(0);
    } else if (activeTab === 'innings2') {
      setActiveInnings(1);
    }
  }, [activeTab]);

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

  const fetchAllScorecards = async () => {
    try {
      const response = await fetch('/api/scorecards?league=wpl');
      if (response.ok) {
        const data = await response.json();
        setScorecards(data || []);
      }
    } catch (err) {
      console.error('Error fetching scorecards:', err);
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
          // Ensure matchId is in matchInfo for existing scorecards
          const loadedScorecard = data[0];
          if (!loadedScorecard.matchInfo.matchId) {
            loadedScorecard.matchInfo.matchId = match.id;
          }
          setScorecard(loadedScorecard);
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
        matchId: match.id,
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
          fallOfWickets: [],
          powerplays: {
            mandatory: { overs: '', runs: 0 },
            optional: { overs: '', runs: 0 }
          },
          partnerships: []
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
          fallOfWickets: [],
          powerplays: {
            mandatory: { overs: '', runs: 0 },
            optional: { overs: '', runs: 0 }
          },
          partnerships: []
        },
      ],
    };
  };

  const initializeInningsData = (innings: any) => {
    if (!innings.fallOfWickets) {
      innings.fallOfWickets = [];
    }
    if (!innings.powerplays) {
      innings.powerplays = {
        mandatory: { overs: '', runs: 0 },
        optional: { overs: '', runs: 0 }
      };
    }
    if (!innings.partnerships) {
      innings.partnerships = [];
    }
    return innings;
  };

  // Ensure data is initialized when scorecard changes
  React.useEffect(() => {
    if (scorecard && scorecard.innings) {
      const updated = { ...scorecard };
      updated.innings = updated.innings.map((innings: any) => initializeInningsData(innings));
      setScorecard(updated);
    }
  }, [scorecard?.matchId]); // Only run when matchId changes (initial load)

  // Helper to get safe current innings data
  const getCurrentInnings = () => {
    if (!scorecard || !scorecard.innings || !scorecard.innings[activeInnings]) {
      return initializeInningsData({
        fallOfWickets: [],
        powerplays: { mandatory: { overs: '', runs: 0 }, optional: { overs: '', runs: 0 } },
        partnerships: []
      });
    }
    return initializeInningsData(scorecard.innings[activeInnings]);
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
      
      // Also update match with scores, result, and toss info if available
      if (scorecard.matchId) {
        try {
          const matchesResponse = await fetch(`/api/matches?id=${scorecard.matchId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (matchesResponse.ok) {
            const match = await matchesResponse.json();
            
            // Calculate scores from innings
            const team1Score = scorecard.innings.find(inn => inn.battingTeamId === scorecard.matchInfo.team1.id);
            const team2Score = scorecard.innings.find(inn => inn.battingTeamId === scorecard.matchInfo.team2.id);
            
            const team1ScoreStr = team1Score 
              ? `${team1Score.totalRuns || 0}/${team1Score.totalWickets || 0} (${team1Score.totalOvers || 0} overs)`
              : undefined;
            const team2ScoreStr = team2Score 
              ? `${team2Score.totalRuns || 0}/${team2Score.totalWickets || 0} (${team2Score.totalOvers || 0} overs)`
              : undefined;
            
            const tossWinner = scorecard.matchInfo.toss?.winner === scorecard.matchInfo.team1.name ? 'team1' : 'team2';
            
            await fetch('/api/matches', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                ...match,
                team1Score: team1ScoreStr,
                team2Score: team2ScoreStr,
                result: scorecard.result?.winner ? `${scorecard.result.winner} won by ${scorecard.result.margin}` : match.result,
                status: scorecard.result?.winner ? 'completed' : match.status,
                matchState: {
                  ...match.matchState,
                  toss: scorecard.matchInfo.toss?.winner ? {
                    winner: tossWinner,
                    decision: scorecard.matchInfo.toss.decision,
                    timestamp: Date.now(),
                  } : match.matchState?.toss,
                },
              }),
            });
          }
        } catch (matchErr) {
          console.error('Error updating match with scorecard data:', matchErr);
          // Don't fail the scorecard save if match update fails
        }
      }
      
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

      const response = await fetch(`/api/scorecards/${scorecard.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...scorecard,
          draft: false,
          publishedAt: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const updatedScorecard = await response.json();
      setScorecard(updatedScorecard);
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

    // Update innings batting order based on toss decision
    if ((field === 'toss.winner' || field === 'toss.decision') && updated.matchInfo.toss?.winner && updated.matchInfo.toss?.decision) {
      const tossWinner = updated.matchInfo.toss.winner;
      const tossDecision = updated.matchInfo.toss.decision;
      
      // Determine which team bats first
      let firstBattingTeam: number;
      let secondBattingTeam: number;
      
      if (tossDecision === 'bat') {
        // Toss winner chose to bat, so they bat first
        if (tossWinner === updated.matchInfo.team1.name) {
          firstBattingTeam = updated.matchInfo.team1.id;
          secondBattingTeam = updated.matchInfo.team2.id;
        } else {
          firstBattingTeam = updated.matchInfo.team2.id;
          secondBattingTeam = updated.matchInfo.team1.id;
        }
      } else {
        // Toss winner chose to bowl, so other team bats first
        if (tossWinner === updated.matchInfo.team1.name) {
          firstBattingTeam = updated.matchInfo.team2.id;
          secondBattingTeam = updated.matchInfo.team1.id;
        } else {
          firstBattingTeam = updated.matchInfo.team1.id;
          secondBattingTeam = updated.matchInfo.team2.id;
        }
      }
      
      updated.innings[0].battingTeamId = firstBattingTeam;
      updated.innings[1].battingTeamId = secondBattingTeam;
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
        batter.isCaptain = player.isCaptain;
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
        bowler.isCaptain = player.isCaptain;
      }
    }
    
    (bowler as any)[field] = value;

    // Calculate economy rate
    if (field === 'overs' || field === 'runs') {
      const totalOvers = parseFloat(bowler.overs) || 0;
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

    // Calculate total overs from bowling data
    const totalBalls = inning.bowling.reduce((sum, bowler) => {
      const overs = parseFloat(bowler.overs) || 0;
      const completeOvers = Math.floor(overs);
      const balls = Math.round((overs - completeOvers) * 10); // 3.5 -> 5 balls
      return sum + (completeOvers * 6) + balls;
    }, 0);
    const oversComplete = Math.floor(totalBalls / 6);
    const ballsRemaining = totalBalls % 6;
    inning.totalOvers = `${oversComplete}.${ballsRemaining}`;

    setScorecard(updated);
  };

  // Helper: build CSV string for a scorecard (simple, human-readable)
  const buildScorecardCSV = (sc: Scorecard): string => {
    const lines: string[] = [];

    // Match info
    lines.push('Match Info');
    lines.push(`Match ID,${sc.matchId}`);
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
        lines.push(`${escapeCsv(b.name || b.playerId || '')},${b.runs || 0},${b.balls || 0},${b.fours || 0},${b.sixes || 0},${b.strikeRate || ''},${escapeCsv(b.dismissal?.details || b.dismissal?.type || '')}`);
      });
      lines.push('');

      lines.push('Bowling');
      lines.push('Bowler,Overs,Balls,Runs,Wickets,Maidens,Wides,NoBalls,Econ');
      inn.bowling.forEach((bw) => {
        lines.push(`${escapeCsv(bw.name || bw.playerId || '')},${bw.overs || ''},${bw.balls || ''},${bw.runs || 0},${bw.wickets || 0},${bw.maidens || 0},${bw.wides || 0},${bw.noBalls || 0},${bw.economyRate || ''}`);
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

    return lines.join('\n');
  };

  const escapeCsv = (value: any) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  const downloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime + ';charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Load jsPDF from CDN if not already present
  const loadJSPDF = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') return reject(new Error('window is undefined'));
      if ((window as any).jspdf) return resolve();
      const existing = document.querySelector('script[data-src="jspdf-cdn"]');
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('Failed to load jsPDF')));
        return;
      }
      const script = document.createElement('script');
      script.setAttribute('data-src', 'jspdf-cdn');
      script.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load jsPDF'));
      document.head.appendChild(script);
    });
  };

  // Load SheetJS for Excel export
  const loadSheetJS = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') return reject(new Error('window is undefined'));
      if ((window as any).XLSX) return resolve();
      const existing = document.querySelector('script[data-src="xlsx-cdn"]');
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('Failed to load SheetJS')));
        return;
      }
      const script = document.createElement('script');
      script.setAttribute('data-src', 'xlsx-cdn');
      script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load SheetJS'));
      document.head.appendChild(script);
    });
  };

  // Export scorecard to ultra-enhanced PDF with colorful fonts and premium design
  const exportScorecardPDF = async (sc: Scorecard) => {
    const jspdfAny = (window as any).jspdf || (window as any).jsPDF || null;
    const jsPDFCtor = jspdfAny && jspdfAny.jsPDF ? jspdfAny.jsPDF : (window as any).jsPDF;
    if (!jsPDFCtor) throw new Error('jsPDF not available');

    const doc = new jsPDFCtor({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Premium Color Palette
    const colors = {
      primary: [255, 87, 51],        // Vibrant Orange-Red
      secondary: [138, 43, 226],     // Blue Violet
      accent: [255, 215, 0],         // Gold
      success: [46, 213, 115],        // Emerald Green
      danger: [239, 68, 68],         // Red
      warning: [245, 158, 11],       // Amber
      info: [59, 130, 246],          // Blue
      dark: [30, 41, 59],            // Dark Blue
      light: [248, 250, 252],        // Light Gray
      purple: [168, 85, 247],        // Purple
      pink: [236, 72, 153],          // Pink
      cyan: [6, 182, 212],           // Cyan
      lime: [132, 204, 22],          // Lime
      indigo: [99, 102, 241],        // Indigo
      rose: [244, 63, 94],           // Rose
    };
    
    let y = 40;
    const lineHeight = 18;
    const sectionSpacing = 25;
    
    // Helper function to add gradient background
    const addGradientBackground = (startY: number, height: number, color1: number[], color2: number[]) => {
      doc.setFillColor(...color1);
      doc.rect(0, startY, pageWidth, height / 2, 'F');
      doc.setFillColor(...color2);
      doc.rect(0, startY + height / 2, pageWidth, height / 2, 'F');
    };
    
    // Helper function to add decorative pattern
    const addDecorativePattern = (yPos: number, color: number[]) => {
      doc.setDrawColor(...color);
      doc.setLineWidth(3);
      doc.line(40, yPos, pageWidth - 40, yPos);
      doc.setLineWidth(1);
      doc.setDrawColor(...color.map(c => c * 0.7));
      doc.line(40, yPos + 3, pageWidth - 40, yPos + 3);
    };
    
    // Helper function to add colorful text
    const addColorfulText = (text: string, x: number, yPos: number, color: number[], fontSize: number, fontWeight: string = 'normal', align: 'left' = 'left') => {
      doc.setTextColor(...color);
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', fontWeight);
      doc.text(text, x, yPos, { align });
    };
    
    // Data Visualization Functions
    const addMiniBarChart = (x: number, y: number, width: number, height: number, data: number[], color: number[]) => {
      if (data.length === 0) return;
      
      const maxValue = Math.max(...data);
      const barWidth = width / data.length;
      
      data.forEach((value, index) => {
        const barHeight = (value / maxValue) * height;
        const barX = x + (index * barWidth);
        const barY = y + (height - barHeight);
        
        doc.setFillColor(...color);
        doc.rect(barX + 1, barY, barWidth - 2, barHeight, 'F');
      });
      
      // Add border
      doc.setDrawColor(100, 100, 100);
      doc.rect(x, y, width, height, 'D');
    };
    
    const addStrikeRateIndicator = (x: number, y: number, width: number, height: number, strikeRate: number) => {
      // Background
      doc.setFillColor(240, 240, 240);
      doc.rect(x, y, width, height, 'F');
      
      // Strike rate bar (0-200 scale, with 100 as baseline)
      const normalizedRate = Math.min(Math.max(strikeRate, 0), 200);
      const barWidth = (normalizedRate / 200) * width;
      
      // Color based on strike rate
      let barColor: number[];
      if (strikeRate < 80) {
        barColor = [255, 100, 100]; // Red for low SR
      } else if (strikeRate < 120) {
        barColor = [255, 200, 100]; // Orange for medium SR
      } else {
        barColor = [100, 255, 100]; // Green for high SR
      }
      
      doc.setFillColor(...barColor);
      doc.rect(x, y, barWidth, height, 'F');
      
      // Border
      doc.setDrawColor(100, 100, 100);
      doc.rect(x, y, width, height, 'D');
      
      // SR text
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      doc.text(`SR: ${strikeRate.toFixed(1)}`, x + width/2, y + height/2 + 2, { align: 'center' });
    };
    
    const addPartnershipBreakdown = (x: number, y: number, width: number, height: number, partnerships: any[]) => {
      if (!partnerships || partnerships.length === 0) return;
      
      const barHeight = 15;
      const spacing = 5;
      let currentY = y;
      
      partnerships.slice(0, 5).forEach((partnership, index) => {
        const runs = partnership.runs || 0;
        const maxRuns = Math.max(...partnerships.map(p => p.runs || 0));
        const barWidth = (runs / maxRuns) * (width - 60);
        
        // Bar
        doc.setFillColor(100, 150, 255);
        doc.rect(x + 60, currentY, barWidth, barHeight, 'F');
        
        // Text
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8);
        doc.text(`${partnership.batsman1 || 'Player1'}-${partnership.batsman2 || 'Player2'}`, x + 2, currentY + 10);
        doc.text(`${runs} runs`, x + 62 + barWidth, currentY + 10);
        
        currentY += barHeight + spacing;
      });
      
      // Border
      doc.setDrawColor(100, 100, 100);
      doc.rect(x, y, width, currentY - y, 'D');
    };
    
    const addPerformanceGraph = (x: number, y: number, width: number, height: number, data: number[], color: number[]) => {
      if (data.length === 0) return;
      
      const maxValue = Math.max(...data);
      const minValue = Math.min(...data);
      const range = maxValue - minValue || 1;
      
      // Background
      doc.setFillColor(250, 250, 250);
      doc.rect(x, y, width, height, 'F');
      
      // Draw grid lines
      doc.setDrawColor(220, 220, 220);
      for (let i = 0; i <= 4; i++) {
        const gridY = y + (i * height / 4);
        doc.line(x, gridY, x + width, gridY);
      }
      
      // Draw line graph
      doc.setDrawColor(...color);
      doc.setLineWidth(2);
      
      data.forEach((value, index) => {
        const pointX = x + (index * width / (data.length - 1));
        const pointY = y + height - ((value - minValue) / range * height);
        
        if (index === 0) {
          doc.moveTo(pointX, pointY);
        } else {
          doc.lineTo(pointX, pointY);
        }
      });
      
      doc.stroke();
      
      // Draw points
      doc.setFillColor(...color);
      data.forEach((value, index) => {
        const pointX = x + (index * width / (data.length - 1));
        const pointY = y + height - ((value - minValue) / range * height);
        doc.circle(pointX, pointY, 2, 'F');
      });
      
      // Border
      doc.setDrawColor(100, 100, 100);
      doc.rect(x, y, width, height, 'D');
    };
    
    // New visualization functions for Fall of Wickets, Powerplays, and Partnerships
    const addWicketsFallChart = (x: number, y: number, width: number, height: number, fallOfWickets: any[], color: number[]) => {
      if (fallOfWickets.length === 0) return;
      
      // Background
      doc.setFillColor(250, 250, 250);
      doc.rect(x, y, width, height, 'F');
      
      // Extract wicket scores for visualization
      const wicketScores = fallOfWickets.map(fow => {
        const score = fow.score || '0-0';
        const runs = parseInt(score.split('-')[1]) || 0;
        return runs;
      });
      
      const maxRuns = Math.max(...wicketScores);
      const barWidth = width / (fallOfWickets.length * 2);
      
      // Draw bars
      fallOfWickets.forEach((fow, index) => {
        const score = fow.score || '0-0';
        const runs = parseInt(score.split('-')[1]) || 0;
        const barHeight = maxRuns > 0 ? (runs / maxRuns) * (height - 20) : 0;
        const barX = x + (index * 2 * barWidth) + barWidth / 2;
        const barY = y + height - barHeight - 10;
        
        // Draw bar
        doc.setFillColor(...color);
        doc.rect(barX, barY, barWidth, barHeight, 'F');
        
        // Add wicket number label
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8);
        doc.text(`W${index + 1}`, barX + barWidth / 2, y + height - 2, { align: 'center' });
        
        // Add runs label
        if (runs > 0) {
          doc.text(`${runs}`, barX + barWidth / 2, barY - 2, { align: 'center' });
        }
      });
      
      // Border
      doc.setDrawColor(100, 100, 100);
      doc.rect(x, y, width, height, 'D');
    };
    
    const addPowerplayComparisonChart = (x: number, y: number, width: number, height: number, powerplays: any, colors: any) => {
      if (!powerplays) return;
      
      // Background
      doc.setFillColor(250, 250, 250);
      doc.rect(x, y, width, height, 'F');
      
      const data: number[] = [];
      const labels: string[] = [];
      const barColors: number[][] = [];
      
      if (powerplays.mandatory) {
        data.push(powerplays.mandatory.runs || 0);
        labels.push('Mandatory');
        barColors.push(colors.info);
      }
      
      if (powerplays.optional) {
        data.push(powerplays.optional.runs || 0);
        labels.push('Optional');
        barColors.push(colors.warning);
      }
      
      if (data.length === 0) return;
      
      const maxValue = Math.max(...data);
      const barWidth = width / (data.length * 2);
      
      // Draw bars
      data.forEach((value, index) => {
        const barHeight = maxValue > 0 ? (value / maxValue) * (height - 30) : 0;
        const barX = x + (index * 2 * barWidth) + barWidth / 2;
        const barY = y + height - barHeight - 20;
        
        // Draw bar
        doc.setFillColor(...barColors[index]);
        doc.rect(barX, barY, barWidth, barHeight, 'F');
        
        // Add label
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8);
        doc.text(labels[index], barX + barWidth / 2, y + height - 2, { align: 'center' });
        
        // Add value
        doc.text(`${value} runs`, barX + barWidth / 2, barY - 2, { align: 'center' });
      });
      
      // Border
      doc.setDrawColor(100, 100, 100);
      doc.rect(x, y, width, height, 'D');
    };
    
    const addPartnershipContributionChart = (x: number, y: number, width: number, height: number, partnerships: any[], color: number[]) => {
      if (partnerships.length === 0) return;
      
      // Background
      doc.setFillColor(250, 250, 250);
      doc.rect(x, y, width, height, 'F');
      
      // Extract partnership totals
      const partnershipRuns = partnerships.map(p => {
        const total = p.totalRuns || '0';
        return parseInt(total) || 0;
      });
      
      const maxRuns = Math.max(...partnershipRuns);
      const barWidth = Math.min(30, width / (partnerships.length * 1.5));
      
      // Draw bars
      partnerships.forEach((partnership, index) => {
        const total = parseInt(partnership.totalRuns) || 0;
        const barHeight = maxRuns > 0 ? (total / maxRuns) * (height - 25) : 0;
        const barX = x + (index * (barWidth + 5)) + 5;
        const barY = y + height - barHeight - 15;
        
        // Draw bar
        doc.setFillColor(...color);
        doc.rect(barX, barY, barWidth, barHeight, 'F');
        
        // Add partnership number
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(7);
        doc.text(`P${index + 1}`, barX + barWidth / 2, y + height - 2, { align: 'center' });
        
        // Add runs value
        if (total > 0) {
          doc.text(`${total}`, barX + barWidth / 2, barY - 2, { align: 'center' });
        }
      });
      
      // Border
      doc.setDrawColor(100, 100, 100);
      doc.rect(x, y, width, height, 'D');
    };
    
    const addWicketsTimelineChart = (x: number, y: number, width: number, height: number, fallOfWickets: any[], color: number[]) => {
      if (fallOfWickets.length === 0) return;
      
      // Background
      doc.setFillColor(250, 250, 250);
      doc.rect(x, y, width, height, 'F');
      
      // Extract over numbers for timeline
      const overData = fallOfWickets.map(fow => {
        const over = fow.over || '0.0';
        return parseFloat(over) || 0;
      });
      
      const maxOver = Math.max(...overData);
      const pointRadius = 3;
      
      // Draw timeline axis
      doc.setDrawColor(100, 100, 100);
      doc.setLineWidth(1);
      doc.line(x + 10, y + height - 15, x + width - 10, y + height - 15);
      
      // Draw timeline points and connections
      doc.setDrawColor(...color);
      doc.setLineWidth(2);
      
      overData.forEach((over, index) => {
        const pointX = x + 10 + ((over / maxOver) * (width - 20));
        const pointY = y + height - 15;
        
        // Draw vertical line from axis
        doc.line(pointX, pointY, pointX, pointY - (height - 25));
        
        // Draw point
        doc.setFillColor(...color);
        doc.circle(pointX, pointY, pointRadius, 'F');
        
        // Add over label
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(7);
        doc.text(`${over}`, pointX, pointY + 10, { align: 'center' });
        
        // Add wicket number
        doc.text(`W${index + 1}`, pointX, pointY - (height - 25) - 5, { align: 'center' });
      });
      
      // Border
      doc.setDrawColor(100, 100, 100);
      doc.rect(x, y, width, height, 'D');
    };
    
    // Ultra-Premium Title Header with Gradient
    addGradientBackground(0, 100, colors.primary, colors.secondary);
    
    // Add decorative stars pattern
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * pageWidth;
      const y = Math.random() * 100;
      doc.text('*', x, y);
    }
    
    addColorfulText('WPL 2026 PREMIUM SCORECARD', pageWidth / 2, 35, [255, 255, 255], 26, 'bold', 'center');
    addColorfulText('WOMEN\'S PREMIER LEAGUE', pageWidth / 2, 60, [255, 215, 0], 16, 'bold', 'center');
    
    // Team names with colorful background - wider box to accommodate long names
    doc.setFillColor(...colors.accent);
    const teamNameBoxWidth = Math.min(450, pageWidth - 100); // Wider box, but not wider than page
    const teamNameBoxX = (pageWidth - teamNameBoxWidth) / 2;
    doc.roundedRect(teamNameBoxX, 75, teamNameBoxWidth, 30, 5, 5, 'F');
    
    // Truncate team names if too long
    let teamNameText = `${sc.matchInfo.team1.name} vs ${sc.matchInfo.team2.name}`;
    const maxTeamNameLength = Math.floor(teamNameBoxWidth / 8); // Approx 8 chars per pixel
    if (teamNameText.length > maxTeamNameLength) {
      teamNameText = teamNameText.substring(0, maxTeamNameLength - 3) + '...';
    }
    
    addColorfulText(teamNameText, pageWidth / 2, 95, colors.dark, 14, 'bold', 'center');
    
    // Match Information Section with Enhanced Design
    y = 130;
    addColorfulText('MATCH INFORMATION', pageWidth / 2, y, colors.primary, 16, 'bold', 'center');
    addDecorativePattern(y + 8, colors.primary);
    y += 25;
    
    // Create info boxes with colors and proper text truncation
    const infoBoxes = [
      { 
        label: 'Venue', 
        value: sc.matchInfo.venue || 'Stadium', 
        color: colors.info,
        maxLength: 25 // Truncate venue names
      },
      { label: 'Date', value: sc.matchInfo.date || 'TBD', color: colors.success },
      { label: 'Time', value: sc.matchInfo.time || 'TBD', color: colors.warning },
      { label: 'Toss', value: `${sc.matchInfo.toss?.winner || 'N/A'} (${sc.matchInfo.toss?.decision || 'N/A'})`, color: colors.purple }
    ];
    
    infoBoxes.forEach((box, index) => {
      const boxWidth = pageWidth / 2 - 120; // Reduced width for more gap
      const horizontalGap = 30; // Gap between left and right boxes
      const verticalGap = 50; // Increased vertical gap
      
      const xPos = 50 + (index % 2) * (boxWidth + horizontalGap);
      const yPos = y + Math.floor(index / 2) * verticalGap;
      
      // Truncate long values
      let displayValue = box.value;
      if (box.maxLength && displayValue.length > box.maxLength) {
        displayValue = displayValue.substring(0, box.maxLength - 3) + '...';
      }
      
      doc.setFillColor(...box.color);
      doc.roundedRect(xPos - 5, yPos - 15, boxWidth, 35, 3, 3, 'F');
      addColorfulText(box.label, xPos + 5, yPos, [255, 255, 255], 9, 'bold');
      addColorfulText(displayValue, xPos + 5, yPos + 12, [255, 255, 255], 11);
    });
    
    y += 120; // Increased to account for larger vertical gap
    
    // Process each innings with ultra-enhanced design
    sc.innings.forEach((inn, innIndex) => {
      const battingTeamName = inn.battingTeamId === sc.matchInfo.team1.id ? sc.matchInfo.team1.name : sc.matchInfo.team2.name;
      
      if (y > pageHeight - 250) { doc.addPage(); y = 40; }
      
      // Innings Header with Gradient - truncate long team names
      addGradientBackground(y - 15, 50, colors.secondary, colors.purple);
      
      // Truncate team name for header if too long
      let headerTeamName = battingTeamName.toUpperCase();
      const maxHeaderLength = 35; // Maximum characters for header
      if (headerTeamName.length > maxHeaderLength) {
        headerTeamName = headerTeamName.substring(0, maxHeaderLength - 3) + '...';
      }
      
      addColorfulText(`INNINGS ${inn.inningsNumber} - ${headerTeamName}`, pageWidth / 2, y + 15, [255, 255, 255], 18, 'bold', 'center');
      y += 60;
      
      // Batting Section with Enhanced Design
      addColorfulText('BATTING SCORECARD', pageWidth / 2, y, colors.success, 14, 'bold', 'center');
      addDecorativePattern(y + 8, colors.success);
      y += 25;
      
      // Enhanced Batting Table Header with proper column widths
      doc.setFillColor(...colors.light);
      doc.roundedRect(35, y - 15, pageWidth - 70, 25, 3, 3, 'F');
      doc.setDrawColor(...colors.success);
      doc.setLineWidth(2);
      doc.roundedRect(35, y - 15, pageWidth - 70, 25, 3, 3, 'D');
      
      // Define column boundaries for proper text wrapping
      const columns = [
        { start: 40, end: 150, text: 'BATTER' },      // 110px width
        { start: 155, end: 195, text: 'R' },           // 40px width  
        { start: 200, end: 240, text: 'B' },           // 40px width
        { start: 245, end: 285, text: '4s' },          // 40px width
        { start: 290, end: 330, text: '6s' },          // 40px width
        { start: 335, end: 385, text: 'SR' },          // 50px width
        { start: 390, end: pageWidth - 40, text: 'DISMISSAL' } // Remaining width
      ];
      
      columns.forEach(column => {
        addColorfulText(column.text, (column.start + column.end) / 2, y, colors.dark, 10, 'bold', 'center');
      });
      y += lineHeight;
      
      // Batting Data with colorful rows
      inn.batting.forEach((b, index) => {
        if (y > pageHeight - 120) { doc.addPage(); y = 40; }
        
        // Rainbow row colors
        const rowColors = [
          [255, 240, 245], // Light Pink
          [240, 248, 255], // Light Blue
          [245, 255, 240], // Light Green
          [255, 248, 240], // Light Orange
          [248, 240, 255], // Light Purple
        ];
        const rowColor = rowColors[index % rowColors.length];
        
        doc.setFillColor(...rowColor);
        doc.roundedRect(35, y - 12, pageWidth - 70, 20, 2, 2, 'F');
        
        // Colorful stats based on performance
        const runsColor = b.runs >= 50 ? colors.success : b.runs >= 30 ? colors.warning : colors.dark;
        const srColor = (b.strikeRate && b.strikeRate >= 150) ? colors.success : (b.strikeRate && b.strikeRate >= 100) ? colors.info : colors.dark;
        
        // Truncate player name if too long
        let playerName = b.name || b.playerId || '';
        if (playerName.length > 18) {
          playerName = playerName.substring(0, 15) + '...';
        }
        
        // Add text within column boundaries
        addColorfulText(playerName, 40, y, colors.dark, 10); // BATTER column
        addColorfulText(String(b.runs || 0), 175, y, runsColor, 11, 'bold', 'center'); // R column
        addColorfulText(String(b.balls || 0), 220, y, colors.info, 10, 'center'); // B column
        addColorfulText(String(b.fours || 0), 265, y, colors.cyan, 10, 'bold', 'center'); // 4s column
        addColorfulText(String(b.sixes || 0), 310, y, colors.warning, 10, 'bold', 'center'); // 6s column
        addColorfulText(String(b.strikeRate ? b.strikeRate.toFixed(1) : '-'), 360, y, srColor, 9, 'center'); // SR column
        
        // Enhanced dismissal info with truncation
        let dismissalText = 'not out';
        let dismissalColor = colors.success;
        
        if (b.dismissal) {
          dismissalColor = colors.danger;
          if (b.dismissal.type === 'caught') {
            dismissalText = `c ${b.dismissal.fielderId || 'fielder'} b ${b.dismissal.bowlerId || 'bowler'}`;
          } else if (b.dismissal.type === 'bowled') {
            dismissalText = `b ${b.dismissal.bowlerId || 'bowler'}`;
          } else if (b.dismissal.type === 'lbw') {
            dismissalText = `lbw b ${b.dismissal.bowlerId || 'bowler'}`;
          } else if (b.dismissal.type === 'run_out') {
            dismissalText = 'run out';
          } else {
            dismissalText = `${b.dismissal.details || b.dismissal.type}`;
          }
          
          // Truncate dismissal text if too long for column
          const maxDismissalLength = Math.floor((pageWidth - 40 - 390) / 6); // Approx 6 chars per 1px
          if (dismissalText.length > maxDismissalLength) {
            dismissalText = dismissalText.substring(0, maxDismissalLength - 3) + '...';
          }
        }
        
        addColorfulText(dismissalText, 395, y, dismissalColor, 8); // DISMISSAL column
        y += lineHeight;
      });
      
      y += 15;
      
      // Data Visualization Section - Batting Performance
      if (y > pageHeight - 200) { doc.addPage(); y = 40; }
      
      addColorfulText('BATTING PERFORMANCE ANALYSIS', pageWidth / 2, y, colors.info, 14, 'bold', 'center');
      addDecorativePattern(y + 8, colors.info);
      y += 25;
      
      // Mini bar chart for runs progression
      const battingRuns = inn.batting.map(b => b.runs || 0);
      addColorfulText('Runs Progression', 40, y, colors.dark, 10, 'bold');
      addMiniBarChart(40, y + 5, pageWidth - 80, 40, battingRuns, colors.success);
      y += 60;
      
      // Strike rate indicators for top batsmen
      addColorfulText('Strike Rate Analysis', 40, y, colors.dark, 10, 'bold');
      const topBatsmen = inn.batting.slice(0, 5);
      topBatsmen.forEach((batsman, index) => {
        if (batsman.strikeRate) {
          addStrikeRateIndicator(40 + (index * 110), y + 5, 100, 20, batsman.strikeRate);
        }
      });
      y += 40;
      
      // Partnership breakdown
      if (inn.partnerships && inn.partnerships.length > 0) {
        addColorfulText('Partnership Breakdown', 40, y, colors.dark, 10, 'bold');
        addPartnershipBreakdown(40, y + 5, pageWidth - 80, 100, inn.partnerships);
        y += 120;
      }
      
      // Enhanced Partnership Contribution Chart
      if (inn.partnerships && inn.partnerships.length > 0) {
        addColorfulText('Partnership Contributions', 40, y, colors.dark, 10, 'bold');
        addPartnershipContributionChart(40, y + 5, pageWidth - 80, 60, inn.partnerships, colors.accent);
        y += 80;
      }
      
      // Fall of Wickets Analysis
      if (inn.fallOfWickets && inn.fallOfWickets.length > 0) {
        if (y > pageHeight - 200) { doc.addPage(); y = 40; }
        
        addColorfulText('FALL OF WICKETS ANALYSIS', 40, y, colors.warning, 10, 'bold');
        
        // Wickets Fall Chart (runs at which wickets fell)
        addColorfulText('Runs at Wickets', 40, y + 15, colors.dark, 9, 'bold');
        addWicketsFallChart(40, y + 20, pageWidth - 80, 50, inn.fallOfWickets, colors.warning);
        y += 80;
        
        // Wickets Timeline Chart (when wickets fell)
        addColorfulText('Wickets Timeline', 40, y, colors.dark, 9, 'bold');
        addWicketsTimelineChart(40, y + 5, pageWidth - 80, 50, inn.fallOfWickets, colors.danger);
        y += 70;
      }
      
      // Powerplays Analysis
      if (inn.powerplays) {
        if (y > pageHeight - 150) { doc.addPage(); y = 40; }
        
        addColorfulText('POWERPLAYS ANALYSIS', 40, y, colors.info, 10, 'bold');
        addPowerplayComparisonChart(40, y + 5, pageWidth - 80, 60, inn.powerplays, colors);
        y += 80;
      }
      
      y += 15;
      
      // Bowling Section with Enhanced Design
      addColorfulText('BOWLING FIGURES', pageWidth / 2, y, colors.purple, 14, 'bold', 'center');
      addDecorativePattern(y + 8, colors.purple);
      y += 25;
      
      // Enhanced Bowling Table Header with proper column widths
      doc.setFillColor(...colors.light);
      doc.roundedRect(35, y - 15, pageWidth - 70, 25, 3, 3, 'F');
      doc.setDrawColor(...colors.purple);
      doc.setLineWidth(2);
      doc.roundedRect(35, y - 15, pageWidth - 70, 25, 3, 3, 'D');
      
      // Define bowling column boundaries
      const bowlingColumns = [
        { start: 40, end: 180, text: 'BOWLER' },      // 140px width
        { start: 185, end: 225, text: 'O' },           // 40px width  
        { start: 230, end: 270, text: 'R' },           // 40px width
        { start: 275, end: 315, text: 'W' },           // 40px width
        { start: 320, end: 380, text: 'ECON' },        // 60px width
        { start: 385, end: 425, text: 'WD' },          // 40px width
        { start: 430, end: pageWidth - 40, text: 'NB' } // Remaining width
      ];
      
      bowlingColumns.forEach(column => {
        addColorfulText(column.text, (column.start + column.end) / 2, y, colors.dark, 10, 'bold', 'center');
      });
      y += lineHeight;
      
      // Bowling Data with colorful performance indicators
      inn.bowling.forEach((bw, index) => {
        if (y > pageHeight - 120) { doc.addPage(); y = 40; }
        
        // Alternating colorful rows
        const bowlingRowColors = [
          [240, 248, 255], // Light Blue
          [255, 240, 245], // Light Pink
        ];
        const rowColor = bowlingRowColors[index % bowlingRowColors.length];
        
        doc.setFillColor(...rowColor);
        doc.roundedRect(35, y - 12, pageWidth - 70, 20, 2, 2, 'F');
        
        // Colorful performance indicators
        const wicketColor = bw.wickets >= 3 ? colors.success : bw.wickets >= 1 ? colors.warning : colors.dark;
        const economyColor = bw.economy && bw.economy <= 6 ? colors.success : bw.economy && bw.economy <= 8 ? colors.warning : colors.danger;
        
        // Truncate bowler name if too long
        let bowlerName = bw.name || bw.playerId || '';
        if (bowlerName.length > 22) {
          bowlerName = bowlerName.substring(0, 19) + '...';
        }
        
        // Add bowling data within column boundaries
        addColorfulText(bowlerName, 40, y, colors.dark, 10); // BOWLER column
        addColorfulText(String(bw.overs || '0.0'), 205, y, colors.info, 10, 'center'); // O column
        addColorfulText(String(bw.runs || 0), 250, y, colors.danger, 10, 'center'); // R column
        addColorfulText(String(bw.wickets || 0), 295, y, wicketColor, 11, 'bold', 'center'); // W column
        addColorfulText(String(bw.economy ? bw.economy.toFixed(2) : '-'), 350, y, economyColor, 10, 'center'); // ECON column
        addColorfulText(String(bw.wides || 0), 405, y, colors.cyan, 10, 'center'); // WD column
        addColorfulText(String(bw.noBalls || 0), 435, y, colors.rose, 10, 'center'); // NB column
        y += lineHeight;
      });
      
      y += 20;
      
      // Data Visualization Section - Bowling Performance
      if (y > pageHeight - 200) { doc.addPage(); y = 40; }
      
      addColorfulText('BOWLING PERFORMANCE ANALYSIS', pageWidth / 2, y, colors.purple, 14, 'bold', 'center');
      addDecorativePattern(y + 8, colors.purple);
      y += 25;
      
      // Mini bar chart for wickets
      const bowlingWickets = inn.bowling.map(b => b.wickets || 0);
      addColorfulText('Wickets Distribution', 40, y, colors.dark, 10, 'bold');
      addMiniBarChart(40, y + 5, pageWidth - 80, 40, bowlingWickets, colors.purple);
      y += 60;
      
      // Economy rate indicators
      addColorfulText('Economy Rate Analysis', 40, y, colors.dark, 10, 'bold');
      const topBowlers = inn.bowling.slice(0, 5);
      topBowlers.forEach((bowler, index) => {
        if (bowler.economy) {
          // Create economy indicator (lower is better, so invert the scale)
          const economyScore = Math.max(0, 15 - bowler.economy) * 10; // Scale 0-150
          addStrikeRateIndicator(40 + (index * 110), y + 5, 100, 20, economyScore);
          // Add economy text
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(7);
          doc.text(`Econ: ${bowler.economy.toFixed(1)}`, 40 + (index * 110) + 50, y + 15, { align: 'center' });
        }
      });
      y += 40;
      
      // Performance graph for runs conceded
      const bowlingRuns = inn.bowling.map(b => b.runs || 0);
      addColorfulText('Runs Conceded Trend', 40, y, colors.dark, 10, 'bold');
      addPerformanceGraph(40, y + 5, pageWidth - 80, 60, bowlingRuns, colors.danger);
      y += 80;
      
      // Bowling vs Partnerships Analysis
      if (inn.partnerships && inn.partnerships.length > 0 && inn.bowling.length > 0) {
        addColorfulText('Bowling Impact on Partnerships', 40, y, colors.dark, 10, 'bold');
        
        // Create a comparison chart showing partnership runs vs bowling economy
        const partnershipData = inn.partnerships.map(p => parseInt(p.totalRuns) || 0);
        const bowlingEconomies = inn.bowling.slice(0, partnershipData.length).map(b => b.economy || 0);
        
        // Show partnership runs as bars and overlay bowling economy as a line
        addColorfulText('Partnership Runs vs Bowling Economy', 40, y + 15, colors.dark, 9, 'italic');
        
        // Draw partnership bars
        const maxPartnershipRuns = Math.max(...partnershipData);
        const barWidth = Math.min(40, (pageWidth - 80) / (partnershipData.length * 1.5));
        
        partnershipData.forEach((runs, index) => {
          const barHeight = maxPartnershipRuns > 0 ? (runs / maxPartnershipRuns) * 40 : 0;
          const barX = 40 + (index * (barWidth + 10));
          const barY = y + 35;
          
          doc.setFillColor(...colors.accent);
          doc.rect(barX, barY - barHeight, barWidth, barHeight, 'F');
          
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(7);
          doc.text(`P${index + 1}`, barX + barWidth / 2, barY + 5, { align: 'center' });
          doc.text(`${runs}`, barX + barWidth / 2, barY - barHeight - 2, { align: 'center' });
        });
        
        y += 70;
      }
      
      y += 20;

      // Fall of Wickets Section
      if (inn.fallOfWickets && inn.fallOfWickets.length > 0) {
        if (y > pageHeight - 150) { doc.addPage(); y = 40; }
        
        addColorfulText('FALL OF WICKETS', pageWidth / 2, y, colors.warning, 14, 'bold', 'center');
        addDecorativePattern(y + 8, colors.warning);
        y += 25;
        
        // Fall of Wickets Table Header
        doc.setFillColor(...colors.light);
        doc.roundedRect(35, y - 15, pageWidth - 70, 25, 3, 3, 'F');
        doc.setDrawColor(...colors.warning);
        doc.setLineWidth(2);
        doc.roundedRect(35, y - 15, pageWidth - 70, 25, 3, 3, 'D');
        
        // Fall of Wickets columns
        const fowColumns = [
          { start: 40, end: 200, text: 'PLAYER' },
          { start: 205, end: 280, text: 'SCORE' },
          { start: 285, end: pageWidth - 40, text: 'OVER' }
        ];
        
        fowColumns.forEach(column => {
          addColorfulText(column.text, (column.start + column.end) / 2, y, colors.dark, 10, 'bold', 'center');
        });
        y += lineHeight;
        
        // Fall of Wickets Data
        inn.fallOfWickets.forEach((fow, index) => {
          if (y > pageHeight - 80) { doc.addPage(); y = 40; }
          
          // Alternating row colors
          const fowRowColors = [
            [255, 248, 225], // Light Yellow
            [255, 240, 245], // Light Pink
          ];
          const rowColor = fowRowColors[index % fowRowColors.length];
          
          doc.setFillColor(...rowColor);
          doc.roundedRect(35, y - 12, pageWidth - 70, 20, 2, 2, 'F');
          
          addColorfulText(fow.player || 'N/A', 40, y, colors.dark, 10);
          addColorfulText(fow.score || 'N/A', 242, y, colors.warning, 10, 'bold', 'center');
          addColorfulText(fow.over || 'N/A', (285 + pageWidth - 40) / 2, y, colors.info, 10, 'center');
          y += lineHeight;
        });
        
        y += 20;
      }
      
      // Powerplays Section
      if (inn.powerplays) {
        if (y > pageHeight - 120) { doc.addPage(); y = 40; }
        
        addColorfulText('POWERPLAYS', pageWidth / 2, y, colors.info, 14, 'bold', 'center');
        addDecorativePattern(y + 8, colors.info);
        y += 25;
        
        // Powerplays Grid Layout
        const powerplayColumns = [
          { start: 40, end: pageWidth / 2 - 10, text: 'TYPE' },
          { start: pageWidth / 2 + 10, end: pageWidth - 40, text: 'DETAILS' }
        ];
        
        // Mandatory Powerplay
        if (inn.powerplays.mandatory) {
          doc.setFillColor(...colors.light);
          doc.roundedRect(35, y - 15, pageWidth - 70, 25, 3, 3, 'F');
          doc.setDrawColor(...colors.info);
          doc.setLineWidth(2);
          doc.roundedRect(35, y - 15, pageWidth - 70, 25, 3, 3, 'D');
          
          addColorfulText('MANDATORY POWERPLAY', pageWidth / 2, y, colors.dark, 10, 'bold', 'center');
          y += lineHeight;
          
          doc.setFillColor([240, 248, 255]);
          doc.roundedRect(35, y - 12, pageWidth - 70, 20, 2, 2, 'F');
          
          addColorfulText('Overs:', 40, y, colors.dark, 10);
          addColorfulText(inn.powerplays.mandatory.overs || 'N/A', 100, y, colors.info, 10, 'bold');
          addColorfulText('Runs:', pageWidth / 2, y, colors.dark, 10);
          addColorfulText(String(inn.powerplays.mandatory.runs || 0), pageWidth / 2 + 50, y, colors.success, 10, 'bold');
          y += lineHeight + 10;
        }
        
        // Optional Powerplay
        if (inn.powerplays.optional) {
          doc.setFillColor(...colors.light);
          doc.roundedRect(35, y - 15, pageWidth - 70, 25, 3, 3, 'F');
          doc.setDrawColor(...colors.info);
          doc.setLineWidth(2);
          doc.roundedRect(35, y - 15, pageWidth - 70, 25, 3, 3, 'D');
          
          addColorfulText('OPTIONAL POWERPLAY', pageWidth / 2, y, colors.dark, 10, 'bold', 'center');
          y += lineHeight;
          
          doc.setFillColor([240, 248, 255]);
          doc.roundedRect(35, y - 12, pageWidth - 70, 20, 2, 2, 'F');
          
          addColorfulText('Overs:', 40, y, colors.dark, 10);
          addColorfulText(inn.powerplays.optional.overs || 'N/A', 100, y, colors.info, 10, 'bold');
          addColorfulText('Runs:', pageWidth / 2, y, colors.dark, 10);
          addColorfulText(String(inn.powerplays.optional.runs || 0), pageWidth / 2 + 50, y, colors.success, 10, 'bold');
          y += lineHeight + 10;
        }
        
        y += 20;
      }
      
      // Partnerships Section (Enhanced version)
      if (inn.partnerships && inn.partnerships.length > 0) {
        if (y > pageHeight - 200) { doc.addPage(); y = 40; }
        
        addColorfulText('PARTNERSHIPS', pageWidth / 2, y, colors.accent, 14, 'bold', 'center');
        addDecorativePattern(y + 8, colors.accent);
        y += 25;
        
        // Partnerships Table Header
        doc.setFillColor(...colors.light);
        doc.roundedRect(35, y - 15, pageWidth - 70, 25, 3, 3, 'F');
        doc.setDrawColor(...colors.accent);
        doc.setLineWidth(2);
        doc.roundedRect(35, y - 15, pageWidth - 70, 25, 3, 3, 'D');
        
        // Partnerships columns
        const partnershipColumns = [
          { start: 40, end: 150, text: 'BATSMAN 1' },
          { start: 155, end: 220, text: 'SCORE' },
          { start: 225, end: 290, text: 'BATSMAN 2' },
          { start: 295, end: 360, text: 'SCORE' },
          { start: 365, end: pageWidth - 40, text: 'TOTAL' }
        ];
        
        partnershipColumns.forEach(column => {
          addColorfulText(column.text, (column.start + column.end) / 2, y, colors.dark, 9, 'bold', 'center');
        });
        y += lineHeight;
        
        // Partnerships Data
        inn.partnerships.forEach((partnership, index) => {
          if (y > pageHeight - 80) { doc.addPage(); y = 40; }
          
          // Alternating row colors
          const partnershipRowColors = [
            [240, 255, 240], // Light Green
            [255, 248, 220], // Light Yellow
          ];
          const rowColor = partnershipRowColors[index % partnershipRowColors.length];
          
          doc.setFillColor(...rowColor);
          doc.roundedRect(35, y - 12, pageWidth - 70, 20, 2, 2, 'F');
          
          addColorfulText(partnership.batsman1 || 'N/A', 40, y, colors.dark, 9);
          addColorfulText(`${partnership.batsman1Runs || 0} (${partnership.batsman1Balls || 0})`, 187, y, colors.info, 9, 'center');
          addColorfulText(partnership.batsman2 || 'N/A', 225, y, colors.dark, 9);
          addColorfulText(`${partnership.batsman2Runs || 0} (${partnership.batsman2Balls || 0})`, 327, y, colors.info, 9, 'center');
          addColorfulText(`${partnership.totalRuns || 0} runs`, (365 + pageWidth - 40) / 2, y, colors.accent, 10, 'bold', 'center');
          y += lineHeight;
        });
        
        y += 20;
      }
      
      y += 20;
      
      // Innings Summary with Enhanced Design
      if (y > pageHeight - 100) { doc.addPage(); y = 40; }
      
      addGradientBackground(y - 10, 40, colors.accent, colors.warning);
      const extras = (inn.extras.wides || 0) + (inn.extras.noBalls || 0) + (inn.extras.byes || 0) + (inn.extras.legByes || 0);
      addColorfulText(`Extras: ${extras} (W ${inn.extras.wides || 0}, NB ${inn.extras.noBalls || 0}, B ${inn.extras.byes || 0}, LB ${inn.extras.legByes || 0})`, pageWidth / 2, y + 10, [255, 255, 255], 12, 'bold', 'center');
      y += 50;
      
      addColorfulText(`TOTAL: ${inn.totalRuns || 0}/${inn.totalWickets || 0} (${inn.totalOvers || '0.0'} overs)`, pageWidth / 2, y, colors.success, 16, 'bold', 'center');
      y += sectionSpacing;
    });
    
    // Enhanced Result Section
    if (y > pageHeight - 120) { doc.addPage(); y = 40; }
    
    addGradientBackground(y - 15, 60, colors.success, colors.primary);
    addColorfulText('MATCH RESULT', pageWidth / 2, y + 15, [255, 255, 255], 18, 'bold', 'center');
    y += 70;
    
    addColorfulText(`Winner: ${sc.result?.winner || 'To be determined'}`, pageWidth / 2, y, colors.success, 14, 'bold', 'center');
    y += lineHeight;
    addColorfulText(`Margin: ${sc.result?.margin || 'N/A'}`, pageWidth / 2, y, colors.info, 12, 'center');
    y += lineHeight;
    addColorfulText(`Man of the Match: ${sc.result?.manOfTheMatch || 'N/A'}`, pageWidth / 2, y, colors.accent, 12, 'center');
    y += lineHeight * 2;
    
    // Enhanced Footer
    const footerY = pageHeight - 40;
    addGradientBackground(footerY - 10, 50, colors.dark, colors.secondary);
    addColorfulText('Generated on SportsUP18', pageWidth / 2, footerY + 10, [255, 255, 255], 10, 'italic', 'center');
    addColorfulText('© 2026 SportsUP18. All rights reserved.', pageWidth / 2, footerY + 25, [255, 215, 0], 9, 'italic', 'center');

    const filename = `WPL_Premium_Scorecard_${sc.matchInfo.team1.shortName || 'Team1'}_vs_${sc.matchInfo.team2.shortName || 'Team2'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  };

  // Export scorecard to enhanced Excel with premium styling
  const exportScorecardExcel = async (sc: Scorecard) => {
    const XLSX = (window as any).XLSX;
    if (!XLSX) throw new Error('SheetJS not available');

    // Create workbook with enhanced styling
    const wb = XLSX.utils.book_new();
    
    // Define premium color scheme
    const colors = {
      header: 'FF6F3D',      // Orange-Red
      accent: 'FFD700',      // Gold
      success: '2ED573',     // Green
      danger: 'EF4444',      // Red
      warning: 'F59E0B',     // Amber
      info: '3B82F6',        // Blue
      purple: 'A855F7',      // Purple
      pink: 'EC4899',        // Pink
      cyan: '06B6D4',        // Cyan
      light: 'F8FAFC',       // Light Gray
    };

    // Match Info Sheet
    const matchInfoData = [
      ['🏆 WPL 2026 PREMIUM SCORECARD 🏆', '', '', '', ''],
      ['📊 MATCH INFORMATION', '', '', '', ''],
      ['', '', '', '', ''],
      ['🏟️ Venue', sc.matchInfo.venue || 'Stadium', '', '', ''],
      ['📅 Date', sc.matchInfo.date || 'TBD', '', '', ''],
      ['⏰ Time', sc.matchInfo.time || 'TBD', '', '', ''],
      ['🎲 Toss Winner', sc.matchInfo.toss?.winner || 'N/A', '', '', ''],
      ['🎲 Toss Decision', sc.matchInfo.toss?.decision || 'N/A', '', '', ''],
      ['', '', '', '', ''],
      ['⭐ MATCH RESULT', '', '', '', ''],
      ['🥇 Winner', sc.result?.winner || 'To be determined', '', '', ''],
      ['📊 Margin', sc.result?.margin || 'N/A', '', '', ''],
      ['🏅 Man of the Match', sc.result?.manOfTheMatch || 'N/A', '', '', ''],
    ];

    const matchInfoWS = XLSX.utils.aoa_to_sheet(matchInfoData);
    
    // Style match info sheet
    const matchInfoRange = XLSX.utils.decode_range(matchInfoWS['!ref'] || 'A1');
    for (let row = matchInfoRange.s.r; row <= matchInfoRange.e.r; row++) {
      for (let col = matchInfoRange.s.c; col <= matchInfoRange.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (!matchInfoWS[cellRef]) continue;
        
        matchInfoWS[cellRef].s = {
          font: { name: 'Calibri', sz: 12 },
          alignment: { vertical: 'center', horizontal: 'left' },
          border: {
            top: { style: 'thin', color: { auto: 1 } },
            bottom: { style: 'thin', color: { auto: 1 } },
            left: { style: 'thin', color: { auto: 1 } },
            right: { style: 'thin', color: { auto: 1 } }
          }
        };

        // Special styling for headers
        if (row === 0) {
          matchInfoWS[cellRef].s.fill = { fgColor: { rgb: colors.header } };
          matchInfoWS[cellRef].s.font = { name: 'Calibri', sz: 16, bold: true, color: { rgb: 'FFFFFF' } };
          matchInfoWS[cellRef].s.alignment = { horizontal: 'center', vertical: 'center' };
        } else if (row === 1 || row === 9) {
          matchInfoWS[cellRef].s.fill = { fgColor: { rgb: colors.accent } };
          matchInfoWS[cellRef].s.font = { name: 'Calibri', sz: 14, bold: true, color: { rgb: '000000' } };
        } else if (row === 3 || row === 10) {
          matchInfoWS[cellRef].s.font = { name: 'Calibri', sz: 11, bold: true, color: { rgb: colors.info } };
        }
      }
    }

    // Process each innings
    sc.innings.forEach((inn, innIndex) => {
      const battingTeamName = inn.battingTeamId === sc.matchInfo.team1.id ? sc.matchInfo.team1.name : sc.matchInfo.team2.name;
      
      // Batting Sheet
      const battingData = [
        [`🏏 INNINGS ${inn.inningsNumber} - ${battingTeamName.toUpperCase()} 🏏`, '', '', '', '', '', '', ''],
        ['🎯 BATTING SCORECARD', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['🏏 Batter', '🎯 Runs', '⚪ Balls', '🔷 4s', '🔶 6s', '📊 Strike Rate', '❌ Dismissal', '⏱️ Minutes'],
      ];

      // Add batting data
      inn.batting.forEach(b => {
        let dismissalText = '🏏 not out';
        if (b.dismissal) {
          if (b.dismissal.type === 'caught') {
            dismissalText = `🤲 c ${b.dismissal.fielderId || 'fielder'} b ${b.dismissal.bowlerId || 'bowler'}`;
          } else if (b.dismissal.type === 'bowled') {
            dismissalText = `🎳 b ${b.dismissal.bowlerId || 'bowler'}`;
          } else if (b.dismissal.type === 'lbw') {
            dismissalText = `⚖️ lbw b ${b.dismissal.bowlerId || 'bowler'}`;
          } else if (b.dismissal.type === 'run_out') {
            dismissalText = `🏃 run out`;
          } else {
            dismissalText = `❌ ${b.dismissal.details || b.dismissal.type}`;
          }
        }
        
        battingData.push([
          b.name || b.playerId || '',
          b.runs || 0,
          b.balls || 0,
          b.fours || 0,
          b.sixes || 0,
          b.strikeRate ? b.strikeRate.toFixed(2) : '-',
          dismissalText,
          b.balls ? Math.floor(b.balls / 6) : 0
        ]);
      });

      // Add innings summary
      const extras = (inn.extras.wides || 0) + (inn.extras.noBalls || 0) + (inn.extras.byes || 0) + (inn.extras.legByes || 0);
      battingData.push(
        ['', '', '', '', '', '', '', ''],
        ['🎁 EXTRAS', extras, '', '', '', '', '', `W: ${inn.extras.wides || 0}, NB: ${inn.extras.noBalls || 0}, B: ${inn.extras.byes || 0}, LB: ${inn.extras.legByes || 0}`],
        ['🏆 TOTAL', `${inn.totalRuns || 0}/${inn.totalWickets || 0}`, '', '', '', '', `${inn.totalOvers || '0.0'} overs`, '']
      );

      const battingWS = XLSX.utils.aoa_to_sheet(battingData);
      
      // Style batting sheet
      const battingRange = XLSX.utils.decode_range(battingWS['!ref'] || 'A1');
      for (let row = battingRange.s.r; row <= battingRange.e.r; row++) {
        for (let col = battingRange.s.c; col <= battingRange.e.c; col++) {
          const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
          if (!battingWS[cellRef]) continue;
          
          battingWS[cellRef].s = {
            font: { name: 'Calibri', sz: 11 },
            alignment: { vertical: 'center', horizontal: col === 0 ? 'left' : 'center' },
            border: {
              top: { style: 'thin', color: { auto: 1 } },
              bottom: { style: 'thin', color: { auto: 1 } },
              left: { style: 'thin', color: { auto: 1 } },
              right: { style: 'thin', color: { auto: 1 } }
            }
          };

          // Special styling
          if (row === 0) {
            battingWS[cellRef].s.fill = { fgColor: { rgb: colors.success } };
            battingWS[cellRef].s.font = { name: 'Calibri', sz: 14, bold: true, color: { rgb: 'FFFFFF' } };
          } else if (row === 1) {
            battingWS[cellRef].s.fill = { fgColor: { rgb: colors.purple } };
            battingWS[cellRef].s.font = { name: 'Calibri', sz: 12, bold: true, color: { rgb: 'FFFFFF' } };
          } else if (row === 3) {
            battingWS[cellRef].s.fill = { fgColor: { rgb: colors.info } };
            battingWS[cellRef].s.font = { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } };
          } else if (row >= 4 && row < 4 + inn.batting.length) {
            // Performance-based coloring
            const batterIndex = row - 4;
            const batter = inn.batting[batterIndex];
            if (col === 1 && batter.runs >= 50) {
              battingWS[cellRef].s.fill = { fgColor: { rgb: colors.success } };
              battingWS[cellRef].s.font = { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } };
            } else if (col === 1 && batter.runs >= 30) {
              battingWS[cellRef].s.fill = { fgColor: { rgb: colors.warning } };
              battingWS[cellRef].s.font = { name: 'Calibri', sz: 11, bold: true };
            }
          } else if (battingData[row][0] === '🎁 EXTRAS') {
            battingWS[cellRef].s.fill = { fgColor: { rgb: colors.warning } };
            battingWS[cellRef].s.font = { name: 'Calibri', sz: 11, bold: true };
          } else if (battingData[row][0] === '🏆 TOTAL') {
            battingWS[cellRef].s.fill = { fgColor: { rgb: colors.accent } };
            battingWS[cellRef].s.font = { name: 'Calibri', sz: 12, bold: true };
          }
        }
      }

      // Bowling Sheet
      const bowlingData = [
        [`🎳 INNINGS ${inn.inningsNumber} - ${battingTeamName.toUpperCase()} BOWLING 🎳`, '', '', '', '', '', '', ''],
        ['🎳 BOWLING FIGURES', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['🎳 Bowler', '⏱️ Overs', '🎯 Runs', '🔥 Wickets', '📈 Economy', '↔️ Wides', '⚡ No Balls', '🎯 Maidens'],
      ];

      // Add bowling data
      inn.bowling.forEach(bw => {
        bowlingData.push([
          bw.name || bw.playerId || '',
          bw.overs || '0.0',
          bw.runs || 0,
          bw.wickets || 0,
          bw.economyRate ? bw.economyRate.toFixed(2) : '-',
          bw.wides || 0,
          bw.noBalls || 0,
          bw.maidens || 0
        ]);
      });

      const bowlingWS = XLSX.utils.aoa_to_sheet(bowlingData);
      
      // Style bowling sheet
      const bowlingRange = XLSX.utils.decode_range(bowlingWS['!ref'] || 'A1');
      for (let row = bowlingRange.s.r; row <= bowlingRange.e.r; row++) {
        for (let col = bowlingRange.s.c; col <= bowlingRange.e.c; col++) {
          const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
          if (!bowlingWS[cellRef]) continue;
          
          bowlingWS[cellRef].s = {
            font: { name: 'Calibri', sz: 11 },
            alignment: { vertical: 'center', horizontal: col === 0 ? 'left' : 'center' },
            border: {
              top: { style: 'thin', color: { auto: 1 } },
              bottom: { style: 'thin', color: { auto: 1 } },
              left: { style: 'thin', color: { auto: 1 } },
              right: { style: 'thin', color: { auto: 1 } }
            }
          };

          // Special styling
          if (row === 0) {
            bowlingWS[cellRef].s.fill = { fgColor: { rgb: colors.purple } };
            bowlingWS[cellRef].s.font = { name: 'Calibri', sz: 14, bold: true, color: { rgb: 'FFFFFF' } };
          } else if (row === 1) {
            bowlingWS[cellRef].s.fill = { fgColor: { rgb: colors.cyan } };
            bowlingWS[cellRef].s.font = { name: 'Calibri', sz: 12, bold: true, color: { rgb: 'FFFFFF' } };
          } else if (row === 3) {
            bowlingWS[cellRef].s.fill = { fgColor: { rgb: colors.info } };
            bowlingWS[cellRef].s.font = { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } };
          } else if (row >= 4 && row < 4 + inn.bowling.length) {
            // Performance-based coloring
            const bowlerIndex = row - 4;
            const bowler = inn.bowling[bowlerIndex];
            if (col === 3 && bowler.wickets >= 3) {
              bowlingWS[cellRef].s.fill = { fgColor: { rgb: colors.success } };
              bowlingWS[cellRef].s.font = { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } };
            } else if (col === 3 && bowler.wickets >= 1) {
              bowlingWS[cellRef].s.fill = { fgColor: { rgb: colors.warning } };
              bowlingWS[cellRef].s.font = { name: 'Calibri', sz: 11, bold: true };
            } else if (col === 4 && bowler.economyRate && bowler.economyRate <= 6) {
              bowlingWS[cellRef].s.fill = { fgColor: { rgb: colors.success } };
              bowlingWS[cellRef].s.font = { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } };
            } else if (col === 4 && bowler.economyRate && bowler.economyRate <= 8) {
              bowlingWS[cellRef].s.fill = { fgColor: { rgb: colors.warning } };
              bowlingWS[cellRef].s.font = { name: 'Calibri', sz: 11, bold: true };
            }
          }
        }
      }

      // Add sheets to workbook
      XLSX.utils.book_append_sheet(wb, battingWS, `Innings${inn.inningsNumber}_Batting`);
      XLSX.utils.book_append_sheet(wb, bowlingWS, `Innings${inn.inningsNumber}_Bowling`);
    });

    // Add match info sheet
    XLSX.utils.book_append_sheet(wb, matchInfoWS, 'Match_Info');

    // Set column widths for all sheets
    wb.SheetNames.forEach(sheetName => {
      const ws = wb.Sheets[sheetName];
      if (ws && ws['!ref']) {
        const range = XLSX.utils.decode_range(ws['!ref']);
        const colWidths = [];
        
        for (let col = range.s.c; col <= range.e.c; col++) {
          let maxWidth = 15; // Default width
          
          // Find the maximum content width in this column
          for (let row = range.s.r; row <= range.e.r; row++) {
            const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
            const cell = ws[cellRef];
            if (cell && cell.v) {
              const cellLength = String(cell.v).length;
              maxWidth = Math.max(maxWidth, Math.min(cellLength + 2, 50));
            }
          }
          
          colWidths.push({ width: maxWidth });
        }
        
        ws['!cols'] = colWidths;
      }
    });

    // Generate filename and save
    const filename = `WPL_Premium_Scorecard_${sc.matchInfo.team1.shortName || 'Team1'}_vs_${sc.matchInfo.team2.shortName || 'Team2'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
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
            
            {/* Published Scorecards Section */}
            {matches.some(match => scorecards.some(sc => sc.matchInfo?.matchId === match.id && sc.draft === false)) && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <h3 className="text-xl font-bold text-green-400">📢 Published Scorecards</h3>
                  <span className="text-sm text-gray-400">(Live and visible to public)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matches
                    .filter(match => scorecards.some(sc => sc.matchInfo?.matchId === match.id && sc.draft === false))
                    .map((match) => {
                      const scorecard = scorecards.find(sc => sc.matchInfo?.matchId === match.id);
                      return (
                        <button
                          key={match.id}
                          onClick={() => handleSelectMatch(match)}
                          className="p-6 rounded-lg bg-gradient-to-r from-green-900/30 to-emerald-900/30 hover:from-green-800/40 hover:to-emerald-800/40 transition text-left border-2 border-green-500/50 hover:border-green-400 shadow-lg shadow-green-500/20 relative overflow-hidden group"
                        >
                          {/* Published Badge */}
                          <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                            <span>📢</span>
                            <span>PUBLISHED</span>
                          </div>
                          
                          {/* Decorative gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          
                          <div className="relative z-10">
                            <div className="font-bold text-lg mb-2 text-green-300">
                              {match.team1.name} vs {match.team2.name}
                            </div>
                            <div className="text-sm text-gray-300">
                              📅 {match.date} • ⏰ {match.time}
                            </div>
                            <div className="text-sm text-gray-300">🏟️ {match.venue}</div>
                            {scorecard?.publishedAt && (
                              <div className="text-xs text-green-400 mt-2">
                                Published: {new Date(scorecard.publishedAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Draft Scorecards Section */}
            {matches.some(match => scorecards.some(sc => sc.matchInfo?.matchId === match.id && sc.draft !== false)) && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <h3 className="text-xl font-bold text-yellow-400">📝 Draft Scorecards</h3>
                  <span className="text-sm text-gray-400">(Saved but not published)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matches
                    .filter(match => scorecards.some(sc => sc.matchInfo?.matchId === match.id && sc.draft !== false))
                    .map((match) => {
                      const scorecard = scorecards.find(sc => sc.matchInfo?.matchId === match.id);
                      return (
                        <button
                          key={match.id}
                          onClick={() => handleSelectMatch(match)}
                          className="p-6 rounded-lg bg-gradient-to-r from-yellow-900/30 to-amber-900/30 hover:from-yellow-800/40 hover:to-amber-800/40 transition text-left border-2 border-yellow-500/50 hover:border-yellow-400 shadow-lg shadow-yellow-500/20 relative overflow-hidden group"
                        >
                          {/* Draft Badge */}
                          <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-500 text-black text-xs font-bold rounded-full flex items-center gap-1">
                            <span>📝</span>
                            <span>DRAFT</span>
                          </div>
                          
                          {/* Decorative gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          
                          <div className="relative z-10">
                            <div className="font-bold text-lg mb-2 text-yellow-300">
                              {match.team1.name} vs {match.team2.name}
                            </div>
                            <div className="text-sm text-gray-300">
                              📅 {match.date} • ⏰ {match.time}
                            </div>
                            <div className="text-sm text-gray-300">🏟️ {match.venue}</div>
                            {scorecard?.updatedAt && (
                              <div className="text-xs text-yellow-400 mt-2">
                                Last saved: {new Date(scorecard.updatedAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Matches without Scorecards */}
            {matches.some(match => !scorecards.some(sc => sc.matchInfo?.matchId === match.id)) && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  <h3 className="text-xl font-bold text-gray-400">🆕 New Matches</h3>
                  <span className="text-sm text-gray-500">(No scorecard created yet)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matches
                    .filter(match => !scorecards.some(sc => sc.matchInfo?.matchId === match.id))
                    .map((match) => (
                      <button
                        key={match.id}
                        onClick={() => handleSelectMatch(match)}
                        className="p-6 rounded-lg bg-gray-800 hover:bg-gray-700 transition text-left border border-gray-700 hover:border-blue-500 group"
                      >
                        <div className="font-bold text-lg mb-2 group-hover:text-blue-300 transition-colors">
                          {match.team1.name} vs {match.team2.name}
                        </div>
                        <div className="text-sm text-gray-400">
                          📅 {match.date} • ⏰ {match.time}
                        </div>
                        <div className="text-sm text-gray-400">🏟️ {match.venue}</div>
                        <div className="text-xs text-gray-500 mt-2">
                          Click to create scorecard
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Summary Stats */}
            <div className="mt-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-400">
                    {matches.filter(match => scorecards.some(sc => sc.matchInfo?.matchId === match.id && sc.draft === false)).length}
                  </div>
                  <div className="text-sm text-gray-400">Published</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-400">
                    {matches.filter(match => scorecards.some(sc => sc.matchInfo?.matchId === match.id && sc.draft !== false)).length}
                  </div>
                  <div className="text-sm text-gray-400">Drafts</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-400">
                    {matches.filter(match => !scorecards.some(sc => sc.matchInfo?.matchId === match.id)).length}
                  </div>
                  <div className="text-sm text-gray-400">New Matches</div>
                </div>
              </div>
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
                  {tab === 'innings1' && `🏏 ${
                    scorecard.innings[0].battingTeamId === scorecard.matchInfo.team1.id 
                      ? scorecard.matchInfo.team1.name 
                      : scorecard.matchInfo.team2.name
                  } Innings`}
                  {tab === 'innings2' && `🏏 ${
                    scorecard.innings[1].battingTeamId === scorecard.matchInfo.team1.id 
                      ? scorecard.matchInfo.team1.name 
                      : scorecard.matchInfo.team2.name
                  } Innings`}
                  {tab === 'result' && '🏆 Result'}
                </button>
              ))}
            </div>

            {/* Match Info Tab */}
            {activeTab === 'matchInfo' && (
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-6">Match Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Innings Batting Order Selection */}
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-400 mb-2">1st Innings Batting Team</label>
                    <select
                      value={scorecard.innings[0].battingTeamId}
                      onChange={(e) => {
                        const firstBattingTeamId = Number(e.target.value);
                        const secondBattingTeamId = firstBattingTeamId === scorecard.matchInfo.team1.id 
                          ? scorecard.matchInfo.team2.id 
                          : scorecard.matchInfo.team1.id;
                        
                        const updated = { ...scorecard };
                        updated.innings[0].battingTeamId = firstBattingTeamId;
                        updated.innings[1].battingTeamId = secondBattingTeamId;
                        setScorecard(updated);
                      }}
                      className="w-full bg-gray-700 p-3 rounded border border-gray-600 text-white"
                    >
                      <option value={scorecard.matchInfo.team1.id}>{scorecard.matchInfo.team1.name} (Team 1)</option>
                      <option value={scorecard.matchInfo.team2.id}>{scorecard.matchInfo.team2.name} (Team 2)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-2">
                      2nd Innings will automatically be assigned to: {
                        scorecard.innings[1].battingTeamId === scorecard.matchInfo.team1.id 
                          ? scorecard.matchInfo.team1.name 
                          : scorecard.matchInfo.team2.name
                      }
                    </p>
                  </div>

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
                                    <option value="retd-out">Retd Out</option>
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
                            <th className="text-center p-2">Overs</th>
                            <th className="text-center p-2">Runs</th>
                            <th className="text-center p-2">Wkts</th>
                            <th className="text-center p-2">Maidens</th>
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
                                  <input
                                    type="text"
                                    value={bowler.overs || ''}
                                    onChange={(e) => updateBowler(idx, 'overs', e.target.value)}
                                    placeholder="3.5"
                                    className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-white text-center text-sm"
                                  />
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
                                    value={bowler.maidens || ''}
                                    onChange={(e) => updateBowler(idx, 'maidens', e.target.value ? parseInt(e.target.value) : '')}
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

                {/* Display Calculated Totals */}
                {scorecard.innings[activeInnings].totalRuns !== undefined && (
                  <div className="mt-6 bg-gray-700 p-6 rounded-lg">
                    <h3 className="text-xl font-bold mb-4 text-green-400">Innings Totals</h3>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-white">{scorecard.innings[activeInnings].totalRuns || 0}</div>
                        <div className="text-sm text-gray-400 mt-1">Total Runs</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-white">{scorecard.innings[activeInnings].totalWickets || 0}</div>
                        <div className="text-sm text-gray-400 mt-1">Wickets</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-white">
                          {scorecard.innings[activeInnings].totalOvers || '0.0'}
                        </div>
                        <div className="text-sm text-gray-400 mt-1">Overs</div>
                      </div>
                    </div>
                    <div className="mt-4 text-center text-gray-300">
                      <span className="font-semibold text-lg">
                        {scorecard.innings[activeInnings].totalRuns || 0}/{Number(scorecard.innings[activeInnings].totalWickets) || 0}{' '}
                        {scorecard.innings[activeInnings].totalOvers && (
                          <span className="text-sm">({scorecard.innings[activeInnings].totalOvers} overs)</span>
                        )}
                      </span>
                    </div>
                  </div>
                )}
              )}

              {/* Fall of Wickets Section */}
              <div className="bg-gray-800 p-6 rounded-lg">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">Fall of Wickets</h3>
                  <button
                    onClick={() => {
                      const updated = { ...scorecard };
                      if (!updated.innings[activeInnings].fallOfWickets) {
                        updated.innings[activeInnings].fallOfWickets = [];
                      }
                      updated.innings[activeInnings].fallOfWickets.push({
                        player: '',
                        score: '',
                        over: ''
                      });
                      setScorecard(updated);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition"
                  >
                    + Add FOW
                  </button>
                </div>

                {(!scorecard.innings[activeInnings].fallOfWickets || scorecard.innings[activeInnings].fallOfWickets.length === 0) ? (
                  <p className="text-gray-400">No fall of wickets added yet</p>
                ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-600">
                            <th className="text-left p-2">Player</th>
                            <th className="text-center p-2">Score</th>
                            <th className="text-center p-2">Over</th>
                            <th className="text-center p-2">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(scorecard.innings[activeInnings].fallOfWickets || []).map((fow, idx) => (
                            <tr key={idx} className="border-b border-gray-700">
                              <td className="p-2">
                                <select
                                  value={fow.player}
                                  onChange={(e) => {
                                    const updated = { ...scorecard };
                                    updated.innings[activeInnings].fallOfWickets[idx].player = e.target.value;
                                    setScorecard(updated);
                                  }}
                                  className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-white"
                                >
                                  <option value="">Select Player</option>
                                  {getPlayersByTeam(scorecard.innings[activeInnings].battingTeamId).map(player => (
                                    <option key={player.id} value={player.name}>{player.name}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={fow.score}
                                  onChange={(e) => {
                                    const updated = { ...scorecard };
                                    updated.innings[activeInnings].fallOfWickets[idx].score = e.target.value;
                                    setScorecard(updated);
                                  }}
                                  placeholder="e.g., 40-1"
                                  className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-white text-center"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={fow.over}
                                  onChange={(e) => {
                                    const updated = { ...scorecard };
                                    updated.innings[activeInnings].fallOfWickets[idx].over = e.target.value;
                                    setScorecard(updated);
                                  }}
                                  placeholder="e.g., 3.5"
                                  className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-white text-center"
                                />
                              </td>
                              <td className="p-2 text-center">
                                <button
                                  onClick={() => {
                                    const updated = { ...scorecard };
                                    updated.innings[activeInnings].fallOfWickets.splice(idx, 1);
                                    setScorecard(updated);
                                  }}
                                  className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-sm transition"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Powerplays Section */}
                <div className="bg-gray-800 p-6 rounded-lg">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold">Powerplays</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Mandatory Powerplay</label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Overs</label>
                          <input
                            type="text"
                            value={getCurrentInnings().powerplays.mandatory.overs}
                            onChange={(e) => {
                              const updated = { ...scorecard };
                              if (!updated.innings[activeInnings].powerplays) {
                                updated.innings[activeInnings].powerplays = { mandatory: { overs: '', runs: 0 }, optional: { overs: '', runs: 0 } };
                              }
                              if (!updated.innings[activeInnings].powerplays.mandatory) {
                                updated.innings[activeInnings].powerplays.mandatory = { overs: '', runs: 0 };
                              }
                              updated.innings[activeInnings].powerplays.mandatory.overs = e.target.value;
                              setScorecard(updated);
                            }}
                            placeholder="e.g., 0.1 - 6"
                            className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Runs</label>
                          <input
                            type="number"
                            value={getCurrentInnings().powerplays.mandatory.runs}
                            onChange={(e) => {
                              const updated = { ...scorecard };
                              if (!updated.innings[activeInnings].powerplays) {
                                updated.innings[activeInnings].powerplays = { mandatory: { overs: '', runs: 0 }, optional: { overs: '', runs: 0 } };
                              }
                              if (!updated.innings[activeInnings].powerplays.mandatory) {
                                updated.innings[activeInnings].powerplays.mandatory = { overs: '', runs: 0 };
                              }
                              updated.innings[activeInnings].powerplays.mandatory.runs = e.target.value ? parseInt(e.target.value) : 0;
                              setScorecard(updated);
                            }}
                            placeholder="57"
                            className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-white"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Optional Powerplay</label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Overs</label>
                          <input
                            type="text"
                            value={scorecard.innings[activeInnings].powerplays.optional.overs}
                            onChange={(e) => {
                              const updated = { ...scorecard };
                              updated.innings[activeInnings].powerplays.optional.overs = e.target.value;
                              setScorecard(updated);
                            }}
                            placeholder="e.g., 16.1 - 19"
                            className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Runs</label>
                          <input
                            type="number"
                            value={scorecard.innings[activeInnings].powerplays.optional.runs}
                            onChange={(e) => {
                              const updated = { ...scorecard };
                              updated.innings[activeInnings].powerplays.optional.runs = e.target.value ? parseInt(e.target.value) : 0;
                              setScorecard(updated);
                            }}
                            placeholder="45"
                            className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Partnerships Section */}
                <div className="bg-gray-800 p-6 rounded-lg">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Partnerships</h3>
                    <button
                      onClick={() => {
                        const updated = { ...scorecard };
                        updated.innings[activeInnings].partnerships.push({
                          batsman1: '',
                          batsman1Runs: '',
                          batsman1Balls: '',
                          batsman2: '',
                          batsman2Runs: '',
                          batsman2Balls: '',
                          totalRuns: ''
                        });
                        setScorecard(updated);
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition"
                    >
                      + Add Partnership
                    </button>
                  </div>

                  {scorecard.innings[activeInnings].partnerships.length === 0 ? (
                    <p className="text-gray-400">No partnerships added yet</p>
                  ) : (
                    <div className="space-y-4">
                      {scorecard.innings[activeInnings].partnerships.map((partnership, idx) => (
                        <div key={idx} className="border border-gray-600 rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm text-gray-400 mb-2">Batsman 1</label>
                              <select
                                  value={partnership.batsman1}
                                  onChange={(e) => {
                                    const updated = { ...scorecard };
                                    updated.innings[activeInnings].partnerships[idx].batsman1 = e.target.value;
                                    setScorecard(updated);
                                  }}
                                  className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-white mb-2"
                                >
                                  <option value="">Select Player</option>
                                  {getPlayersByTeam(scorecard.innings[activeInnings].battingTeamId).map(player => (
                                    <option key={player.id} value={player.name}>{player.name}</option>
                                  ))}
                                </select>
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  value={partnership.batsman1Runs}
                                  onChange={(e) => {
                                    const updated = { ...scorecard };
                                    updated.innings[activeInnings].partnerships[idx].batsman1Runs = e.target.value;
                                    setScorecard(updated);
                                  }}
                                  placeholder="Runs"
                                  className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-white text-sm"
                                />
                                <input
                                  type="text"
                                  value={partnership.batsman1Balls}
                                  onChange={(e) => {
                                    const updated = { ...scorecard };
                                    updated.innings[activeInnings].partnerships[idx].batsman1Balls = e.target.value;
                                    setScorecard(updated);
                                  }}
                                  placeholder="Balls"
                                  className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-white text-sm"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm text-gray-400 mb-2">Batsman 2</label>
                              <select
                                value={partnership.batsman2}
                                onChange={(e) => {
                                  const updated = { ...scorecard };
                                  updated.innings[activeInnings].partnerships[idx].batsman2 = e.target.value;
                                  setScorecard(updated);
                                }}
                                className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-white mb-2"
                              >
                                <option value="">Select Player</option>
                                {getPlayersByTeam(scorecard.innings[activeInnings].battingTeamId).map(player => (
                                  <option key={player.id} value={player.name}>{player.name}</option>
                                ))}
                              </select>
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  value={partnership.batsman2Runs}
                                  onChange={(e) => {
                                    const updated = { ...scorecard };
                                    updated.innings[activeInnings].partnerships[idx].batsman2Runs = e.target.value;
                                    setScorecard(updated);
                                  }}
                                  placeholder="Runs"
                                  className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-white text-sm"
                                />
                                <input
                                  type="text"
                                  value={partnership.batsman2Balls}
                                  onChange={(e) => {
                                    const updated = { ...scorecard };
                                    updated.innings[activeInnings].partnerships[idx].batsman2Balls = e.target.value;
                                    setScorecard(updated);
                                  }}
                                  placeholder="Balls"
                                  className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-white text-sm"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm text-gray-400 mb-2">Total Partnership</label>
                              <input
                                type="text"
                                value={partnership.totalRuns}
                                onChange={(e) => {
                                  const updated = { ...scorecard };
                                  updated.innings[activeInnings].partnerships[idx].totalRuns = e.target.value;
                                  setScorecard(updated);
                                }}
                                placeholder="Total runs"
                                className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-white mb-2"
                              />
                              <button
                                onClick={() => {
                                  const updated = { ...scorecard };
                                  updated.innings[activeInnings].partnerships.splice(idx, 1);
                                  setScorecard(updated);
                                }}
                                className="w-full px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-sm transition"
                              >
                                Remove Partnership
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Result Tab */}
            {activeTab === 'result' && (
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-6">Match Result</h3>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Winning Team</label>
                    <select
                      value={scorecard.result?.winner || ''}
                      onChange={(e) => {
                        const updated = { ...scorecard };
                        updated.result = { ...updated.result, winner: e.target.value };
                        setScorecard(updated);
                      }}
                      className="w-full bg-gray-700 p-3 rounded border border-gray-600 text-white"
                    >
                      <option value="">Select Winning Team</option>
                      <option value={scorecard.matchInfo.team1.name}>{scorecard.matchInfo.team1.name}</option>
                      <option value={scorecard.matchInfo.team2.name}>{scorecard.matchInfo.team2.name}</option>
                      <option value="No Result">No Result</option>
                      <option value="Match Tied">Match Tied</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Margin</label>
                    <input
                      type="text"
                      value={scorecard.result?.margin || ''}
                      onChange={(e) => {
                        const updated = { ...scorecard };
                        updated.result = { ...updated.result, margin: e.target.value };
                        setScorecard(updated);
                      }}
                      placeholder="e.g., 3 wickets, 25 runs, Super Over"
                      className="w-full bg-gray-700 p-3 rounded border border-gray-600 text-white placeholder-gray-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter the margin of victory (e.g., 3 wickets, 25 runs)</p>
                  </div>
                  <div>
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
                      {/* Team 1 Players */}
                      <optgroup label={scorecard.matchInfo.team1.name}>
                        {getPlayersByTeam(scorecard.matchInfo.team1.id).map(player => (
                          <option key={player.id} value={player.name}>{player.name}</option>
                        ))}
                      </optgroup>
                      {/* Team 2 Players */}
                      <optgroup label={scorecard.matchInfo.team2.name}>
                        {getPlayersByTeam(scorecard.matchInfo.team2.id).map(player => (
                          <option key={player.id} value={player.name}>{player.name}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 flex gap-4 flex-wrap items-center">
              {scorecard.id && (
                <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  scorecard.draft === false 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/40' 
                    : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                }`}>
                  {scorecard.draft === false ? '✓ Published' : '📝 Draft'}
                </div>
              )}
              <button
                onClick={handleSaveScorecard}
                disabled={saving}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded font-bold transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : '💾 Save Scorecard'}
              </button>
              {scorecard.id && scorecard.draft !== false && (
                <button
                  onClick={handlePublishScorecard}
                  disabled={saving}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded font-bold transition disabled:opacity-50"
                >
                  {saving ? 'Publishing...' : '🚀 Publish Scorecard'}
                </button>
              )}
              {/* Export Buttons (client-side CSV/JSON) */}
              <button
                onClick={async () => {
                  if (!scorecard) return;
                  try {
                    const csv = buildScorecardCSV(scorecard);
                    downloadFile(csv, `scorecard_${scorecard.matchId || 'unknown'}.csv`, 'text/csv');
                  } catch (e) {
                    console.error('Export CSV error', e);
                    setMessage('✗ Error exporting CSV');
                    setTimeout(() => setMessage(''), 3000);
                  }
                }}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-500 rounded font-bold transition"
              >
                📥 Export CSV
              </button>
              <button
                onClick={async () => {
                  if (!scorecard) return;
                  try {
                    const json = JSON.stringify(scorecard, null, 2);
                    downloadFile(json, `scorecard_${scorecard.matchId || 'unknown'}.json`, 'application/json');
                  } catch (e) {
                    console.error('Export JSON error', e);
                    setMessage('✗ Error exporting JSON');
                    setTimeout(() => setMessage(''), 3000);
                  }
                }}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-500 rounded font-bold transition"
              >
                📥 Export JSON
              </button>
              <button
                onClick={async () => {
                  if (!scorecard) return;
                  setMessage('');
                  try {
                    await loadJSPDF();
                    await exportScorecardPDF(scorecard);
                  } catch (e) {
                    console.error('Export PDF error', e);
                    setMessage('✗ Error exporting PDF');
                    setTimeout(() => setMessage(''), 3000);
                  }
                }}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-500 rounded font-bold transition"
              >
                📥 Export PDF
              </button>
              <button
                onClick={async () => {
                  if (!scorecard) return;
                  setMessage('');
                  try {
                    await loadSheetJS();
                    await exportScorecardExcel(scorecard);
                  } catch (e) {
                    console.error('Export Excel error', e);
                    setMessage('✗ Error exporting Excel');
                    setTimeout(() => setMessage(''), 3000);
                  }
                }}
                className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded font-bold transition"
              >
                📊 Export Excel
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
