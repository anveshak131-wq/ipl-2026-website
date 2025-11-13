/**
 * Cloudflare Pages Function for /api/players
 * Handles player CRUD operations
 */

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS for CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// GET all players
export async function onRequestGet(context) {
  const { env } = context;

  try {
    const playersData = await env.IPL_CACHE.get('players', 'json');
    const players = playersData || [];

    return new Response(JSON.stringify(players), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch players', message: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
}

// POST - Create new player
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const newPlayer = await request.json();

    // Validate required fields
    if (!newPlayer.name || !newPlayer.role || !newPlayer.teamId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, role, teamId' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Get existing players
    const playersData = await env.IPL_CACHE.get('players', 'json');
    const players = playersData || [];

    // Generate new ID
    const newId = (players.length + 1).toString();
    const playerToAdd = {
      id: newId,
      name: newPlayer.name,
      role: newPlayer.role,
      teamId: newPlayer.teamId,
      age: parseInt(newPlayer.age) || 0,
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

    // Add to array
    players.push(playerToAdd);

    // Save to KV
    await env.IPL_CACHE.put('players', JSON.stringify(players));

    return new Response(JSON.stringify(playerToAdd), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to create player', message: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
}

// PUT - Update existing player
export async function onRequestPut(context) {
  const { request, env } = context;

  try {
    const updatedPlayer = await request.json();

    if (!updatedPlayer.id) {
      return new Response(
        JSON.stringify({ error: 'Player ID is required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Get existing players
    const playersData = await env.IPL_CACHE.get('players', 'json');
    const players = playersData || [];

    // Find and update player
    const index = players.findIndex(p => p.id === updatedPlayer.id);
    
    if (index === -1) {
      return new Response(
        JSON.stringify({ error: 'Player not found' }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Update player data
    players[index] = {
      id: updatedPlayer.id,
      name: updatedPlayer.name,
      role: updatedPlayer.role,
      teamId: updatedPlayer.teamId,
      age: parseInt(updatedPlayer.age) || 0,
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

    // Save to KV
    await env.IPL_CACHE.put('players', JSON.stringify(players));

    return new Response(JSON.stringify(players[index]), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to update player', message: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
}

// DELETE - Remove player
export async function onRequestDelete(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const playerId = url.searchParams.get('id');

    if (!playerId) {
      return new Response(
        JSON.stringify({ error: 'Player ID is required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Get existing players
    const playersData = await env.IPL_CACHE.get('players', 'json');
    const players = playersData || [];

    // Filter out the player
    const filteredPlayers = players.filter(p => p.id !== playerId);

    if (filteredPlayers.length === players.length) {
      return new Response(
        JSON.stringify({ error: 'Player not found' }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Save to KV
    await env.IPL_CACHE.put('players', JSON.stringify(filteredPlayers));

    return new Response(
      JSON.stringify({ success: true, message: 'Player deleted' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to delete player', message: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
}
