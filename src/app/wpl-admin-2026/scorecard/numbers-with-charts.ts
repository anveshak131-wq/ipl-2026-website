/**
 * Apple Numbers Export - Advanced Version with Chart Data
 * Exports scorecard data with chart-ready data sheets for Apple Numbers
 */

interface BattingEntry {
  playerName: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  isOut: boolean;
  dismissalType?: string;
  fielders?: string[];
}

interface BowlingEntry {
  bowlerName: string;
  overs: number;
  maidens: number;
  runs: number;
  wickets: number;
  economy: number;
  wides?: number;
  noBalls?: number;
}

interface InningsData {
  battingTeam: string;
  bowlingTeam: string;
  batting: BattingEntry[];
  bowling: BowlingEntry[];
  extras?: {
    wides?: number;
    noBalls?: number;
    byes?: number;
    legByes?: number;
    total?: number;
  };
  total?: {
    runs: number;
    wickets: number;
    overs: number;
  };
  fallOfWickets?: Array<{
    runs: number;
    wickets: number;
    playerName: string;
    overs: number;
  }>;
  partnerships?: Array<{
    player1: string;
    player2: string;
    runs: number;
    balls: number;
  }>;
}

interface ScorecardData {
  matchId: string;
  team1: string;
  team2: string;
  venue?: string;
  date?: string;
  result?: string;
  innings: InningsData[];
}

/**
 * Export scorecard to CSV format with chart data for Apple Numbers
 */
export function exportToNumbersWithCharts(scorecard: ScorecardData) {
  const csvRows: string[] = [];

  // Title and Instructions
  csvRows.push(`"${scorecard.team1} vs ${scorecard.team2} - CHART DATA FOR APPLE NUMBERS"`);
  csvRows.push('');
  csvRows.push('"INSTRUCTIONS: Import this CSV into Apple Numbers. Each section below can be used to create charts."');
  csvRows.push('"Select the data range for each chart and insert charts from the Charts menu."');
  csvRows.push('');
  csvRows.push('');

  // Match Overview
  csvRows.push('"=== MATCH OVERVIEW ==="');
  csvRows.push('"Match","Value"');
  csvRows.push(`"Teams","${scorecard.team1} vs ${scorecard.team2}"`);
  csvRows.push(`"Venue","${scorecard.venue || 'N/A'}"`);
  csvRows.push(`"Date","${scorecard.date || 'N/A'}"`);
  csvRows.push(`"Result","${scorecard.result || 'N/A'}"`);
  csvRows.push('');
  csvRows.push('');

  // Chart 1: Top Scorers
  csvRows.push('"=== CHART 1: TOP SCORERS (Bar Chart) ==="');
  csvRows.push('"Player","Runs","Balls","Team"');
  const allBatters = getAllBatters(scorecard);
  allBatters
    .sort((a, b) => b.runs - a.runs)
    .slice(0, 10)
    .forEach(bat => {
      csvRows.push(`"${bat.playerName}",${bat.runs},${bat.balls},"${bat.team}"`);
    });
  csvRows.push('');
  csvRows.push('');

  // Chart 2: Strike Rates
  csvRows.push('"=== CHART 2: STRIKE RATES (Column Chart) ==="');
  csvRows.push('"Player","Strike Rate","Runs","Balls"');
  allBatters
    .filter(b => b.balls >= 10 && b.strikeRate != null)
    .sort((a, b) => (b.strikeRate || 0) - (a.strikeRate || 0))
    .slice(0, 10)
    .forEach(bat => {
      const sr = bat.strikeRate != null ? bat.strikeRate.toFixed(2) : '0.00';
      csvRows.push(`"${bat.playerName}",${sr},${bat.runs},${bat.balls}`);
    });
  csvRows.push('');
  csvRows.push('');

  // Chart 3: Boundaries
  csvRows.push('"=== CHART 3: BOUNDARIES (Stacked Bar Chart) ==="');
  csvRows.push('"Player","4s","6s","Total Boundaries"');
  allBatters
    .filter(b => (b.fours + b.sixes) > 0)
    .sort((a, b) => (b.fours + b.sixes) - (a.fours + a.sixes))
    .slice(0, 10)
    .forEach(bat => {
      csvRows.push(`"${bat.playerName}",${bat.fours},${bat.sixes},${bat.fours + bat.sixes}`);
    });
  csvRows.push('');
  csvRows.push('');

  // Chart 4: Wicket Takers
  csvRows.push('"=== CHART 4: WICKET TAKERS (Bar Chart) ==="');
  csvRows.push('"Bowler","Wickets","Runs","Economy"');
  const allBowlers = getAllBowlers(scorecard);
  allBowlers
    .filter(b => b.wickets > 0)
    .sort((a, b) => b.wickets - a.wickets)
    .slice(0, 10)
    .forEach(bowl => {
      csvRows.push(`"${bowl.bowlerName}",${bowl.wickets},${bowl.runs},${bowl.economy ? bowl.economy.toFixed(2) : '0.00'}`);
    });
  csvRows.push('');
  csvRows.push('');

  // Chart 5: Economy Rates
  csvRows.push('"=== CHART 5: ECONOMY RATES (Column Chart) ==="');
  csvRows.push('"Bowler","Economy","Overs","Runs","Wickets"');
  allBowlers
    .filter(b => b.overs >= 2 && b.economy != null)
    .sort((a, b) => (a.economy || 0) - (b.economy || 0))
    .slice(0, 10)
    .forEach(bowl => {
      const econ = bowl.economy != null ? bowl.economy.toFixed(2) : '0.00';
      csvRows.push(`"${bowl.bowlerName}",${econ},${bowl.overs},${bowl.runs},${bowl.wickets}`);
    });
  csvRows.push('');
  csvRows.push('');

  // Chart 6: Team Comparison
  csvRows.push('"=== CHART 6: TEAM COMPARISON (Clustered Column Chart) ==="');
  csvRows.push('"Team","Total Runs","Wickets Lost","Extras","Overs"');
  const teamStats = getTeamStats(scorecard);
  teamStats.forEach(team => {
    csvRows.push(`"${team.team}",${team.runs},${team.wickets},${team.extras},${team.overs}`);
  });
  csvRows.push('');
  csvRows.push('');

  // Chart 7: Run Share (Pie Chart)
  csvRows.push('"=== CHART 7: RUN SHARE (Pie Chart) ==="');
  csvRows.push('"Player","Runs"');
  allBatters
    .sort((a, b) => b.runs - a.runs)
    .slice(0, 8)
    .forEach(bat => {
      csvRows.push(`"${bat.playerName}",${bat.runs}`);
    });
  csvRows.push('');
  csvRows.push('');

  // Chart 8: Extras Breakdown (Pie Chart)
  csvRows.push('"=== CHART 8: EXTRAS BREAKDOWN (Pie Chart) ==="');
  csvRows.push('"Type","Count"');
  const extrasBreakdown = getExtrasBreakdown(scorecard);
  Object.entries(extrasBreakdown).forEach(([type, count]) => {
    if (count > 0) {
      csvRows.push(`"${type}",${count}`);
    }
  });
  csvRows.push('');
  csvRows.push('');

  // Chart 9: Bowling Overs Distribution (Pie Chart)
  csvRows.push('"=== CHART 9: BOWLING OVERS (Pie Chart) ==="');
  csvRows.push('"Bowler","Overs"');
  allBowlers
    .filter(b => b.overs > 0)
    .sort((a, b) => b.overs - a.overs)
    .slice(0, 8)
    .forEach(bowl => {
      csvRows.push(`"${bowl.bowlerName}",${bowl.overs}`);
    });
  csvRows.push('');
  csvRows.push('');

  // Chart 10: Runs vs Balls (Scatter Plot)
  csvRows.push('"=== CHART 10: RUNS VS BALLS (Scatter Plot) ==="');
  csvRows.push('"Player","Balls","Runs","Strike Rate"');
  allBatters
    .filter(b => b.balls >= 5)
    .forEach(bat => {
      csvRows.push(`"${bat.playerName}",${bat.balls},${bat.runs},${bat.strikeRate ? bat.strikeRate.toFixed(2) : '0.00'}`);
    });
  csvRows.push('');
  csvRows.push('');

  // Chart 11: Boundary Percentage (Bar Chart)
  csvRows.push('"=== CHART 11: BOUNDARY PERCENTAGE (Bar Chart) ==="');
  csvRows.push('"Player","Boundary %","Boundary Runs","Total Runs"');
  allBatters
    .filter(b => b.runs >= 10)
    .map(bat => ({
      ...bat,
      boundaryRuns: (bat.fours * 4) + (bat.sixes * 6),
      boundaryPercentage: bat.runs > 0 ? ((bat.fours * 4 + bat.sixes * 6) / bat.runs) * 100 : 0,
    }))
    .sort((a, b) => b.boundaryPercentage - a.boundaryPercentage)
    .slice(0, 10)
    .forEach(bat => {
      const pct = bat.boundaryPercentage != null && !isNaN(bat.boundaryPercentage) ? bat.boundaryPercentage.toFixed(1) : '0.0';
      csvRows.push(`"${bat.playerName}",${pct},${bat.boundaryRuns},${bat.runs}`);
    });
  csvRows.push('');
  csvRows.push('');

  // Chart 12: Maiden Overs (Column Chart)
  csvRows.push('"=== CHART 12: MAIDEN OVERS (Column Chart) ==="');
  csvRows.push('"Bowler","Maidens","Total Overs","Economy"');
  allBowlers
    .filter(b => b.maidens > 0)
    .sort((a, b) => b.maidens - a.maidens)
    .forEach(bowl => {
      csvRows.push(`"${bowl.bowlerName}",${bowl.maidens},${bowl.overs},${bowl.economy ? bowl.economy.toFixed(2) : '0.00'}`);
    });
  csvRows.push('');
  csvRows.push('');

  // Footer
  csvRows.push('');
  csvRows.push('"=== END OF CHART DATA ==="');
  csvRows.push('"Generated by SportsUP18"');
  csvRows.push(`"Date: ${new Date().toLocaleDateString()}"`);
  csvRows.push('');
  csvRows.push('"To create charts in Apple Numbers:"');
  csvRows.push('"1. Select the data range for a chart section"');
  csvRows.push('"2. Click the Chart button in the toolbar"');
  csvRows.push('"3. Choose the recommended chart type (mentioned in section header)"');
  csvRows.push('"4. Customize colors and labels as needed"');

  // Create CSV blob and download
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  const filename = `${scorecard.team1}_vs_${scorecard.team2}_Numbers_Charts.csv`;
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  console.log(`✅ Numbers CSV with charts exported: ${filename}`);
}

// Helper functions

function getAllBatters(scorecard: ScorecardData) {
  const batters: any[] = [];
  scorecard.innings.forEach(innings => {
    innings.batting.forEach(bat => {
      batters.push({
        ...bat,
        team: innings.battingTeam,
      });
    });
  });
  return batters;
}

function getAllBowlers(scorecard: ScorecardData) {
  const bowlers: any[] = [];
  scorecard.innings.forEach(innings => {
    innings.bowling.forEach(bowl => {
      bowlers.push({
        ...bowl,
        team: innings.bowlingTeam,
      });
    });
  });
  return bowlers;
}

function getTeamStats(scorecard: ScorecardData) {
  const stats: any[] = [];
  scorecard.innings.forEach(innings => {
    stats.push({
      team: innings.battingTeam,
      runs: innings.total?.runs || 0,
      wickets: innings.total?.wickets || 0,
      extras: innings.extras?.total || 0,
      overs: innings.total?.overs || 0,
    });
  });
  return stats;
}

function getExtrasBreakdown(scorecard: ScorecardData) {
  const breakdown = {
    Wides: 0,
    'No Balls': 0,
    Byes: 0,
    'Leg Byes': 0,
  };

  scorecard.innings.forEach(innings => {
    if (innings.extras) {
      breakdown.Wides += innings.extras.wides || 0;
      breakdown['No Balls'] += innings.extras.noBalls || 0;
      breakdown.Byes += innings.extras.byes || 0;
      breakdown['Leg Byes'] += innings.extras.legByes || 0;
    }
  });

  return breakdown;
}
