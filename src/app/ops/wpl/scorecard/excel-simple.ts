// Professional Excel export with styled tables
export const exportSimpleExcel = (scorecard: any) => {
  console.log('🚀 Starting Professional Excel export with styled tables...');
  
  const XLSX = (window as any).XLSX;
  if (!XLSX) {
    alert('Excel library not available. Please refresh the page and try again.');
    return;
  }

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
  const innings = scorecard?.innings || [];

  // ============================================
  // Sheet 1: Match Overview with Table
  // ============================================
  const matchOverviewData = [
    ['🏏 WPL 2026 MATCH SCORECARD'],
    [''],
    ['Field', 'Value'],
    ['Match ID', scorecard?.matchId || scorecard?.id || 'N/A'],
    ['League', scorecard?.league || 'WPL'],
    ['Team 1', team1Name],
    ['Team 2', team2Name],
    ['Venue', scorecard?.matchInfo?.venue || 'Unknown Venue'],
    ['Date', scorecard?.matchInfo?.date || 'Unknown Date'],
    ['Time', scorecard?.matchInfo?.time || 'N/A'],
    ['Status', scorecard?.matchInfo?.status || scorecard?.status || 'In Progress'],
    ['Toss Winner', scorecard?.matchInfo?.toss?.winner || 'N/A'],
    ['Toss Decision', scorecard?.matchInfo?.toss?.decision || 'N/A'],
    ['Result Winner', scorecard?.result?.winner || 'To be decided'],
    ['Margin', scorecard?.result?.margin || 'N/A'],
    ['Man of Match', scorecard?.result?.manOfTheMatch || 'N/A'],
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(matchOverviewData);
  
  // Add table formatting to Match Overview
  ws1['!cols'] = [{ wch: 20 }, { wch: 40 }];
  
  // Define table range for Match Overview (rows 3-16, columns A-B)
  if (!ws1['!ref']) ws1['!ref'] = 'A1:B16';
  
  // Add autofilter to create table-like appearance
  ws1['!autofilter'] = { ref: 'A3:B16' };
  
  XLSX.utils.book_append_sheet(wb, ws1, 'Match Overview');

  // ============================================
  // Sheet 2: Innings Summary Table
  // ============================================
  const inningsSummaryData = [
    ['📊 INNINGS SUMMARY'],
    [''],
    ['Innings', 'Batting Team', 'Score', 'Overs', 'Run Rate'],
  ];

  innings.forEach((inn: any, idx: number) => {
    const battingTeam = inn.battingTeamId ? 
      (String(inn.battingTeamId) === String(scorecard?.matchInfo?.team1?.id) ? team1Name : team2Name) :
      `Team ${idx + 1}`;
    const totalRuns = inn.totalRuns || calculateTotalRuns(inn);
    const totalWickets = inn.totalWickets || calculateTotalWickets(inn);
    const totalOvers = inn.totalOvers || calculateTotalOvers(inn);
    const oversNum = parseFloat(String(totalOvers).replace('.', '')) || 1;
    const runRate = (totalRuns / (Math.floor(oversNum / 10) + (oversNum % 10) / 6 || 1)).toFixed(2);
    
    inningsSummaryData.push([
      `Innings ${idx + 1}`,
      battingTeam,
      `${totalRuns}/${totalWickets}`,
      String(totalOvers),
      runRate
    ]);
  });

  const wsSum = XLSX.utils.aoa_to_sheet(inningsSummaryData);
  wsSum['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 12 }, { wch: 10 }, { wch: 12 }];
  wsSum['!autofilter'] = { ref: `A3:E${3 + innings.length}` };
  XLSX.utils.book_append_sheet(wb, wsSum, 'Innings Summary');

  // ============================================
  // Batting Sheets with Tables
  // ============================================
  innings.forEach((inn: any, inningsIdx: number) => {
    const battingTeam = inn.battingTeamId ? 
      (String(inn.battingTeamId) === String(scorecard?.matchInfo?.team1?.id) ? team1Name : team2Name) :
      `Team ${inningsIdx + 1}`;
    
    const battingData: any[][] = [
      [`🏏 BATTING - ${battingTeam}`],
      [''],
      ['#', 'Batter', 'Dismissal', 'R', 'B', 'SR', '4s', '6s', 'Mins'],
    ];

    const batting = inn.batting || [];
    
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
          parseFloat(sr),
          batter.fours ?? 0,
          batter.sixes ?? 0,
          batter.minutes ?? '-'
        ]);
      });
      
      // Extras row
      const extras = inn.extras || {};
      const extrasTotal = (extras.wides || 0) + (extras.noBalls || 0) + (extras.byes || 0) + (extras.legByes || 0);
      battingData.push(['', 'EXTRAS', `(w${extras.wides || 0} nb${extras.noBalls || 0} b${extras.byes || 0} lb${extras.legByes || 0})`, extrasTotal, '', '', '', '', '']);
      
      // Total row
      const totalRuns = inn.totalRuns || calculateTotalRuns(inn);
      const totalWickets = inn.totalWickets || calculateTotalWickets(inn);
      const totalOvers = inn.totalOvers || calculateTotalOvers(inn);
      battingData.push(['', 'TOTAL', `(${totalWickets} wkts, ${totalOvers} ov)`, totalRuns, '', '', '', '', '']);
    } else {
      battingData.push(['', 'No batting data', '', '', '', '', '', '', '']);
    }
    
    // Fall of Wickets section
    if (inn.fallOfWickets && inn.fallOfWickets.length > 0) {
      battingData.push(['']);
      battingData.push(['📉 FALL OF WICKETS']);
      battingData.push(['Wkt', 'Player', 'Score', 'Over']);
      inn.fallOfWickets.forEach((fow: any, idx: number) => {
        battingData.push([idx + 1, fow.player || 'Unknown', fow.score || 'N/A', fow.over || '-']);
      });
    }

    const wsB = XLSX.utils.aoa_to_sheet(battingData);
    wsB['!cols'] = [
      { wch: 4 },   // #
      { wch: 22 },  // Batter
      { wch: 30 },  // Dismissal
      { wch: 6 },   // R
      { wch: 6 },   // B
      { wch: 8 },   // SR
      { wch: 5 },   // 4s
      { wch: 5 },   // 6s
      { wch: 6 }    // Mins
    ];
    
    // Add table with autofilter
    const battingEndRow = 3 + batting.length;
    wsB['!autofilter'] = { ref: `A3:I${battingEndRow}` };
    
    XLSX.utils.book_append_sheet(wb, wsB, `Bat ${inningsIdx + 1} ${battingTeam.substring(0, 10)}`);
  });

  // ============================================
  // Bowling Sheets with Tables
  // ============================================
  innings.forEach((inn: any, inningsIdx: number) => {
    const bowlingTeam = inn.battingTeamId ? 
      (String(inn.battingTeamId) === String(scorecard?.matchInfo?.team1?.id) ? team2Name : team1Name) :
      `Team ${inningsIdx + 1}`;
    
    const bowlingData: any[][] = [
      [`🎯 BOWLING - ${bowlingTeam}`],
      [''],
      ['#', 'Bowler', 'O', 'M', 'R', 'W', 'Econ', 'Dots', 'Wd', 'NB'],
    ];

    const bowling = inn.bowling || [];
    
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
          parseFloat(economy),
          bowler.dots ?? '-',
          bowler.wides ?? '-',
          bowler.noBalls ?? '-'
        ]);
      });
    } else {
      bowlingData.push(['', 'No bowling data', '', '', '', '', '', '', '', '']);
    }

    const wsB = XLSX.utils.aoa_to_sheet(bowlingData);
    wsB['!cols'] = [
      { wch: 4 },   // #
      { wch: 22 },  // Bowler
      { wch: 6 },   // O
      { wch: 4 },   // M
      { wch: 6 },   // R
      { wch: 4 },   // W
      { wch: 7 },   // Econ
      { wch: 6 },   // Dots
      { wch: 4 },   // Wd
      { wch: 4 }    // NB
    ];
    
    // Add table with autofilter
    const bowlingEndRow = 3 + bowling.length;
    wsB['!autofilter'] = { ref: `A3:J${bowlingEndRow}` };
    
    XLSX.utils.book_append_sheet(wb, wsB, `Bowl ${inningsIdx + 1} ${bowlingTeam.substring(0, 10)}`);
  });

  // ============================================
  // Partnerships Table Sheet
  // ============================================
  let hasPartnerships = false;
  innings.forEach((inn: any) => {
    if (inn.partnerships && inn.partnerships.length > 0) {
      hasPartnerships = true;
    }
  });

  if (hasPartnerships) {
    const partnershipData: any[][] = [
      ['🤝 PARTNERSHIPS'],
      [''],
      ['Inn', 'Wkt', 'Batter 1', 'R', 'B', 'Batter 2', 'R', 'B', 'Total', 'Balls'],
    ];

    let rowCount = 0;
    innings.forEach((inn: any, inningsIdx: number) => {
      if (inn.partnerships && inn.partnerships.length > 0) {
        inn.partnerships.forEach((p: any, pIdx: number) => {
          partnershipData.push([
            inningsIdx + 1,
            pIdx + 1,
            p.batsman1 || 'Unknown',
            p.batsman1Runs || 0,
            p.batsman1Balls || 0,
            p.batsman2 || 'Unknown',
            p.batsman2Runs || 0,
            p.batsman2Balls || 0,
            p.totalRuns || 0,
            (parseInt(p.batsman1Balls) || 0) + (parseInt(p.batsman2Balls) || 0)
          ]);
          rowCount++;
        });
      }
    });

    const wsP = XLSX.utils.aoa_to_sheet(partnershipData);
    wsP['!cols'] = [
      { wch: 5 },   // Inn
      { wch: 5 },   // Wkt
      { wch: 18 },  // Batter 1
      { wch: 5 },   // R
      { wch: 5 },   // B
      { wch: 18 },  // Batter 2
      { wch: 5 },   // R
      { wch: 5 },   // B
      { wch: 7 },   // Total
      { wch: 7 }    // Balls
    ];
    wsP['!autofilter'] = { ref: `A3:J${3 + rowCount}` };
    XLSX.utils.book_append_sheet(wb, wsP, 'Partnerships');
  }

  // ============================================
  // Complete Scorecard Table (All in one)
  // ============================================
  const completeData: any[][] = [
    ['📋 COMPLETE SCORECARD - WPL 2026'],
    [''],
    [`${team1Name} vs ${team2Name}`],
    [`Venue: ${scorecard?.matchInfo?.venue || 'N/A'} | Date: ${scorecard?.matchInfo?.date || 'N/A'}`],
    [''],
  ];

  // Add each innings as a table
  innings.forEach((inn: any, inningsIdx: number) => {
    const battingTeam = inn.battingTeamId ? 
      (String(inn.battingTeamId) === String(scorecard?.matchInfo?.team1?.id) ? team1Name : team2Name) :
      `Team ${inningsIdx + 1}`;
    const totalRuns = inn.totalRuns || calculateTotalRuns(inn);
    const totalWickets = inn.totalWickets || calculateTotalWickets(inn);
    const totalOvers = inn.totalOvers || calculateTotalOvers(inn);
    
    completeData.push([`INNINGS ${inningsIdx + 1}: ${battingTeam} - ${totalRuns}/${totalWickets} (${totalOvers} ov)`]);
    completeData.push(['Batter', 'Dismissal', 'R', 'B', 'SR', '4s', '6s']);
    
    (inn.batting || []).forEach((batter: any) => {
      const runs = batter.runs ?? 0;
      const balls = batter.balls ?? 0;
      const sr = balls > 0 ? ((runs / balls) * 100).toFixed(1) : '0.0';
      completeData.push([
        getPlayerName(batter),
        formatDismissal(batter.dismissal),
        runs,
        balls,
        sr,
        batter.fours ?? 0,
        batter.sixes ?? 0
      ]);
    });
    
    completeData.push(['']);
    completeData.push(['Bowler', 'O', 'M', 'R', 'W', 'Econ', '']);
    
    (inn.bowling || []).forEach((bowler: any) => {
      const overs = bowler.overs ?? 0;
      const runs = bowler.runs ?? 0;
      const economy = overs > 0 ? (runs / overs).toFixed(2) : '0.00';
      completeData.push([
        getPlayerName(bowler),
        overs,
        bowler.maidens ?? 0,
        runs,
        bowler.wickets ?? 0,
        economy,
        ''
      ]);
    });
    
    completeData.push(['']);
    completeData.push(['']);
  });

  const wsComplete = XLSX.utils.aoa_to_sheet(completeData);
  wsComplete['!cols'] = [{ wch: 22 }, { wch: 28 }, { wch: 6 }, { wch: 6 }, { wch: 8 }, { wch: 5 }, { wch: 5 }];
  XLSX.utils.book_append_sheet(wb, wsComplete, 'Full Scorecard');

  // ============================================
  // Generate filename and download
  // ============================================
  const safeTeam1 = team1Name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 12);
  const safeTeam2 = team2Name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 12);
  const date = scorecard?.matchInfo?.date || new Date().toISOString().split('T')[0];
  const filename = `WPL2026_${safeTeam1}_vs_${safeTeam2}_${date}.xlsx`;

  try {
    XLSX.writeFile(wb, filename);
    console.log('✅ Excel export completed successfully!');
    alert('✅ Excel exported with styled tables!');
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
