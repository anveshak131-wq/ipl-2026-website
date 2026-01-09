/**
 * Script to update RCB vs MI playing XI for today's WPL match
 * This script will update the match data with the correct playing XI
 */

// Mock player data for RCB and MI women's teams
const rcbPlayers = [
  { id: 'rcb-001', name: 'Smriti Mandhana', role: 'Batter', jerseyNumber: '18', isCaptain: true },
  { id: 'rcb-002', name: 'Grace Harris', role: 'All-rounder', jerseyNumber: '45' },
  { id: 'rcb-003', name: 'Dayalan Hemalatha', role: 'Batter', jerseyNumber: '15' },
  { id: 'rcb-004', name: 'Richa Ghosh', role: 'Wicketkeeper', jerseyNumber: '28' },
  { id: 'rcb-005', name: 'Radha Yadav', role: 'Bowler', jerseyNumber: '7' },
  { id: 'rcb-006', name: 'Nadine de Klerk', role: 'All-rounder', jerseyNumber: '22' },
  { id: 'rcb-007', name: 'Arundhati Reddy', role: 'Bowler', jerseyNumber: '11' },
  { id: 'rcb-008', name: 'Shreyanka Patil', role: 'Bowler', jerseyNumber: '19' },
  { id: 'rcb-009', name: 'Prema Rawat', role: 'Batter', jerseyNumber: '33' },
  { id: 'rcb-010', name: 'Linsey Smith', role: 'Bowler', jerseyNumber: '8' },
  { id: 'rcb-011', name: 'Lauren Bell', role: 'Bowler', jerseyNumber: '25' }
];

const miPlayers = [
  { id: 'mi-001', name: 'Nat Sciver-Brunt', role: 'All-rounder', jerseyNumber: '10' },
  { id: 'mi-002', name: 'G Kamalini', role: 'Wicketkeeper', jerseyNumber: '1' },
  { id: 'mi-003', name: 'Amelia Kerr', role: 'All-rounder', jerseyNumber: '24' },
  { id: 'mi-004', name: 'Harmanpreet Kaur', role: 'Batter', jerseyNumber: '84', isCaptain: true },
  { id: 'mi-005', name: 'Amanjot Kaur', role: 'Batter', jerseyNumber: '15' },
  { id: 'mi-006', name: 'Nicola Carey', role: 'All-rounder', jerseyNumber: '7' },
  { id: 'mi-007', name: 'Poonam Khemnar', role: 'Batter', jerseyNumber: '18' },
  { id: 'mi-008', name: 'Shabnim Ismail', role: 'Bowler', jerseyNumber: '3' },
  { id: 'mi-009', name: 'Sanskriti Gupta', role: 'Batter', jerseyNumber: '21' },
  { id: 'mi-010', name: 'Sajeevan Sajana', role: 'Bowler', jerseyNumber: '12' },
  { id: 'mi-011', name: 'Saika Ishaque', role: 'Bowler', jerseyNumber: '4' }
];

// Today's playing XI
const rcbPlaying11 = [
  'rcb-001', 'rcb-002', 'rcb-003', 'rcb-004', 'rcb-005',
  'rcb-006', 'rcb-007', 'rcb-008', 'rcb-009', 'rcb-010', 'rcb-011'
];

const miPlaying11 = [
  'mi-001', 'mi-002', 'mi-003', 'mi-004', 'mi-005',
  'mi-006', 'mi-007', 'mi-008', 'mi-009', 'mi-010', 'mi-011'
];

// Function to update match with playing XI
async function updateMatchPlaying11(matchId) {
  try {
    // Get the admin token from localStorage (in browser context)
    const token = localStorage.getItem('adminToken');
    
    if (!token) {
      console.error('Admin token not found. Please login to admin panel first.');
      return;
    }
    
    // Update the match with playing XI
    const response = await fetch(`/api/matches?id=${matchId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        id: matchId,
        playing11: {
          team1: miPlaying11, // MI is team1
          team2: rcbPlaying11, // RCB is team2
          setAt: new Date().toISOString()
        }
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update playing XI');
    }
    
    const result = await response.json();
    console.log('Playing XI updated successfully:', result);
    return result;
    
  } catch (error) {
    console.error('Error updating playing XI:', error);
    throw error;
  }
}

// Function to find the RCB vs MI match
async function findRcbMiMatch() {
  try {
    const response = await fetch('/api/matches?league=wpl');
    if (!response.ok) {
      throw new Error('Failed to fetch matches');
    }
    
    const matches = await response.json();
    
    // Find RCB vs MI match (assuming it's today's match)
    const today = new Date().toISOString().split('T')[0];
    const rcbMiMatch = matches.find(match => 
      ((match.team1.shortName === 'RCB-W' && match.team2.shortName === 'MI-W') ||
       (match.team1.shortName === 'MI-W' && match.team2.shortName === 'RCB-W')) &&
      match.date === today
    );
    
    if (!rcbMiMatch) {
      console.error('RCB vs MI match not found for today');
      return null;
    }
    
    return rcbMiMatch;
    
  } catch (error) {
    console.error('Error finding RCB vs MI match:', error);
    throw error;
  }
}

// Main function
async function main() {
  try {
    console.log('Finding RCB vs MI match...');
    const match = await findRcbMiMatch();
    
    if (!match) {
      console.error('Match not found. Please create the match first in admin panel.');
      return;
    }
    
    console.log('Found match:', match.id, match.team1.shortName, 'vs', match.team2.shortName);
    console.log('Updating playing XI...');
    
    const result = await updateMatchPlaying11(match.id);
    console.log('Success! Playing XI updated for RCB vs MI match.');
    
  } catch (error) {
    console.error('Failed to update playing XI:', error);
  }
}

// Run the script
if (typeof window !== 'undefined') {
  // Browser environment
  main();
} else {
  // Node.js environment
  console.log('This script is designed to run in browser environment.');
  console.log('Please run it from the admin panel or include it in your frontend code.');
}

export { rcbPlayers, miPlayers, rcbPlaying11, miPlaying11, updateMatchPlaying11, findRcbMiMatch };