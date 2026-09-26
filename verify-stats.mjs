import fs from 'node:fs';

const players = JSON.parse(fs.readFileSync('comprehensive-players.json', 'utf8'));
console.log('Total players in comprehensive-players.json:', players.length);

const krunal = players.find(p => p.name && p.name.includes('Krunal'));
const bhuvneshwar = players.find(p => p.name && p.name.includes('Bhuvneshwar'));

console.log('\nKrunal Pandya:');
if (krunal) {
  console.log('  Found:', {id: krunal.id, name: krunal.name});
  console.log('  Bowling Stats:', {
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
} else {
  console.log('  NOT FOUND in comprehensive-players.json');
}

console.log('\nBhuvneshwar Kumar:');
if (bhuvneshwar) {
  console.log('  Found:', {id: bhuvneshwar.id, name: bhuvneshwar.name});
  console.log('  Bowling Stats:', {
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
} else {
  console.log('  NOT FOUND in comprehensive-players.json');
}

// Count stats coverage
const withBowling = players.filter(p => p.stats && p.stats.bowlingInnings && p.stats.bowlingInnings > 0).length;
console.log(`\nPlayers with populated bowling stats: ${withBowling}/${players.length}`);

// Show a few examples
console.log('\nFirst 3 players with bowling stats:');
players.filter(p => p.stats && p.stats.bowlingInnings > 0).slice(0, 3).forEach(p => {
  console.log(`  ${p.name} (ID: ${p.id}): ${p.stats.bowlingInnings} innings, ${p.stats.wickets} wickets`);
});
