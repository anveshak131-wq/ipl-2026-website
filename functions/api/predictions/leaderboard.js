/**
 * Cloudflare Pages Function for predictions leaderboard
 */

// Helper to get all predictions
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

// Get or calculate leaderboard
async function getLeaderboard(matchId, env, corsHeaders) {
  try {
    const cacheKey = matchId 
      ? `leaderboard:match:${matchId}` 
      : 'leaderboard:global';
    
    const cached = await env.SPORTS_KV.get(cacheKey);
    if (cached) {
      return new Response(cached, {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const allPredictions = await getAllPredictions(matchId, null, null, env);
    const userStats = {};

    for (const pred of allPredictions) {
      if (!pred.accuracy) continue;
      
      const userId = pred.userId;
      if (!userStats[userId]) {
        userStats[userId] = {
          userId,
          totalPredictions: 0,
          completedPredictions: 0,
          totalPoints: 0,
          wins: 0,
        };
      }

      userStats[userId].totalPredictions++;
      if (pred.accuracy) {
        userStats[userId].completedPredictions++;
        userStats[userId].totalPoints += pred.accuracy.points || 0;
        if (pred.accuracy.points === 30) {
          userStats[userId].wins++;
        }
      }
    }

    const leaderboard = Object.values(userStats)
      .map((stats) => ({
        ...stats,
        averagePoints: stats.completedPredictions > 0
          ? stats.totalPoints / stats.completedPredictions
          : 0,
        overallAccuracy: stats.completedPredictions > 0
          ? (stats.totalPoints / (stats.completedPredictions * 30)) * 100
          : 0,
      }))
      .sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) {
          return b.totalPoints - a.totalPoints;
        }
        return b.averagePoints - a.averagePoints;
      })
      .map((stats, index) => ({
        ...stats,
        rank: index + 1,
      }))
      .slice(0, 100);

    const result = JSON.stringify(leaderboard);
    
    await env.SPORTS_KV.put(cacheKey, result, { expirationTtl: 300 });

    return new Response(result, {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to calculate leaderboard' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

export const onRequest = async (context) => {
  const { request, env } = context;
  const { searchParams } = new URL(request.url);
  const method = request.method;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  try {
    const matchId = searchParams.get('matchId');
    return await getLeaderboard(matchId, env, corsHeaders);
  } catch (error) {
    console.error('Leaderboard error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};
