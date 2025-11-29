/**
 * Cloudflare Pages Function for matches API
 * Handles GET, POST, PUT, DELETE operations for matches
 */

// Mock teams for reference
const mockTeams = [
  {
    id: '1',
    name: 'Royal Challengers Bengaluru',
    shortName: 'RCB',
    logo: '/logos/rcb_logo_new.svg',
    colors: { primary: '#EC1C24', secondary: '#000000' }
  },
  {
    id: '2',
    name: 'Mumbai Indians',
    shortName: 'MI',
    logo: '/logos/mi_logo_new.svg',
    colors: { primary: '#004BA0', secondary: '#FFFFFF' }
  },
  {
    id: '3',
    name: 'Sunrisers Hyderabad',
    shortName: 'SRH',
    logo: '/logos/srh_logo_new.svg',
    colors: { primary: '#FF822A', secondary: '#000000' }
  },
  {
    id: '4',
    name: 'Gujarat Titans',
    shortName: 'GT',
    logo: '/logos/gt_logo_new.svg',
    colors: { primary: '#1B2130', secondary: '#E15454' }
  },
  {
    id: '5',
    name: 'Punjab Kings',
    shortName: 'PBKS',
    logo: '/logos/kxip_logo_new.svg',
    colors: { primary: '#ED1D24', secondary: '#FBDD0B' }
  },
  {
    id: '6',
    name: 'Delhi Capitals',
    shortName: 'DC',
    logo: '/logos/dc_logo_new.svg',
    colors: { primary: '#0078BC', secondary: '#EF1B26' }
  },
  {
    id: '7',
    name: 'Lucknow Super Giants',
    shortName: 'LSG',
    logo: '/logos/lsg_logo_new.svg',
    colors: { primary: '#9C2A2C', secondary: '#F7E17D' }
  },
  {
    id: '8',
    name: 'Rajasthan Royals',
    shortName: 'RR',
    logo: '/logos/rr_logo_new.svg',
    colors: { primary: '#EA1A85', secondary: '#004B8D' }
  },
  {
    id: '9',
    name: 'Kolkata Knight Riders',
    shortName: 'KKR',
    logo: '/logos/kkr_logo_new.svg',
    colors: { primary: '#3A225D', secondary: '#B9975B' }
  },
  {
    id: '10',
    name: 'Chennai Super Kings',
    shortName: 'CSK',
    logo: '/logos/csk_logo_new.svg',
    colors: { primary: '#FFFF00', secondary: '#0081E8' }
  }
];

// Default mock matches
const defaultMatches = [
  {
    id: '1',
    league: 'ipl',
    date: '2026-03-23',
    time: '19:30',
    venue: 'M. A. Chidambaram Stadium, Chennai',
    team1Id: '10',
    team2Id: '1',
    status: 'upcoming'
  },
  {
    id: '2',
    league: 'ipl',
    date: '2026-03-24',
    time: '15:30',
    venue: 'Eden Gardens, Kolkata',
    team1Id: '9',
    team2Id: '4',
    status: 'upcoming'
  },
  {
    id: '3',
    league: 'ipl',
    date: '2026-03-25',
    time: '19:30',
    venue: 'Wankhede Stadium, Mumbai',
    team1Id: '2',
    team2Id: '8',
    status: 'upcoming'
  }
];

// Helper function to verify admin token
function verifyAdminToken(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  // In production, verify the actual token
  // For now, accept any bearer token from authenticated sessions
  return true;
}

// Helper function to get team by ID
function getTeamById(teamId) {
  return mockTeams.find(t => t.id === teamId);
}

// Helper function to format match with full team objects
function formatMatch(match) {
  const team1 = getTeamById(match.team1Id);
  const team2 = getTeamById(match.team2Id);
  
  return {
    id: match.id,
    league: match.league || 'ipl', // Ensure league property is included
    date: match.date,
    time: match.time,
    venue: match.venue,
    team1: team1 || { id: match.team1Id, shortName: 'Unknown' },
    team2: team2 || { id: match.team2Id, shortName: 'Unknown' },
    status: match.status
  };
}

// GET - Retrieve all matches
async function handleGetRequest(context) {
  const { env, request } = context;
  
  try {
    // Get league query parameter
    const url = new URL(request.url);
    const league = url.searchParams.get('league');
    
    // Try to get matches from KV storage
    let matches = await env.IPL_CACHE.get('matches', 'json');
    
    // Fallback to default matches if KV storage is empty
    if (!matches) {
      matches = defaultMatches;
    }
    
    // Ensure all matches have league property (migration for existing data)
    matches = matches.map(match => ({
      ...match,
      league: match.league || 'ipl' // Default to 'ipl' if missing
    }));
    
    // Filter by league if specified
    if (league && (league === 'ipl' || league === 'wpl')) {
      matches = matches.filter(match => {
        const matchLeague = match.league || 'ipl';
        return matchLeague === league;
      });
    }
    
    // Format matches with team objects
    const formattedMatches = matches.map(formatMatch);
    
    return new Response(JSON.stringify(formattedMatches), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error) {
    console.error('Error retrieving matches:', error);
    return new Response(JSON.stringify({ error: 'Failed to retrieve matches' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// POST - Create a new match
async function handlePostRequest(context) {
  const { env, request } = context;
  
  // Verify admin authentication
  if (!verifyAdminToken(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const body = await request.json();
    const { date, time, venue, team1Id, team2Id, status, league } = body;
    
    // Validate required fields
    if (!date || !time || !venue || !team1Id || !team2Id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get existing matches
    let matches = await env.IPL_CACHE.get('matches', 'json') || defaultMatches;
    
    // Generate new ID
    const newId = String(Math.max(...matches.map(m => parseInt(m.id) || 0), 0) + 1);
    
    // Create new match
    const newMatch = {
      id: newId,
      league: league || 'ipl', // Default to 'ipl' if not specified
      date,
      time,
      venue,
      team1Id,
      team2Id,
      status: status || 'upcoming'
    };
    
    // Add to matches array
    matches.push(newMatch);
    
    // Save to KV
    await env.IPL_CACHE.put('matches', JSON.stringify(matches));
    
    return new Response(JSON.stringify(formatMatch(newMatch)), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating match:', error);
    return new Response(JSON.stringify({ error: 'Failed to create match' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// PUT - Update an existing match
async function handlePutRequest(context) {
  const { env, request } = context;
  
  // Verify admin authentication
  if (!verifyAdminToken(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const body = await request.json();
    const { id, date, time, venue, team1Id, team2Id, status, league } = body;
    
    if (!id) {
      return new Response(JSON.stringify({ error: 'Match ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get existing matches
    let matches = await env.IPL_CACHE.get('matches', 'json') || defaultMatches;
    
    // Find and update match
    const matchIndex = matches.findIndex(m => m.id === id);
    
    if (matchIndex === -1) {
      return new Response(JSON.stringify({ error: 'Match not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const updatedMatch = {
      ...matches[matchIndex],
      ...(date && { date }),
      ...(time && { time }),
      ...(venue && { venue }),
      ...(team1Id && { team1Id }),
      ...(team2Id && { team2Id }),
      ...(status && { status }),
      ...(league && { league }) // Update league if provided
    };
    
    // Ensure league property exists (default to existing or 'ipl')
    if (!updatedMatch.league) {
      updatedMatch.league = matches[matchIndex].league || 'ipl';
    }
    
    matches[matchIndex] = updatedMatch;
    
    // Save to KV
    await env.IPL_CACHE.put('matches', JSON.stringify(matches));
    
    return new Response(JSON.stringify(formatMatch(updatedMatch)), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating match:', error);
    return new Response(JSON.stringify({ error: 'Failed to update match' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// DELETE - Delete a match
async function handleDeleteRequest(context) {
  const { env, request } = context;
  
  // Verify admin authentication
  if (!verifyAdminToken(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const url = new URL(request.url);
    const matchId = url.searchParams.get('id');
    
    if (!matchId) {
      return new Response(JSON.stringify({ error: 'Match ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get existing matches
    let matches = await env.IPL_CACHE.get('matches', 'json') || defaultMatches;
    
    // Ensure all matches have league property
    matches = matches.map(m => ({
      ...m,
      league: m.league || 'ipl'
    }));
    
    // Find the match to delete
    const matchIndex = matches.findIndex(m => m.id === matchId);
    
    if (matchIndex === -1) {
      console.error(`Match with ID ${matchId} not found. Total matches: ${matches.length}`);
      return new Response(JSON.stringify({ error: 'Match not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Remove the match
    matches.splice(matchIndex, 1);
    
    // Save to KV
    await env.IPL_CACHE.put('matches', JSON.stringify(matches));
    
    console.log(`Match ${matchId} deleted successfully. Remaining matches: ${matches.length}`);
    
    return new Response(JSON.stringify({ success: true, message: 'Match deleted' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error deleting match:', error);
    return new Response(JSON.stringify({ error: `Failed to delete match: ${error.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Main request handler
export async function onRequest(context) {
  const { request } = context;
  const method = request.method;
  
  // Enable CORS for your domain
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
  
  let response;
  
  switch (method) {
    case 'GET':
      response = await handleGetRequest(context);
      break;
    case 'POST':
      response = await handlePostRequest(context);
      break;
    case 'PUT':
      response = await handlePutRequest(context);
      break;
    case 'DELETE':
      response = await handleDeleteRequest(context);
      break;
    default:
      response = new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
  }
  
  // Add CORS headers to response
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return response;
}
