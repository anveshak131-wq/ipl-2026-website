/**
 * Apple Numbers Export - Simple Version
 * Exports scorecard data as CSV optimized for Apple Numbers
 * Uses actual scorecard data structure from the admin panel
 */

// Helper functions to safely extract data
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

const formatDismissal = (dismissal: any): string => {
  if (!dismissal || dismissal.type === 'not out') return 'not out';
  return dismissal.details || dismissal.type || 'out';
};

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
          bat.strikeRate ? bat.strikeRate.toFixed(2) : '0.00',
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
        bowl.economy ? bowl.economy.toFixed(2) : '0.00',
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
 * Export scorecard to CSV format optimized for Apple Numbers
 */
export function exportToNumbersSimple(scorecard: any) {
  const csvRows: string[] = [];

  // Get team names
  const team1Name = getTeamName(scorecard?.matchInfo?.team1);
  const team2Name = getTeamName(scorecard?.matchInfo?.team2);

  // Title section
  csvRows.push(`"${team1Name} vs ${team2Name}"`);
  csvRows.push('');
  
  // Match information
  csvRows.push('"MATCH INFORMATION"');
  if (scorecard?.matchInfo?.venue) csvRows.push(`"Venue","${scorecard.matchInfo.venue}"`);
  if (scorecard?.matchInfo?.date) csvRows.push(`"Date","${scorecard.matchInfo.date}"`);
  if (scorecard?.result?.winner) {
    const resultStr = `${scorecard.result.winner} won by ${scorecard.result.margin || 'N/A'}`;
    csvRows.push(`"Result","${resultStr}"`);
  }
  csvRows.push('');
  csvRows.push('');

  // Process each innings
  const innings = scorecard?.innings || [];
  innings.forEach((inn: any, inningsIndex: number) => {
    const inningsNumber = inningsIndex + 1;
    
    // Get batting team name
    const battingTeam = inn.battingTeamId ? 
      (String(inn.battingTeamId) === String(scorecard?.matchInfo?.team1?.id) ? team1Name : team2Name) :
      `Team ${inningsNumber}`;

    // Innings header
    csvRows.push(`"INNINGS ${inningsNumber} - ${battingTeam}"`);
    csvRows.push('');

    // Batting section
    const batting = inn.batting || [];
    if (batting.length > 0) {
      csvRows.push('"BATTING"');
      csvRows.push('"Batter","Dismissal","Runs","Balls","4s","6s","Strike Rate"');

      batting.forEach((bat: any) => {
        const playerName = getPlayerName(bat);
        const dismissal = formatDismissal(bat.dismissal);
        const runs = bat.runs ?? 0;
        const balls = bat.balls ?? 0;
        const strikeRate = balls > 0 ? ((runs / balls) * 100).toFixed(2) : '0.00';

        csvRows.push(
          `"${playerName}","${dismissal}",${runs},${balls},${bat.fours ?? 0},${bat.sixes ?? 0},${strikeRate}`
        );
      });

      csvRows.push('');

      // Extras
      const extras = inn.extras || {};
      const extrasTotal = (extras.wides || 0) + (extras.noBalls || 0) + (extras.byes || 0) + (extras.legByes || 0);
      const extrasBreakdown = [];
      if (extras.wides) extrasBreakdown.push(`wd ${extras.wides}`);
      if (extras.noBalls) extrasBreakdown.push(`nb ${extras.noBalls}`);
      if (extras.byes) extrasBreakdown.push(`b ${extras.byes}`);
      if (extras.legByes) extrasBreakdown.push(`lb ${extras.legByes}`);

      csvRows.push(`"Extras","${extrasBreakdown.join(', ')}",${extrasTotal}`);

      // Total
      const totalRuns = inn.totalRuns ?? 0;
      const totalWickets = inn.totalWickets ?? 0;
      const totalOvers = inn.totalOvers ?? 0;
      csvRows.push(
        `"TOTAL","${totalWickets} wkts, ${totalOvers} ov",${totalRuns}`
      );

      csvRows.push('');
      csvRows.push('');

      // Fall of Wickets
      if (inn.fallOfWickets && inn.fallOfWickets.length > 0) {
        csvRows.push('"FALL OF WICKETS"');
        csvRows.push('"Score","Batter","Overs"');

        inn.fallOfWickets.forEach((fow: any) => {
          csvRows.push(`"${fow.score}","${fow.player}",${fow.over}`);
        });

        csvRows.push('');
        csvRows.push('');
      }

      // Partnerships
      if (inn.partnerships && inn.partnerships.length > 0) {
        csvRows.push('"PARTNERSHIPS"');
        csvRows.push('"Player 1","Player 2","Runs","Balls"');

        inn.partnerships.forEach((p: any) => {
          const player1 = p.batsman1 || 'Unknown';
          const player2 = p.batsman2 || 'Unknown';
          const runs = p.totalRuns || '0';
          const balls = 'N/A'; // Calculate if needed
          csvRows.push(`"${player1}","${player2}",${runs},${balls}`);
        });

        csvRows.push('');
        csvRows.push('');
      }
    }

    // Bowling section
    const bowling = inn.bowling || [];
    if (bowling.length > 0) {
      csvRows.push('"BOWLING"');
      csvRows.push('"Bowler","Overs","Maidens","Runs","Wickets","Economy","Wides","No Balls"');

      bowling.forEach((bowl: any) => {
        const bowlerName = getPlayerName(bowl);
        const overs = bowl.overs ?? 0;
        const runs = bowl.runs ?? 0;
        const econ = bowl.economyRate ?? (overs > 0 ? (runs / overs).toFixed(2) : '0.00');

        csvRows.push(
          `"${bowlerName}",${overs},${bowl.maidens ?? 0},${runs},${bowl.wickets ?? 0},${econ},${bowl.wides ?? 0},${bowl.noBalls ?? 0}`
        );
      });

      csvRows.push('');
      csvRows.push('');
    }

    csvRows.push('');
  });

  // Footer
  csvRows.push('');
  csvRows.push('"Generated by SportsUP18"');
  csvRows.push(`"Date: ${new Date().toLocaleDateString()}"`);

  // Create CSV blob and download
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  const filename = `${team1Name}_vs_${team2Name}_scorecard.csv`;
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  console.log(`✅ CSV exported: ${filename}`);
}
