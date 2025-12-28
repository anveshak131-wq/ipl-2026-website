/**
 * Shared helper functions for predictions API
 */

// Helper to get user from token
export async function getUserFromToken(token, env) {
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
export function isMatchUpcoming(match) {
  if (!match || match.status !== 'upcoming') return false;
  
  const matchDateTime = new Date(`${match.date}T${match.time}`);
  const now = new Date();
  return matchDateTime > now;
}

// Get all predictions (optionally filtered)
export async function getAllPredictions(matchId, userId, league, env) {
  const predictions = [];

  if (matchId) {
    // Get predictions for specific match
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
    // Get predictions for specific user
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
    // Get all predictions (limited - for leaderboard calculation)
    const list = await env.SPORTS_KV.list({ prefix: 'prediction:' });
    for (const key of list.keys) {
      const predData = await env.SPORTS_KV.get(key.name);
      if (predData) {
        predictions.push(JSON.parse(predData));
      }
    }
  }

  // Filter by league if specified
  if (league) {
    return predictions.filter((p) => p.league === league);
  }

  return predictions;
}

// Get or calculate leaderboard
export async function getLeaderboard(matchId, env, corsHeaders) {
  try {
    const cacheKey = matchId 
      ? `leaderboard:match:${matchId}` 
      : 'leaderboard:global';
    
    // Try to get cached leaderboard
    const cached = await env.SPORTS_KV.get(cacheKey);
    if (cached) {
      return new Response(cached, {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Calculate leaderboard
    const allPredictions = await getAllPredictions(matchId, null, null, env);
    const userStats = {};

    for (const pred of allPredictions) {
      if (!pred.accuracy) continue; // Skip predictions without accuracy
      
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

    // Convert to array and calculate averages
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
        // Sort by total points, then by average points
        if (b.totalPoints !== a.totalPoints) {
          return b.totalPoints - a.totalPoints;
        }
        return b.averagePoints - a.averagePoints;
      })
      .map((stats, index) => ({
        ...stats,
        rank: index + 1,
      }))
      .slice(0, 100); // Top 100

    const result = JSON.stringify(leaderboard);
    
    // Cache for 5 minutes
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

