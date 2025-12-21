/**
 * Test script to check KV storage for IPL players
 * Run with: node test-diagnostic.js
 */

const API_BASE_URL = process.env.API_URL || 'http://localhost:8788';

async function testDiagnostic() {
  try {
    console.log('🔍 Testing diagnostic endpoint...\n');
    console.log(`📡 Calling: ${API_BASE_URL}/api/players?diagnostic=true\n`);
    
    const response = await fetch(`${API_BASE_URL}/api/players?diagnostic=true`);
    
    if (!response.ok) {
      console.error(`❌ Error: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error('Response:', text);
      return;
    }
    
    const data = await response.json();
    
    console.log('✅ Diagnostic Results:\n');
    console.log('📊 Summary:');
    console.log(`   Total Players: ${data.summary.total}`);
    console.log(`   IPL Players: ${data.summary.ipl}`);
    console.log(`   WPL Players: ${data.summary.wpl}`);
    console.log(`   Unknown Players: ${data.summary.unknown}\n`);
    
    if (data.iplPlayers && data.iplPlayers.length > 0) {
      console.log('🏏 IPL Players:');
      data.iplPlayers.forEach(player => {
        console.log(`   - ${player.name} (ID: ${player.id}, Team: ${player.teamId}, League: ${player.league}, Role: ${player.role})`);
      });
      console.log('');
    } else {
      console.log('⚠️  No IPL players found!\n');
    }
    
    if (data.wplPlayers && data.wplPlayers.length > 0) {
      console.log('👩‍🦰 WPL Players:');
      data.wplPlayers.forEach(player => {
        console.log(`   - ${player.name} (ID: ${player.id}, Team: ${player.teamId}, League: ${player.league}, Role: ${player.role})`);
      });
      console.log('');
    } else {
      console.log('⚠️  No WPL players found!\n');
    }
    
    if (data.unknownPlayers && data.unknownPlayers.length > 0) {
      console.log('❓ Unknown Players (check team IDs):');
      data.unknownPlayers.forEach(player => {
        console.log(`   - ${player.name} (ID: ${player.id}, Team: ${player.teamId}, League: ${player.league})`);
      });
      console.log('');
    }
    
    // Check for Ellyse Perry specifically
    const ellyse = [...(data.iplPlayers || []), ...(data.wplPlayers || [])].find(p => 
      p.name && p.name.toLowerCase().includes('ellyse')
    );
    
    if (ellyse) {
      console.log('🎯 Ellyse Perry Status:');
      console.log(`   Name: ${ellyse.name}`);
      console.log(`   Team ID: ${ellyse.teamId}`);
      console.log(`   League: ${ellyse.league}`);
      console.log(`   Expected: Team ID 12 (RCB-W), League: wpl`);
      if (ellyse.teamId === '12' && ellyse.league === 'wpl') {
        console.log('   ✅ Correctly assigned to RCB-W!');
      } else {
        console.log('   ⚠️  Needs correction!');
      }
    } else {
      console.log('⚠️  Ellyse Perry not found in players list');
    }
    
  } catch (error) {
    console.error('❌ Error testing diagnostic endpoint:', error.message);
    console.error('\n💡 Make sure:');
    console.error('   1. The dev server is running (wrangler pages dev or npm run dev)');
    console.error('   2. Or set API_URL environment variable to your deployed URL');
    console.error('   3. Example: API_URL=https://your-domain.com node test-diagnostic.js');
  }
}

testDiagnostic();

