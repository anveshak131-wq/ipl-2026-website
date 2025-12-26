export const onRequest = async (context) => {
  const { request, env } = context;
  const { searchParams } = new URL(request.url);
  const method = request.method;

  try {
    // GET current match live score (public)
    if (method === 'GET') {
      const matchId = searchParams.get('matchId') || 'current';
      const liveScore = await env.SPORTS_KV.get(`live:${matchId}`);

      if (!liveScore) {
        return new Response(
          JSON.stringify({
            matchId,
            team1: { name: 'RCB', runs: 0, wickets: 0, overs: 0 },
            team2: { name: 'CSK', runs: 0, wickets: 0, overs: 0 },
            currentBatter: { name: '', runs: 0, balls: 0 },
            currentBowler: { name: '', runs: 0, balls: 0 },
            commentary: [],
            status: 'Not Started',
            lastUpdated: new Date().toISOString(),
            // New fields for IPL rules
            strategicTimeout: {
              team1: { used: 0, remaining: 2 },
              team2: { used: 0, remaining: 2 },
              currentTimeout: null,
            },
            drsReviews: {
              team1: { used: 0, remaining: 2, successful: 0 },
              team2: { used: 0, remaining: 2, successful: 0 },
            },
            impactPlayer: {
              team1: null,
              team2: null,
            },
            superOver: null,
            ballChanged: false,
            isEveningMatch: false,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(JSON.stringify(JSON.parse(liveScore)), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // POST update live score (admin only)
    if (method === 'POST') {
      const token = request.headers.get('Authorization')?.replace('Bearer ', '');
      if (!token) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
      if (!tokenValue) {
        return new Response(
          JSON.stringify({ error: 'Invalid token' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // tokenValue may be a plain email (from /api/auth) or JSON (from /api/admin/setup)
      let email = tokenValue;
      if (tokenValue.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(tokenValue);
          if (parsed && typeof parsed.email === 'string') {
            email = parsed.email;
          }
        } catch {
          // fall back to using tokenValue directly
        }
      }

      const userData = await env.SPORTS_KV.get(`user:${email}`);
      if (!userData) {
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const user = JSON.parse(userData);

      // Check if user is admin or super_admin
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        return new Response(
          JSON.stringify({ error: 'Forbidden' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const { matchId = 'current', scoreUpdate } = await request.json();

      // Get current score or create new
      let liveScore = JSON.parse(
        (await env.SPORTS_KV.get(`live:${matchId}`)) ||
          JSON.stringify({
            matchId,
            team1: { name: 'RCB', runs: 0, wickets: 0, overs: 0 },
            team2: { name: 'CSK', runs: 0, wickets: 0, overs: 0 },
            currentBatter: { name: '', runs: 0, balls: 0 },
            currentBowler: { name: '', runs: 0, balls: 0 },
            commentary: [],
            status: 'Live',
            lastUpdated: new Date().toISOString(),
            // New fields for IPL rules
            strategicTimeout: {
              team1: { used: 0, remaining: 2 },
              team2: { used: 0, remaining: 2 },
              currentTimeout: null,
            },
            drsReviews: {
              team1: { used: 0, remaining: 2, successful: 0 },
              team2: { used: 0, remaining: 2, successful: 0 },
            },
            impactPlayer: {
              team1: null,
              team2: null,
            },
            superOver: null,
            ballChanged: false,
            isEveningMatch: false,
          })
      );

      // Update with new data
      liveScore = { ...liveScore, ...scoreUpdate, lastUpdated: new Date().toISOString() };

      // Store updated score
      await env.SPORTS_KV.put(`live:${matchId}`, JSON.stringify(liveScore), {
        expirationTtl: 604800, // 7 days
      });

      return new Response(JSON.stringify({ success: true, liveScore }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Live score error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
