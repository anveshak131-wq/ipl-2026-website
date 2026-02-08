// Comprehensive Excel export with proper data extraction
export const exportSimpleExcel = (scorecard: any) => {
  console.log('🚀 Starting Excel export...');
  console.log('📊 Received scorecard:', JSON.stringify(scorecard, null, 2).substring(0, 1000));
  
  const XLSX = (window as any).XLSX;
  if (!XLSX) {
    alert('Excel library not available. Please refresh the page and try again.');
    return;
  }

  // Debug: Log the scorecard structure
  console.log('📊 Scorecard structure:', {
    hasScorecard: !!scorecard,
    hasMatchInfo: !!scorecard?.matchInfo,
    hasInnings: !!scorecard?.innings,
    inningsCount: scorecard?.innings?.length || 0,
    team1: scorecard?.matchInfo?.team1,
    team2: scorecard?.matchInfo?.team2,
  });

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Helper function to safely get team name
  const getTeamName = (team: any): string => {
    if (!team) return 'Unknown Team';
    if (typeof team === 'string') return team;
    return team.name || team.shortName || `Team ${team.id}` || 'Unknown Team';
  };

  // Helper function to safely get player name
  const getPlayerName = (player: any): string => {
    if (!player) return 'Unknown';
    if (typeof player === 'string') return player;
    return player.name || player.playerId || 'Unknown';
  };

  // Get team names
  const team1Name = getTeamName(scorecard?.matchInfo?.team1);
  const team2Name = getTeamName(scorecard?.matchInfo?.team2);

  // ============================================
  // Sheet 1: Match Overview
  // ============================================
  const matchData: any[][] = [
    ['WPL 2026 MATCH SCORECARD'],
    [''],
    ['MATCH INFORMATION'],
    ['Match ID', scorecard?.matchId || scorecard?.id || 'N/A'],
    ['League', scorecard?.league || 'WPL'],
    ['Team 1', team1Name],
    ['Team 2', team2Name],
    ['Venue', scorecard?.matchInfo?.venue || 'Unknown Venue'],
    ['Date', scorecard?.matchInfo?.date || 'Unknown Date'],
    ['Time', scorecard?.matchInfo?.time || 'N/A'],
    ['Status', scorecard?.matchInfo?.status || scorecard?.status || 'In Progress'],
    [''],
    ['TOSS'],
    ['Winner', scorecard?.matchInfo?.toss?.winner || 'N/A'],
    ['Decision', scorecard?.matchInfo?.toss?.decision || 'N/A'],
    [''],
    ['RESULT'],
    ['Winner', scorecard?.result?.winner || 'To be decided'],
    ['Margin', scorecard?.result?.margin || 'N/A'],
    ['Man of the Match', scorecard?.result?.manOfTheMatch || 'N/A'],
    [''],
    ['INNINGS SUMMARY'],
  ];

  // Add innings summary
  const innings = scorecard?.innings || [];
  if (innings.length > 0) {
    innings.forEach((inn: any, idx: number) => {
      const battingTeam = inn.battingTeamId ? 
        (String(inn.battingTeamId) === String(scorecard?.matchInfo?.team1?.id) ? team1Name : team2Name) :
        `Innings ${idx + 1}`;
      matchData.push([
        `Innings ${idx + 1}`,
        battingTeam,
        `${inn.totalRuns || calculateTotalRuns(inn)}/${inn.totalWickets || calculateTotalWickets(inn)}`,
        `(${inn.totalOvers || calculateTotalOvers(inn)} ov)`
      ]);
    });
  } else {
    matchData.push(['No innings data available']);
  }
  
  const ws1 = XLSX.utils.aoa_to_sheet(matchData);
  // Set column widths
  ws1['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'Match Overview');

  // ============================================
  // Sheet 2 & 3: Batting for each innings
  // ============================================
  innings.forEach((inn: any, inningsIdx: number) => {
    const battingTeam = inn.battingTeamId ? 
      (String(inn.battingTeamId) === String(scorecard?.matchInfo?.team1?.id) ? team1Name : team2Name) :
      `Innings ${inningsIdx + 1}`;
    
    const battingData: any[][] = [
      [`BATTING - ${battingTeam} (Innings ${inningsIdx + 1})`],
      [''],
      ['#', 'Player', 'Dismissal', 'Runs', 'Balls', 'SR', '4s', '6s', 'Minutes']
    ];

    const batting = inn.batting || [];
    console.log(`📊 Innings ${inningsIdx + 1} batting:`, batting.length, 'batters');
    
    if (batting.length > 0) {
      batting.forEach((batter: any, idx: number) => {
        const runs = batter.runs ?? 0;
        const balls = batter.balls ?? 0;
        const sr = balls > 0 ? ((runs / balls) * 100).toFixed(2) : '0.00';
        const dismissalText = formatDismissal(batter.dismissal);
        
        battingData.push([
          idx + 1,
          getPlayerName(batter),
          dismissalText,
          runs,
          balls,
          sr,
          batter.fours ?? 0,
          batter.sixes ?? 0,
          batter.minutes ?? ''
        ]);
      });
      
      // Add extras
      const extras = inn.extras || {};
      const extrasTotal = (extras.wides || 0) + (extras.noBalls || 0) + (extras.byes || 0) + (extras.legByes || 0);
      battingData.push(['']);
      battingData.push(['', 'Extras', `(w ${extras.wides || 0}, nb ${extras.noBalls || 0}, b ${extras.byes || 0}, lb ${extras.legByes || 0})`, extrasTotal]);
      
      // Add total
      const totalRuns = inn.totalRuns || calculateTotalRuns(inn);
      const totalWickets = inn.totalWickets || calculateTotalWickets(inn);
      const totalOvers = inn.totalOvers || calculateTotalOvers(inn);
      battingData.push(['', 'TOTAL', `(${totalWickets} wkts, ${totalOvers} ov)`, totalRuns]);
    } else {
      battingData.push(['', 'No batting data available']);
    }
    
    // Add Fall of Wickets if available
    if (inn.fallOfWickets && inn.fallOfWickets.length > 0) {
      battingData.push(['']);
      battingData.push(['FALL OF WICKETS']);
      inn.fallOfWickets.forEach((fow: any, idx: number) => {
        battingData.push([
          `${idx + 1}`,
          fow.player || 'Unknown',
          fow.score || 'N/A',
          fow.over ? `(${fow.over} ov)` : ''
        ]);
      });
    }

    const wsB = XLSX.utils.aoa_to_sheet(battingData);
    wsB['!cols'] = [{ wch: 5 }, { wch: 25 }, { wch: 35 }, { wch: 8 }, { wch: 8 }, { wch: 10 }, { wch: 5 }, { wch: 5 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, wsB, `Batting Inn ${inningsIdx + 1}`);
  });

  // ============================================
  // Sheet 4 & 5: Bowling for each innings
  // ============================================
  innings.forEach((inn: any, inningsIdx: number) => {
    const bowlingTeam = inn.battingTeamId ? 
      (String(inn.battingTeamId) === String(scorecard?.matchInfo?.team1?.id) ? team2Name : team1Name) :
      `Bowling ${inningsIdx + 1}`;
    
    const bowlingData: any[][] = [
      [`BOWLING - ${bowlingTeam} (Innings ${inningsIdx + 1})`],
      [''],
      ['#', 'Bowler', 'Overs', 'Maidens', 'Runs', 'Wickets', 'Economy', 'Dots', 'Wides', 'No Balls']
    ];

    const bowling = inn.bowling || [];
    console.log(`📊 Innings ${inningsIdx + 1} bowling:`, bowling.length, 'bowlers');
    
    if (bowling.length > 0) {
      bowling.forEach((bowler: any, idx: number) => {
        const overs = bowler.overs ?? 0;
        const runs = bowler.runs ?? 0;
        const economy = overs > 0 ? (runs / overs).toFixed(2) : '0.00';
        
        bowlingData.push([
          idx + 1,
          getPlayerName(bowler),
          overs,
          bowler.maidens ?? 0,
          runs,
          bowler.wickets ?? 0,
          economy,
          bowler.dots ?? '',
          bowler.wides ?? '',
          bowler.noBalls ?? ''
        ]);
      });
    } else {
      bowlingData.push(['', 'No bowling data available']);
    }

    const wsB = XLSX.utils.aoa_to_sheet(bowlingData);
    wsB['!cols'] = [{ wch: 5 }, { wch: 25 }, { wch: 8 }, { wch: 10 }, { wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 8 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, wsB, `Bowling Inn ${inningsIdx + 1}`);
  });

  // ============================================
  // Sheet: Partnerships (if available)
  // ============================================
  let hasPartnerships = false;
  innings.forEach((inn: any) => {
    if (inn.partnerships && inn.partnerships.length > 0) {
      hasPartnerships = true;
    }
  });

  if (hasPartnerships) {
    const partnershipData: any[][] = [
      ['PARTNERSHIPS'],
      [''],
      ['Innings', 'Batter 1', 'Runs', 'Balls', 'Batter 2', 'Runs', 'Balls', 'Total']
    ];

    innings.forEach((inn: any, inningsIdx: number) => {
      if (inn.partnerships && inn.partnerships.length > 0) {
        partnershipData.push([`--- Innings ${inningsIdx + 1} ---`]);
        inn.partnerships.forEach((p: any) => {
          partnershipData.push([
            '',
            p.batsman1 || 'Unknown',
            p.batsman1Runs || 0,
            p.batsman1Balls || 0,
            p.batsman2 || 'Unknown',
            p.batsman2Runs || 0,
            p.batsman2Balls || 0,
            p.totalRuns || 0
          ]);
        });
      }
    });

    const wsP = XLSX.utils.aoa_to_sheet(partnershipData);
    wsP['!cols'] = [{ wch: 12 }, { wch: 20 }, { wch: 8 }, { wch: 8 }, { wch: 20 }, { wch: 8 }, { wch: 8 }, { wch: 8 }];
    XLSX.utils.book_append_sheet(wb, wsP, 'Partnerships');
  }

  // ============================================
  // Generate filename and download
  // ============================================
  const safeTeam1 = team1Name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15);
  const safeTeam2 = team2Name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15);
  const date = scorecard?.matchInfo?.date || new Date().toISOString().split('T')[0];
  const filename = `WPL2026_${safeTeam1}_vs_${safeTeam2}_${date}.xlsx`;

  try {
    XLSX.writeFile(wb, filename);
    console.log('✅ Excel export completed successfully!');
    alert('✅ Excel exported successfully!');
  } catch (writeError) {
    console.error('❌ Error writing Excel file:', writeError);
    alert(`Error saving Excel file: ${writeError instanceof Error ? writeError.message : 'Unknown error'}`);
  }
};

// Helper function to format dismissal
function formatDismissal(dismissal: any): string {
  if (!dismissal) return 'not out';
  if (typeof dismissal === 'string') return dismissal;
  
  const type = dismissal.type || '';
  const details = dismissal.details || '';
  
  if (details) return details;
  
  switch (type.toLowerCase()) {
    case 'bowled':
      return `b ${dismissal.bowlerId || ''}`.trim();
    case 'caught':
      return `c ${dismissal.fielderId || ''} b ${dismissal.bowlerId || ''}`.trim();
    case 'lbw':
      return `lbw b ${dismissal.bowlerId || ''}`.trim();
    case 'run out':
      return `run out (${dismissal.fielderId || ''})`.trim();
    case 'stumped':
      return `st ${dismissal.fielderId || ''} b ${dismissal.bowlerId || ''}`.trim();
    case 'hit wicket':
      return 'hit wicket';
    case 'retired hurt':
      return 'retired hurt';
    case 'not out':
      return 'not out';
    default:
      return type || 'not out';
  }
}

// Helper function to calculate total runs from batting
function calculateTotalRuns(innings: any): number {
  if (!innings) return 0;
  const battingRuns = (innings.batting || []).reduce((sum: number, b: any) => sum + (b.runs || 0), 0);
  const extras = innings.extras || {};
  const extrasTotal = (extras.wides || 0) + (extras.noBalls || 0) + (extras.byes || 0) + (extras.legByes || 0);
  return battingRuns + extrasTotal;
}

// Helper function to calculate total wickets
function calculateTotalWickets(innings: any): number {
  if (!innings || !innings.batting) return 0;
  return innings.batting.filter((b: any) => b.dismissal && b.dismissal.type && b.dismissal.type.toLowerCase() !== 'not out').length;
}

// Helper function to calculate total overs from bowling
function calculateTotalOvers(innings: any): string {
  if (!innings || !innings.bowling) return '0';
  const totalBalls = (innings.bowling || []).reduce((sum: number, b: any) => {
    const overs = b.overs || 0;
    const fullOvers = Math.floor(overs);
    const balls = Math.round((overs - fullOvers) * 10);
    return sum + (fullOvers * 6) + balls;
  }, 0);
  const overs = Math.floor(totalBalls / 6);
  const balls = totalBalls % 6;
  return balls > 0 ? `${overs}.${balls}` : `${overs}`;
}
