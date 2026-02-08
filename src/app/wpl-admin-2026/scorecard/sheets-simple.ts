/**
 * Google Sheets Export - Simple Version
 * Exports scorecard data to Google Sheets format with tables
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
 * Export scorecard to Google Sheets using the Google Sheets API
 */
export async function exportScorecardToSheetsSimple(scorecard: ScorecardData) {
  try {
    // Load Google Sheets API
    await loadGoogleSheetsAPI();

    // Create a new spreadsheet
    const spreadsheetId = await createSpreadsheet(scorecard);

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
 * Create a new spreadsheet with scorecard data
 */
async function createSpreadsheet(scorecard: ScorecardData): Promise<string> {
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

  // Create the spreadsheet
  const title = `${scorecard.team1} vs ${scorecard.team2} - ${scorecard.date || 'Scorecard'}`;
  const response = await window.gapi.client.sheets.spreadsheets.create({
    properties: {
      title: title,
    },
  });

  const spreadsheetId = response.result.spreadsheetId;

  // Prepare all data to be written
  const requests: any[] = [];
  const dataToWrite: any[] = [];

  // Add match header
  dataToWrite.push({
    range: 'Sheet1!A1:G1',
    values: [[`🏏 ${scorecard.team1} vs ${scorecard.team2}`]],
  });

  if (scorecard.venue) {
    dataToWrite.push({
      range: 'Sheet1!A2:G2',
      values: [[`📍 Venue: ${scorecard.venue}`]],
    });
  }

  if (scorecard.date) {
    dataToWrite.push({
      range: 'Sheet1!A3:G3',
      values: [[`📅 Date: ${scorecard.date}`]],
    });
  }

  if (scorecard.result) {
    dataToWrite.push({
      range: 'Sheet1!A4:G4',
      values: [[`🏆 Result: ${scorecard.result}`]],
    });
  }

  let currentRow = 6;

  // Process each innings
  scorecard.innings.forEach((innings, inningsIndex) => {
    const inningsNumber = inningsIndex + 1;

    // Innings header
    dataToWrite.push({
      range: `Sheet1!A${currentRow}:G${currentRow}`,
      values: [[`⚡ INNINGS ${inningsNumber} - ${innings.battingTeam}`]],
    });
    currentRow += 2;

    // Batting section
    if (innings.batting && innings.batting.length > 0) {
      dataToWrite.push({
        range: `Sheet1!A${currentRow}:G${currentRow}`,
        values: [['🏏 BATTING']],
      });
      currentRow += 1;

      // Batting headers
      dataToWrite.push({
        range: `Sheet1!A${currentRow}:G${currentRow}`,
        values: [['Batter', 'Dismissal', 'R', 'B', '4s', '6s', 'SR']],
      });
      currentRow += 1;

      // Batting data
      const battingData = innings.batting.map(bat => {
        const dismissal = bat.isOut
          ? `${bat.dismissalType || 'out'}${bat.fielders && bat.fielders.length > 0 ? ` (${bat.fielders.join(', ')})` : ''}`
          : 'not out';

        return [
          bat.playerName,
          dismissal,
          bat.runs,
          bat.balls,
          bat.fours,
          bat.sixes,
          bat.strikeRate.toFixed(2),
        ];
      });

      dataToWrite.push({
        range: `Sheet1!A${currentRow}:G${currentRow + battingData.length - 1}`,
        values: battingData,
      });
      currentRow += battingData.length;

      // Extras
      if (innings.extras) {
        const extrasTotal = innings.extras.total || 0;
        const extrasBreakdown = [];
        if (innings.extras.wides) extrasBreakdown.push(`wd ${innings.extras.wides}`);
        if (innings.extras.noBalls) extrasBreakdown.push(`nb ${innings.extras.noBalls}`);
        if (innings.extras.byes) extrasBreakdown.push(`b ${innings.extras.byes}`);
        if (innings.extras.legByes) extrasBreakdown.push(`lb ${innings.extras.legByes}`);

        dataToWrite.push({
          range: `Sheet1!A${currentRow}:G${currentRow}`,
          values: [[`Extras`, extrasBreakdown.join(', '), extrasTotal]],
        });
        currentRow += 1;
      }

      // Total
      if (innings.total) {
        dataToWrite.push({
          range: `Sheet1!A${currentRow}:G${currentRow}`,
          values: [[`TOTAL`, `${innings.total.wickets} wkts, ${innings.total.overs} ov`, innings.total.runs]],
        });
        currentRow += 2;
      }

      // Fall of Wickets
      if (innings.fallOfWickets && innings.fallOfWickets.length > 0) {
        dataToWrite.push({
          range: `Sheet1!A${currentRow}:G${currentRow}`,
          values: [['📉 Fall of Wickets']],
        });
        currentRow += 1;

        const fowData = innings.fallOfWickets.map(fow => [
          `${fow.runs}-${fow.wickets}`,
          fow.playerName,
          `${fow.overs} ov`,
        ]);

        dataToWrite.push({
          range: `Sheet1!A${currentRow}:C${currentRow + fowData.length - 1}`,
          values: fowData,
        });
        currentRow += fowData.length + 1;
      }

      // Partnerships
      if (innings.partnerships && innings.partnerships.length > 0) {
        dataToWrite.push({
          range: `Sheet1!A${currentRow}:G${currentRow}`,
          values: [['🤝 Partnerships']],
        });
        currentRow += 1;

        dataToWrite.push({
          range: `Sheet1!A${currentRow}:D${currentRow}`,
          values: [['Player 1', 'Player 2', 'Runs', 'Balls']],
        });
        currentRow += 1;

        const partnershipData = innings.partnerships.map(p => [
          p.player1,
          p.player2,
          p.runs,
          p.balls,
        ]);

        dataToWrite.push({
          range: `Sheet1!A${currentRow}:D${currentRow + partnershipData.length - 1}`,
          values: partnershipData,
        });
        currentRow += partnershipData.length + 1;
      }
    }

    // Bowling section
    if (innings.bowling && innings.bowling.length > 0) {
      dataToWrite.push({
        range: `Sheet1!A${currentRow}:G${currentRow}`,
        values: [['⚾ BOWLING']],
      });
      currentRow += 1;

      // Bowling headers
      dataToWrite.push({
        range: `Sheet1!A${currentRow}:H${currentRow}`,
        values: [['Bowler', 'O', 'M', 'R', 'W', 'Econ', 'WD', 'NB']],
      });
      currentRow += 1;

      // Bowling data
      const bowlingData = innings.bowling.map(bowl => [
        bowl.bowlerName,
        bowl.overs,
        bowl.maidens,
        bowl.runs,
        bowl.wickets,
        bowl.economy.toFixed(2),
        bowl.wides || 0,
        bowl.noBalls || 0,
      ]);

      dataToWrite.push({
        range: `Sheet1!A${currentRow}:H${currentRow + bowlingData.length - 1}`,
        values: bowlingData,
      });
      currentRow += bowlingData.length + 2;
    }

    currentRow += 2; // Space between innings
  });

  // Write all data to the spreadsheet
  await window.gapi.client.sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: spreadsheetId,
    resource: {
      valueInputOption: 'USER_ENTERED',
      data: dataToWrite,
    },
  });

  // Format the spreadsheet (bold headers, freeze rows, etc.)
  await formatSpreadsheet(spreadsheetId);

  return spreadsheetId;
}

/**
 * Format the spreadsheet with styling
 */
async function formatSpreadsheet(spreadsheetId: string) {
  const requests = [
    // Freeze the first row
    {
      updateSheetProperties: {
        properties: {
          sheetId: 0,
          gridProperties: {
            frozenRowCount: 1,
          },
        },
        fields: 'gridProperties.frozenRowCount',
      },
    },
    // Auto-resize columns
    {
      autoResizeDimensions: {
        dimensions: {
          sheetId: 0,
          dimension: 'COLUMNS',
          startIndex: 0,
          endIndex: 8,
        },
      },
    },
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
export function exportScorecardToCSV(scorecard: ScorecardData) {
  const csvRows: string[] = [];

  // Add match header
  csvRows.push(`${scorecard.team1} vs ${scorecard.team2}`);
  if (scorecard.venue) csvRows.push(`Venue: ${scorecard.venue}`);
  if (scorecard.date) csvRows.push(`Date: ${scorecard.date}`);
  if (scorecard.result) csvRows.push(`Result: ${scorecard.result}`);
  csvRows.push('');

  // Process each innings
  scorecard.innings.forEach((innings, inningsIndex) => {
    const inningsNumber = inningsIndex + 1;

    // Innings header
    csvRows.push(`INNINGS ${inningsNumber} - ${innings.battingTeam}`);
    csvRows.push('');

    // Batting section
    if (innings.batting && innings.batting.length > 0) {
      csvRows.push('BATTING');
      csvRows.push('Batter,Dismissal,R,B,4s,6s,SR');

      innings.batting.forEach(bat => {
        const dismissal = bat.isOut
          ? `${bat.dismissalType || 'out'}${bat.fielders && bat.fielders.length > 0 ? ` (${bat.fielders.join(' ')})` : ''}`
          : 'not out';

        csvRows.push(
          `${bat.playerName},"${dismissal}",${bat.runs},${bat.balls},${bat.fours},${bat.sixes},${bat.strikeRate.toFixed(2)}`
        );
      });

      // Extras
      if (innings.extras) {
        const extrasTotal = innings.extras.total || 0;
        const extrasBreakdown = [];
        if (innings.extras.wides) extrasBreakdown.push(`wd ${innings.extras.wides}`);
        if (innings.extras.noBalls) extrasBreakdown.push(`nb ${innings.extras.noBalls}`);
        if (innings.extras.byes) extrasBreakdown.push(`b ${innings.extras.byes}`);
        if (innings.extras.legByes) extrasBreakdown.push(`lb ${innings.extras.legByes}`);

        csvRows.push(`Extras,"${extrasBreakdown.join(', ')}",${extrasTotal}`);
      }

      // Total
      if (innings.total) {
        csvRows.push(`TOTAL,"${innings.total.wickets} wkts ${innings.total.overs} ov",${innings.total.runs}`);
      }

      csvRows.push('');

      // Fall of Wickets
      if (innings.fallOfWickets && innings.fallOfWickets.length > 0) {
        csvRows.push('Fall of Wickets');
        csvRows.push('Score,Batter,Overs');

        innings.fallOfWickets.forEach(fow => {
          csvRows.push(`${fow.runs}-${fow.wickets},${fow.playerName},${fow.overs}`);
        });

        csvRows.push('');
      }

      // Partnerships
      if (innings.partnerships && innings.partnerships.length > 0) {
        csvRows.push('Partnerships');
        csvRows.push('Player 1,Player 2,Runs,Balls');

        innings.partnerships.forEach(p => {
          csvRows.push(`${p.player1},${p.player2},${p.runs},${p.balls}`);
        });

        csvRows.push('');
      }
    }

    // Bowling section
    if (innings.bowling && innings.bowling.length > 0) {
      csvRows.push('BOWLING');
      csvRows.push('Bowler,O,M,R,W,Econ,WD,NB');

      innings.bowling.forEach(bowl => {
        csvRows.push(
          `${bowl.bowlerName},${bowl.overs},${bowl.maidens},${bowl.runs},${bowl.wickets},${bowl.economy.toFixed(2)},${bowl.wides || 0},${bowl.noBalls || 0}`
        );
      });

      csvRows.push('');
    }

    csvRows.push('');
  });

  // Create CSV blob and download
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${scorecard.team1}_vs_${scorecard.team2}_scorecard.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
