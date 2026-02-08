/**
 * Google Sheets Export - Advanced Version with Charts
 * Exports scorecard data to Google Sheets with chart data sheets
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
 * Export scorecard to Google Sheets with chart data sheets
 */
export async function exportScorecardToSheetsWithCharts(scorecard: ScorecardData) {
  try {
    // Load Google Sheets API
    await loadGoogleSheetsAPI();

    // Create a new spreadsheet with charts
    const spreadsheetId = await createSpreadsheetWithCharts(scorecard);

    // Open the spreadsheet in a new tab
    window.open(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`, '_blank');

    return { success: true, spreadsheetId };
  } catch (error) {
    console.error('Error exporting to Google Sheets:', error);
    throw error;
  }
}

/**
 * Load Google Sheets API
 */
async function loadGoogleSheetsAPI(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if gapi is already loaded
    if (typeof window.gapi !== 'undefined' && window.gapi.client) {
      resolve();
      return;
    }

    // Load the Google API client
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      window.gapi.load('client:auth2', () => {
        resolve();
      });
    };
    script.onerror = () => reject(new Error('Failed to load Google Sheets API'));
    document.head.appendChild(script);
  });
}

/**
 * Create a new spreadsheet with scorecard data and chart sheets
 */
async function createSpreadsheetWithCharts(scorecard: ScorecardData): Promise<string> {
  // Initialize the Google Sheets API
  const API_KEY = 'YOUR_GOOGLE_API_KEY'; // Replace with actual API key
  const CLIENT_ID = 'YOUR_CLIENT_ID'; // Replace with actual client ID
  const DISCOVERY_DOCS = ['https://sheets.googleapis.com/$discovery/rest?version=v4'];
  const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

  await window.gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
    scope: SCOPES,
  });

  // Authenticate the user
  const authInstance = window.gapi.auth2.getAuthInstance();
  if (!authInstance.isSignedIn.get()) {
    await authInstance.signIn();
  }

  // Create the spreadsheet with multiple sheets
  const title = `${scorecard.team1} vs ${scorecard.team2} - Charts`;
  const response = await window.gapi.client.sheets.spreadsheets.create({
    properties: {
      title: title,
    },
    sheets: [
      { properties: { title: 'Match Overview', sheetId: 0 } },
      { properties: { title: 'Batting Analysis', sheetId: 1 } },
      { properties: { title: 'Bowling Analysis', sheetId: 2 } },
      { properties: { title: 'Chart 1 - Top Scorers', sheetId: 3 } },
      { properties: { title: 'Chart 2 - Strike Rates', sheetId: 4 } },
      { properties: { title: 'Chart 3 - Boundaries', sheetId: 5 } },
      { properties: { title: 'Chart 4 - Wicket Takers', sheetId: 6 } },
      { properties: { title: 'Chart 5 - Economy Rates', sheetId: 7 } },
      { properties: { title: 'Chart 6 - Team Comparison', sheetId: 8 } },
      { properties: { title: 'Chart 7 - Run Share', sheetId: 9 } },
      { properties: { title: 'Chart 8 - Extras', sheetId: 10 } },
      { properties: { title: 'Chart 9 - Bowling Overs', sheetId: 11 } },
      { properties: { title: 'Chart 10 - Runs vs Balls', sheetId: 12 } },
      { properties: { title: 'Chart 11 - Boundary %', sheetId: 13 } },
      { properties: { title: 'Chart 12 - Maidens', sheetId: 14 } },
    ],
  });

  const spreadsheetId = response.result.spreadsheetId;

  // Prepare all data for all sheets
  const dataToWrite: any[] = [];

  // 1. Match Overview Sheet
  dataToWrite.push({
    range: 'Match Overview!A1',
    values: [
      ['Match Overview'],
      [''],
      ['Match', `${scorecard.team1} vs ${scorecard.team2}`],
      ['Venue', scorecard.venue || 'N/A'],
      ['Date', scorecard.date || 'N/A'],
      ['Result', scorecard.result || 'N/A'],
    ],
  });

  // 2. Batting Analysis Sheet
  const allBatters: any[] = [['Player', 'Team', 'Runs', 'Balls', '4s', '6s', 'SR', 'Dismissal']];
  scorecard.innings.forEach(innings => {
    innings.batting.forEach(bat => {
      allBatters.push([
        bat.playerName,
        innings.battingTeam,
        bat.runs,
        bat.balls,
        bat.fours,
        bat.sixes,
        bat.strikeRate,
        bat.isOut ? (bat.dismissalType || 'out') : 'not out',
      ]);
    });
  });
  dataToWrite.push({
    range: 'Batting Analysis!A1',
    values: allBatters,
  });

  // 3. Bowling Analysis Sheet
  const allBowlers: any[] = [['Bowler', 'Team', 'Overs', 'Maidens', 'Runs', 'Wickets', 'Economy', 'Wides', 'No Balls']];
  scorecard.innings.forEach(innings => {
    innings.bowling.forEach(bowl => {
      allBowlers.push([
        bowl.bowlerName,
        innings.bowlingTeam,
        bowl.overs,
        bowl.maidens,
        bowl.runs,
        bowl.wickets,
        bowl.economy,
        bowl.wides || 0,
        bowl.noBalls || 0,
      ]);
    });
  });
  dataToWrite.push({
    range: 'Bowling Analysis!A1',
    values: allBowlers,
  });

  // Chart Data Sheets

  // Chart 1: Top Scorers (Bar Chart)
  const topScorers = getAllBatters(scorecard)
    .sort((a, b) => b.runs - a.runs)
    .slice(0, 10);
  
  const chart1Data: any[] = [
    ['TOP SCORERS - Create a bar chart: X-axis = Player, Y-axis = Runs'],
    [''],
    ['Player', 'Runs', 'Balls', 'Team'],
  ];
  topScorers.forEach(bat => {
    chart1Data.push([bat.playerName, bat.runs, bat.balls, bat.team]);
  });
  dataToWrite.push({
    range: 'Chart 1 - Top Scorers!A1',
    values: chart1Data,
  });

  // Chart 2: Strike Rates (Column Chart)
  const strikeRates = getAllBatters(scorecard)
    .filter(b => b.balls >= 10)
    .sort((a, b) => b.strikeRate - a.strikeRate)
    .slice(0, 10);
  
  const chart2Data: any[] = [
    ['STRIKE RATES - Create a column chart: X-axis = Player, Y-axis = Strike Rate'],
    [''],
    ['Player', 'Strike Rate', 'Runs', 'Balls'],
  ];
  strikeRates.forEach(bat => {
    chart2Data.push([bat.playerName, bat.strikeRate, bat.runs, bat.balls]);
  });
  dataToWrite.push({
    range: 'Chart 2 - Strike Rates!A1',
    values: chart2Data,
  });

  // Chart 3: Boundaries (Stacked Bar Chart)
  const boundaries = getAllBatters(scorecard)
    .filter(b => (b.fours + b.sixes) > 0)
    .sort((a, b) => (b.fours + b.sixes) - (a.fours + a.sixes))
    .slice(0, 10);
  
  const chart3Data: any[] = [
    ['BOUNDARIES - Create a stacked bar chart: X-axis = Player, Y-axis = Count (stack 4s and 6s)'],
    [''],
    ['Player', '4s', '6s', 'Total Boundaries'],
  ];
  boundaries.forEach(bat => {
    chart3Data.push([bat.playerName, bat.fours, bat.sixes, bat.fours + bat.sixes]);
  });
  dataToWrite.push({
    range: 'Chart 3 - Boundaries!A1',
    values: chart3Data,
  });

  // Chart 4: Wicket Takers (Bar Chart)
  const wicketTakers = getAllBowlers(scorecard)
    .filter(b => b.wickets > 0)
    .sort((a, b) => b.wickets - a.wickets)
    .slice(0, 10);
  
  const chart4Data: any[] = [
    ['WICKET TAKERS - Create a bar chart: X-axis = Bowler, Y-axis = Wickets'],
    [''],
    ['Bowler', 'Wickets', 'Runs', 'Economy'],
  ];
  wicketTakers.forEach(bowl => {
    chart4Data.push([bowl.bowlerName, bowl.wickets, bowl.runs, bowl.economy]);
  });
  dataToWrite.push({
    range: 'Chart 4 - Wicket Takers!A1',
    values: chart4Data,
  });

  // Chart 5: Economy Rates (Column Chart)
  const economyRates = getAllBowlers(scorecard)
    .filter(b => b.overs >= 2)
    .sort((a, b) => a.economy - b.economy)
    .slice(0, 10);
  
  const chart5Data: any[] = [
    ['ECONOMY RATES - Create a column chart: X-axis = Bowler, Y-axis = Economy'],
    [''],
    ['Bowler', 'Economy', 'Overs', 'Runs', 'Wickets'],
  ];
  economyRates.forEach(bowl => {
    chart5Data.push([bowl.bowlerName, bowl.economy, bowl.overs, bowl.runs, bowl.wickets]);
  });
  dataToWrite.push({
    range: 'Chart 5 - Economy Rates!A1',
    values: chart5Data,
  });

  // Chart 6: Team Comparison (Clustered Column Chart)
  const teamStats = getTeamStats(scorecard);
  const chart6Data: any[] = [
    ['TEAM COMPARISON - Create a clustered column chart: Categories = Teams, Series = Runs/Wickets/Extras'],
    [''],
    ['Team', 'Total Runs', 'Wickets Lost', 'Extras', 'Overs Bowled'],
  ];
  teamStats.forEach(team => {
    chart6Data.push([team.team, team.runs, team.wickets, team.extras, team.overs]);
  });
  dataToWrite.push({
    range: 'Chart 6 - Team Comparison!A1',
    values: chart6Data,
  });

  // Chart 7: Run Share (Pie Chart)
  const runShare = getAllBatters(scorecard)
    .sort((a, b) => b.runs - a.runs)
    .slice(0, 8);
  
  const chart7Data: any[] = [
    ['RUN SHARE - Create a pie chart: Values = Runs, Labels = Player'],
    [''],
    ['Player', 'Runs'],
  ];
  runShare.forEach(bat => {
    chart7Data.push([bat.playerName, bat.runs]);
  });
  dataToWrite.push({
    range: 'Chart 7 - Run Share!A1',
    values: chart7Data,
  });

  // Chart 8: Extras Breakdown (Pie Chart)
  const extrasBreakdown = getExtrasBreakdown(scorecard);
  const chart8Data: any[] = [
    ['EXTRAS BREAKDOWN - Create a pie chart: Values = Count, Labels = Type'],
    [''],
    ['Type', 'Count'],
  ];
  Object.entries(extrasBreakdown).forEach(([type, count]) => {
    if (count > 0) {
      chart8Data.push([type, count]);
    }
  });
  dataToWrite.push({
    range: 'Chart 8 - Extras!A1',
    values: chart8Data,
  });

  // Chart 9: Bowling Overs Distribution (Pie Chart)
  const oversDistribution = getAllBowlers(scorecard)
    .filter(b => b.overs > 0)
    .sort((a, b) => b.overs - a.overs)
    .slice(0, 8);
  
  const chart9Data: any[] = [
    ['BOWLING OVERS - Create a pie chart: Values = Overs, Labels = Bowler'],
    [''],
    ['Bowler', 'Overs'],
  ];
  oversDistribution.forEach(bowl => {
    chart9Data.push([bowl.bowlerName, bowl.overs]);
  });
  dataToWrite.push({
    range: 'Chart 9 - Bowling Overs!A1',
    values: chart9Data,
  });

  // Chart 10: Runs vs Balls (Scatter Plot)
  const runsVsBalls = getAllBatters(scorecard)
    .filter(b => b.balls >= 5);
  
  const chart10Data: any[] = [
    ['RUNS VS BALLS - Create a scatter plot: X-axis = Balls, Y-axis = Runs'],
    [''],
    ['Player', 'Balls', 'Runs', 'Strike Rate'],
  ];
  runsVsBalls.forEach(bat => {
    chart10Data.push([bat.playerName, bat.balls, bat.runs, bat.strikeRate]);
  });
  dataToWrite.push({
    range: 'Chart 10 - Runs vs Balls!A1',
    values: chart10Data,
  });

  // Chart 11: Boundary Percentage (Bar Chart)
  const boundaryPercentage = getAllBatters(scorecard)
    .filter(b => b.runs >= 10)
    .map(bat => ({
      ...bat,
      boundaryRuns: (bat.fours * 4) + (bat.sixes * 6),
      boundaryPercentage: ((bat.fours * 4 + bat.sixes * 6) / bat.runs) * 100,
    }))
    .sort((a, b) => b.boundaryPercentage - a.boundaryPercentage)
    .slice(0, 10);
  
  const chart11Data: any[] = [
    ['BOUNDARY % - Create a bar chart: X-axis = Player, Y-axis = Boundary %'],
    [''],
    ['Player', 'Boundary %', 'Boundary Runs', 'Total Runs'],
  ];
  boundaryPercentage.forEach(bat => {
    chart11Data.push([bat.playerName, bat.boundaryPercentage.toFixed(1), bat.boundaryRuns, bat.runs]);
  });
  dataToWrite.push({
    range: 'Chart 11 - Boundary %!A1',
    values: chart11Data,
  });

  // Chart 12: Maiden Overs (Column Chart)
  const maidenOvers = getAllBowlers(scorecard)
    .filter(b => b.maidens > 0)
    .sort((a, b) => b.maidens - a.maidens);
  
  const chart12Data: any[] = [
    ['MAIDEN OVERS - Create a column chart: X-axis = Bowler, Y-axis = Maidens'],
    [''],
    ['Bowler', 'Maidens', 'Total Overs', 'Economy'],
  ];
  maidenOvers.forEach(bowl => {
    chart12Data.push([bowl.bowlerName, bowl.maidens, bowl.overs, bowl.economy]);
  });
  dataToWrite.push({
    range: 'Chart 12 - Maidens!A1',
    values: chart12Data,
  });

  // Write all data to the spreadsheet
  await window.gapi.client.sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: spreadsheetId,
    resource: {
      valueInputOption: 'USER_ENTERED',
      data: dataToWrite,
    },
  });

  // Format the spreadsheet
  await formatSpreadsheetWithCharts(spreadsheetId);

  return spreadsheetId;
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

/**
 * Format the spreadsheet with styling
 */
async function formatSpreadsheetWithCharts(spreadsheetId: string) {
  const requests = [
    // Auto-resize all columns in all sheets
    ...Array.from({ length: 15 }, (_, i) => ({
      autoResizeDimensions: {
        dimensions: {
          sheetId: i,
          dimension: 'COLUMNS',
          startIndex: 0,
          endIndex: 10,
        },
      },
    })),
  ];

  await window.gapi.client.sheets.spreadsheets.batchUpdate({
    spreadsheetId: spreadsheetId,
    resource: {
      requests: requests,
    },
  });
}

/**
 * Fallback: Download as CSV for manual Google Sheets import
 */
export function exportChartsDataToCSV(scorecard: ScorecardData) {
  // Create a simple CSV with chart-ready data
  const csvRows: string[] = [];

  csvRows.push('CHART DATA FOR GOOGLE SHEETS');
  csvRows.push('');
  csvRows.push('Import this CSV to Google Sheets and create charts from the data below');
  csvRows.push('');

  // Top Scorers
  csvRows.push('TOP SCORERS');
  csvRows.push('Player,Runs,Balls');
  const allBatters = getAllBatters(scorecard);
  allBatters
    .sort((a, b) => b.runs - a.runs)
    .slice(0, 10)
    .forEach(bat => {
      csvRows.push(`${bat.playerName},${bat.runs},${bat.balls}`);
    });

  csvRows.push('');
  csvRows.push('');

  // Wicket Takers
  csvRows.push('WICKET TAKERS');
  csvRows.push('Bowler,Wickets,Economy');
  const allBowlers = getAllBowlers(scorecard);
  allBowlers
    .filter(b => b.wickets > 0)
    .sort((a, b) => b.wickets - a.wickets)
    .slice(0, 10)
    .forEach(bowl => {
      csvRows.push(`${bowl.bowlerName},${bowl.wickets},${bowl.economy}`);
    });

  // Create blob and download
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${scorecard.team1}_vs_${scorecard.team2}_charts.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
