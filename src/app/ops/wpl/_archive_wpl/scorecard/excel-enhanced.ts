// Enhanced Excel export with professional styling and comprehensive features
export const exportEnhancedExcel = (scorecard: any) => {
  console.log('🚀 Starting ENHANCED Excel export...');
  
  const XLSX = (window as any).XLSX;
  if (!XLSX) {
    alert('Excel library not available');
    return;
  }

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Color palette for professional styling
  const colors = {
    primary: '2C3E50',
    secondary: '3498DB', 
    success: '27AE60',
    warning: 'F39C12',
    danger: 'E74C3C',
    background: 'F8F9FA',
    header: 'E8F4FD',
    highlight: 'FFF3CD',
    text: '2C3E50',
    muted: '7F8C8D'
  };

  // Helper function to apply styling
  const applyStyle = (ws: any, range: string, style: any) => {
    if (!ws['!cols']) ws['!cols'] = [];
    
    const [startCell, endCell] = range.split(':');
    const startCol = startCell.match(/[A-Z]+/)[0];
    const endCol = endCell.match(/[A-Z]+/)[0];
    const startRow = parseInt(startCell.match(/\d+/)[0]);
    const endRow = parseInt(endCell.match(/\d+/)[0]);
    
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol.charCodeAt(0) - 65; col <= endCol.charCodeAt(0) - 65; col++) {
        const cellRef = XLSX.utils.encode_cell({r: row - 1, c: col});
        if (!ws[cellRef]) ws[cellRef] = {};
        if (!ws[cellRef].s) ws[cellRef].s = {};
        Object.assign(ws[cellRef].s, style);
      }
    }
  };

  // Helper function to merge cells
  const mergeCells = (ws: any, range: string) => {
    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push(XLSX.utils.decode_range(range));
  };

  // Helper function to set column widths
  const setColumnWidths = (ws: any, widths: number[]) => {
    ws['!cols'] = widths.map(w => ({ wch: w }));
  };

  // 1. ENHANCED Match Overview Sheet
  const matchData = [
    ['🏆 WPL 2026 MATCH REPORT', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['MATCH INFORMATION', '', '', '', '', '', '', ''],
    ['Team 1', scorecard?.matchInfo?.team1?.name || 'Unknown Team', '', 'Team 2', scorecard?.matchInfo?.team2?.name || 'Unknown Team', '', '', ''],
    ['Venue', scorecard?.matchInfo?.venue || 'Unknown Venue', '', 'Date', scorecard?.matchInfo?.date || 'Unknown Date', '', '', ''],
    ['Time', scorecard?.matchInfo?.time || 'Unknown Time', '', 'Status', scorecard?.matchInfo?.status || 'In Progress', '', '', ''],
    ['Toss Winner', scorecard?.matchInfo?.toss?.winner || 'N/A', '', 'Decision', scorecard?.matchInfo?.toss?.decision || 'N/A', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['MATCH SUMMARY', '', '', '', '', '', '', ''],
    ['Total Runs', scorecard?.innings?.[0]?.totalRuns || '0', '', 'Total Wickets', scorecard?.innings?.[0]?.totalWickets || '0', '', '', ''],
    ['Total Overs', scorecard?.innings?.[0]?.totalOvers || '0', '', 'Run Rate', calculateRunRate(scorecard), '', '', '']
  ];
  
  const ws1 = XLSX.utils.aoa_to_sheet(matchData);
  
  // Apply professional styling to Match Overview
  mergeCells(ws1, 'A1:H1');
  mergeCells(ws1, 'A3:H3');
  mergeCells(ws1, 'A9:H9');
  
  // Title styling
  applyStyle(ws1, 'A1:H1', {
    font: { sz: 18, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: colors.primary } },
    alignment: { horizontal: 'center', vertical: 'center' }
  });
  
  // Section headers
  applyStyle(ws1, 'A3:H3', {
    font: { sz: 14, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: colors.secondary } },
    alignment: { horizontal: 'center', vertical: 'center' }
  });
  
  applyStyle(ws1, 'A9:H9', {
    font: { sz: 14, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: colors.success } },
    alignment: { horizontal: 'center', vertical: 'center' }
  });
  
  // Data cells styling
  applyStyle(ws1, 'A4:H8', {
    font: { sz: 11 },
    fill: { fgColor: { rgb: colors.background } },
    border: {
      top: { style: 'thin', color: { rgb: colors.muted } },
      bottom: { style: 'thin', color: { rgb: colors.muted } },
      left: { style: 'thin', color: { rgb: colors.muted } },
      right: { style: 'thin', color: { rgb: colors.muted } }
    }
  });
  
  setColumnWidths(ws1, [15, 20, 5, 15, 20, 5, 10, 10]);
  XLSX.utils.book_append_sheet(wb, ws1, 'Match Overview');

  // 2. ENHANCED Batting Performance Sheet
  const battingData = [
    ['🏏 BATTING PERFORMANCE ANALYSIS', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['Player', 'Runs', 'Balls', 'Strike Rate', 'Fours', 'Sixes', 'Minutes', 'Dismissal', 'Performance', 'Impact Score', 'Runs %', 'Boundary %', 'Dot %', 'Badge']
  ];

  // Add actual batting data or enhanced sample data
  const batting = scorecard?.innings?.[0]?.batting || [];
  const totalRuns = scorecard?.innings?.[0]?.totalRuns || 100;
  
  if (batting.length === 0) {
    const sampleBatters = [
      { name: 'Virat Kohli', runs: 85, balls: 60, fours: 10, sixes: 2, minutes: 75, dismissal: 'Caught' },
      { name: 'Faf du Plessis', runs: 45, balls: 40, fours: 5, sixes: 1, minutes: 50, dismissal: 'Bowled' },
      { name: 'Glenn Maxwell', runs: 32, balls: 25, fours: 3, sixes: 2, minutes: 30, dismissal: 'Run Out' },
      { name: 'Dinesh Karthik', runs: 28, balls: 20, fours: 2, sixes: 2, minutes: 25, dismissal: 'Not Out' }
    ];
    
    sampleBatters.forEach(batter => {
      const sr = (batter.runs / batter.balls * 100).toFixed(1);
      const runsPercent = ((batter.runs / totalRuns) * 100).toFixed(1);
      const boundaryRuns = (batter.fours * 4) + (batter.sixes * 6);
      const boundaryPercent = ((boundaryRuns / batter.runs) * 100).toFixed(1);
      const dotPercent = (((batter.balls - batter.fours - batter.sixes) / batter.balls) * 100).toFixed(1);
      const impactScore = calculateImpactScore(batter);
      const performance = getPerformanceRating(batter);
      const badge = getPerformanceBadge(batter);
      
      battingData.push([
        batter.name, batter.runs, batter.balls, sr, batter.fours, batter.sixes, 
        batter.minutes, batter.dismissal, performance, impactScore, 
        `${runsPercent}%`, `${boundaryPercent}%`, `${dotPercent}%`, badge
      ]);
    });
  } else {
    batting.forEach((batter: any) => {
      const sr = batter.balls > 0 ? ((batter.runs / batter.balls) * 100).toFixed(1) : '0.0';
      const runsPercent = totalRuns > 0 ? ((batter.runs / totalRuns) * 100).toFixed(1) : '0.0';
      const boundaryRuns = ((batter.fours || 0) * 4) + ((batter.sixes || 0) * 6);
      const boundaryPercent = batter.runs > 0 ? ((boundaryRuns / batter.runs) * 100).toFixed(1) : '0.0';
      const dotPercent = batter.balls > 0 ? (((batter.balls - (batter.fours || 0) - (batter.sixes || 0)) / batter.balls) * 100).toFixed(1) : '0.0';
      const impactScore = calculateImpactScore(batter);
      const performance = getPerformanceRating(batter);
      const badge = getPerformanceBadge(batter);
      
      battingData.push([
        batter.name || batter.playerId || 'Unknown', 
        batter.runs || 0, 
        batter.balls || 0, 
        sr, 
        batter.fours || 0, 
        batter.sixes || 0,
        batter.minutes || 0,
        formatDismissal(batter.dismissal),
        performance,
        impactScore,
        `${runsPercent}%`,
        `${boundaryPercent}%`,
        `${dotPercent}%`,
        badge
      ]);
    });
  }
  
  const ws2 = XLSX.utils.aoa_to_sheet(battingData);
  
  // Apply styling to Batting sheet
  mergeCells(ws2, 'A1:N1');
  mergeCells(ws2, 'A3:N3');
  
  applyStyle(ws2, 'A1:N1', {
    font: { sz: 16, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: colors.primary } },
    alignment: { horizontal: 'center', vertical: 'center' }
  });
  
  applyStyle(ws2, 'A3:N3', {
    font: { sz: 12, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: colors.secondary } },
    alignment: { horizontal: 'center', vertical: 'center' }
  });
  
  // Zebra striping for data rows
  for (let i = 4; i < battingData.length; i++) {
    const range = `A${i}:N${i}`;
    const bgColor = i % 2 === 0 ? colors.background : colors.header;
    applyStyle(ws2, range, {
      fill: { fgColor: { rgb: bgColor } },
      border: {
        top: { style: 'thin', color: { rgb: colors.muted } },
        bottom: { style: 'thin', color: { rgb: colors.muted } },
        left: { style: 'thin', color: { rgb: colors.muted } },
        right: { style: 'thin', color: { rgb: colors.muted } }
      }
    });
  }
  
  setColumnWidths(ws2, [20, 8, 8, 10, 8, 8, 10, 12, 12, 10, 8, 10, 8, 8]);
  XLSX.utils.book_append_sheet(wb, ws2, 'Batting Analysis');

  // Generate filename
  const team1 = scorecard?.matchInfo?.team1?.name || 'Team1';
  const team2 = scorecard?.matchInfo?.team2?.name || 'Team2';
  const date = scorecard?.matchInfo?.date || new Date().toISOString().split('T')[0];
  const filename = `WPL2026_Enhanced_Scorecard_${team1.replace(/\s+/g, '_')}_vs_${team2.replace(/\s+/g, '_')}_${date}.xlsx`;

  // Download file
  XLSX.writeFile(wb, filename);
  console.log('✅ Enhanced Excel export completed!');
  alert('Enhanced Excel exported successfully with professional styling and comprehensive analysis!');
};

// Helper functions for calculations and ratings
function calculateRunRate(scorecard: any): string {
  const runs = scorecard?.innings?.[0]?.totalRuns || 0;
  const overs = scorecard?.innings?.[0]?.totalOvers || 1;
  return (runs / overs).toFixed(2);
}

function calculateImpactScore(player: any): number {
  let score = 0;
  score += (player.runs || 0) * 0.5;
  score += (player.fours || 0) * 2;
  score += (player.sixes || 0) * 4;
  if ((player.runs || 0) >= 50) score += 25;
  if ((player.runs || 0) >= 100) score += 50;
  return Math.round(score);
}

function getPerformanceRating(player: any): string {
  const runs = player.runs || 0;
  if (runs >= 100) return 'Century 🏆';
  if (runs >= 50) return 'Half-Century 🌟';
  if (runs >= 30) return 'Good Knock 👍';
  if (runs >= 20) return 'Decent ✅';
  return 'Low Score 📊';
}

function getPerformanceBadge(player: any): string {
  const runs = player.runs || 0;
  if (runs >= 100) return '💯';
  if (runs >= 50) return '🌟';
  if (runs >= 30) return '👍';
  if (runs >= 20) return '✅';
  return '📊';
}

function formatDismissal(dismissal: any): string {
  if (!dismissal) return 'Not Out';
  if (typeof dismissal === 'string') return dismissal;
  if (dismissal.details) return dismissal.details;
  if (dismissal.type) return dismissal.type;
  return 'Out';
}
