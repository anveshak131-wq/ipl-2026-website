import fs from 'node:fs';

// Parse CSV IDs
const csvContent = fs.readFileSync('/Users/anvesh/Downloads/ipl-bowling-stats-all-teams-2026-03-22.csv', 'utf8');
const csvLines = csvContent.split('\n').filter(l => l.trim());
const csvIds = new Set();

csvLines.slice(1).forEach(line => {
  const match = line.match(/^"(\d+)"/);
  if (match) csvIds.add(match[1]);
});

// Get database IDs
const players = JSON.parse(fs.readFileSync('comprehensive-players.json', 'utf8'));
const dbIds = new Set(players.map(p => p.id));

console.log('CSV total records:', csvLines.length - 1);
console.log('CSV unique IDs:', csvIds.size);
console.log('Database players:', players.length);
console.log('Database unique IDs:', dbIds.size);

// Find IDs in both
const bothHave = Array.from(csvIds).filter(id => dbIds.has(id));
console.log('\nIDs present in both CSV and DB:', bothHave.length);
console.log('First 10 matching IDs:', bothHave.sort((a,b) => Number(a) - Number(b)).slice(0, 10));

// Find IDs only in CSV
const onlyInCsv = Array.from(csvIds).filter(id => !dbIds.has(id)).sort((a,b) => Number(a) - Number(b));
console.log('\nIDs in CSV but NOT in DB:', onlyInCsv.length);
console.log('Sample (first 20):', onlyInCsv.slice(0, 20));

// Find IDs only in DB
const onlyInDb = Array.from(dbIds).filter(id => !csvIds.has(id)).sort((a,b) => Number(a) - Number(b));
console.log('\nIDs in DB but NOT in CSV:', onlyInDb.length);
console.log('Sample (first 20):', onlyInDb.slice(0, 20));

// Check if matching by name instead
console.log('\n--- Checking name-based matching ---');
const csvByName = {};
csvLines.slice(1).forEach(line => {
  const parts = line.split('","');
  if (parts.length > 1) {
    const id = parts[0].replace(/^"/, '');
    const name = parts[1].trim();
    csvByName[name] = id;
  }
});

let nameMatches = 0;
players.forEach(p => {
  if (csvByName[p.name]) {
    nameMatches++;
  }
});

console.log('Players with name match in CSV:', nameMatches);
console.log('Sample name matches:');
players.slice(0, 5).forEach(p => {
  const csvId = csvByName[p.name];
  console.log(`  ${p.name}: DB ID ${p.id}, CSV ID ${csvId || 'NOT FOUND'}`);
});
