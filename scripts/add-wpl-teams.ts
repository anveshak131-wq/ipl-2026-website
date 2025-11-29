/**
 * Script to add WPL teams to the system
 * Run this script to populate WPL teams in the database
 */

import { wplTeams } from '../src/data/wpl-teams';

async function addWPLTeams() {
  console.log('Adding WPL teams to the system...\n');
  
  for (const team of wplTeams) {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        console.error('❌ Admin token not found. Please login first.');
        return;
      }
      
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(team)
      });
      
      if (response.ok) {
        const createdTeam = await response.json();
        console.log(`✅ Created: ${createdTeam.name} (${createdTeam.shortName})`);
        console.log(`   League: ${createdTeam.league}`);
        console.log(`   Colors: ${createdTeam.colors.primary} / ${createdTeam.colors.secondary}`);
        console.log(`   Logo: ${createdTeam.logo}\n`);
      } else {
        const error = await response.json();
        console.error(`❌ Failed to create ${team.name}:`, error.error || 'Unknown error');
      }
    } catch (error) {
      console.error(`❌ Error creating ${team.name}:`, error);
    }
  }
  
  console.log('✅ WPL teams addition complete!');
}

// Note: This script should be run from the browser console after logging in as admin
// Or can be integrated into an admin page
export default addWPLTeams;

