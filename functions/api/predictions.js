/**
 * Cloudflare Pages Function for predictions API
 * Handles CRUD operations for predictions
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

// Helper to check if match is upcoming
function isMatchUpcoming(match) {
  if (!match || match.status !== 'upcoming') return false;
  
  const matchDateTime = new Date(`${match.date}T${match.time}`);
  const now = new Date();
  return matchDateTime > now;
}

// Get all predictions (optionally filtered)
async function getAllPredictions(matchId, userId, league, env) {
  const predictions = [];

  if (matchId) {
    const matchKey = `predictions:match:${matchId}`;
    const matchPreds = await env.SPORTS_KV.get(matchKey);
    if (matchPreds) {
      const predIds = JSON.parse(matchPreds);
      for (const predId of predIds) {
        const predData = await env.SPORTS_KV.get(`prediction:${predId}`);
        if (predData) {
          predictions.push(JSON.parse(predData));
        }
      }
    }
  } else if (userId) {
    const userKey = `predictions:user:${userId}`;
    const userPreds = await env.SPORTS_KV.get(userKey);
    if (userPreds) {
      const predIds = JSON.parse(userPreds);
      for (const predId of predIds) {
        const predData = await env.SPORTS_KV.get(`prediction:${predId}`);
        if (predData) {
          predictions.push(JSON.parse(predData));
        }
      }
    }
  } else {
    const list = await env.SPORTS_KV.list({ prefix: 'prediction:' });
    for (const key of list.keys) {
      const predData = await env.SPORTS_KV.get(key.name);
      if (predData) {
        predictions.push(JSON.parse(predData));
      }
    }
  }

  if (league) {
    return predictions.filter((p) => p.league === league);
  }

  return predictions;
}

export const onRequest = async (context) => {
  const { request, env } = context;
  const { pathname, searchParams } = new URL(request.url);
  const method = request.method;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // GET /api/predictions - Get predictions
    if (pathname === '/api/predictions' && method === 'GET') {
      const matchId = searchParams.get('matchId');
      const userId = searchParams.get('userId');
      const league = searchParams.get('league');

      const predictions = await getAllPredictions(matchId, userId, league, env);

      return new Response(JSON.stringify(predictions), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // POST /api/predictions - Create prediction
    if (pathname === '/api/predictions' && method === 'POST') {
      const token = request.headers.get('Authorization')?.replace('Bearer ', '');
      const user = await getUserFromToken(token, env);

      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      if (user.isBlocked) {
        return new Response(
          JSON.stringify({ error: 'Your account is blocked' }),
          { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      const body = await request.json();
      const { matchId, predictedWinner, playerPredictions, league } = body;

      if (!matchId || !predictedWinner || !league) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Validate match exists and is upcoming
      const matchesData = await env.SPORTS_KV.get('matches');
      if (!matchesData) {
        return new Response(
          JSON.stringify({ error: 'Matches data not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      const matches = JSON.parse(matchesData);
      const match = matches.find((m) => m.id === matchId);
      
      if (!match) {
        return new Response(
          JSON.stringify({ error: 'Match not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      if (!isMatchUpcoming(match)) {
        return new Response(
          JSON.stringify({ error: 'Predictions only allowed for upcoming matches' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Check if user already has a prediction for this match
      const existingKey = `predictions:match:${matchId}:user:${user.id}`;
      const existingPredId = await env.SPORTS_KV.get(existingKey);
      
      if (existingPredId) {
        return new Response(
          JSON.stringify({ error: 'You already have a prediction for this match' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Create prediction
      const predictionId = crypto.randomUUID();
      const now = new Date().toISOString();
      
      const prediction = {
        id: predictionId,
        userId: user.id,
        matchId,
        league,
        predictedWinner,
        playerPredictions: playerPredictions || {},
        createdAt: now,
        updatedAt: now,
      };

      // Store prediction
      await env.SPORTS_KV.put(`prediction:${predictionId}`, JSON.stringify(prediction), {
        expirationTtl: 31536000, // 1 year
      });

      // Update indexes
      const matchKey = `predictions:match:${matchId}`;
      const matchPreds = await env.SPORTS_KV.get(matchKey);
      const matchPredIds = matchPreds ? JSON.parse(matchPreds) : [];
      matchPredIds.push(predictionId);
      await env.SPORTS_KV.put(matchKey, JSON.stringify(matchPredIds), {
        expirationTtl: 31536000,
      });

      const userKey = `predictions:user:${user.id}`;
      const userPreds = await env.SPORTS_KV.get(userKey);
      const userPredIds = userPreds ? JSON.parse(userPreds) : [];
      userPredIds.push(predictionId);
      await env.SPORTS_KV.put(userKey, JSON.stringify(userPredIds), {
        expirationTtl: 31536000,
      });

      // Store quick lookup
      await env.SPORTS_KV.put(existingKey, predictionId, {
        expirationTtl: 31536000,
      });

      return new Response(JSON.stringify(prediction), {
        status: 201,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // PUT /api/predictions - Update prediction
    if (pathname === '/api/predictions' && method === 'PUT') {
      const token = request.headers.get('Authorization')?.replace('Bearer ', '');
      const user = await getUserFromToken(token, env);

      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      const body = await request.json();
      const { id, predictedWinner, playerPredictions } = body;

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Prediction ID required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Get existing prediction
      const predData = await env.SPORTS_KV.get(`prediction:${id}`);
      if (!predData) {
        return new Response(
          JSON.stringify({ error: 'Prediction not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      const prediction = JSON.parse(predData);

      // Check ownership
      if (prediction.userId !== user.id) {
        return new Response(
          JSON.stringify({ error: 'Forbidden' }),
          { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Validate match is still upcoming
      const matchesData = await env.SPORTS_KV.get('matches');
      if (matchesData) {
        const matches = JSON.parse(matchesData);
        const match = matches.find((m) => m.id === prediction.matchId);
        if (match && !isMatchUpcoming(match)) {
          return new Response(
            JSON.stringify({ error: 'Cannot update prediction after match starts' }),
            { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }
      }

      // Update prediction
      prediction.predictedWinner = predictedWinner ?? prediction.predictedWinner;
      prediction.playerPredictions = playerPredictions ?? prediction.playerPredictions;
      prediction.updatedAt = new Date().toISOString();

      await env.SPORTS_KV.put(`prediction:${id}`, JSON.stringify(prediction), {
        expirationTtl: 31536000,
      });

      return new Response(JSON.stringify(prediction), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Predictions error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};
