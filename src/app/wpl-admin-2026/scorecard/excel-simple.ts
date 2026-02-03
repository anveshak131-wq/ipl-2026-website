// Simple, direct Excel export that works
export const exportSimpleExcel = (scorecard: any) => {
  console.log('🚀 Starting SIMPLE Excel export...');
  
  const XLSX = (window as any).XLSX;
  if (!XLSX) {
    alert('Excel library not available');
    return;
  }

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Match Overview Sheet
  const matchData = [
    ['MATCH OVERVIEW'],
    ['Team 1', scorecard?.matchInfo?.team1?.name || 'Unknown Team'],
    ['Team 2', scorecard?.matchInfo?.team2?.name || 'Unknown Team'],
    ['Venue', scorecard?.matchInfo?.venue || 'Unknown Venue'],
    ['Date', scorecard?.matchInfo?.date || 'Unknown Date'],
    ['Status', scorecard?.matchInfo?.status || 'In Progress']
  ];
  
  const ws1 = XLSX.utils.aoa_to_sheet(matchData);
  XLSX.utils.book_append_sheet(wb, ws1, 'Match Overview');

  // Batting Sheet
  const battingData = [
    ['BATTING PERFORMANCE'],
    ['Player', 'Runs', 'Balls', 'Strike Rate', 'Fours', 'Sixes']
  ];

  // Add actual batting data or sample data
  const batting = scorecard?.innings?.[0]?.batting || [];
  if (batting.length === 0) {
    // Add sample data if no real data
    battingData.push(['Sample Batter 1', 45, 32, 140.6, 5, 1]);
    battingData.push(['Sample Batter 2', 23, 18, 127.8, 3, 0]);
  } else {
    batting.forEach((batter: any) => {
      const sr = batter.balls > 0 ? ((batter.runs / batter.balls) * 100).toFixed(1) : '0.0';
      battingData.push([
        batter.name || batter.playerId || 'Unknown',
        batter.runs || 0,
        batter.balls || 0,
        sr,
        batter.fours || 0,
        batter.sixes || 0
      ]);
    });
  }
  
  const ws2 = XLSX.utils.aoa_to_sheet(battingData);
  XLSX.utils.book_append_sheet(wb, ws2, 'Batting');

  // Bowling Sheet
  const bowlingData = [
    ['BOWLING PERFORMANCE'],
    ['Bowler', 'Overs', 'Runs', 'Wickets', 'Economy']
  ];

  const bowling = scorecard?.innings?.[0]?.bowling || [];
  if (bowling.length === 0) {
    // Add sample data if no real data
    bowlingData.push(['Sample Bowler 1', 4.0, 28, 2, 7.0]);
    bowlingData.push(['Sample Bowler 2', 3.0, 25, 1, 8.3]);
  } else {
    bowling.forEach((bowler: any) => {
      const economy = bowler.overs > 0 ? (bowler.runs / bowler.overs).toFixed(2) : '0.00';
      bowlingData.push([
        bowler.name || bowler.playerId || 'Unknown',
        bowler.overs || 0,
        bowler.runs || 0,
        bowler.wickets || 0,
        economy
      ]);
    });
  }
  
  const ws3 = XLSX.utils.aoa_to_sheet(bowlingData);
  XLSX.utils.book_append_sheet(wb, ws3, 'Bowling');

  // Generate filename
  const team1 = scorecard?.matchInfo?.team1?.name || 'Team1';
  const team2 = scorecard?.matchInfo?.team2?.name || 'Team2';
  const date = scorecard?.matchInfo?.date || new Date().toISOString().split('T')[0];
  const filename = `WPL2026_Scorecard_${team1.replace(/\s+/g, '_')}_vs_${team2.replace(/\s+/g, '_')}_${date}.xlsx`;

  // Download file
  XLSX.writeFile(wb, filename);
  console.log('✅ Simple Excel export completed!');
  alert('Excel exported successfully!');
};
