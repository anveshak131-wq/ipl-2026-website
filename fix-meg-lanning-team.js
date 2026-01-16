/**
 * Script to fix Meg Lanning's team assignment
 * She should be in UP Warriorz (team 15), not RCB-W (team 12)
 */

const ADMIN_TOKEN = 'admin-token-123';
const API_URL = 'http://localhost:8788'; // Change to your actual deployment URL if needed

async function fixMegLanning() {
  try {
    console.log('Fetching all WPL players...');
    
    // Get all players
    const playersResponse = await fetch(`${API_URL}/api/players?league=wpl`);
    const players = await playersResponse.json();
    
    console.log(`Found ${players.length} WPL players`);
    
    // Find Meg Lanning
    const megLanning = players.find(p => 
      p.name === 'Meg Lanning' || 
      p.id === 'wpl11'
    );
    
    if (!megLanning) {
      console.error('Meg Lanning not found in players data');
      return;
    }
    
    console.log('Found Meg Lanning:', megLanning);
    console.log(`Current teamId: ${megLanning.teamId}`);
    
    if (megLanning.teamId === 15 || megLanning.teamId === '15') {
      console.log('✅ Meg Lanning already has correct teamId (15 - UP Warriorz)');
      return;
    }
    
    // Update to correct team
    console.log('Updating Meg Lanning to teamId 15 (UP Warriorz)...');
    
    const updateResponse = await fetch(`${API_URL}/api/players`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      },
      body: JSON.stringify({
        id: megLanning.id,
        teamId: 15,
        league: 'wpl'
      })
    });
    
    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      console.error('Failed to update player:', error);
      return;
    }
    
    console.log('✅ Successfully updated Meg Lanning to UP Warriorz (team 15)');
    
    // Verify the update
    const verifyResponse = await fetch(`${API_URL}/api/players?league=wpl&forceRefresh=true`);
    const updatedPlayers = await verifyResponse.json();
    const verifyMeg = updatedPlayers.find(p => p.id === megLanning.id);
    
    if (verifyMeg) {
      console.log('Verified teamId:', verifyMeg.teamId);
    }
    
  } catch (error) {
    console.error('Error fixing Meg Lanning:', error);
  }
}

// Run the fix
fixMegLanning();
