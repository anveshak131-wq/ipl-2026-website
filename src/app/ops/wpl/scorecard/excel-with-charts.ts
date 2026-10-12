// Excel Export with 10+ Charts using ExcelJS
// Charts: Runs, Wickets, Strike Rate, Economy, Boundaries, Run Rate, Top Scorers, etc.

export const exportExcelWithCharts = async (scorecard: any) => {
  console.log('🚀 Starting Excel export with charts...');
  
  const ExcelJS = (window as any).ExcelJS;
  if (!ExcelJS) {
    alert('ExcelJS library not available. Please refresh and try again.');
    return;
  }

  // Create workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'WPL 2026 Admin';
  workbook.created = new Date();

  // Helper functions
  const getTeamName = (team: any): string => {
    if (!team) return 'Unknown Team';
    if (typeof team === 'string') return team;
    return team.name || team.shortName || `Team ${team.id}` || 'Unknown Team';
  };

  const getPlayerName = (player: any): string => {
    if (!player) return 'Unknown';
    if (typeof player === 'string') return player;
    return player.name || player.playerId || 'Unknown';
  };

  // Get team names
  const team1Name = getTeamName(scorecard?.matchInfo?.team1);
  const team2Name = getTeamName(scorecard?.matchInfo?.team2);
  const innings = scorecard?.innings || [];

  // Color palette for charts
  const colors = {
    primary: 'FF6B35',
    secondary: '004E89',
    success: '10B981',
    warning: 'F59E0B',
    danger: 'EF4444',
    purple: '8B5CF6',
    pink: 'EC4899',
    cyan: '06B6D4',
    orange: 'F97316',
    lime: '84CC16',
    indigo: '6366F1',
    teal: '14B8A6'
  };

  // ============================================
  // SHEET 1: Match Overview
  // ============================================
  const overviewSheet = workbook.addWorksheet('Match Overview', {
    properties: { tabColor: { argb: 'FF6B35' } }
  });

  // Title
  overviewSheet.mergeCells('A1:F1');
  const titleCell = overviewSheet.getCell('A1');
  titleCell.value = '🏏 WPL 2026 MATCH SCORECARD';
  titleCell.font = { size: 20, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6B35' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  overviewSheet.getRow(1).height = 40;

  // Match Info Table
  const matchInfoData = [
    ['Field', 'Value'],
    ['Match ID', scorecard?.matchId || scorecard?.id || 'N/A'],
    ['Team 1', team1Name],
    ['Team 2', team2Name],
    ['Venue', scorecard?.matchInfo?.venue || 'Unknown'],
    ['Date', scorecard?.matchInfo?.date || 'Unknown'],
    ['Time', scorecard?.matchInfo?.time || 'N/A'],
    ['Toss Winner', scorecard?.matchInfo?.toss?.winner || 'N/A'],
    ['Toss Decision', scorecard?.matchInfo?.toss?.decision || 'N/A'],
    ['Result', scorecard?.result?.winner ? `${scorecard.result.winner} won by ${scorecard.result.margin || 'N/A'}` : 'TBD'],
    ['Man of Match', scorecard?.result?.manOfTheMatch || 'N/A'],
  ];

  matchInfoData.forEach((row, idx) => {
    const rowNum = idx + 3;
    overviewSheet.getCell(`A${rowNum}`).value = row[0];
    overviewSheet.getCell(`B${rowNum}`).value = row[1];
    
    if (idx === 0) {
      // Header row
      overviewSheet.getCell(`A${rowNum}`).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      overviewSheet.getCell(`B${rowNum}`).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      overviewSheet.getCell(`A${rowNum}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '004E89' } };
      overviewSheet.getCell(`B${rowNum}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '004E89' } };
    } else {
      overviewSheet.getCell(`A${rowNum}`).font = { bold: true };
      overviewSheet.getRow(rowNum).fill = { 
        type: 'pattern', 
        pattern: 'solid', 
        fgColor: { argb: idx % 2 === 0 ? 'FFF3F4F6' : 'FFFFFFFF' } 
      };
    }
  });

  overviewSheet.columns = [{ width: 20 }, { width: 40 }];

  // ============================================
  // SHEET 2: Batting Analysis with Charts Data
  // ============================================
  const battingSheet = workbook.addWorksheet('Batting Analysis', {
    properties: { tabColor: { argb: '10B981' } }
  });

  // Title
  battingSheet.mergeCells('A1:J1');
  const batTitleCell = battingSheet.getCell('A1');
  batTitleCell.value = '🏏 BATTING PERFORMANCE ANALYSIS';
  batTitleCell.font = { size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
  batTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '10B981' } };
  batTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  battingSheet.getRow(1).height = 35;

  // Batting data for all innings
  let battingRow = 3;
  const allBatters: any[] = [];

  innings.forEach((inn: any, inningsIdx: number) => {
    const battingTeam = inn.battingTeamId ? 
      (String(inn.battingTeamId) === String(scorecard?.matchInfo?.team1?.id) ? team1Name : team2Name) :
      `Team ${inningsIdx + 1}`;

    // Innings header
    battingSheet.mergeCells(`A${battingRow}:J${battingRow}`);
    const innHeader = battingSheet.getCell(`A${battingRow}`);
    innHeader.value = `📊 INNINGS ${inningsIdx + 1}: ${battingTeam}`;
    innHeader.font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    innHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '6366F1' } };
    battingRow++;

    // Column headers
    const headers = ['#', 'Batter', 'Dismissal', 'Runs', 'Balls', 'SR', '4s', '6s', 'Boundary%', 'Contribution%'];
    headers.forEach((h, i) => {
      const cell = battingSheet.getCell(battingRow, i + 1);
      cell.value = h;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '374151' } };
      cell.alignment = { horizontal: 'center' };
    });
    battingRow++;

    const batting = inn.batting || [];
    const totalRuns = inn.totalRuns || batting.reduce((s: number, b: any) => s + (b.runs || 0), 0) || 1;

    batting.forEach((batter: any, idx: number) => {
      const runs = batter.runs ?? 0;
      const balls = batter.balls ?? 0;
      const fours = batter.fours ?? 0;
      const sixes = batter.sixes ?? 0;
      const sr = balls > 0 ? ((runs / balls) * 100).toFixed(2) : '0.00';
      const boundaryRuns = (fours * 4) + (sixes * 6);
      const boundaryPct = runs > 0 ? ((boundaryRuns / runs) * 100).toFixed(1) : '0.0';
      const contribution = ((runs / totalRuns) * 100).toFixed(1);

      const rowData = [
        idx + 1,
        getPlayerName(batter),
        formatDismissal(batter.dismissal),
        runs,
        balls,
        parseFloat(sr),
        fours,
        sixes,
        parseFloat(boundaryPct),
        parseFloat(contribution)
      ];

      rowData.forEach((val, i) => {
        const cell = battingSheet.getCell(battingRow, i + 1);
        cell.value = val;
        cell.alignment = { horizontal: i <= 2 ? 'left' : 'center' };
        if (idx % 2 === 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
        }
      });

      allBatters.push({
        name: getPlayerName(batter),
        innings: inningsIdx + 1,
        team: battingTeam,
        runs,
        balls,
        sr: parseFloat(sr),
        fours,
        sixes,
        boundaryPct: parseFloat(boundaryPct),
        contribution: parseFloat(contribution)
      });

      battingRow++;
    });

    // Extras and Total
    const extras = inn.extras || {};
    const extrasTotal = (extras.wides || 0) + (extras.noBalls || 0) + (extras.byes || 0) + (extras.legByes || 0);
    
    battingSheet.getCell(battingRow, 2).value = 'Extras';
    battingSheet.getCell(battingRow, 3).value = `(w${extras.wides || 0} nb${extras.noBalls || 0} b${extras.byes || 0} lb${extras.legByes || 0})`;
    battingSheet.getCell(battingRow, 4).value = extrasTotal;
    battingSheet.getCell(battingRow, 4).font = { bold: true };
    battingRow++;

    battingSheet.getCell(battingRow, 2).value = 'TOTAL';
    battingSheet.getCell(battingRow, 2).font = { bold: true };
    battingSheet.getCell(battingRow, 4).value = totalRuns;
    battingSheet.getCell(battingRow, 4).font = { bold: true, size: 14 };
    battingRow += 2;
  });

  battingSheet.columns = [
    { width: 5 }, { width: 22 }, { width: 28 }, { width: 8 }, { width: 8 },
    { width: 10 }, { width: 6 }, { width: 6 }, { width: 12 }, { width: 14 }
  ];

  // ============================================
  // SHEET 3: Bowling Analysis
  // ============================================
  const bowlingSheet = workbook.addWorksheet('Bowling Analysis', {
    properties: { tabColor: { argb: 'EF4444' } }
  });

  // Title
  bowlingSheet.mergeCells('A1:J1');
  const bowlTitleCell = bowlingSheet.getCell('A1');
  bowlTitleCell.value = '🎯 BOWLING PERFORMANCE ANALYSIS';
  bowlTitleCell.font = { size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
  bowlTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EF4444' } };
  bowlTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  bowlingSheet.getRow(1).height = 35;

  let bowlingRow = 3;
  const allBowlers: any[] = [];

  innings.forEach((inn: any, inningsIdx: number) => {
    const bowlingTeam = inn.battingTeamId ? 
      (String(inn.battingTeamId) === String(scorecard?.matchInfo?.team1?.id) ? team2Name : team1Name) :
      `Team ${inningsIdx + 1}`;

    // Innings header
    bowlingSheet.mergeCells(`A${bowlingRow}:J${bowlingRow}`);
    const innHeader = bowlingSheet.getCell(`A${bowlingRow}`);
    innHeader.value = `🎯 INNINGS ${inningsIdx + 1}: ${bowlingTeam} Bowling`;
    innHeader.font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    innHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DC2626' } };
    bowlingRow++;

    // Column headers
    const headers = ['#', 'Bowler', 'Overs', 'Maidens', 'Runs', 'Wickets', 'Economy', 'Dots', 'Wides', 'NB'];
    headers.forEach((h, i) => {
      const cell = bowlingSheet.getCell(bowlingRow, i + 1);
      cell.value = h;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '374151' } };
      cell.alignment = { horizontal: 'center' };
    });
    bowlingRow++;

    const bowling = inn.bowling || [];

    bowling.forEach((bowler: any, idx: number) => {
      const overs = bowler.overs ?? 0;
      const runs = bowler.runs ?? 0;
      const wickets = bowler.wickets ?? 0;
      const economy = overs > 0 ? (runs / overs).toFixed(2) : '0.00';

      const rowData = [
        idx + 1,
        getPlayerName(bowler),
        overs,
        bowler.maidens ?? 0,
        runs,
        wickets,
        parseFloat(economy),
        bowler.dots ?? '-',
        bowler.wides ?? '-',
        bowler.noBalls ?? '-'
      ];

      rowData.forEach((val, i) => {
        const cell = bowlingSheet.getCell(bowlingRow, i + 1);
        cell.value = val;
        cell.alignment = { horizontal: i <= 1 ? 'left' : 'center' };
        if (idx % 2 === 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF2F2' } };
        }
      });

      allBowlers.push({
        name: getPlayerName(bowler),
        innings: inningsIdx + 1,
        team: bowlingTeam,
        overs,
        maidens: bowler.maidens ?? 0,
        runs,
        wickets,
        economy: parseFloat(economy)
      });

      bowlingRow++;
    });

    bowlingRow += 2;
  });

  bowlingSheet.columns = [
    { width: 5 }, { width: 22 }, { width: 8 }, { width: 10 }, { width: 8 },
    { width: 10 }, { width: 10 }, { width: 8 }, { width: 8 }, { width: 6 }
  ];

  // ============================================
  // SHEET 4: CHART DATA - Top Scorers (Bar Chart Data)
  // ============================================
  const chart1Sheet = workbook.addWorksheet('📊 Chart 1 - Top Scorers', {
    properties: { tabColor: { argb: 'F59E0B' } }
  });

  chart1Sheet.mergeCells('A1:D1');
  chart1Sheet.getCell('A1').value = '📊 CHART 1: TOP SCORERS (Select A3:B12 → Insert → Bar Chart)';
  chart1Sheet.getCell('A1').font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  chart1Sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F59E0B' } };

  chart1Sheet.getCell('A3').value = 'Batter';
  chart1Sheet.getCell('B3').value = 'Runs';
  chart1Sheet.getCell('A3').font = { bold: true };
  chart1Sheet.getCell('B3').font = { bold: true };

  const sortedByRuns = [...allBatters].sort((a, b) => b.runs - a.runs).slice(0, 10);
  sortedByRuns.forEach((b, i) => {
    chart1Sheet.getCell(`A${4 + i}`).value = b.name;
    chart1Sheet.getCell(`B${4 + i}`).value = b.runs;
  });

  chart1Sheet.columns = [{ width: 25 }, { width: 12 }];

  // ============================================
  // SHEET 5: CHART DATA - Strike Rates (Bar Chart Data)
  // ============================================
  const chart2Sheet = workbook.addWorksheet('📊 Chart 2 - Strike Rates', {
    properties: { tabColor: { argb: '10B981' } }
  });

  chart2Sheet.mergeCells('A1:D1');
  chart2Sheet.getCell('A1').value = '📊 CHART 2: STRIKE RATES (Select A3:B12 → Insert → Column Chart)';
  chart2Sheet.getCell('A1').font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  chart2Sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '10B981' } };

  chart2Sheet.getCell('A3').value = 'Batter';
  chart2Sheet.getCell('B3').value = 'Strike Rate';
  chart2Sheet.getCell('A3').font = { bold: true };
  chart2Sheet.getCell('B3').font = { bold: true };

  const sortedBySR = [...allBatters].filter(b => b.balls >= 5).sort((a, b) => b.sr - a.sr).slice(0, 10);
  sortedBySR.forEach((b, i) => {
    chart2Sheet.getCell(`A${4 + i}`).value = b.name;
    chart2Sheet.getCell(`B${4 + i}`).value = b.sr;
  });

  chart2Sheet.columns = [{ width: 25 }, { width: 15 }];

  // ============================================
  // SHEET 6: CHART DATA - Boundaries (Stacked Bar)
  // ============================================
  const chart3Sheet = workbook.addWorksheet('📊 Chart 3 - Boundaries', {
    properties: { tabColor: { argb: '8B5CF6' } }
  });

  chart3Sheet.mergeCells('A1:D1');
  chart3Sheet.getCell('A1').value = '📊 CHART 3: BOUNDARIES (Select A3:C12 → Insert → Stacked Bar Chart)';
  chart3Sheet.getCell('A1').font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  chart3Sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '8B5CF6' } };

  chart3Sheet.getCell('A3').value = 'Batter';
  chart3Sheet.getCell('B3').value = 'Fours';
  chart3Sheet.getCell('C3').value = 'Sixes';
  ['A3', 'B3', 'C3'].forEach(c => { chart3Sheet.getCell(c).font = { bold: true }; });

  const sortedByBoundaries = [...allBatters].sort((a, b) => (b.fours + b.sixes) - (a.fours + a.sixes)).slice(0, 10);
  sortedByBoundaries.forEach((b, i) => {
    chart3Sheet.getCell(`A${4 + i}`).value = b.name;
    chart3Sheet.getCell(`B${4 + i}`).value = b.fours;
    chart3Sheet.getCell(`C${4 + i}`).value = b.sixes;
  });

  chart3Sheet.columns = [{ width: 25 }, { width: 10 }, { width: 10 }];

  // ============================================
  // SHEET 7: CHART DATA - Top Wicket Takers
  // ============================================
  const chart4Sheet = workbook.addWorksheet('📊 Chart 4 - Wicket Takers', {
    properties: { tabColor: { argb: 'EF4444' } }
  });

  chart4Sheet.mergeCells('A1:D1');
  chart4Sheet.getCell('A1').value = '📊 CHART 4: TOP WICKET TAKERS (Select A3:B12 → Insert → Bar Chart)';
  chart4Sheet.getCell('A1').font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  chart4Sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EF4444' } };

  chart4Sheet.getCell('A3').value = 'Bowler';
  chart4Sheet.getCell('B3').value = 'Wickets';
  chart4Sheet.getCell('A3').font = { bold: true };
  chart4Sheet.getCell('B3').font = { bold: true };

  const sortedByWickets = [...allBowlers].sort((a, b) => b.wickets - a.wickets).slice(0, 10);
  sortedByWickets.forEach((b, i) => {
    chart4Sheet.getCell(`A${4 + i}`).value = b.name;
    chart4Sheet.getCell(`B${4 + i}`).value = b.wickets;
  });

  chart4Sheet.columns = [{ width: 25 }, { width: 12 }];

  // ============================================
  // SHEET 8: CHART DATA - Economy Rates
  // ============================================
  const chart5Sheet = workbook.addWorksheet('📊 Chart 5 - Economy Rates', {
    properties: { tabColor: { argb: '06B6D4' } }
  });

  chart5Sheet.mergeCells('A1:D1');
  chart5Sheet.getCell('A1').value = '📊 CHART 5: ECONOMY RATES (Select A3:B12 → Insert → Column Chart)';
  chart5Sheet.getCell('A1').font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  chart5Sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '06B6D4' } };

  chart5Sheet.getCell('A3').value = 'Bowler';
  chart5Sheet.getCell('B3').value = 'Economy';
  chart5Sheet.getCell('A3').font = { bold: true };
  chart5Sheet.getCell('B3').font = { bold: true };

  const sortedByEconomy = [...allBowlers].filter(b => b.overs >= 1).sort((a, b) => a.economy - b.economy).slice(0, 10);
  sortedByEconomy.forEach((b, i) => {
    chart5Sheet.getCell(`A${4 + i}`).value = b.name;
    chart5Sheet.getCell(`B${4 + i}`).value = b.economy;
  });

  chart5Sheet.columns = [{ width: 25 }, { width: 12 }];

  // ============================================
  // SHEET 9: CHART DATA - Team Comparison
  // ============================================
  const chart6Sheet = workbook.addWorksheet('📊 Chart 6 - Team Compare', {
    properties: { tabColor: { argb: 'EC4899' } }
  });

  chart6Sheet.mergeCells('A1:D1');
  chart6Sheet.getCell('A1').value = '📊 CHART 6: TEAM COMPARISON (Select A3:C5 → Insert → Clustered Column)';
  chart6Sheet.getCell('A1').font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  chart6Sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EC4899' } };

  chart6Sheet.getCell('A3').value = 'Team';
  chart6Sheet.getCell('B3').value = 'Total Runs';
  chart6Sheet.getCell('C3').value = 'Boundaries';
  ['A3', 'B3', 'C3'].forEach(c => { chart6Sheet.getCell(c).font = { bold: true }; });

  innings.forEach((inn: any, idx: number) => {
    const battingTeam = inn.battingTeamId ? 
      (String(inn.battingTeamId) === String(scorecard?.matchInfo?.team1?.id) ? team1Name : team2Name) :
      `Team ${idx + 1}`;
    const batting = inn.batting || [];
    const totalRuns = inn.totalRuns || batting.reduce((s: number, b: any) => s + (b.runs || 0), 0);
    const totalBoundaries = batting.reduce((s: number, b: any) => s + (b.fours || 0) + (b.sixes || 0), 0);

    chart6Sheet.getCell(`A${4 + idx}`).value = battingTeam;
    chart6Sheet.getCell(`B${4 + idx}`).value = totalRuns;
    chart6Sheet.getCell(`C${4 + idx}`).value = totalBoundaries;
  });

  chart6Sheet.columns = [{ width: 30 }, { width: 12 }, { width: 12 }];

  // ============================================
  // SHEET 10: CHART DATA - Run Contribution Pie
  // ============================================
  const chart7Sheet = workbook.addWorksheet('📊 Chart 7 - Run Share', {
    properties: { tabColor: { argb: 'F97316' } }
  });

  chart7Sheet.mergeCells('A1:D1');
  chart7Sheet.getCell('A1').value = '📊 CHART 7: RUN CONTRIBUTION (Select A3:B12 → Insert → Pie Chart)';
  chart7Sheet.getCell('A1').font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  chart7Sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F97316' } };

  chart7Sheet.getCell('A3').value = 'Batter';
  chart7Sheet.getCell('B3').value = 'Runs';
  chart7Sheet.getCell('A3').font = { bold: true };
  chart7Sheet.getCell('B3').font = { bold: true };

  // Top 8 scorers + Others
  const topScorers = [...allBatters].sort((a, b) => b.runs - a.runs).slice(0, 8);
  const othersRuns = allBatters.slice(8).reduce((s, b) => s + b.runs, 0);

  topScorers.forEach((b, i) => {
    chart7Sheet.getCell(`A${4 + i}`).value = b.name;
    chart7Sheet.getCell(`B${4 + i}`).value = b.runs;
  });
  if (othersRuns > 0) {
    chart7Sheet.getCell(`A${12}`).value = 'Others';
    chart7Sheet.getCell(`B${12}`).value = othersRuns;
  }

  chart7Sheet.columns = [{ width: 25 }, { width: 12 }];

  // ============================================
  // SHEET 11: CHART DATA - Extras Breakdown
  // ============================================
  const chart8Sheet = workbook.addWorksheet('📊 Chart 8 - Extras', {
    properties: { tabColor: { argb: '84CC16' } }
  });

  chart8Sheet.mergeCells('A1:D1');
  chart8Sheet.getCell('A1').value = '📊 CHART 8: EXTRAS BREAKDOWN (Select A3:B6 → Insert → Pie Chart)';
  chart8Sheet.getCell('A1').font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  chart8Sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '84CC16' } };

  chart8Sheet.getCell('A3').value = 'Extra Type';
  chart8Sheet.getCell('B3').value = 'Count';
  chart8Sheet.getCell('A3').font = { bold: true };
  chart8Sheet.getCell('B3').font = { bold: true };

  let totalWides = 0, totalNoBalls = 0, totalByes = 0, totalLegByes = 0;
  innings.forEach((inn: any) => {
    const extras = inn.extras || {};
    totalWides += extras.wides || 0;
    totalNoBalls += extras.noBalls || 0;
    totalByes += extras.byes || 0;
    totalLegByes += extras.legByes || 0;
  });

  chart8Sheet.getCell('A4').value = 'Wides';
  chart8Sheet.getCell('B4').value = totalWides;
  chart8Sheet.getCell('A5').value = 'No Balls';
  chart8Sheet.getCell('B5').value = totalNoBalls;
  chart8Sheet.getCell('A6').value = 'Byes';
  chart8Sheet.getCell('B6').value = totalByes;
  chart8Sheet.getCell('A7').value = 'Leg Byes';
  chart8Sheet.getCell('B7').value = totalLegByes;

  chart8Sheet.columns = [{ width: 15 }, { width: 12 }];

  // ============================================
  // SHEET 12: CHART DATA - Bowling Overs
  // ============================================
  const chart9Sheet = workbook.addWorksheet('📊 Chart 9 - Bowling Overs', {
    properties: { tabColor: { argb: '14B8A6' } }
  });

  chart9Sheet.mergeCells('A1:D1');
  chart9Sheet.getCell('A1').value = '📊 CHART 9: BOWLING OVERS DISTRIBUTION (Select A3:B12 → Insert → Pie Chart)';
  chart9Sheet.getCell('A1').font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  chart9Sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '14B8A6' } };

  chart9Sheet.getCell('A3').value = 'Bowler';
  chart9Sheet.getCell('B3').value = 'Overs';
  chart9Sheet.getCell('A3').font = { bold: true };
  chart9Sheet.getCell('B3').font = { bold: true };

  const sortedByOvers = [...allBowlers].sort((a, b) => b.overs - a.overs).slice(0, 10);
  sortedByOvers.forEach((b, i) => {
    chart9Sheet.getCell(`A${4 + i}`).value = b.name;
    chart9Sheet.getCell(`B${4 + i}`).value = b.overs;
  });

  chart9Sheet.columns = [{ width: 25 }, { width: 12 }];

  // ============================================
  // SHEET 13: CHART DATA - Runs vs Balls Scatter
  // ============================================
  const chart10Sheet = workbook.addWorksheet('📊 Chart 10 - Runs vs Balls', {
    properties: { tabColor: { argb: '6366F1' } }
  });

  chart10Sheet.mergeCells('A1:D1');
  chart10Sheet.getCell('A1').value = '📊 CHART 10: RUNS vs BALLS (Select B3:C12 → Insert → Scatter Chart)';
  chart10Sheet.getCell('A1').font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  chart10Sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '6366F1' } };

  chart10Sheet.getCell('A3').value = 'Batter';
  chart10Sheet.getCell('B3').value = 'Balls';
  chart10Sheet.getCell('C3').value = 'Runs';
  ['A3', 'B3', 'C3'].forEach(c => { chart10Sheet.getCell(c).font = { bold: true }; });

  allBatters.forEach((b, i) => {
    chart10Sheet.getCell(`A${4 + i}`).value = b.name;
    chart10Sheet.getCell(`B${4 + i}`).value = b.balls;
    chart10Sheet.getCell(`C${4 + i}`).value = b.runs;
  });

  chart10Sheet.columns = [{ width: 25 }, { width: 10 }, { width: 10 }];

  // ============================================
  // SHEET 14: CHART DATA - Boundary Percentage
  // ============================================
  const chart11Sheet = workbook.addWorksheet('📊 Chart 11 - Boundary %', {
    properties: { tabColor: { argb: 'A855F7' } }
  });

  chart11Sheet.mergeCells('A1:D1');
  chart11Sheet.getCell('A1').value = '📊 CHART 11: BOUNDARY PERCENTAGE (Select A3:B12 → Insert → Bar Chart)';
  chart11Sheet.getCell('A1').font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  chart11Sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'A855F7' } };

  chart11Sheet.getCell('A3').value = 'Batter';
  chart11Sheet.getCell('B3').value = 'Boundary %';
  chart11Sheet.getCell('A3').font = { bold: true };
  chart11Sheet.getCell('B3').font = { bold: true };

  const sortedByBoundaryPct = [...allBatters].filter(b => b.runs >= 10).sort((a, b) => b.boundaryPct - a.boundaryPct).slice(0, 10);
  sortedByBoundaryPct.forEach((b, i) => {
    chart11Sheet.getCell(`A${4 + i}`).value = b.name;
    chart11Sheet.getCell(`B${4 + i}`).value = b.boundaryPct;
  });

  chart11Sheet.columns = [{ width: 25 }, { width: 15 }];

  // ============================================
  // SHEET 15: CHART DATA - Maidens
  // ============================================
  const chart12Sheet = workbook.addWorksheet('📊 Chart 12 - Maidens', {
    properties: { tabColor: { argb: '0EA5E9' } }
  });

  chart12Sheet.mergeCells('A1:D1');
  chart12Sheet.getCell('A1').value = '📊 CHART 12: MAIDEN OVERS (Select A3:B12 → Insert → Column Chart)';
  chart12Sheet.getCell('A1').font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  chart12Sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0EA5E9' } };

  chart12Sheet.getCell('A3').value = 'Bowler';
  chart12Sheet.getCell('B3').value = 'Maidens';
  chart12Sheet.getCell('A3').font = { bold: true };
  chart12Sheet.getCell('B3').font = { bold: true };

  const sortedByMaidens = [...allBowlers].sort((a, b) => b.maidens - a.maidens).slice(0, 10);
  sortedByMaidens.forEach((b, i) => {
    chart12Sheet.getCell(`A${4 + i}`).value = b.name;
    chart12Sheet.getCell(`B${4 + i}`).value = b.maidens;
  });

  chart12Sheet.columns = [{ width: 25 }, { width: 12 }];

  // ============================================
  // Generate and Download
  // ============================================
  const safeTeam1 = team1Name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 12);
  const safeTeam2 = team2Name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 12);
  const date = scorecard?.matchInfo?.date || new Date().toISOString().split('T')[0];
  const filename = `WPL2026_Charts_${safeTeam1}_vs_${safeTeam2}_${date}.xlsx`;

  try {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('✅ Excel with charts data exported!');
    alert('✅ Excel exported with 12 chart data sheets!\n\nTo create charts:\n1. Open the file in Excel\n2. Go to each "Chart" sheet\n3. Select the data range shown\n4. Click Insert → Chart → Choose chart type');
  } catch (err) {
    console.error('❌ Export error:', err);
    alert(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
};

// Helper function
function formatDismissal(dismissal: any): string {
  if (!dismissal) return 'not out';
  if (typeof dismissal === 'string') return dismissal;
  const type = dismissal.type || '';
  const details = dismissal.details || '';
  if (details) return details;
  switch (type.toLowerCase()) {
    case 'bowled': return `b ${dismissal.bowlerId || ''}`.trim();
    case 'caught': return `c ${dismissal.fielderId || ''} b ${dismissal.bowlerId || ''}`.trim();
    case 'lbw': return `lbw b ${dismissal.bowlerId || ''}`.trim();
    case 'run out': return `run out (${dismissal.fielderId || ''})`.trim();
    case 'stumped': return `st ${dismissal.fielderId || ''} b ${dismissal.bowlerId || ''}`.trim();
    default: return type || 'not out';
  }
}
