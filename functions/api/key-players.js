/**
 * Key Players API - Manage admin-selected key player roles per team
 * GET: Fetch key players (all or by teamId)
 * POST: Create/update key players for a team (admin only)
 */

export async function onRequestGet(context) {
  try {
    const { searchParams } = new URL(context.request.url);
    const teamId = searchParams.get('teamId');

    if (teamId) {
      // Fetch key players for specific team
      const keyPlayers = await context.env.IPL_CACHE.get(`keyPlayers:${teamId}`, 'json');
      return new Response(JSON.stringify(keyPlayers || null), {
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      // Fetch all key players
      const allTeams = (await context.env.IPL_CACHE.get('teams', 'json')) || [];
      const allKeyPlayers = [];

      for (const team of allTeams) {
        const data = await context.env.IPL_CACHE.get(`keyPlayers:${team.id}`, 'json');
        if (data) {
          allKeyPlayers.push(data);
        }
      }

      return new Response(JSON.stringify(allKeyPlayers), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error fetching key players:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch key players' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestPost(context) {
  try {
    // Authentication check
    const authHeader = context.request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token
    const userToken = await context.env.SPORTS_KV.get(`token:${token}`);
    if (!userToken) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse token value
    let tokenData;
    try {
      tokenData = JSON.parse(userToken);
    } catch {
      tokenData = { email: userToken, role: 'admin' };
    }

    // Check if user is admin or super_admin
    if (tokenData.role !== 'admin' && tokenData.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get key players data
    const keyPlayers = await context.request.json();

    if (!keyPlayers.teamId) {
      return new Response(JSON.stringify({ error: 'teamId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Store key players
    await context.env.IPL_CACHE.put(
      `keyPlayers:${keyPlayers.teamId}`,
      JSON.stringify(keyPlayers)
    );

    // Track admin activity
    try {
      await fetch(`${new URL(context.request.url).origin}/api/admin/users/activity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({
          action: 'update_key_players',
          details: `Updated key players for team ${keyPlayers.teamId}`,
        }),
      });
    } catch (err) {
      console.error('Failed to track activity:', err);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Key players updated successfully',
        data: keyPlayers,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error updating key players:', error);
    return new Response(JSON.stringify({ error: 'Failed to update key players' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
