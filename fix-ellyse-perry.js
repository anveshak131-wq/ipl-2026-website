// Fix Ellyse Perry team assignment script
// This script updates Ellyse Perry's team from DC-W (13) to RCB-W (12)

const fixEllysePerry = async () => {
  try {
    // Get current players data
    const response = await fetch('https://cdabc74b.ipl-2026-website.pages.dev/api/players?league=wpl');
    const players = await response.json();
    
    // Find Ellyse Perry
    const ellyseIndex = players.findIndex(p => p.name === 'Ellyse Perry');
    
    if (ellyseIndex === -1) {
      console.log('Ellyse Perry not found');
      return;
    }
    
    // Update her team to RCB-W (team ID 12)
    players[ellyseIndex].teamId = '12';
    
    console.log('Updated Ellyse Perry to RCB-W');
    console.log('New data:', players[ellyseIndex]);
    
    // Note: This would require admin authentication to actually save
    console.log('Manual update needed: Use admin interface to change Ellyse Perry team to RCB-W');
    
  } catch (error) {
    console.error('Error:', error);
  }
};

fixEllysePerry();
