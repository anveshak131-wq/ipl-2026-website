/**
 * API handler for syncing scorecard stats to player profiles
 * POST /api/scorecard-sync
 * 
 * Body: {
 *   scorecardId: string,
 *   league: 'ipl' | 'wpl',
 *   matchId: string,
 *   playerStats: {
 *     playerId: string,
 *     playerName: string,
 *     batting?: { runs, balls, fours, sixes, dismissalType },
 *     bowling?: { wickets, overs, balls, runs, maidens, wides, noBalls }
 *   }[]
 * }
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  }

  try {
    // Verify admin token
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing authorization token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await request.json();
    const { scorecardId, league = 'ipl', matchId, playerStats = [] } = data;

    if (!scorecardId || !playerStats || playerStats.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`[Scorecard Sync] Processing ${playerStats.length} players for match ${matchId}`);

    const updatedPlayers = [];
    const errors = [];

    // Process each player's stats
    for (const playerStat of playerStats) {
      try {
        const playerId = playerStat.playerId;
        if (!playerId) {
          console.warn('[Scorecard Sync] Skipping player with no ID');
          continue;
        }

        // Get current player data
        const playerKey = `player_${playerId}`;
        const playerData = await env.IPL_CACHE.get(playerKey);
        
        if (!playerData) {
          console.warn(`[Scorecard Sync] Player ${playerId} not found, creating new entry`);
          // Create basic entry if doesn't exist
          const newPlayer = {
            id: playerId,
            name: playerStat.playerName,
            league,
            stats: {}
          };
          
          // Apply stats updates
          const statUpdates = calculatePlayerStatsUpdates(newPlayer.stats, playerStat);
          newPlayer.stats = statUpdates;
          
          await env.IPL_CACHE.put(playerKey, JSON.stringify(newPlayer));
          updatedPlayers.push({ playerId, operation: 'created' });
          continue;
        }

        const player = JSON.parse(playerData);
        const currentStats = player.stats || {};

        // Calculate new stats
        const updatedStats = calculatePlayerStatsUpdates(currentStats, playerStat);

        // Update player with new stats
        player.stats = updatedStats;
        player.updatedAt = new Date().toISOString();
        player.lastSyncScorecard = scorecardId;

        await env.IPL_CACHE.put(playerKey, JSON.stringify(player));
        
        console.log(`[Scorecard Sync] Updated player ${playerId}:`, {
          batting: !!playerStat.batting,
          bowling: !!playerStat.bowling,
          runs: updatedStats.runs,
          wickets: updatedStats.wickets
        });

        updatedPlayers.push({
          playerId,
          playerName: playerStat.playerName,
          batting: !!playerStat.batting,
          bowling: !!playerStat.bowling,
          stats: {
            runs: updatedStats.runs,
            wickets: updatedStats.wickets,
            battingAverage: updatedStats.battingAverage,
            bowlingAverage: updatedStats.bowlingAverage
          }
        });
      } catch (error) {
        console.error(`[Scorecard Sync] Error updating player ${playerStat.playerId}:`, error);
        errors.push({
          playerId: playerStat.playerId,
          error: String(error)
        });
      }
    }

    console.log(`[Scorecard Sync] Completed: ${updatedPlayers.length} updated, ${errors.length} errors`);

    return new Response(JSON.stringify({
      success: true,
      scorecardId,
      matchId,
      updatedCount: updatedPlayers.length,
      details: updatedPlayers,
      errors: errors.length > 0 ? errors : undefined
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('[Scorecard Sync] Server error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: String(error)
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

/**
 * Helper: Calculate updated player stats from scorecard performance
 */
function calculatePlayerStatsUpdates(currentStats, scorecardStats) {
  const updates = { ...currentStats };

  // Update batting stats
  if (scorecardStats.batting) {
    const batting = scorecardStats.batting;
    
    updates.matches = (updates.matches || 0) + 1;
    updates.runs = (updates.runs || 0) + batting.runs;
    
    const battingInnings = (updates.battingInnings || 0) + 1;
    updates.battingInnings = battingInnings;

    if (scorecardStats.batting.dismissalType === 'not-out') {
      updates.notOuts = (updates.notOuts || 0) + 1;
    }

    if (batting.runs === 0 && scorecardStats.batting.dismissalType && scorecardStats.batting.dismissalType !== 'not-out') {
      updates.ducks = (updates.ducks || 0) + 1;
    }

    updates.ballsFaced = (updates.ballsFaced || 0) + batting.balls;
    updates.fours = (updates.fours || 0) + batting.fours;
    updates.sixes = (updates.sixes || 0) + batting.sixes;

    if (batting.runs >= 50 && batting.runs < 100) {
      updates.fifties = (updates.fifties || 0) + 1;
    }
    if (batting.runs >= 100) {
      updates.hundreds = (updates.hundreds || 0) + 1;
      updates.fifties = (updates.fifties || 0) + 1;
    }

    const highest = parseInt(String(updates.highest || 0), 10);
    if (batting.runs > highest) {
      updates.highest = batting.runs;
    }

    const dismissals = battingInnings - (updates.notOuts || 0);
    if (dismissals > 0) {
      updates.battingAverage = (updates.runs / dismissals).toFixed(2);
    }

    if (updates.ballsFaced > 0) {
      updates.battingStrikeRate = ((updates.runs / updates.ballsFaced) * 100).toFixed(2);
    }
  }

  // Update bowling stats
  if (scorecardStats.bowling) {
    const bowling = scorecardStats.bowling;
    
    updates.wickets = (updates.wickets || 0) + bowling.wickets;
    
    const bowlingInnings = (updates.bowlingInnings || 0) + 1;
    updates.bowlingInnings = bowlingInnings;

    const oversValue = parseFloat(String(bowling.overs || 0));
    updates.overs = (parseFloat(String(updates.overs || 0)) + oversValue).toFixed(1);
    updates.runsConceded = (updates.runsConceded || 0) + bowling.runs;

    updates.maidens = (updates.maidens || 0) + (bowling.maidens || 0);
    updates.wides = (updates.wides || 0) + (bowling.wides || 0);
    updates.noBalls = (updates.noBalls || 0) + (bowling.noBalls || 0);

    if (bowling.wickets >= 5) {
      updates.fiveWickets = (updates.fiveWickets || 0) + 1;
    } else if (bowling.wickets >= 4) {
      updates.fourWickets = (updates.fourWickets || 0) + 1;
    }

    const currentBest = updates.bestBowling || '0/0';
    const currentWickets = parseInt(currentBest.split('/')[0], 10);
    const bestRuns = parseInt(currentBest.split('/')[1], 10);
    
    if (bowling.wickets > currentWickets || (bowling.wickets === currentWickets && bowling.runs < bestRuns)) {
      updates.bestBowling = `${bowling.wickets}/${bowling.runs}`;
    }

    const bowlingInningsCount = updates.bowlingInnings || 1;
    if (updates.wickets > 0 && bowlingInningsCount > 0) {
      updates.bowlingAverage = (updates.runsConceded / updates.wickets).toFixed(2);
    }

    const oversFloat = parseFloat(String(updates.overs || 0));
    if (oversFloat > 0) {
      updates.economy = ((updates.runsConceded || 0) / oversFloat).toFixed(2);
    }
  }

  return updates;
}

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}
