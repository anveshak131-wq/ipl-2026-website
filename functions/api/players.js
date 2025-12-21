/**
 * Cloudflare Pages Function for /api/players
 * Handles player CRUD operations
 */

// Unified Cloudflare Pages Function for /api/players
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Helper: basic admin token check (presence of Bearer token)
function verifyAdminToken(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  return true;
}

// Helper: get team name by team ID
async function getTeamNameById(players, teamId, league, env) {
  try {
    const teamsData = await env.IPL_CACHE.get('teams', 'json');
    const teams = teamsData || [];
    const team = teams.find(t => (t.league || 'ipl') === league && t.id === teamId);
    return team ? team.name : `Team ${teamId}`;
  } catch (error) {
    return `Team ${teamId}`;
  }
}

export const onRequest = async (context) => {
  const { request, env } = context;

  // Handle OPTIONS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (request.method === 'GET') {
      const url = new URL(request.url);
      const league = url.searchParams.get('league');
      
      const playersData = await env.IPL_CACHE.get('players', 'json');
      let players = playersData || [];
      
      // Normalize teamId values - ensure they're strings without "Team" prefix
      players = players.map(player => {
        let normalizedTeamId = String(player.teamId || '').trim();
        // Remove "Team " prefix if present
        if (normalizedTeamId.startsWith('Team ')) {
          normalizedTeamId = normalizedTeamId.replace('Team ', '');
        }
        // Remove "team" prefix (case-insensitive)
        if (normalizedTeamId.toLowerCase().startsWith('team')) {
          normalizedTeamId = normalizedTeamId.replace(/^team/i, '');
        }
        
        return {
          ...player,
          teamId: normalizedTeamId || player.teamId, // Use normalized or fallback to original
          league: player.league || 'ipl' // Default to 'ipl' if missing
        };
      });
      
      // Filter by league if specified
      if (league && (league === 'ipl' || league === 'wpl')) {
        players = players.filter(player => {
          const playerLeague = player.league || 'ipl';
          return playerLeague === league;
        });
      }
      
      return new Response(JSON.stringify(players), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (request.method === 'POST') {
      if (!verifyAdminToken(request)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const newPlayer = await request.json();

      if (!newPlayer.name || !newPlayer.role || !newPlayer.teamId) {
        return new Response(JSON.stringify({ error: 'Missing required fields: name, role, teamId' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const playersData = await env.IPL_CACHE.get('players', 'json');
      const players = playersData || [];

      const playerLeague = newPlayer.league || 'ipl';

      // Check for duplicate player (same name in any team within same league)
      const duplicatePlayer = players.find(p => 
        (p.league || 'ipl') === playerLeague &&
        p.name.toLowerCase().trim() === newPlayer.name.toLowerCase().trim()
      );
      
      if (duplicatePlayer) {
        const existingTeamName = await getTeamNameById(players, duplicatePlayer.teamId, playerLeague, env);
        return new Response(JSON.stringify({ 
          error: 'Player "' + newPlayer.name + '" already exists in ' + existingTeamName + ' for ' + playerLeague.toUpperCase() + '. A player cannot play for multiple teams in the same league.' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Check team size limits
      if (playerLeague === 'ipl') {
        // IPL teams: maximum 25 players
        const existingTeamPlayers = players.filter(p => 
          (p.league || 'ipl') === 'ipl' && p.teamId === newPlayer.teamId
        );
        
        if (existingTeamPlayers.length >= 25) {
          return new Response(JSON.stringify({ 
            error: 'IPL teams cannot have more than 25 players. This team already has ' + existingTeamPlayers.length + ' players.' 
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }
      } else if (playerLeague === 'wpl') {
        // WPL teams: maximum 18 players
        const existingTeamPlayers = players.filter(p => 
          (p.league || 'ipl') === 'wpl' && p.teamId === newPlayer.teamId
        );
        
        if (existingTeamPlayers.length >= 18) {
          return new Response(JSON.stringify({ 
            error: 'WPL teams cannot have more than 18 players. This team already has ' + existingTeamPlayers.length + ' players.' 
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }
      }
      
      // Generate unique ID within the specific league
      const leaguePlayers = players.filter(p => (p.league || 'ipl') === (newPlayer.league || 'ipl'));
      const maxId = leaguePlayers.length > 0 
        ? Math.max(...leaguePlayers.map(p => parseInt(p.id) || 0))
        : 0;
      const newId = (maxId + 1).toString();
      
      const playerToAdd = {
        id: newId,
        league: newPlayer.league || 'ipl', // Default to 'ipl' if not specified
        name: newPlayer.name,
        role: newPlayer.role,
        teamId: newPlayer.teamId,
        age: parseInt(newPlayer.age) || 0,
        dateOfBirth: newPlayer.dateOfBirth || undefined,
        nationality: newPlayer.nationality || '',
        jerseyNumber: parseInt(newPlayer.jerseyNumber) || 0,
        isCaptain: newPlayer.isCaptain || false,
        bowlingStyle: newPlayer.bowlingStyle || 'N/A (Batsman)',
        battingStyle: newPlayer.battingStyle || 'Right-handed bat',
        stats: {
          matches: parseInt(newPlayer.stats?.matches) || 0,
          runs: parseInt(newPlayer.stats?.runs) || 0,
          wickets: parseInt(newPlayer.stats?.wickets) || 0,
          average: parseFloat(newPlayer.stats?.average) || 0,
          bowlingAverage: parseFloat(newPlayer.stats?.bowlingAverage) || 0,
          strikeRate: parseFloat(newPlayer.stats?.strikeRate) || 0,
          economy: parseFloat(newPlayer.stats?.economy) || 0,
          highest: parseInt(newPlayer.stats?.highest) || 0,
          fours: parseInt(newPlayer.stats?.fours) || 0,
          sixes: parseInt(newPlayer.stats?.sixes) || 0,
          fifties: parseInt(newPlayer.stats?.fifties) || 0,
          hundreds: parseInt(newPlayer.stats?.hundreds) || 0,
          bestBowling: newPlayer.stats?.bestBowling || '-',
        },
      };

      players.push(playerToAdd);
      await env.IPL_CACHE.put('players', JSON.stringify(players));

      return new Response(JSON.stringify(playerToAdd), {
        status: 201,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (request.method === 'PUT') {
      if (!verifyAdminToken(request)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const updatedPlayer = await request.json();
      if (!updatedPlayer.id) {
        return new Response(JSON.stringify({ error: 'Player ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const playersData = await env.IPL_CACHE.get('players', 'json');
      const players = playersData || [];
      const index = players.findIndex((p) => p.id === updatedPlayer.id);
      if (index === -1) {
        return new Response(JSON.stringify({ error: 'Player not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Check for duplicate player when updating team or name
      const playerLeague = updatedPlayer.league || players[index].league || 'ipl';
      const duplicatePlayer = players.find(p => 
        p.id !== updatedPlayer.id && // Exclude the current player
        (p.league || 'ipl') === playerLeague &&
        p.name.toLowerCase().trim() === updatedPlayer.name.toLowerCase().trim()
      );
      
      if (duplicatePlayer) {
        const existingTeamName = await getTeamNameById(players, duplicatePlayer.teamId, playerLeague, env);
        return new Response(JSON.stringify({ 
          error: 'Player "' + updatedPlayer.name + '" already exists in ' + existingTeamName + ' for ' + playerLeague.toUpperCase() + '. A player cannot play for multiple teams in the same league.' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      players[index] = {
        ...players[index], // Preserve existing properties
        id: updatedPlayer.id,
        ...(updatedPlayer.league && { league: updatedPlayer.league }), // Update league if provided
        name: updatedPlayer.name,
        role: updatedPlayer.role,
        teamId: updatedPlayer.teamId,
        age: parseInt(updatedPlayer.age) || 0,
        dateOfBirth: updatedPlayer.dateOfBirth || undefined,
        nationality: updatedPlayer.nationality || '',
        jerseyNumber: parseInt(updatedPlayer.jerseyNumber) || 0,
        isCaptain: updatedPlayer.isCaptain || false,
        bowlingStyle: updatedPlayer.bowlingStyle || 'N/A (Batsman)',
        battingStyle: updatedPlayer.battingStyle || 'Right-handed bat',
        stats: {
          matches: parseInt(updatedPlayer.stats?.matches) || 0,
          runs: parseInt(updatedPlayer.stats?.runs) || 0,
          wickets: parseInt(updatedPlayer.stats?.wickets) || 0,
          average: parseFloat(updatedPlayer.stats?.average) || 0,
          bowlingAverage: parseFloat(updatedPlayer.stats?.bowlingAverage) || 0,
          strikeRate: parseFloat(updatedPlayer.stats?.strikeRate) || 0,
          economy: parseFloat(updatedPlayer.stats?.economy) || 0,
          highest: parseInt(updatedPlayer.stats?.highest) || 0,
          fours: parseInt(updatedPlayer.stats?.fours) || 0,
          sixes: parseInt(updatedPlayer.stats?.sixes) || 0,
          fifties: parseInt(updatedPlayer.stats?.fifties) || 0,
          hundreds: parseInt(updatedPlayer.stats?.hundreds) || 0,
          bestBowling: updatedPlayer.stats?.bestBowling || '-',
        },
      };
      
      // Ensure league property exists (default to existing or 'ipl')
      if (!players[index].league) {
        players[index].league = 'ipl';
      }

      await env.IPL_CACHE.put('players', JSON.stringify(players));

      return new Response(JSON.stringify(players[index]), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (request.method === 'DELETE') {
      if (!verifyAdminToken(request)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const url = new URL(request.url);
      const playerId = url.searchParams.get('id');
      if (!playerId) {
        return new Response(JSON.stringify({ error: 'Player ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const playersData = await env.IPL_CACHE.get('players', 'json');
      const players = playersData || [];
      const filteredPlayers = players.filter((p) => p.id !== playerId);
      if (filteredPlayers.length === players.length) {
        return new Response(JSON.stringify({ error: 'Player not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      await env.IPL_CACHE.put('players', JSON.stringify(filteredPlayers));

      return new Response(JSON.stringify({ success: true, message: 'Player deleted' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};
