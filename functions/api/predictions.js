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
  // Ensure user.id is always a string and not undefined
  if (!user.id) {
    console.error(`[getUserFromToken] User data missing id field for email: ${email}`);
    return null;
  }
  return { ...user, email, id: String(user.id).trim() };
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
        userId: String(user.id || '').trim(), // Ensure userId is always a string
        userName: user.name || user.email || 'Anonymous',
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
          JSON.stringify({ error: 'Unauthorized. Please log in to update predictions.' }),
          { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      if (user.isBlocked) {
        return new Response(
          JSON.stringify({ error: 'Your account is blocked' }),
          { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      let body;
      try {
        body = await request.json();
      } catch (e) {
        return new Response(
          JSON.stringify({ error: 'Invalid request body' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

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

      // Check ownership - normalize IDs to strings for comparison
      // Handle both string and number IDs, and trim whitespace
      const predictionUserId = String(prediction.userId || '').trim().toLowerCase();
      const currentUserId = String(user.id || '').trim().toLowerCase();
      
      console.log(`[UPDATE PREDICTION] Checking ownership: prediction.userId="${predictionUserId}" (original: "${prediction.userId}", type: ${typeof prediction.userId}), user.id="${currentUserId}" (original: "${user.id}", type: ${typeof user.id})`);
      console.log(`[UPDATE PREDICTION] User object:`, JSON.stringify({ id: user.id, email: user.email, name: user.name }));
      console.log(`[UPDATE PREDICTION] Prediction object:`, JSON.stringify({ id: prediction.id, userId: prediction.userId, userName: prediction.userName }));
      
      if (!predictionUserId || !currentUserId) {
        console.error(`[UPDATE PREDICTION] Missing user ID: prediction.userId="${predictionUserId}", user.id="${currentUserId}"`);
        return new Response(
          JSON.stringify({ error: 'Invalid user identification. Please try logging in again.' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
      
      // Compare normalized IDs (case-insensitive, trimmed)
      // Also try comparing without normalization as fallback
      const directMatch = String(prediction.userId || '').trim() === String(user.id || '').trim();
      const normalizedMatch = predictionUserId === currentUserId;
      
      if (!directMatch && !normalizedMatch) {
        console.log(`[UPDATE PREDICTION] Ownership mismatch: User ${currentUserId} (email: ${user.email}) attempted to update prediction ${id} owned by ${predictionUserId} (userName: ${prediction.userName})`);
        console.log(`[UPDATE PREDICTION] Direct match: ${directMatch}, Normalized match: ${normalizedMatch}`);
        return new Response(
          JSON.stringify({ error: 'You can only update your own predictions' }),
          { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
      
      console.log(`[UPDATE PREDICTION] Ownership verified: User ${currentUserId} owns prediction ${id}`);

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

      // Update prediction - merge playerPredictions if provided
      if (predictedWinner !== undefined) {
        prediction.predictedWinner = predictedWinner;
      }
      if (playerPredictions !== undefined) {
        // Merge player predictions instead of replacing entirely
        prediction.playerPredictions = {
          ...(prediction.playerPredictions || {}),
          ...playerPredictions,
        };
      }
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
