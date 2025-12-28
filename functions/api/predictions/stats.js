/**
 * Cloudflare Pages Function for prediction stats
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
    const userId = searchParams.get('userId');
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const predictions = await getAllPredictions(null, userId, null, env);
    
    const stats = {
      userId,
      totalPredictions: predictions.length,
      completedPredictions: predictions.filter((p) => p.accuracy).length,
      accuracy: {
        matchWinner: 0,
        topScorer: 0,
        mostWickets: 0,
        playerOfMatch: 0,
        overall: 0,
      },
      totalPoints: 0,
      averagePoints: 0,
      wins: 0,
    };

    const completed = predictions.filter((p) => p.accuracy);
    if (completed.length > 0) {
      let matchWinnerCorrect = 0;
      let topScorerCorrect = 0;
      let mostWicketsCorrect = 0;
      let playerOfMatchCorrect = 0;

      for (const pred of completed) {
        if (pred.accuracy) {
          stats.totalPoints += pred.accuracy.points || 0;
          if (pred.accuracy.points === 30) stats.wins++;
          if (pred.accuracy.matchWinner) matchWinnerCorrect++;
          if (pred.accuracy.topScorer) topScorerCorrect++;
          if (pred.accuracy.mostWickets) mostWicketsCorrect++;
          if (pred.accuracy.playerOfMatch) playerOfMatchCorrect++;
        }
      }

      stats.accuracy.matchWinner = (matchWinnerCorrect / completed.length) * 100;
      stats.accuracy.topScorer = (topScorerCorrect / completed.length) * 100;
      stats.accuracy.mostWickets = (mostWicketsCorrect / completed.length) * 100;
      stats.accuracy.playerOfMatch = (playerOfMatchCorrect / completed.length) * 100;
      stats.accuracy.overall = (stats.totalPoints / (completed.length * 30)) * 100;
      stats.averagePoints = stats.totalPoints / completed.length;
    }

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Stats error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};
