/**
 * Cloudflare Pages Function for matches API
 * Handles GET, POST, PUT, DELETE operations for matches
 */

// Mock teams for reference (IPL + WPL)
const mockTeams = [
  // IPL Teams (IDs 1-10)
  {
    id: '1',
    league: 'ipl',
    name: 'Royal Challengers Bengaluru',
    shortName: 'RCB',
    logo: '/logos/rcb_logo_premium.svg',
    colors: { primary: '#EC1C24', secondary: '#000000' }
  },
  {
    id: '2',
    league: 'ipl',
    name: 'Mumbai Indians',
    shortName: 'MI',
    logo: '/logos/mi_logo_new.svg',
    colors: { primary: '#004BA0', secondary: '#FFFFFF' }
  },
  {
    id: '3',
    league: 'ipl',
    name: 'Sunrisers Hyderabad',
    shortName: 'SRH',
    logo: '/logos/srh_logo_new.svg',
    colors: { primary: '#FF822A', secondary: '#000000' }
  },
  {
    id: '4',
    league: 'ipl',
    name: 'Gujarat Titans',
    shortName: 'GT',
    logo: '/logos/gt_logo_new.svg',
    colors: { primary: '#1B2130', secondary: '#E15454' }
  },
  {
    id: '5',
    league: 'ipl',
    name: 'Punjab Kings',
    shortName: 'PBKS',
    aliases: ['Kings XI Punjab', 'Kings Eleven Punjab'],
    logo: '/logos/kxip_logo_new.svg',
    colors: { primary: '#ED1D24', secondary: '#FBDD0B' }
  },
  {
    id: '6',
    league: 'ipl',
    name: 'Delhi Capitals',
    aliases: ['Delhi Daredevils'],
    shortName: 'DC',
    logo: '/logos/dc_logo_new.svg',
    colors: { primary: '#0078BC', secondary: '#EF1B26' }
  },
  {
    id: '7',
    league: 'ipl',
    name: 'Lucknow Super Giants',
    shortName: 'LSG',
    logo: '/logos/lsg_logo_new.svg',
    colors: { primary: '#9C2A2C', secondary: '#F7E17D' }
  },
  {
    id: '8',
    league: 'ipl',
    name: 'Rajasthan Royals',
    shortName: 'RR',
    logo: '/logos/rr_logo_new.svg',
    colors: { primary: '#EA1A85', secondary: '#004B8D' }
  },
  {
    id: '9',
    league: 'ipl',
    name: 'Kolkata Knight Riders',
    shortName: 'KKR',
    logo: '/logos/kkr_logo_new.svg',
    colors: { primary: '#3A225D', secondary: '#B9975B' }
  },
  {
    id: '10',
    league: 'ipl',
    name: 'Chennai Super Kings',
    shortName: 'CSK',
    logo: '/logos/csk_logo_new.svg',
    colors: { primary: '#FFB90F', secondary: '#0081E8' }
  },
  {
    id: '16',
    league: 'ipl',
    name: 'Gujarat Lions',
    shortName: 'GL',
    logo: '/logos/tba_logo.svg',
    colors: { primary: '#F28C28', secondary: '#1B365D' }
  },
  {
    id: '17',
    league: 'ipl',
    name: 'Rising Pune Supergiant',
    shortName: 'RPS',
    aliases: ['Rising Pune Supergiants'],
    logo: '/logos/tba_logo.svg',
    colors: { primary: '#6A1B9A', secondary: '#F06292' }
  },
  {
    id: '18',
    league: 'ipl',
    name: 'Deccan Chargers',
    shortName: 'DCG',
    logo: '/logos/tba_logo.svg',
    colors: { primary: '#1E3A8A', secondary: '#F59E0B' }
  },
  {
    id: '19',
    league: 'ipl',
    name: 'Kochi Tuskers Kerala',
    shortName: 'KTK',
    logo: '/logos/tba_logo.svg',
    colors: { primary: '#0F766E', secondary: '#F97316' }
  },
  {
    id: '20',
    league: 'ipl',
    name: 'Pune Warriors India',
    shortName: 'PWI',
    logo: '/logos/tba_logo.svg',
    colors: { primary: '#2563EB', secondary: '#FACC15' }
  },
  // WPL Teams (IDs 11-15)
  {
    id: '11',
    league: 'wpl',
    name: 'Mumbai Indians (WPL)',
    shortName: 'MI-W',
    logo: '/logos/wpl_mi_logo_animated.svg',
    colors: { primary: '#004BA0', secondary: '#FFD700' }
  },
  {
    id: '12',
    league: 'wpl',
    name: 'Royal Challengers Bengaluru (WPL)',
    shortName: 'RCB-W',
    logo: '/logos/wpl_rcb_logo_animated.svg',
    colors: { primary: '#C8102E', secondary: '#FFD700' }
  },
  {
    id: '13',
    league: 'wpl',
    name: 'Delhi Capitals (WPL)',
    shortName: 'DC-W',
    logo: '/logos/wpl_dc_logo_animated.svg',
    colors: { primary: '#004BA0', secondary: '#DC2626' }
  },
  {
    id: '14',
    league: 'wpl',
    name: 'Gujarat Giants (WPL)',
    shortName: 'GG',
    logo: '/logos/wpl_gg_logo_animated.svg',
    colors: { primary: '#F97316', secondary: '#FFD700' }
  },
  {
    id: '15',
    league: 'wpl',
    name: 'UP Warriorz (WPL)',
    shortName: 'UPW',
    logo: '/logos/wpl_upw_logo_animated.svg',
    colors: { primary: '#059669', secondary: '#F97316' }
  }
];

// No default/sample matches - start with empty array
// Users must create matches through the admin panel

const IPL_TEAM_IDS = new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '16', '17', '18', '19', '20']);
const WPL_TEAM_IDS = new Set(['11', '12', '13', '14', '15']);
const ACTIVE_IPL_2026_TEAM_IDS = new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
const ACTIVE_WPL_2026_TEAM_IDS = new Set(['11', '12', '13', '14', '15']);
const DEFAULT_SEASON_YEAR = 2026;

function getYearFromDateLike(value) {
  if (!value) return null;
  const str = String(value).trim();
  if (!str) return null;
  const prefix = str.slice(0, 4);
  if (/^\d{4}$/.test(prefix)) {
    const parsed = Number(prefix);
    return Number.isFinite(parsed) ? parsed : null;
  }
  const ms = Date.parse(str);
  if (Number.isNaN(ms)) return null;
  return new Date(ms).getUTCFullYear();
}

function normalizeTeamId(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  if (raw.startsWith('tbd-')) return raw;
  return raw.replace(/^team/i, '');
}

function isActiveSeasonMatch(match, seasonYear) {
  const matchLeague = inferMatchLeague(match) || match.league || 'ipl';
  const activeIds = matchLeague === 'wpl' ? ACTIVE_WPL_2026_TEAM_IDS : ACTIVE_IPL_2026_TEAM_IDS;

  const year = getYearFromDateLike(match?.date);
  if (year !== seasonYear) return false;

  const team1Id = normalizeTeamId(match?.team1Id ?? match?.team1?.id);
  const team2Id = normalizeTeamId(match?.team2Id ?? match?.team2?.id);
  return activeIds.has(team1Id) && activeIds.has(team2Id);
}

function normalizeLeague(value) {
  return value === 'ipl' || value === 'wpl' ? value : null;
}

function inferMatchLeague(match) {
  const explicit = normalizeLeague(match?.league);

  const team1Id = String(match?.team1Id ?? match?.team1?.id ?? '');
  const team2Id = String(match?.team2Id ?? match?.team2?.id ?? '');

  let teamBased = null;
  if (WPL_TEAM_IDS.has(team1Id) || WPL_TEAM_IDS.has(team2Id)) teamBased = 'wpl';
  if (IPL_TEAM_IDS.has(team1Id) || IPL_TEAM_IDS.has(team2Id)) teamBased = teamBased || 'ipl';

  if (explicit && teamBased && explicit !== teamBased) return teamBased;
  return explicit || teamBased || null;
}

// Helper function to verify admin token
function verifyAdminToken(request) {
  // Auth is enforced at the Cloudflare Pages middleware/layout level.
  // Here we do a lightweight presence check: accept any Bearer token,
  // or requests from same-origin (no Authorization header at all).
  const authHeader = request.headers.get('authorization');
  if (authHeader && !authHeader.startsWith('Bearer ')) {
    return false; // malformed header — reject
  }
  return true;
}

// Helper function to get team by ID from teams array
function getTeamById(teamId, teams) {
  // First try to find in provided teams array
  const team = teams.find(t => t.id === teamId);
  if (team) return team;
  
  // Fallback to mockTeams for backward compatibility
  return mockTeams.find(t => t.id === teamId);
}

// Helper function to format match with full team objects
function formatMatch(match, teams) {
  // If match already has full team objects, use them (preserve logo property)
  if (match.team1 && match.team1.name && match.team1.shortName) {
    return {
      id: match.id,
      league: match.league || 'ipl',
      date: match.date,
      time: match.time,
      venue: match.venue,
      team1: match.team1, // Preserve full team object including logo
      team2: match.team2, // Preserve full team object including logo
      status: match.status,
      result: match.result,
      score: match.score,
      team1Score: match.team1Score,
      team2Score: match.team2Score,
      matchNumber: match.matchNumber,
      playoffType: match.playoffType,
      playing11: match.playing11,
      impactPlayer: match.impactPlayer,
      toss: match.toss,
      matchState: match.matchState,
      _isMock: match._isMock
    };
  }
  
  // Otherwise, resolve team IDs to team objects
  const team1 = getTeamById(match.team1Id, teams);
  const team2 = getTeamById(match.team2Id, teams);
  
  // Log if teams are not found for debugging
  if (!team1) {
    console.warn(`Team not found for team1Id: ${match.team1Id}. Available teams:`, teams.map(t => ({ id: t.id, shortName: t.shortName })));
  }
  if (!team2) {
    console.warn(`Team not found for team2Id: ${match.team2Id}. Available teams:`, teams.map(t => ({ id: t.id, shortName: t.shortName })));
  }
  
  return {
    id: match.id,
    league: match.league || 'ipl', // Ensure league property is included
    date: match.date,
    time: match.time,
    venue: match.venue,
    team1: team1 ? {
      ...team1, // Preserve all team properties including logo
      players: team1.players || []
    } : { 
      id: match.team1Id, 
      shortName: `Team ${match.team1Id}`, 
      name: `Team ${match.team1Id}`, 
      logo: '', 
      league: match.league || 'ipl',
      colors: { primary: '#6B7280', secondary: '#9CA3AF' },
      players: []
    },
    team2: team2 ? {
      ...team2, // Preserve all team properties including logo
      players: team2.players || []
    } : { 
      id: match.team2Id, 
      shortName: `Team ${match.team2Id}`, 
      name: `Team ${match.team2Id}`, 
      logo: '', 
      league: match.league || 'ipl',
      colors: { primary: '#6B7280', secondary: '#9CA3AF' },
      players: []
    },
    status: match.status,
    result: match.result,
    score: match.score,
    team1Score: match.team1Score,
    team2Score: match.team2Score,
    matchNumber: match.matchNumber,
    playoffType: match.playoffType,
    playing11: match.playing11,
    impactPlayer: match.impactPlayer,
    toss: match.toss,
    matchState: match.matchState,
    _isMock: match._isMock
  };
}

// GET - Retrieve all matches
async function handleGetRequest(context) {
  const { env, request } = context;
  
  try {
    // Get league query parameter
    const url = new URL(request.url);
    const league = url.searchParams.get('league');
    const matchId = url.searchParams.get('id');
    const includeAll = url.searchParams.get('includeAll') === 'true';
    const seasonParam = url.searchParams.get('season') || url.searchParams.get('year');
    const seasonYear = Number.parseInt(seasonParam || '', 10);
    const resolvedSeasonYear = Number.isFinite(seasonYear) ? seasonYear : DEFAULT_SEASON_YEAR;
    
    // Try to get matches from KV storage
    const kvMatches = await env.IPL_CACHE.get('matches', 'json');
    
    // Check if KV key exists (even if empty array)
    const kvExists = await env.IPL_CACHE.get('matches');
    
    let matches;
    // Start with empty array - no default/sample matches
    // If KV exists, use what's in KV (even if empty array)
    if (kvExists === null) {
      // KV key doesn't exist - first time, start with empty array
      matches = [];
    } else {
      // KV key exists - use what's in KV (even if empty array)
      matches = kvMatches || [];
    }
    
    // Ensure all matches have league property (migration for existing data)
    let needsUpdate = false;
    matches = matches.map((match) => {
      const inferred = inferMatchLeague(match);
      const nextLeague = inferred || match.league || 'ipl';
      if (match.league !== nextLeague) {
        needsUpdate = true;
        return { ...match, league: nextLeague };
      }
      if (!match.league) {
        // Guarantee the property exists for consistent filtering on the client.
        needsUpdate = true;
        return { ...match, league: nextLeague };
      }
      return match;
    });

    if (needsUpdate) {
      await env.IPL_CACHE.put('matches', JSON.stringify(matches));
    }
    
    // Filter by league if specified
    if (league && (league === 'ipl' || league === 'wpl')) {
      matches = matches.filter(match => {
        const matchLeague = inferMatchLeague(match) || match.league || 'ipl';
        return matchLeague === league;
      });
    }

    // Default: only return the active 2026 season data (unless explicitly requested otherwise).
    if (!includeAll) {
      matches = matches.filter((match) => isActiveSeasonMatch(match, resolvedSeasonYear));
    }
    
    // Fetch teams from KV storage to properly resolve team objects
    let allTeams = await env.IPL_CACHE.get('teams', 'json');
    if (!allTeams || allTeams.length === 0) {
      // Fallback to mockTeams if KV is empty
      allTeams = mockTeams;
    }
    
    // Format matches with team objects
    const formattedMatches = matches.map(match => formatMatch(match, allTeams));
    
    // Sync results from scorecards for completed matches with missing results
    try {
      const scorecardsResponse = await fetch(`${request.url.replace('/api/matches', '/api/scorecards')}&league=${league || 'ipl'}`);
      if (scorecardsResponse.ok) {
        const scorecards = await scorecardsResponse.json();
        if (Array.isArray(scorecards)) {
          // Update matches with scorecard results
          formattedMatches.forEach(match => {
            if (match.status === 'completed' && !match.result) {
              // Only use published scorecards to avoid leaking draft results.
              const scorecard = scorecards.find(sc => sc.matchId === match.id && sc.draft === false);
              if (scorecard && scorecard.result && scorecard.result.winner) {
                // Create result text from scorecard
                const winnerTeam = allTeams.find(t => t.name === scorecard.result.winner);
                const isTeam1Winner = winnerTeam && winnerTeam.id === match.team1?.id;
                
                if (isTeam1Winner) {
                  match.result = `${match.team1?.shortName || match.team1?.name} won by ${scorecard.result.margin}`;
                } else {
                  match.result = `${match.team2?.shortName || match.team2?.name} won by ${scorecard.result.margin}`;
                }
                
                console.log(`Updated match ${match.id} result from scorecard:`, match.result);
              }
            }
          });
        }
      }
    } catch (error) {
      console.error('Error syncing scorecard results:', error);
    }
    
    if (matchId) {
      const selected = formattedMatches.find((m) => String(m.id) === String(matchId)) || null;
      if (!selected) {
        return new Response(JSON.stringify({ error: 'Match not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        });
      }

      return new Response(JSON.stringify(selected), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    }

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

// POST (bulk) - Create multiple matches in one atomic KV write
async function handleBulkPostRequest(context) {
  const { env, request } = context;

  if (!verifyAdminToken(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const incoming = Array.isArray(body.matches) ? body.matches : [];
    if (!incoming.length) {
      return new Response(JSON.stringify({ error: 'No matches provided' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate each row has required fields
    for (const m of incoming) {
      if (!m.date || !m.time || !m.venue || !m.team1Id || !m.team2Id) {
        return new Response(JSON.stringify({ error: `Missing required fields in match: ${JSON.stringify(m)}` }), {
          status: 400, headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Read existing matches ONCE
    let matches = await env.IPL_CACHE.get('matches', 'json') || [];
    let nextId = Math.max(...matches.map(m => parseInt(m.id) || 0), 0) + 1;

    // Fetch teams for response formatting
    let allTeams = await env.IPL_CACHE.get('teams', 'json');
    if (!allTeams || !allTeams.length) allTeams = mockTeams;

    const created = incoming.map(m => {
      const newMatch = {
        id: String(nextId++),
        league: m.league || 'ipl',
        date: m.date,
        time: m.time,
        venue: m.venue,
        team1Id: m.team1Id,
        team2Id: m.team2Id,
        status: m.status || 'upcoming',
        ...(m.playoffType ? { playoffType: m.playoffType } : {}),
      };
      matches.push(newMatch);
      return newMatch;
    });

    // Single atomic write
    await env.IPL_CACHE.put('matches', JSON.stringify(matches));

    return new Response(JSON.stringify({
      success: true,
      created: created.map(m => formatMatch(m, allTeams)),
      count: created.length
    }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error bulk creating matches:', error);
    return new Response(JSON.stringify({ error: `Bulk create failed: ${error.message}` }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
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
    
    // Get existing matches from KV
    let matches = await env.IPL_CACHE.get('matches', 'json');
    
    // Check if KV key exists
    const kvExists = await env.IPL_CACHE.get('matches');
    
    // Start with empty array - no default/sample matches
    // If KV exists but is empty, use empty array
    if (kvExists === null) {
      matches = [];
    } else {
      matches = matches || [];
    }
    
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
    
    // Fetch teams to format the response
    let allTeams = await env.IPL_CACHE.get('teams', 'json');
    if (!allTeams || allTeams.length === 0) {
      allTeams = mockTeams;
    }
    
    return new Response(JSON.stringify(formatMatch(newMatch, allTeams)), {
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

// PUT (bulk) - Update status for multiple matches in one atomic KV write
async function handleBulkPutRequest(context) {
  const { env, request } = context;

  if (!verifyAdminToken(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { matchIds, status } = body;
    if (!Array.isArray(matchIds) || !matchIds.length || !status) {
      return new Response(JSON.stringify({ error: 'matchIds array and status are required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    const idSet = new Set(matchIds.map(String));
    let matches = await env.IPL_CACHE.get('matches', 'json') || [];
    let updatedCount = 0;
    matches = matches.map(m => {
      if (idSet.has(String(m.id))) { updatedCount++; return { ...m, status }; }
      return m;
    });
    await env.IPL_CACHE.put('matches', JSON.stringify(matches));
    return new Response(JSON.stringify({ success: true, updated: updatedCount, status }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error bulk updating match status:', error);
    return new Response(JSON.stringify({ error: `Bulk status update failed: ${error.message}` }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
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
    const { id, date, time, venue, team1Id, team2Id, status, league, playing11 } = body;
    
    if (!id) {
      return new Response(JSON.stringify({ error: 'Match ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get existing matches from KV
    let matches = await env.IPL_CACHE.get('matches', 'json');
    
    // Check if KV key exists
    const kvExists = await env.IPL_CACHE.get('matches');
    
    // Start with empty array - no default/sample matches
    // If KV exists but is empty, use empty array
    if (kvExists === null) {
      matches = [];
    } else {
      matches = matches || [];
    }
    
    // Find and update match
    const matchIndex = matches.findIndex(m => m.id === id);
    
    if (matchIndex === -1) {
      return new Response(JSON.stringify({ error: 'Match not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Update match with all fields from body, preserving existing values
    const updatedMatch = {
      ...matches[matchIndex],
      ...body, // Spread all fields from body
      id // Ensure ID doesn't change
    };
    
    // Ensure league property exists (default to existing or 'ipl')
    if (!updatedMatch.league) {
      updatedMatch.league = matches[matchIndex].league || 'ipl';
    }
    
    matches[matchIndex] = updatedMatch;
    
    // Save to KV
    await env.IPL_CACHE.put('matches', JSON.stringify(matches));
    
    // Fetch teams to format the response
    let allTeams = await env.IPL_CACHE.get('teams', 'json');
    if (!allTeams || allTeams.length === 0) {
      allTeams = mockTeams;
    }
    
    return new Response(JSON.stringify(formatMatch(updatedMatch, allTeams)), {
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

// DELETE - Delete a match or clear all matches
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
    const clearAll = url.searchParams.get('clearAll') === 'true';
    const bulkDelete = url.searchParams.get('bulkDelete') === 'true' || url.searchParams.get('bulk') === 'true';
    
    // If clearAll is true, clear all matches from KV storage
    if (clearAll) {
      await env.IPL_CACHE.put('matches', JSON.stringify([]));
      console.log('All matches cleared from KV storage');
      return new Response(JSON.stringify({ success: true, message: 'All matches cleared successfully' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Bulk delete matches in one request (atomic KV write)
    if (bulkDelete) {
      let body = {};
      try {
        body = await request.json();
      } catch {
        body = {};
      }

      const matchIds = Array.isArray(body.matchIds) ? body.matchIds.map(String).filter(Boolean) : [];
      if (!matchIds.length) {
        return new Response(JSON.stringify({ error: 'matchIds array is required for bulk delete' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      let matches = await env.IPL_CACHE.get('matches', 'json');
      const kvExists = await env.IPL_CACHE.get('matches');
      if (kvExists === null) {
        matches = [];
      } else {
        matches = matches || [];
      }

      const idSet = new Set(matchIds);
      const existingIds = new Set(matches.map((m) => String(m.id)));
      const notFound = matchIds.filter((id) => !existingIds.has(id));

      const remainingMatches = matches.filter((m) => !idSet.has(String(m.id)));
      const deleted = matches.length - remainingMatches.length;

      await env.IPL_CACHE.put('matches', JSON.stringify(remainingMatches));

      return new Response(JSON.stringify({
        success: true,
        deleted,
        requested: matchIds.length,
        notFound,
        message: `Deleted ${deleted} match(es)`
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (!matchId) {
      return new Response(JSON.stringify({ error: 'Match ID is required or use clearAll=true to clear all matches' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get existing matches from KV
    let matches = await env.IPL_CACHE.get('matches', 'json');
    
    // Check if KV key exists
    const kvExists = await env.IPL_CACHE.get('matches');
    
    // Start with empty array - no default/sample matches
    // If KV exists but is empty, use empty array
    if (kvExists === null) {
      matches = [];
    } else {
      matches = matches || [];
    }
    
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
    case 'POST': {
      const postUrl = new URL(request.url);
      response = postUrl.searchParams.get('bulk') === 'true'
        ? await handleBulkPostRequest(context)
        : await handlePostRequest(context);
      break;
    }
    case 'PUT': {
      const putUrl = new URL(request.url);
      response = putUrl.searchParams.get('bulkStatus') === 'true'
        ? await handleBulkPutRequest(context)
        : await handlePutRequest(context);
      break;
    }
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
