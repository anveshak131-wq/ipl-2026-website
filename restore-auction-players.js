/**
 * Script to restore IPL Mini Auction 2026 players
 * Usage: node restore-auction-players.js [domain]
 */

const fs = require('fs');
const path = require('path');

const domain = process.argv[2] || 'ipl-2026-website.pages.dev';
const apiUrl = `https://${domain}/api/restore-players`;

async function restoreAuctionPlayers() {
  try {
    // Read auction players JSON
    const auctionPlayersPath = path.join(__dirname, 'auction-players-clean.json');
    const auctionPlayers = JSON.parse(fs.readFileSync(auctionPlayersPath, 'utf-8'));
    
    console.log(`🔄 Restoring ${auctionPlayers.length} auction players to ${domain}...\n`);
    
    // POST to restore endpoint
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ players: auctionPlayers })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error: ${response.status} ${response.statusText}`);
      console.error('Response:', errorText);
      return;
    }
    
    const result = await response.json();
    
    console.log('✅ Restore Results:');
    console.log(`   Restored: ${result.restored} players`);
    console.log(`   Skipped (duplicates): ${result.skipped || 0} players`);
    console.log(`   Existing WPL: ${result.existingWPL} players`);
    console.log(`   Total Players: ${result.totalPlayers} players\n`);
    
    if (result.restored > 0) {
      console.log('🎉 Successfully restored auction players!');
    } else {
      console.log('⚠️  No new players restored (all may already exist)');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n💡 Make sure:');
    console.error('   1. The domain is correct and deployed');
    console.error('   2. The auction-players-clean.json file exists');
    console.error('   3. You have network access');
  }
}

restoreAuctionPlayers();



