/**
 * Coaches API - Manage team coaching staff
 * GET: Fetch coaching staff (all or by teamId)
 * POST: Create/update coaching staff for a team
 */

export async function onRequestGet(context) {
  try {
    const { searchParams } = new URL(context.request.url);
    const teamId = searchParams.get('teamId');
    const league = searchParams.get('league');

    if (teamId) {
      // Fetch coaching staff for specific team
      const coachingStaff = await context.env.IPL_CACHE.get(`coaches:${teamId}`, 'json');
      return new Response(JSON.stringify(coachingStaff || null), {
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      // Fetch all coaching staff
      let allTeams = await context.env.IPL_CACHE.get('teams', 'json') || [];
      
      // Ensure all teams have league property
      allTeams = allTeams.map(team => ({
        ...team,
        league: team.league || 'ipl'
      }));
      
      // Filter teams by league if specified
      if (league && (league === 'ipl' || league === 'wpl')) {
        allTeams = allTeams.filter(team => {
          const teamLeague = team.league || 'ipl';
          return teamLeague === league;
        });
      }
      
      const allCoaches = [];
      
      for (const team of allTeams) {
        const staff = await context.env.IPL_CACHE.get(`coaches:${team.id}`, 'json');
        if (staff) {
          allCoaches.push(staff);
        }
      }

      return new Response(JSON.stringify(allCoaches), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error fetching coaches:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch coaching staff' }), {
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

    // Get coaching staff data
    const coachingStaff = await context.request.json();
    
    if (!coachingStaff.teamId) {
      return new Response(JSON.stringify({ error: 'teamId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Store coaching staff
    await context.env.IPL_CACHE.put(
      `coaches:${coachingStaff.teamId}`,
      JSON.stringify(coachingStaff)
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
          action: 'update_coaching_staff',
          details: `Updated coaching staff for team ${coachingStaff.teamId}`,
        }),
      });
    } catch (err) {
      console.error('Failed to track activity:', err);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Coaching staff updated successfully',
      data: coachingStaff 
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating coaches:', error);
    return new Response(JSON.stringify({ error: 'Failed to update coaching staff' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
