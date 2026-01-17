/**
 * Cloudflare Pages Function to seed WPL data
 * POST /api/admin/seed-wpl-data
 * 
 * This endpoint initializes WPL matches and players in Cloudflare KV
 * Requires admin authentication token
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function verifyAdminToken(request) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  // Accept any bearer token - in production you'd verify against a real secret
  // For now, just check that the token exists
  if (!token) {
    return false;
  }
  return true;
}

// WPL Teams data
const wplTeams = [
  {
    id: 11,
    league: 'wpl',
    name: 'Mumbai Indians (WPL)',
    shortName: 'MI-W',
    logo: '/logos/wpl_mi_logo_animated.svg',
    colors: { primary: '#004BA0', secondary: '#FFD700' }
  },
  {
    id: 12,
    league: 'wpl',
    name: 'Royal Challengers Bengaluru (WPL)',
    shortName: 'RCB-W',
    logo: '/logos/wpl_rcb_logo_animated.svg',
    colors: { primary: '#C8102E', secondary: '#FFD700' }
  },
  {
    id: 13,
    league: 'wpl',
    name: 'Delhi Capitals (WPL)',
    shortName: 'DC-W',
    logo: '/logos/wpl_dc_logo_animated.svg',
    colors: { primary: '#004BA0', secondary: '#DC2626' }
  },
  {
    id: 14,
    league: 'wpl',
    name: 'Gujarat Giants (WPL)',
    shortName: 'GG',
    logo: '/logos/wpl_gg_logo_animated.svg',
    colors: { primary: '#F97316', secondary: '#FFD700' }
  },
  {
    id: 15,
    league: 'wpl',
    name: 'UP Warriorz (WPL)',
    shortName: 'UPW',
    logo: '/logos/wpl_upw_logo_animated.svg',
    colors: { primary: '#059669', secondary: '#F97316' }
  }
];

// Sample WPL Matches
const wplMatches = [
  {
    id: 'wpl_match_1',
    league: 'wpl',
    date: '2026-02-15',
    time: '19:30',
    venue: 'DY Patil Stadium, Mumbai',
    team1Id: 11,
    team2Id: 12,
    team1: wplTeams[0],
    team2: wplTeams[1],
    status: 'scheduled',
    matchNumber: 1
  },
  {
    id: 'wpl_match_2',
    league: 'wpl',
    date: '2026-02-16',
    time: '15:30',
    venue: 'Ekana Cricket Stadium, Lucknow',
    team1Id: 13,
    team2Id: 14,
    team1: wplTeams[2],
    team2: wplTeams[3],
    status: 'scheduled',
    matchNumber: 2
  },
  {
    id: 'wpl_match_3',
    league: 'wpl',
    date: '2026-02-17',
    time: '19:30',
    venue: 'Arun Jaitley Stadium, Delhi',
    team1Id: 15,
    team2Id: 11,
    team1: wplTeams[4],
    team2: wplTeams[0],
    status: 'scheduled',
    matchNumber: 3
  },
  {
    id: 'wpl_match_4',
    league: 'wpl',
    date: '2026-02-18',
    time: '15:30',
    venue: 'M Chinnaswamy Stadium, Bengaluru',
    team1Id: 12,
    team2Id: 14,
    team1: wplTeams[1],
    team2: wplTeams[3],
    status: 'scheduled',
    matchNumber: 4
  }
];

// Sample WPL Players
const wplPlayers = [
  // Mumbai Indians Women (Team 11)
  { id: 'wpl1', league: 'wpl', name: 'Harmanpreet Kaur', role: 'All-rounder', teamId: 11, age: 35, nationality: 'India', jerseyNumber: 18, isCaptain: true, bowlingStyle: 'Right-arm off-break', battingStyle: 'Right-handed bat', stats: { matches: 50, runs: 1200, wickets: 30, average: 28.5, strikeRate: 125, economy: 7.2, highest: 103, fours: 85, sixes: 45, fifties: 8, hundreds: 1, bestBowling: '3/15', bowlingAverage: 0 } },
  { id: 'wpl2', league: 'wpl', name: 'Alyssa Healy', role: 'Wicket-keeper Batter', teamId: 11, age: 33, nationality: 'Australia', jerseyNumber: 1, isCaptain: false, bowlingStyle: 'N/A', battingStyle: 'Right-handed bat', stats: { matches: 45, runs: 980, wickets: 0, average: 26.5, strikeRate: 130, economy: 0, highest: 88, fours: 70, sixes: 35, fifties: 7, hundreds: 0, bestBowling: '-' } },
  { id: 'wpl3', league: 'wpl', name: 'Nat Sciver-Brunt', role: 'All-rounder', teamId: 11, age: 31, nationality: 'England', jerseyNumber: 8, isCaptain: false, bowlingStyle: 'Right-arm medium', battingStyle: 'Right-handed bat', stats: { matches: 40, runs: 750, wickets: 45, average: 24, strikeRate: 118, economy: 6.8, highest: 75, fours: 55, sixes: 20, fifties: 5, hundreds: 0, bestBowling: '4/20', bowlingAverage: 0 } },
  
  // RCB Women (Team 12)
  { id: 'wpl4', league: 'wpl', name: 'Smriti Mandhana', role: 'Batter', teamId: 12, age: 27, nationality: 'India', jerseyNumber: 10, isCaptain: true, bowlingStyle: 'Right-arm medium', battingStyle: 'Left-handed bat', stats: { matches: 48, runs: 1350, wickets: 8, average: 32.1, strikeRate: 135, economy: 8.5, highest: 87, fours: 95, sixes: 48, fifties: 10, hundreds: 0, bestBowling: '2/25', bowlingAverage: 0 } },
  { id: 'wpl5', league: 'wpl', name: 'Ellyse Perry', role: 'All-rounder', teamId: 12, age: 33, nationality: 'Australia', jerseyNumber: 7, isCaptain: false, bowlingStyle: 'Right-arm fast', battingStyle: 'Right-handed bat', stats: { matches: 42, runs: 890, wickets: 55, average: 28.5, strikeRate: 120, economy: 6.5, highest: 85, fours: 65, sixes: 25, fifties: 6, hundreds: 0, bestBowling: '5/15', bowlingAverage: 0 } },
  { id: 'wpl6', league: 'wpl', name: 'Richa Ghosh', role: 'Wicket-keeper Batter', teamId: 12, age: 21, nationality: 'India', jerseyNumber: 33, isCaptain: false, bowlingStyle: 'N/A', battingStyle: 'Right-handed bat', stats: { matches: 25, runs: 420, wickets: 0, average: 24, strikeRate: 140, economy: 0, highest: 65, fours: 30, sixes: 18, fifties: 2, hundreds: 0, bestBowling: '-' } },
  
  // Delhi Capitals Women (Team 13)
  { id: 'wpl7', league: 'wpl', name: 'Alyssa Perry', role: 'All-rounder', teamId: 13, age: 23, nationality: 'Australia', jerseyNumber: 17, isCaptain: false, bowlingStyle: 'Right-arm leg-break', battingStyle: 'Right-handed bat', stats: { matches: 18, runs: 320, wickets: 22, average: 22.5, strikeRate: 125, economy: 7, highest: 61, fours: 25, sixes: 10, fifties: 2, hundreds: 0, bestBowling: '3/18', bowlingAverage: 0 } },
  
  // Gujarat Giants (Team 14)
  { id: 'wpl8', league: 'wpl', name: 'Sophie Devine', role: 'All-rounder', teamId: 14, age: 35, nationality: 'New Zealand', jerseyNumber: 6, isCaptain: true, bowlingStyle: 'Right-arm medium', battingStyle: 'Right-handed bat', stats: { matches: 38, runs: 780, wickets: 40, average: 26, strikeRate: 122, economy: 7.1, highest: 76, fours: 58, sixes: 22, fifties: 6, hundreds: 0, bestBowling: '4/22', bowlingAverage: 0 } },
  { id: 'wpl9', league: 'wpl', name: 'Ashleigh Gardner', role: 'All-rounder', teamId: 14, age: 26, nationality: 'Australia', jerseyNumber: 8, isCaptain: true, bowlingStyle: 'Right-arm off-break', battingStyle: 'Right-handed bat', stats: { matches: 35, runs: 680, wickets: 48, average: 24.5, strikeRate: 128, economy: 6.8, highest: 66, fours: 52, sixes: 18, fifties: 4, hundreds: 0, bestBowling: '4/12', bowlingAverage: 0 } },
  { id: 'wpl10', league: 'wpl', name: 'Beth Mooney', role: 'Wicket-keeper Batter', teamId: 14, age: 30, nationality: 'Australia', jerseyNumber: 5, isCaptain: false, bowlingStyle: 'N/A', battingStyle: 'Left-handed bat', stats: { matches: 40, runs: 920, wickets: 0, average: 28, strikeRate: 132, economy: 0, highest: 82, fours: 68, sixes: 28, fifties: 8, hundreds: 0, bestBowling: '-' } },
  
  // Delhi Capitals (Team 13)
  { id: 'wpl12', league: 'wpl', name: 'Jemimah Rodrigues', role: 'Batter', teamId: 13, age: 24, nationality: 'India', jerseyNumber: 21, isCaptain: true, bowlingStyle: 'N/A', battingStyle: 'Right-handed bat', stats: { matches: 32, runs: 580, wickets: 0, average: 22, strikeRate: 118, economy: 0, highest: 69, fours: 42, sixes: 15, fifties: 4, hundreds: 0, bestBowling: '-' } },
  
  // UP Warriorz (Team 15)
  { id: 'wpl11', league: 'wpl', name: 'Meg Lanning', role: 'Batter', teamId: 15, age: 31, nationality: 'Australia', jerseyNumber: 1, isCaptain: true, bowlingStyle: 'Right-arm leg-break', battingStyle: 'Right-handed bat', stats: { matches: 36, runs: 840, wickets: 15, average: 26.5, strikeRate: 125, economy: 7.5, highest: 78, fours: 62, sixes: 24, fifties: 7, hundreds: 0, bestBowling: '2/28', bowlingAverage: 0 } }
];

export const onRequest = async (context) => {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Verify admin token
    if (!verifyAdminToken(request)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get existing data
    let teams = await env.IPL_CACHE.get('teams', 'json') || [];
    let matches = await env.IPL_CACHE.get('matches', 'json') || [];
    let players = await env.IPL_CACHE.get('players', 'json') || [];

    // Add WPL teams
    const existingTeamIds = new Set(teams.map(t => t.id));
    const newTeams = wplTeams.filter(t => !existingTeamIds.has(t.id));
    teams = [...teams, ...newTeams];

    // Add WPL matches
    const existingMatchIds = new Set(matches.map(m => m.id));
    const newMatches = wplMatches.filter(m => !existingMatchIds.has(m.id));
    matches = [...matches, ...newMatches];

    // Add WPL players
    const existingPlayerIds = new Set(players.map(p => p.id));
    const newPlayers = wplPlayers.filter(p => !existingPlayerIds.has(p.id));
    players = [...players, ...newPlayers];

    // Save to KV
    await env.IPL_CACHE.put('teams', JSON.stringify(teams));
    await env.IPL_CACHE.put('matches', JSON.stringify(matches));
    await env.IPL_CACHE.put('players', JSON.stringify(players));

    return new Response(JSON.stringify({
      success: true,
      message: 'WPL data seeded successfully',
      stats: {
        teamsAdded: newTeams.length,
        matchesAdded: newMatches.length,
        playersAdded: newPlayers.length,
        totalTeams: teams.length,
        totalMatches: matches.length,
        totalPlayers: players.length
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Error seeding WPL data:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to seed WPL data',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
