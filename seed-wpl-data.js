#!/usr/bin/env node

/**
 * Seed script to populate Cloudflare KV with WPL matches and players
 * Usage: node seed-wpl-data.js
 * 
 * This script adds sample WPL matches and players to the local KV storage
 * so the WPL Scorecard Admin can display them.
 */

const fetch = require('node-fetch');

const KV_API_URL = 'http://localhost:8787/api';

// Sample WPL Teams
const wplTeams = [
  { id: '11', league: 'wpl', name: 'Mumbai Indians (WPL)', shortName: 'MI-W', logo: '/logos/wpl_mi_logo_animated.svg', colors: { primary: '#004BA0', secondary: '#FFD700' } },
  { id: '12', league: 'wpl', name: 'Royal Challengers Bengaluru (WPL)', shortName: 'RCB-W', logo: '/logos/wpl_rcb_logo_animated.svg', colors: { primary: '#C8102E', secondary: '#FFD700' } },
  { id: '13', league: 'wpl', name: 'Delhi Capitals (WPL)', shortName: 'DC-W', logo: '/logos/wpl_dc_logo_animated.svg', colors: { primary: '#004BA0', secondary: '#DC2626' } },
  { id: '14', league: 'wpl', name: 'Gujarat Giants (WPL)', shortName: 'GG', logo: '/logos/wpl_gg_logo_animated.svg', colors: { primary: '#F97316', secondary: '#FFD700' } },
  { id: '15', league: 'wpl', name: 'UP Warriorz (WPL)', shortName: 'UPW', logo: '/logos/wpl_upw_logo_animated.svg', colors: { primary: '#059669', secondary: '#F97316' } }
];

// Sample WPL Matches
const wplMatches = [
  {
    id: 'wpl-match-1',
    league: 'wpl',
    date: '2026-02-15',
    time: '19:30',
    venue: 'M. Chinnaswamy Stadium',
    team1Id: '11',
    team2Id: '12',
    team1: wplTeams[0],
    team2: wplTeams[1],
    status: 'scheduled',
    matchNumber: 1
  },
  {
    id: 'wpl-match-2',
    league: 'wpl',
    date: '2026-02-16',
    time: '15:00',
    venue: 'M. A. Chidambaram Stadium',
    team1Id: '13',
    team2Id: '14',
    team1: wplTeams[2],
    team2: wplTeams[3],
    status: 'scheduled',
    matchNumber: 2
  },
  {
    id: 'wpl-match-3',
    league: 'wpl',
    date: '2026-02-17',
    time: '19:30',
    venue: 'Eden Gardens',
    team1Id: '15',
    team2Id: '11',
    team1: wplTeams[4],
    team2: wplTeams[0],
    status: 'scheduled',
    matchNumber: 3
  },
  {
    id: 'wpl-match-4',
    league: 'wpl',
    date: '2026-02-18',
    time: '15:00',
    venue: 'M. Chinnaswamy Stadium',
    team1Id: '12',
    team2Id: '13',
    team1: wplTeams[1],
    team2: wplTeams[2],
    status: 'scheduled',
    matchNumber: 4
  }
];

// Sample WPL Players
const wplPlayers = [
  // Mumbai Indians Women (Team 11)
  { id: '101', name: 'Smriti Mandhana', teamId: '11', league: 'wpl', role: 'batter', battingStyle: 'left-hand', stats: { runs: 1200, ballsFaced: 900 } },
  { id: '102', name: 'Alyssa Healy', teamId: '11', league: 'wpl', role: 'batter', battingStyle: 'right-hand', stats: { runs: 1100, ballsFaced: 850 } },
  { id: '103', name: 'Harmanpreet Kaur', teamId: '11', league: 'wpl', role: 'all-rounder', battingStyle: 'right-hand', bowlingStyle: 'right-arm-off', stats: { runs: 950, ballsFaced: 700, wickets: 8, overs: 15 } },
  { id: '104', name: 'Nat Sciver-Brunt', teamId: '11', league: 'wpl', role: 'all-rounder', battingStyle: 'right-hand', bowlingStyle: 'right-arm-medium', stats: { runs: 800, ballsFaced: 600, wickets: 10, overs: 18 } },
  { id: '105', name: 'Deepti Sharma', teamId: '11', league: 'wpl', role: 'all-rounder', battingStyle: 'right-hand', bowlingStyle: 'right-arm-off', stats: { runs: 600, ballsFaced: 500, wickets: 12, overs: 20 } },
  
  // RCB Women (Team 12)
  { id: '201', name: 'Ellyse Perry', teamId: '12', league: 'wpl', role: 'all-rounder', battingStyle: 'right-hand', bowlingStyle: 'right-arm-fast', stats: { runs: 1050, ballsFaced: 800, wickets: 15, overs: 22 } },
  { id: '202', name: 'Virat Kohli', teamId: '12', league: 'wpl', role: 'batter', battingStyle: 'right-hand', stats: { runs: 1300, ballsFaced: 950 } },
  { id: '203', name: 'Richa Ghosh', teamId: '12', league: 'wpl', role: 'wicket-keeper', battingStyle: 'right-hand', stats: { runs: 700, ballsFaced: 550 } },
  { id: '204', name: 'Marizanne Kapp', teamId: '12', league: 'wpl', role: 'all-rounder', battingStyle: 'left-hand', bowlingStyle: 'left-arm-medium', stats: { runs: 850, ballsFaced: 650, wickets: 11, overs: 19 } },
  { id: '205', name: 'Erin Burns', teamId: '12', league: 'wpl', role: 'batter', battingStyle: 'right-hand', stats: { runs: 750, ballsFaced: 580 } },
  
  // Delhi Capitals Women (Team 13)
  { id: '301', name: 'Meg Lanning', teamId: '13', league: 'wpl', role: 'batter', battingStyle: 'right-hand', stats: { runs: 1250, ballsFaced: 900 } },
  { id: '302', name: 'Jemimah Rodrigues', teamId: '13', league: 'wpl', role: 'batter', battingStyle: 'right-hand', stats: { runs: 950, ballsFaced: 750 } },
  { id: '303', name: 'Shafali Verma', teamId: '13', league: 'wpl', role: 'batter', battingStyle: 'right-hand', stats: { runs: 1000, ballsFaced: 720 } },
  { id: '304', name: 'Radha Yadav', teamId: '13', league: 'wpl', role: 'bowler', bowlingStyle: 'left-arm-off', stats: { wickets: 14, overs: 21 } },
  { id: '305', name: 'Alice Capsey', teamId: '13', league: 'wpl', role: 'all-rounder', battingStyle: 'right-hand', bowlingStyle: 'right-arm-leg', stats: { runs: 800, ballsFaced: 600, wickets: 9, overs: 16 } },
  
  // Gujarat Giants Women (Team 14)
  { id: '401', name: 'Beth Mooney', teamId: '14', league: 'wpl', role: 'wicket-keeper', battingStyle: 'right-hand', stats: { runs: 1100, ballsFaced: 850 } },
  { id: '402', name: 'Aiden Markram', teamId: '14', league: 'wpl', role: 'batter', battingStyle: 'right-hand', stats: { runs: 1050, ballsFaced: 800 } },
  { id: '403', name: 'Georgia Adams', teamId: '14', league: 'wpl', role: 'all-rounder', battingStyle: 'right-hand', bowlingStyle: 'right-arm-medium', stats: { runs: 700, ballsFaced: 550, wickets: 10, overs: 18 } },
  { id: '404', name: 'Sneh Rana', teamId: '14', league: 'wpl', role: 'bowler', bowlingStyle: 'right-arm-off', stats: { wickets: 12, overs: 20 } },
  { id: '405', name: 'Ashleigh Gardner', teamId: '14', league: 'wpl', role: 'all-rounder', battingStyle: 'right-hand', bowlingStyle: 'right-arm-off', stats: { runs: 900, ballsFaced: 700, wickets: 11, overs: 19 } },
  
  // UP Warriorz Women (Team 15)
  { id: '501', name: 'Amorita Sohail', teamId: '15', league: 'wpl', role: 'batter', battingStyle: 'right-hand', stats: { runs: 950, ballsFaced: 750 } },
  { id: '502', name: 'Sophie Devine', teamId: '15', league: 'wpl', role: 'all-rounder', battingStyle: 'right-hand', bowlingStyle: 'right-arm-off', stats: { runs: 1100, ballsFaced: 850, wickets: 9, overs: 17 } },
  { id: '503', name: 'Chamari Atapattu', teamId: '15', league: 'wpl', role: 'batter', battingStyle: 'right-hand', stats: { runs: 1000, ballsFaced: 800 } },
  { id: '504', name: 'Muskan Malik', teamId: '15', league: 'wpl', role: 'bowler', bowlingStyle: 'right-arm-off', stats: { wickets: 13, overs: 21 } },
  { id: '505', name: 'Pooja Vastrakar', teamId: '15', league: 'wpl', role: 'all-rounder', battingStyle: 'right-hand', bowlingStyle: 'right-arm-fast', stats: { runs: 750, ballsFaced: 600, wickets: 12, overs: 19 } }
];

async function seedData() {
  try {
    console.log('🌱 Seeding WPL data to Cloudflare KV...\n');
    
    // Check if server is running
    try {
      const testResponse = await fetch(`${KV_API_URL}/players?league=wpl`);
      if (testResponse.status === 404) {
        console.log('⚠️  Note: API server might not be accessible. Make sure Wrangler is running on port 8787');
        console.log('   Run: npm run dev\n');
      }
    } catch (e) {
      console.log('⚠️  Cannot reach API server on port 8787. Make sure Wrangler is running:');
      console.log('   Run: npm run dev\n');
      return;
    }

    // Seed WPL Teams
    console.log('📝 Seeding teams...');
    const teamsResponse = await fetch(`${KV_API_URL}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teams: wplTeams, league: 'wpl' })
    });
    
    if (teamsResponse.ok) {
      console.log('✅ Teams seeded successfully');
    } else {
      console.log('⚠️  Teams API not available, but matches and players will work');
    }

    // Seed WPL Matches
    console.log('\n📝 Seeding matches...');
    for (const match of wplMatches) {
      const response = await fetch(`${KV_API_URL}/matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify(match)
      });
      
      if (response.ok) {
        console.log(`  ✅ Match ${match.matchNumber}: ${match.team1.shortName} vs ${match.team2.shortName}`);
      } else {
        console.error(`  ❌ Failed to seed match ${match.matchNumber}`);
      }
    }

    // Seed WPL Players
    console.log('\n📝 Seeding players...');
    for (const player of wplPlayers) {
      const response = await fetch(`${KV_API_URL}/players`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify(player)
      });
      
      if (!response.ok) {
        console.error(`  ❌ Failed to seed player: ${player.name}`);
      }
    }
    console.log(`  ✅ Seeded ${wplPlayers.length} players`);

    console.log('\n✨ WPL data seeding complete!');
    console.log('\nYou can now:');
    console.log('1. Visit http://localhost:3000/wpl-admin-2026/scorecard');
    console.log('2. Refresh the page to see the WPL matches and players');
    console.log('3. Create and manage WPL scorecards\n');

  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
    console.error('\nMake sure:');
    console.error('1. Wrangler dev server is running: npm run dev');
    console.error('2. The API endpoints are accessible on http://localhost:8787/api');
  }
}

// Run the seed function
seedData();
