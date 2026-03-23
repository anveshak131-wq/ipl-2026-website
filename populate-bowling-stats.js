const fs = require('fs');

console.log('Reading CSV file...');
const csvContent = fs.readFileSync('/Users/anvesh/Downloads/ipl-bowling-stats-all-teams-2026-03-22.csv', 'utf8');

// Simple CSV parser - handles quoted fields
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
    
    if (record['Name']) {
      records.push(record);
    }
  }
  
  return records;
}

const records = parseCSV(csvContent);
console.log('Parsed', records.length, 'records from CSV');

// Create maps keyed by player ID and Name
const csvMapById = {};
const csvMapByName = {};
records.forEach((record) => {
  const playerId = record['ID']?.trim();
  const playerName = record['Name']?.trim();
  
  if (playerId) {
    csvMapById[playerId] = record;
  }
  if (playerName) {
    csvMapByName[playerName] = record;
  }
});

console.log('CSV has', Object.keys(csvMapById).length, 'unique IDs and', Object.keys(csvMapByName).length, 'unique names');

// Read comprehensive-players.json
console.log('Reading comprehensive-players.json...');
const players = JSON.parse(fs.readFileSync('/Users/anvesh/Downloads/sportsup99/comprehensive-players.json', 'utf8'));

// Update players with CSV data - try ID match first, then name match
let updatedById = 0;
let updatedByName = 0;
const updated_players = players.map(player => {
  let csvRecord = csvMapById[player.id];
  let matchType = 'ID';
  
  if (!csvRecord) {
    csvRecord = csvMapByName[player.name];
    if (csvRecord) matchType = 'Name';
  }
  
  if (csvRecord) {
    const stats = {
      ...player.stats,
      // Bowling stats from CSV
      bowlingInnings: parseInt(csvRecord['Bowling Innings']) || 0,
      balls: parseInt(csvRecord['Balls']) || 0,
      maidens: parseInt(csvRecord['Maidens']) || 0,
      runsConceded: parseInt(csvRecord['Runs Conceded']) || 0,
      bowlingAverage: csvRecord['Bowling Average'] === '-' ? 0 : (parseFloat(csvRecord['Bowling Average']) || 0),
      bowlingStrikeRate: csvRecord['Bowling Strike Rate'] === '-' ? 0 : (parseFloat(csvRecord['Bowling Strike Rate']) || 0),
      economy: csvRecord['Economy'] === '-' ? 0 : (parseFloat(csvRecord['Economy']) || 0),
      wickets: parseInt(csvRecord['Wickets']) || player.stats.wickets || 0,
      bestBowling: csvRecord['Best Bowling'] && csvRecord['Best Bowling'] !== '-' ? csvRecord['Best Bowling'].trim() : (player.stats.bestBowling || '0/0'),
      fiveWickets: parseInt(csvRecord['Five Wickets']) || 0
    };
    
    if (matchType === 'ID') {
      updatedById++;
    } else {
      updatedByName++;
    }
    
    return {
      ...player,
      stats
    };
  }
  
  return player;
});

fs.writeFileSync('/Users/anvesh/Downloads/sportsup99/comprehensive-players.json', JSON.stringify(updated_players, null, 2));
console.log('✅ Updated', updatedById + updatedByName, 'players total:');
console.log('   - By ID match:', updatedById);
console.log('   - By Name match:', updatedByName);

// Show examples
console.log('\nSample updates:');
const krunal = updated_players.find(p => p.name && p.name.includes('Krunal'));
if (krunal) {
  console.log(krunal.name + ':', {
    bowlingInnings: krunal.stats.bowlingInnings,
    balls: krunal.stats.balls,
    maidens: krunal.stats.maidens,
    wickets: krunal.stats.wickets,
    runsConceded: krunal.stats.runsConceded,
    bowlingAverage: krunal.stats.bowlingAverage,
    bowlingStrikeRate: krunal.stats.bowlingStrikeRate,
    economy: krunal.stats.economy,
    bestBowling: krunal.stats.bestBowling,
    fiveWickets: krunal.stats.fiveWickets
  });
}

const bhuvneshwar = updated_players.find(p => p.name && p.name.includes('Bhuvneshwar'));
if (bhuvneshwar) {
  console.log(bhuvneshwar.name + ':', {
    bowlingInnings: bhuvneshwar.stats.bowlingInnings,
    balls: bhuvneshwar.stats.balls,
    maidens: bhuvneshwar.stats.maidens,
    wickets: bhuvneshwar.stats.wickets,
    runsConceded: bhuvneshwar.stats.runsConceded,
    bowlingAverage: bhuvneshwar.stats.bowlingAverage,
    bowlingStrikeRate: bhuvneshwar.stats.bowlingStrikeRate,
    economy: bhuvneshwar.stats.economy,
    bestBowling: bhuvneshwar.stats.bestBowling,
    fiveWickets: bhuvneshwar.stats.fiveWickets
  });
}
