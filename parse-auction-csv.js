/**
 * Parse IPL Mini Auction 2026 CSV and convert to player objects
 */

const fs = require('fs');
const path = require('path');

// Team mapping: CSV abbreviation -> Team ID
const teamMapping = {
  'RCB': '1',  // Royal Challengers Bengaluru
  'MI': '2',   // Mumbai Indians
  'SRH': '3',  // Sunrisers Hyderabad
  'GT': '4',   // Gujarat Titans
  'PBKS': '5', // Punjab Kings
  'DC': '6',   // Delhi Capitals
  'LSG': '7',  // Lucknow Super Giants
  'RR': '8',   // Rajasthan Royals
  'KKR': '9',  // Kolkata Knight Riders
  'CSK': '10'  // Chennai Super Kings
};

// Role mapping: CSV role -> Our role format
const roleMapping = {
  'Batter': 'Batsman',
  'WK-Batter': 'Wicket-keeper',
  'Bowler': 'Bowler',
  'All-Rounder': 'All-rounder'
};

// Nationality mapping
const nationalityMapping = {
  'Indian': 'India',
  'Overseas': null // Will be determined from common patterns
};

// Common overseas nationalities based on names
function guessNationality(name) {
  const nameLower = name.toLowerCase();
  // Australian names
  if (nameLower.includes('cameron') || nameLower.includes('cooper') || nameLower.includes('matthew') || 
      nameLower.includes('riley') || nameLower.includes('jordan') || nameLower.includes('jack') ||
      nameLower.includes('zak') || nameLower.includes('luke')) {
    return 'Australia';
  }
  // New Zealand names
  if (nameLower.includes('rachin') || nameLower.includes('finn') || nameLower.includes('tim') ||
      nameLower.includes('matt') || nameLower.includes('kyle') || nameLower.includes('jacob')) {
    return 'New Zealand';
  }
  // South African names
  if (nameLower.includes('anrich') || nameLower.includes('lungi') || nameLower.includes('quinton')) {
    return 'South Africa';
  }
  // Sri Lankan names
  if (nameLower.includes('matheesha') || nameLower.includes('pathirana') || nameLower.includes('wanindu') ||
      nameLower.includes('pathum') || nameLower.includes('akeal')) {
    return 'Sri Lanka';
  }
  // English names
  if (nameLower.includes('liam') || nameLower.includes('josh') || nameLower.includes('adam') ||
      nameLower.includes('ben') || nameLower.includes('david')) {
    return 'England';
  }
  // West Indies
  if (nameLower.includes('jason')) {
    return 'West Indies';
  }
  // Default to Australia for unknown overseas
  return 'Australia';
}

// Parse CSV
const csvPath = path.join(__dirname, '../ipl players 2026 list/IPL_Mini_Auction_2026.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.trim().split('\n');

// Skip header
const dataLines = lines.slice(1).filter(line => line.trim());

const players = [];
let playerId = 100; // Start from 100 to avoid conflicts

dataLines.forEach((line, index) => {
  const [playerName, teamAbbr, priceCr, role, category, nationality] = line.split(',');
  
  if (!playerName || !teamAbbr) return;
  
  const teamId = teamMapping[teamAbbr.trim()];
  if (!teamId) {
    console.warn(`Unknown team: ${teamAbbr} for player ${playerName}`);
    return;
  }
  
  const mappedRole = roleMapping[role.trim()] || 'Batsman';
  const isIndian = nationality.trim() === 'Indian';
  const finalNationality = isIndian ? 'India' : guessNationality(playerName);
  
  // Determine bowling and batting styles based on role
  let bowlingStyle = 'N/A (Batsman)';
  let battingStyle = 'Right-handed bat';
  
  if (mappedRole === 'Bowler') {
    bowlingStyle = 'Right-arm medium-fast';
    battingStyle = 'Right-handed bat';
  } else if (mappedRole === 'All-rounder') {
    bowlingStyle = 'Right-arm medium';
    battingStyle = 'Right-handed bat';
  } else if (mappedRole === 'Wicket-keeper') {
    bowlingStyle = 'N/A (Wicket-keeper)';
    battingStyle = 'Right-handed bat';
  }
  
  // Generate realistic stats based on role and category
  const isCapped = category.trim() === 'Capped';
  const baseMatches = isCapped ? Math.floor(Math.random() * 50) + 20 : Math.floor(Math.random() * 10) + 5;
  const baseRuns = mappedRole === 'Bowler' ? Math.floor(Math.random() * 100) : 
                   mappedRole === 'All-rounder' ? Math.floor(Math.random() * 1000) + 200 :
                   Math.floor(Math.random() * 2000) + 500;
  const baseWickets = mappedRole === 'Batsman' || mappedRole === 'Wicket-keeper' ? 0 :
                     mappedRole === 'Bowler' ? Math.floor(Math.random() * 80) + 20 :
                     Math.floor(Math.random() * 30) + 5;
  
  const player = {
    id: String(playerId++),
    league: 'ipl',
    name: playerName.trim(),
    role: mappedRole,
    teamId: teamId,
    age: Math.floor(Math.random() * 15) + 20, // 20-35
    nationality: finalNationality,
    jerseyNumber: Math.floor(Math.random() * 99) + 1,
    isCaptain: false, // Will be set manually for captains
    bowlingStyle: bowlingStyle,
    battingStyle: battingStyle,
    stats: {
      matches: baseMatches,
      runs: baseRuns,
      wickets: baseWickets,
      average: parseFloat((Math.random() * 35 + 15).toFixed(2)),
      strikeRate: parseFloat((Math.random() * 50 + 120).toFixed(2)),
      economy: mappedRole === 'Batsman' || mappedRole === 'Wicket-keeper' ? 0 : parseFloat((Math.random() * 3 + 6).toFixed(2)),
      highest: Math.floor(Math.random() * 80) + 20,
      fours: Math.floor(baseRuns / 15),
      sixes: Math.floor(baseRuns / 25),
      fifties: Math.floor(baseMatches / 8),
      hundreds: mappedRole === 'Batsman' ? Math.floor(Math.random() * 3) : 0,
      bestBowling: mappedRole === 'Batsman' || mappedRole === 'Wicket-keeper' ? '-' : `${Math.floor(Math.random() * 3) + 1}/${Math.floor(Math.random() * 20)}`
    }
  };
  
  players.push(player);
});

console.log(JSON.stringify(players, null, 2));
console.error(`\nTotal players parsed: ${players.length}`);




