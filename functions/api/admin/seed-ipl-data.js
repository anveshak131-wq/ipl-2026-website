/**
 * Cloudflare Pages Function to seed IPL data
 * POST /api/admin/seed-ipl-data
 * 
 * This endpoint initializes IPL matches and players in Cloudflare KV
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

// IPL Teams data
const iplTeams = [
  {
    id: 1,
    league: 'ipl',
    name: 'Royal Challengers Bengaluru',
    shortName: 'RCB',
    logo: '/logos/rcb_logo_premium.svg',
    description: 'One of the most popular IPL teams known for their aggressive batting',
    colors: { primary: '#EC1C24', secondary: '#000000' }
  },
  {
    id: 2,
    league: 'ipl',
    name: 'Mumbai Indians',
    shortName: 'MI',
    logo: '/logos/mi_logo_new.svg',
    description: 'The most successful IPL team with 5 championship titles',
    colors: { primary: '#004BA0', secondary: '#FFFFFF' }
  },
  {
    id: 3,
    league: 'ipl',
    name: 'Sunrisers Hyderabad',
    shortName: 'SRH',
    logo: '/logos/srh_logo_new.svg',
    description: 'Known for their strong bowling attack and consistent performances',
    colors: { primary: '#FF822A', secondary: '#000000' }
  },
  {
    id: 4,
    league: 'ipl',
    name: 'Gujarat Titans',
    shortName: 'GT',
    logo: '/logos/gt_logo_new.svg',
    description: 'The newest powerhouse team that won IPL in their debut season',
    colors: { primary: '#1B2130', secondary: '#E15454' }
  },
  {
    id: 5,
    league: 'ipl',
    name: 'Punjab Kings',
    shortName: 'PBKS',
    logo: '/logos/kxip_logo_new.svg',
    description: 'Known for their explosive batting and competitive spirit',
    colors: { primary: '#ED1D24', secondary: '#FBDD0B' }
  },
  {
    id: 6,
    league: 'ipl',
    name: 'Delhi Capitals',
    shortName: 'DC',
    logo: '/logos/dc_logo_new.svg',
    description: 'A young and dynamic team with a balanced squad',
    colors: { primary: '#0078BC', secondary: '#000000' }
  },
  {
    id: 7,
    league: 'ipl',
    name: 'Lucknow Super Giants',
    shortName: 'LSG',
    logo: '/logos/lsg_logo_new.svg',
    description: 'The newest team with a strong combination of experience and youth',
    colors: { primary: '#237C2A', secondary: '#F8A400' }
  },
  {
    id: 8,
    league: 'ipl',
    name: 'Rajasthan Royals',
    shortName: 'RR',
    logo: '/logos/rr_logo_new.svg',
    description: 'The inaugural IPL champions known for nurturing young talent',
    colors: { primary: '#EA1A85', secondary: '#004B8D' }
  },
  {
    id: 9,
    league: 'ipl',
    name: 'Kolkata Knight Riders',
    shortName: 'KKR',
    logo: '/logos/kkr_logo_new.svg',
    description: 'Two-time IPL champions with a passionate fan base',
    colors: { primary: '#3A225D', secondary: '#B9975B' }
  },
  {
    id: 10,
    league: 'ipl',
    name: 'Chennai Super Kings',
    shortName: 'CSK',
    logo: '/logos/csk_logo_new.svg',
    description: 'The most consistent IPL team with 4 championship titles',
    colors: { primary: '#FFFF00', secondary: '#0081E8' }
  }
];

// IPL Players data
const iplPlayers = [
  // RCB Players
  {
    id: '1',
    league: 'ipl',
    name: 'Virat Kohli',
    role: 'Batsman',
    teamId: '1',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm medium',
    matches: 233,
    runs: 7263,
    wickets: 4,
    average: 37.24,
    strikeRate: 133.73,
    economy: 9.15
  },
  {
    id: '2',
    league: 'ipl',
    name: 'Faf du Plessis',
    role: 'Batsman',
    teamId: '1',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm offbreak',
    matches: 129,
    runs: 3898,
    wickets: 0,
    average: 35.16,
    strikeRate: 130.21,
    economy: 0
  },
  {
    id: '3',
    league: 'ipl',
    name: 'Mohammed Siraj',
    role: 'Bowler',
    teamId: '1',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm fast',
    matches: 91,
    runs: 156,
    wickets: 85,
    average: 29.65,
    strikeRate: 118.32,
    economy: 8.92
  },
  
  // MI Players
  {
    id: '4',
    league: 'ipl',
    name: 'Rohit Sharma',
    role: 'Batsman',
    teamId: '2',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm offbreak',
    matches: 243,
    runs: 6211,
    wickets: 8,
    average: 30.31,
    strikeRate: 130.03,
    economy: 7.25
  },
  {
    id: '5',
    league: 'ipl',
    name: 'Jasprit Bumrah',
    role: 'Bowler',
    teamId: '2',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm fast',
    matches: 133,
    runs: 389,
    wickets: 170,
    average: 23.24,
    strikeRate: 106.84,
    economy: 7.39
  },
  {
    id: '6',
    league: 'ipl',
    name: 'Suryakumar Yadav',
    role: 'Batsman',
    teamId: '2',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm offbreak',
    matches: 132,
    runs: 3575,
    wickets: 1,
    average: 39.50,
    strikeRate: 166.79,
    economy: 8.50
  },
  
  // SRH Players
  {
    id: '7',
    league: 'ipl',
    name: 'Pat Cummins',
    role: 'Bowler',
    teamId: '3',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm fast',
    matches: 45,
    runs: 321,
    wickets: 51,
    average: 28.47,
    strikeRate: 123.46,
    economy: 8.91
  },
  {
    id: '8',
    league: 'ipl',
    name: 'Travis Head',
    role: 'Batsman',
    teamId: '3',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm offbreak',
    matches: 10,
    runs: 249,
    wickets: 0,
    average: 27.67,
    strikeRate: 191.46,
    economy: 0
  },
  
  // GT Players
  {
    id: '9',
    league: 'ipl',
    name: 'Hardik Pandya',
    role: 'All-rounder',
    teamId: '4',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm fast',
    matches: 125,
    runs: 2107,
    wickets: 72,
    average: 27.58,
    strikeRate: 141.44,
    economy: 8.51
  },
  {
    id: '10',
    league: 'ipl',
    name: 'Shubman Gill',
    role: 'Batsman',
    teamId: '4',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm offbreak',
    matches: 91,
    runs: 3004,
    wickets: 0,
    average: 37.97,
    strikeRate: 140.21,
    economy: 0
  }
];

// Sample IPL Matches
const iplMatches = [
  {
    id: 'ipl-match-1',
    league: 'ipl',
    date: '2026-03-23',
    time: '19:30',
    venue: 'M. Chinnaswamy Stadium, Bengaluru',
    team1Id: '1',
    team2Id: '2',
    status: 'upcoming',
    team1: {
      id: 1,
      name: 'Royal Challengers Bengaluru',
      shortName: 'RCB'
    },
    team2: {
      id: 2,
      name: 'Mumbai Indians',
      shortName: 'MI'
    }
  },
  {
    id: 'ipl-match-2',
    league: 'ipl',
    date: '2026-03-24',
    time: '19:30',
    venue: 'Eden Gardens, Kolkata',
    team1Id: '9',
    team2Id: '8',
    status: 'upcoming',
    team1: {
      id: 9,
      name: 'Kolkata Knight Riders',
      shortName: 'KKR'
    },
    team2: {
      id: 8,
      name: 'Rajasthan Royals',
      shortName: 'RR'
    }
  },
  {
    id: 'ipl-match-3',
    league: 'ipl',
    date: '2026-03-25',
    time: '15:30',
    venue: 'MA Chidambaram Stadium, Chennai',
    team1Id: '10',
    team2Id: '7',
    status: 'upcoming',
    team1: {
      id: 10,
      name: 'Chennai Super Kings',
      shortName: 'CSK'
    },
    team2: {
      id: 7,
      name: 'Lucknow Super Giants',
      shortName: 'LSG'
    }
  }
];

export const onRequest = async (context) => {
  const { request, env } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  // Only allow POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // Verify admin token
  if (!verifyAdminToken(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  try {
    console.log('=== IPL DATA SEEDING START ===');
    
    // Get existing data
    const existingTeams = await env.IPL_CACHE.get('teams', 'json') || [];
    const existingPlayers = await env.IPL_CACHE.get('players', 'json') || [];
    const existingMatches = await env.IPL_CACHE.get('matches', 'json') || [];
    
    console.log(`Existing data - Teams: ${existingTeams.length}, Players: ${existingPlayers.length}, Matches: ${existingMatches.length}`);

    // Filter out existing IPL data to avoid duplicates
    const existingIPLTeamIds = existingTeams.filter(t => t.league === 'ipl').map(t => t.id);
    const existingIPLPlayerNames = existingPlayers.filter(p => p.league === 'ipl').map(p => p.name.toLowerCase());
    const existingIPLMatchIds = existingMatches.filter(m => m.league === 'ipl').map(m => m.id);

    // Add new IPL teams (avoid duplicates)
    const newTeams = iplTeams.filter(team => !existingIPLTeamIds.includes(team.id));
    const allTeams = [...existingTeams, ...newTeams];
    
    // Add new IPL players (avoid duplicates by name)
    const newPlayers = iplPlayers.filter(player => !existingIPLPlayerNames.includes(player.name.toLowerCase()));
    const allPlayers = [...existingPlayers, ...newPlayers];
    
    // Add new IPL matches (avoid duplicates by id)
    const newMatches = iplMatches.filter(match => !existingIPLMatchIds.includes(match.id));
    const allMatches = [...existingMatches, ...newMatches];

    // Save to KV storage
    await env.IPL_CACHE.put('teams', JSON.stringify(allTeams));
    await env.IPL_CACHE.put('players', JSON.stringify(allPlayers));
    await env.IPL_CACHE.put('matches', JSON.stringify(allMatches));

    console.log(`=== IPL DATA SEEDING COMPLETE ===`);
    console.log(`Teams added: ${newTeams.length}, Players added: ${newPlayers.length}, Matches added: ${newMatches.length}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'IPL data seeded successfully',
      data: {
        teams: {
          added: newTeams.length,
          total: allTeams.length,
          new: newTeams.map(t => ({ id: t.id, name: t.name }))
        },
        players: {
          added: newPlayers.length,
          total: allPlayers.length,
          new: newPlayers.map(p => ({ id: p.id, name: p.name, teamId: p.teamId }))
        },
        matches: {
          added: newMatches.length,
          total: allMatches.length,
          new: newMatches.map(m => ({ id: m.id, team1: m.team1.name, team2: m.team2.name }))
        }
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Error seeding IPL data:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
};
