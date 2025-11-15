export const onRequest = async (context) => {
  const { request, env } = context;
  const { pathname, searchParams } = new URL(request.url);
  const method = request.method;

  try {
    // Get current match live score
    if (pathname === '/api/live-score' && method === 'GET') {
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
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(JSON.stringify(JSON.parse(liveScore)), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update live score (admin only)
    if (pathname === '/api/live-score' && method === 'POST') {
      const token = request.headers.get('Authorization')?.replace('Bearer ', '');
      if (!token) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const email = await env.SPORTS_KV.get(`token:${token}`);
      if (!email) {
        return new Response(
          JSON.stringify({ error: 'Invalid token' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const userData = await env.SPORTS_KV.get(`user:${email}`);
      const user = JSON.parse(userData);

      // Check if user is admin
      if (user.role !== 'admin') {
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
