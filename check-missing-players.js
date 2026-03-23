const fs = require('fs');

// Parse CSV 
const csvContent = fs.readFileSync('/Users/anvesh/Downloads/ipl-bowling-stats-all-teams-2026-03-22.csv', 'utf8');
const csvLines = csvContent.split('\n').filter(l => l.trim());

// Extract names from CSV (Name is second column)
const csvNames = new Set();
csvLines.slice(1).forEach(line => {
  const match = line.match(/^"[^"]*","([^"]+)"/);
  if (match) csvNames.add(match[1].trim());
});

// Get database players
const players = JSON.parse(fs.readFileSync('comprehensive-players.json', 'utf8'));
const dbNames = new Set(players.map(p => p.name));

// Find popular players in CSV but not in DB by exact name match
const csvOnlyByName = Array.from(csvNames).filter(name => !dbNames.has(name));

// Look for close matches and show some famous players
console.log('Players in CSV but NOT in comprehensive-players.json by name:');
const famousInCsv = ['Krunal Pandya', 'Bhuvneshwar Kumar', 'Rohit Sharma', 'Virat Kohli', 'MS Dhoni', 'Hardik Pandya', 'Yuzvendra Chahal', 'Suresh Raina'];

famousInCsv.forEach(name => {
  const inCsv = csvNames.has(name);
  const inDb = dbNames.has(name);
  console.log(`  ${name}: CSV=${inCsv}, DB=${inDb}`);
});

console.log(`\nTotal unique names in CSV: ${csvNames.size}`);
console.log(`Total unique names in DB: ${dbNames.size}`);
console.log(`Names in CSV but NOT in DB: ${csvOnlyByName.length}`);

// Show first 20
console.log('\nFirst 20 players in CSV but not in DB:');
csvOnlyByName.slice(0, 20).forEach(name => console.log(`  - ${name}`));

// Find potential matches (case-insensitive)
console.log('\n--- Checking case-insensitive matches ---');
const csvNameLower = new Map();
csvNames.forEach(name => csvNameLower.set(name.toLowerCase(), name));

let caseMatches = 0;
const dbOnlyByName = Array.from(dbNames).filter(name => !csvNames.has(name));
dbOnlyByName.forEach(name => {
  const csvName = csvNameLower.get(name.toLowerCase());
  if (csvName) {
    caseMatches++;
    console.log(`  ${name} (DB) ← → ${csvName} (CSV)`);
  }
});

console.log(`Found ${caseMatches} case-insensitive matches`);

// Find partial name matches for famous players  
console.log('\n--- Looking for partial matches ---');
const popularMissing = csvOnlyByName.filter(name => 
  name.includes('Pandya') || 
  name.includes('Kumar') || 
  name.includes('Sharma') || 
  name.includes('Kohli') || 
  name.includes('Dhoni') || 
  name.includes('Raina') ||
  name.includes('Chahal')
);

if (popularMissing.length > 0) {
  console.log('Famous/popular players in CSV but not in DB:');
  popularMissing.forEach(name => console.log(`  - ${name}`));
}
