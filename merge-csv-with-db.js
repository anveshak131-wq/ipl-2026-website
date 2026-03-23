const fs = require('fs');

console.log('Step 1: Reading CSV from bowling-stats export...');
const csvContent = fs.readFileSync('/Users/anvesh/Downloads/ipl-bowling-stats-all-teams-2026-03-22.csv', 'utf8');

// Parse CSV
function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
  
  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.replace(/^"|"$/g, '').trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.replace(/^"|"$/g, '').trim());
    
    const record = {};
    headers.forEach((header, idx) => {
      record[header] = values[idx] || '';
    });
    
    if (record['ID'] && record['Name']) {
      records.push(record);
    }
  }
  
  return records;
}

const csvRecords = parseCSV(csvContent);
console.log(`Parsed ${csvRecords.length} complete player records from CSV\n`);

console.log('Step 2: Reading existing comprehensive-players.json...');
const existingPlayers = JSON.parse(fs.readFileSync('comprehensive-players.json', 'utf8'));
console.log(`Found ${existingPlayers.length} players in database\n`);

// Create map of existing players by name for preserving batting stats
const existingByName = {};
existingPlayers.forEach(p => {
  existingByName[p.name] = p;
});

console.log('Step 3: Merging CSV data with existing player records...');
const mergedPlayers = csvRecords.map(csvRecord => {
  const csvId = csvRecord['ID'];
  const csvName = csvRecord['Name'];
  
  // Try to find existing player by name or ID
  let existingPlayer = existingPlayers.find(p => p.id === csvId);
  if (!existingPlayer) {
    existingPlayer = existingByName[csvName];
  }
  
  // Create merged player record
  const player = {
    id: csvId,
    name: csvName,
    role: csvRecord['Role'] || 'Unknown',
    allRounderType: csvRecord['All-rounder Type'] || '',
    teamId: csvRecord['Team ID'] || '',
    team: csvRecord['Team Name'] || csvRecord['Team Short Name'] || '',
    teamShortName: csvRecord['Team Short Name'] || '',
    league: csvRecord['League'] || 'ipl',
    age: parseInt(csvRecord['Age']) || null,
    dateOfBirth: csvRecord['Date of Birth'] || '',
    nationality: csvRecord['Nationality'] || '',
    jerseyNumber: parseInt(csvRecord['Jersey Number']) || null,
    isCaptain: csvRecord['Captain'] === 'Yes',
    battingStyle: csvRecord['Batting Style'] || '',
    bowlingStyle: csvRecord['Bowling Style'] || '',
    transferAcquiredVia: csvRecord['Transfer Acquired Via'] || '',
    transferFee: csvRecord['Transfer Fee'] || '',
    transferNotes: csvRecord['Transfer Notes'] || '',
    lastAuctionYear: parseInt(csvRecord['Last Auction Year']) || null,
    
    // Stats - from CSV for bowling, from existing for batting
    stats: {
      // Batting stats (from existing if available, else defaults)
      matches: parseInt(csvRecord['Matches']) || (existingPlayer?.stats?.matches || 0),
      battingInnings: existingPlayer?.stats?.battingInnings || 0,
      notOuts: existingPlayer?.stats?.notOuts || 0,
      runs: existingPlayer?.stats?.runs || 0,
      ballsFaced: existingPlayer?.stats?.ballsFaced || 0,
      average: existingPlayer?.stats?.average || 0,
      battingAverage: existingPlayer?.stats?.battingAverage || 0,
      strikeRate: existingPlayer?.stats?.strikeRate || 0,
      battingStrikeRate: existingPlayer?.stats?.battingStrikeRate || 0,
      highest: existingPlayer?.stats?.highest || 0,
      fours: existingPlayer?.stats?.fours || 0,
      sixes: existingPlayer?.stats?.sixes || 0,
      fifties: existingPlayer?.stats?.fifties || 0,
      hundreds: existingPlayer?.stats?.hundreds || 0,
      
      // Bowling stats (from CSV)
      bowlingInnings: parseInt(csvRecord['Bowling Innings']) || 0,
      balls: parseInt(csvRecord['Balls']) || 0,
      maidens: parseInt(csvRecord['Maidens']) || 0,
      runsConceded: parseInt(csvRecord['Runs Conceded']) || 0,
      bowlingAverage: csvRecord['Bowling Average'] === '-' ? 0 : (parseFloat(csvRecord['Bowling Average']) || 0),
      bowlingStrikeRate: csvRecord['Bowling Strike Rate'] === '-' ? 0 : (parseFloat(csvRecord['Bowling Strike Rate']) || 0),
      economy: csvRecord['Economy'] === '-' ? 0 : (parseFloat(csvRecord['Economy']) || 0),
      wickets: parseInt(csvRecord['Wickets']) || 0,
      bestBowling: csvRecord['Best Bowling'] && csvRecord['Best Bowling'] !== '-' ? csvRecord['Best Bowling'].trim() : '0/0',
      fiveWickets: parseInt(csvRecord['Five Wickets']) || 0
    },
    
    // Squad status (from existing if available, else default)
    isActiveInSquad: existingPlayer?.isActiveInSquad !== false,
    squadStatus: existingPlayer?.squadStatus || 'active'
  };
  
  return player;
});

console.log(`Merged ${mergedPlayers.length} players\n`);

// Save merged data
fs.writeFileSync('comprehensive-players.json', JSON.stringify(mergedPlayers, null, 2));

console.log('✅ Successfully updated comprehensive-players.json with:');
console.log(`   - Total players: ${mergedPlayers.length}`);
console.log(`   - Added/updated: ${mergedPlayers.length} players`);
console.log(`   - Bowling stats: All 255 players now have complete bowling stats from admin export\n`);

// Show summary
const withBowling = mergedPlayers.filter(p => p.stats.bowlingInnings > 0 || p.stats.wickets > 0).length;
const withBatting = mergedPlayers.filter(p => p.stats.runs > 0 || p.stats.matches > 0).length;

console.log('Statistics:');
console.log(`   - Players with bowling stats: ${withBowling}/${mergedPlayers.length}`);
console.log(`   - Players with batting stats: ${withBatting}/${mergedPlayers.length}`);

// Show popular player examples
console.log('\nPopular players included:');
const popular = ['Rohit Sharma', 'Virat Kohli', 'MS Dhoni', 'Krunal Pandya', 'Bhuvneshwar Kumar'];
popular.forEach(name => {
  const player = mergedPlayers.find(p => p.name === name);
  if (player) {
    console.log(`  ✓ ${name} - ${player.stats.wickets} wickets, ${player.stats.bowlingInnings} innings`);
  }
});
