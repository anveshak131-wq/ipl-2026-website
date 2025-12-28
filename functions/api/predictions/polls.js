/**
 * Cloudflare Pages Function for polls
 */

// Helper to get user from token
async function getUserFromToken(token, env) {
  if (!token) return null;
  
  const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
  if (!tokenValue) return null;

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
  if (!userData) return null;

  const user = JSON.parse(userData);
  return { ...user, email };
}

export const onRequest = async (context) => {
  const { request, env } = context;
  const { pathname, searchParams } = new URL(request.url);
  const method = request.method;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // GET /api/predictions/polls - Get polls for match
    if (method === 'GET') {
      const matchId = searchParams.get('matchId');
      if (!matchId) {
        return new Response(
          JSON.stringify({ error: 'Match ID required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      const pollData = await env.SPORTS_KV.get(`poll:${matchId}`);
      if (!pollData) {
        return new Response(JSON.stringify(null), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      return new Response(pollData, {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // POST /api/predictions/polls - Create or vote on poll
    if (method === 'POST') {
      const token = request.headers.get('Authorization')?.replace('Bearer ', '');
      const user = await getUserFromToken(token, env);

      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      const body = await request.json();
      const { action, matchId, question, options, pollId, optionId } = body;

      // Create poll (admin only)
      if (action === 'create') {
        if (user.role !== 'admin' && user.role !== 'super_admin') {
          return new Response(
            JSON.stringify({ error: 'Forbidden' }),
            { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }

        if (!matchId || !question || !options || !Array.isArray(options)) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields' }),
            { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }

        const pollId = crypto.randomUUID();
        const poll = {
          id: pollId,
          matchId,
          league: body.league || 'ipl',
          question,
          options: options.map((opt, idx) => ({
            id: `opt-${idx}`,
            text: opt,
            votes: 0,
          })),
          createdAt: new Date().toISOString(),
          createdBy: user.id,
          isActive: true,
        };

        await env.SPORTS_KV.put(`poll:${matchId}`, JSON.stringify(poll), {
          expirationTtl: 31536000,
        });

        return new Response(JSON.stringify(poll), {
          status: 201,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Vote on poll
      if (action === 'vote') {
        if (!pollId || !optionId) {
          return new Response(
            JSON.stringify({ error: 'Poll ID and option ID required' }),
            { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }

        // Get poll (stored by matchId)
        const pollData = await env.SPORTS_KV.get(`poll:${matchId}`);
        if (!pollData) {
          return new Response(
            JSON.stringify({ error: 'Poll not found' }),
            { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }

        const poll = JSON.parse(pollData);
        if (!poll.isActive) {
          return new Response(
            JSON.stringify({ error: 'Poll is not active' }),
            { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }

        // Check if user already voted
        const voteKey = `poll:${matchId}:vote:${user.id}`;
        const existingVote = await env.SPORTS_KV.get(voteKey);
        if (existingVote) {
          return new Response(
            JSON.stringify({ error: 'You have already voted on this poll' }),
            { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }

        // Update vote count
        const option = poll.options.find((opt) => opt.id === optionId);
        if (!option) {
          return new Response(
            JSON.stringify({ error: 'Invalid option' }),
            { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }

        option.votes++;
        await env.SPORTS_KV.put(`poll:${matchId}`, JSON.stringify(poll), {
          expirationTtl: 31536000,
        });

        // Record user vote
        await env.SPORTS_KV.put(voteKey, optionId, {
          expirationTtl: 31536000,
        });

        return new Response(JSON.stringify(poll), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Polls error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};
